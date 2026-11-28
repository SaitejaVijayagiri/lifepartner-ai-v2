import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { prisma } from './prisma'; // Use Prisma
import jwt from 'jsonwebtoken';
import { SpeedDatingManager } from './services/SpeedDatingManager';
import { sanitizeContent } from './utils/contentFilter';
import {
    applyRemoteCacheInvalidation,
    CacheInvalidationMessage,
    createSocketRedisClients,
    getRedisClient,
    isRedisReady,
    setClusterCacheBroadcaster
} from './services/redisClient';
import {
    sanitizePhotoUrl,
    isNotificationPhotoBlurred,
    areUsersConnected,
    isPhotoPrivacyShieldEnabled,
    getBlockedUserIdSet,
    getConnectedUserIdSet
} from './utils/photoUrl';

let io: Server;
let hasRedisAdapter = false;
// Exact set of active socket IDs per user (guarantees accurate presence count without false duplicates)
const userSockets = new Map<string, Set<string>>();
// userId -> count of active sockets (kept for backwards compatibility)
const onlineUsers = new Map<string, number>();
// Users known to be online on sibling Cloud Run / cluster replicas
const clusterOnlineUsers = new Set<string>();

// userId -> active partnerId that user is currently chatting with
// (used to suppress push notifications when recipient is actively viewing the conversation)
const activeChats = new Map<string, string>();

// Track users explicitly in the Verified Lounge (local sockets)
// socketId -> { id, userId, name, photo, isVerified, isShielded, updatedAt }
interface LoungeParticipant {
    id?: string;
    userId: string;
    name: string;
    photo: string;
    isVerified?: boolean;
    isShielded?: boolean;
    updatedAt?: number;
}
const communityUsers = new Map<string, LoungeParticipant>();

const REDIS_ONLINE_ZSET = 'lp:online:zset';
const REDIS_ONLINE_SOCK_PREFIX = 'lp:online:user_sockets:';
const REDIS_OFFLINE_AT_PREFIX = 'lp:offline_at:';
const REDIS_ACTIVE_CHAT_PREFIX = 'lp:active_chat:';
const REDIS_PENDING_CALL_PREFIX = 'lp:pending_call:';
const REDIS_ONLINE_PUSH_PREFIX = 'lp:online_push:';
const REDIS_LOUNGE_HASH = 'lp:lounge:users';

const emitClusterEvent = (event: string, ...args: any[]) => {
    if (!io || !hasRedisAdapter) return;
    try {
        io.serverSideEmit(event, ...args);
    } catch {
        // Non-fatal in single-node or test contexts
    }
};

const isUserOnlineLocalOrCluster = (uId: string): boolean => {
    if (!uId) return false;
    const socketSet = userSockets.get(uId);
    if (socketSet && socketSet.size > 0) return true;
    if ((onlineUsers.get(uId) || 0) > 0) return true;
    if (clusterOnlineUsers.has(uId)) return true;
    return false;
};

const isUserAccountActive = (u: { is_banned?: boolean | null; is_deactivated?: boolean | null; deactivated_until?: Date | string | null } | null | undefined): boolean => {
    if (!u || u.is_banned) return false;
    if (u.is_deactivated && (!u.deactivated_until || new Date(u.deactivated_until) > new Date())) return false;
    return true;
};

interface PendingCall {
    callerId: string;
    userToCall: string;
    signalData: any;
    name: string;
    type: 'audio' | 'video' | 'speed_date';
    location?: string | null;
    avatarUrl?: string | null;
    photoUrl?: string | null;
    isBlurred?: boolean;
    _speedDateMode?: string;
    createdAt: number;
}
const pendingCalls = new Map<string, PendingCall>();

export const getPendingCallForUser = (userId: string) => {
    if (!userId || !pendingCalls.has(userId)) return null;
    const call = pendingCalls.get(userId)!;
    if (Date.now() - call.createdAt > 45000) {
        pendingCalls.delete(userId);
        return null;
    }
    return call;
};

export const getPendingCallForUserAsync = async (userId: string): Promise<PendingCall | null> => {
    const local = getPendingCallForUser(userId);
    if (local) return local;
    if (!userId || !isRedisReady()) return null;
    try {
        const raw = await getRedisClient()!.get(`${REDIS_PENDING_CALL_PREFIX}${userId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingCall;
        if (!parsed || Date.now() - parsed.createdAt > 45000) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const clearPendingCallForUser = (userId: string) => {
    if (!userId) return;
    pendingCalls.delete(userId);
    if (isRedisReady()) {
        getRedisClient()!.del(`${REDIS_PENDING_CALL_PREFIX}${userId}`).catch(() => {});
    }
};

const deliverPendingCall = async (targetSocket: Socket, uId: string) => {
    const call = await getPendingCallForUserAsync(uId);
    if (call) {
        console.log(`[Socket] Delivering active pending call from ${call.name} to ${uId}`);
        targetSocket.emit("callUser", {
            signal: call.signalData,
            from: call.callerId,
            name: call.name,
            type: call.type,
            location: call.location,
            avatarUrl: call.avatarUrl,
            photoUrl: call.photoUrl,
            isBlurred: call.isBlurred,
            _speedDateMode: call._speedDateMode
        });
    }
};

const OFFLINE_GRACE_MS = 45 * 1000; // 45s grace for screen-lock, tab switch & brief reconnects
const ONLINE_PUSH_MIN_ABSENCE_MS = 20 * 60 * 1000; // Must be offline >= 20 mins before notifying partners
const ONLINE_PUSH_PAIR_COOLDOWN_MS = 6 * 60 * 60 * 1000; // Max 1 online alert per pair every 6 hours

const offlineGraceTimers = new Map<string, NodeJS.Timeout>();
const lastTrueOfflineAt = new Map<string, number>();
const lastOnlinePushSentAt = new Map<string, number>();

const recordOnlinePushTimestamp = (pairKey: string, now: number) => {
    if (lastOnlinePushSentAt.size > 50000) {
        const cutoff = now - ONLINE_PUSH_PAIR_COOLDOWN_MS;
        for (const [k, ts] of lastOnlinePushSentAt.entries()) {
            if (ts < cutoff) lastOnlinePushSentAt.delete(k);
        }
        if (lastOnlinePushSentAt.size > 50000) lastOnlinePushSentAt.clear();
    }
    lastOnlinePushSentAt.set(pairKey, now);
};

const notifyConnectionsOfOnlineStatus = async (targetUserId: string) => {
    try {
        const userDetails = await prisma.users.findUnique({
            where: { id: targetUserId },
            select: { 
                full_name: true, 
                avatar_url: true, 
                profiles: { 
                    select: { 
                        photos: true, 
                        metadata: true 
                    } 
                } 
            }
        });
        
        if (userDetails) {
            const now = Date.now();
            let memOfflineAt = lastTrueOfflineAt.get(targetUserId);
            if (!memOfflineAt && isRedisReady()) {
                try {
                    const redisOfflineRaw = await getRedisClient()!.get(`${REDIS_OFFLINE_AT_PREFIX}${targetUserId}`);
                    if (redisOfflineRaw) memOfflineAt = Number(redisOfflineRaw);
                } catch {}
            }
            const metaLastSeenStr = (userDetails.profiles?.metadata as any)?.last_seen_at;
            const dbLastSeenAt = metaLastSeenStr ? Date.parse(metaLastSeenStr) : NaN;
            const lastSeenMs = memOfflineAt ?? (Number.isFinite(dbLastSeenAt) ? dbLastSeenAt : NaN);
            const isEligibleForOnlineAlert = Number.isFinite(lastSeenMs) && (now - lastSeenMs) >= ONLINE_PUSH_MIN_ABSENCE_MS;

            const connectionsList = await prisma.interactions.findMany({
                where: {
                    OR: [
                        { from_user_id: targetUserId },
                        { to_user_id: targetUserId }
                    ],
                    status: { in: ['accepted', 'connected'] }
                },
                select: {
                    from_user_id: true,
                    to_user_id: true
                }
            });

            const name = userDetails.full_name || 'Someone';
            let rawPhoto = userDetails.avatar_url || (userDetails.profiles?.photos as any)?.[0] || null;
            if (rawPhoto && rawPhoto.startsWith('data:image')) {
                rawPhoto = null;
            }
            const fromUserPhoto = rawPhoto 
                ? sanitizePhotoUrl(rawPhoto, name)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;

            const uniqueTargetUserIds = new Set<string>();
            for (const conn of connectionsList) {
                const partnerId = conn.from_user_id === targetUserId ? conn.to_user_id : conn.from_user_id;
                if (partnerId) {
                    uniqueTargetUserIds.add(partnerId);
                }
            }

            for (const otherUserId of uniqueTargetUserIds) {
                const isOtherOnline = isUserOnlineLocalOrCluster(otherUserId);
                if (isOtherOnline) {
                    io.to(otherUserId).emit('userOnline', targetUserId);
                }

                // Only fire notification/push after genuine absence (>= 20m) and pair cooldown (>= 6h)
                if (!isEligibleForOnlineAlert) continue;
                const pairKey = `${targetUserId}:${otherUserId}`;
                const lastSent = lastOnlinePushSentAt.get(pairKey) || 0;
                if (now - lastSent < ONLINE_PUSH_PAIR_COOLDOWN_MS) continue;
                if (isRedisReady()) {
                    try {
                        const claimed = await getRedisClient()!.set(`${REDIS_ONLINE_PUSH_PREFIX}${pairKey}`, '1', 'EX', Math.floor(ONLINE_PUSH_PAIR_COOLDOWN_MS / 1000), 'NX');
                        if (!claimed) {
                            recordOnlinePushTimestamp(pairKey, now);
                            continue;
                        }
                    } catch {}
                }
                recordOnlinePushTimestamp(pairKey, now);

                const wittyMsgs = [
                    `Your match ${name} just logged on! Strike a conversation while they are active! ⚡`,
                    `${name} is online now! Send a quick hello to see what they are up to. 💬`,
                    `Look who is online! ${name} is active now. Don't keep them waiting! 😉`,
                    `⚡ Chemistry alert! ${name} just came online. Perfect time to ask them about their day!`
                ];
                const msg = wittyMsgs[Math.floor(Math.random() * wittyMsgs.length)];

                if (isOtherOnline) {
                    io.to(otherUserId).emit('notification:new', {
                        id: `conn-online-${targetUserId}-${Date.now()}`,
                        type: 'connection_online',
                        message: msg,
                        timestamp: new Date(),
                        fromUserId: targetUserId,
                        fromUserName: name,
                        fromUserPhoto: fromUserPhoto
                    });
                } else {
                    try {
                        const { NotificationService } = require('./services/notification');
                        NotificationService.getInstance().sendToUser(
                            otherUserId,
                            `${name} is active now ⚡`,
                            msg,
                            {
                                type: 'connection_online',
                                fromUserId: targetUserId,
                                fromUserName: name,
                                fromUserPhoto: fromUserPhoto
                            }
                        ).catch((e: any) => console.warn("Push failed for connection online alert", e));
                    } catch (pushErr) {
                        console.error("Push service error on connection online alert", pushErr);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to notify online status to connections:", e);
    }
};

const PUBLIC_STATS_THROTTLE_MS = 5000;
let publicStatsTimer: NodeJS.Timeout | null = null;
const schedulePublicStatsBroadcast = () => {
    if (!io || publicStatsTimer) return;
    publicStatsTimer = setTimeout(async () => {
        publicStatsTimer = null;
        if (!io) return;
        let onlineCount = userSockets.size + clusterOnlineUsers.size;
        let loungeCount = new Set(Array.from(communityUsers.values()).map(u => u.userId)).size;
        if (isRedisReady()) {
            try {
                const redis = getRedisClient()!;
                const [rOnline, rLounge] = await Promise.all([
                    redis.zcard(REDIS_ONLINE_ZSET),
                    redis.hlen(REDIS_LOUNGE_HASH)
                ]);
                if (typeof rOnline === 'number' && rOnline > 0) onlineCount = Math.max(onlineCount, rOnline);
                if (typeof rLounge === 'number' && rLounge > 0) loungeCount = Math.max(loungeCount, rLounge);
            } catch {}
        }
        io.to('public_updates').emit('public_stats', {
            onlineCount,
            loungeCount
        });
    }, PUBLIC_STATS_THROTTLE_MS);
};

const getSampledOnlineUserIds = (limit = 200): string[] => {
    const combined = new Set<string>(userSockets.keys());
    for (const id of clusterOnlineUsers) {
        combined.add(id);
        if (combined.size >= limit * 2) break;
    }
    const keys = Array.from(combined);
    return keys.length > limit ? keys.slice(-limit) : keys;
};

const notifyConnectionsOffline = async (offlineUserId: string) => {
    if (!io || !offlineUserId) return;
    try {
        const connectionsList = await prisma.interactions.findMany({
            where: {
                OR: [{ from_user_id: offlineUserId }, { to_user_id: offlineUserId }],
                status: { in: ['accepted', 'connected'] }
            },
            select: { from_user_id: true, to_user_id: true }
        });
        for (const conn of connectionsList) {
            const partnerId = conn.from_user_id === offlineUserId ? conn.to_user_id : conn.from_user_id;
            if (partnerId && partnerId !== offlineUserId && isUserOnlineLocalOrCluster(partnerId)) {
                io.to(partnerId).emit('userOffline', offlineUserId);
            }
        }
    } catch {
        // Non-fatal
    }
};

export const addSocketToOnlineUser = (socket: Socket | any, targetUserId: string) => {
    if (!targetUserId) return;

    // Detach any previous user ID tracked by this socket
    if (socket.data?.trackedUserId && socket.data.trackedUserId !== targetUserId) {
        removeSocketFromOnlineUser(socket, socket.data.trackedUserId);
    }

    // Cancel pending offline grace timer if the user reconnected after screen lock or brief network drop
    const pendingGraceTimer = offlineGraceTimers.get(targetUserId);
    let wasWithinGraceWindow = false;
    if (pendingGraceTimer) {
        clearTimeout(pendingGraceTimer);
        offlineGraceTimers.delete(targetUserId);
        wasWithinGraceWindow = true;
    }

    if (socket.data) {
        socket.data.trackedUserId = targetUserId;
    }
    if (socket.join) {
        socket.join(targetUserId);
    }

    if (!userSockets.has(targetUserId)) {
        userSockets.set(targetUserId, new Set<string>());
    }
    const socketSet = userSockets.get(targetUserId)!;
    const isFirstConnectionForSocket = !socketSet.has(socket.id);

    if (isFirstConnectionForSocket) {
        socketSet.add(socket.id);
        onlineUsers.set(targetUserId, socketSet.size);
        const alreadyOnlineInCluster = clusterOnlineUsers.has(targetUserId);
        clusterOnlineUsers.delete(targetUserId);

        if (isRedisReady() && socket.id) {
            const now = Date.now();
            const sockHashKey = `${REDIS_ONLINE_SOCK_PREFIX}${targetUserId}`;
            const redis = getRedisClient()!;
            redis.hset(sockHashKey, socket.id, String(now))
                .then(() => Promise.all([redis.expire(sockHashKey, 900), redis.zadd(REDIS_ONLINE_ZSET, now, targetUserId)]))
                .catch(() => {});
        }

        // Only notify partners/lounge on a true fresh online session (not a screen-lock reconnect)
        if (socketSet.size === 1 && !wasWithinGraceWindow && !alreadyOnlineInCluster) {
            emitClusterEvent('presence:delta', { uId: targetUserId, online: true });
            if (io) {
                io.to('verified_lounge').emit('userOnline', targetUserId);
                schedulePublicStatsBroadcast();
            }
            notifyConnectionsOfOnlineStatus(targetUserId);
        }
    }

    // Send bounded online sample on handshake (prevents 4MB payloads at 100k+ concurrent users)
    if (socket.emit) {
        socket.emit('onlineUsers', getSampledOnlineUserIds(200));
    }
};

const finalizeUserOffline = async (uId: string) => {
    offlineGraceTimers.delete(uId);
    if ((userSockets.get(uId)?.size || 0) > 0) return;

    // Verify with Redis that the user didn't already reconnect onto another Cloud Run instance
    if (isRedisReady()) {
        try {
            const remoteCount = await getRedisClient()!.hlen(`${REDIS_ONLINE_SOCK_PREFIX}${uId}`);
            if (remoteCount > 0) {
                clusterOnlineUsers.add(uId);
                return;
            }
            await Promise.all([
                getRedisClient()!.zrem(REDIS_ONLINE_ZSET, uId),
                getRedisClient()!.set(`${REDIS_OFFLINE_AT_PREFIX}${uId}`, String(Date.now()), 'EX', 86400)
            ]);
        } catch {}
    }

    userSockets.delete(uId);
    onlineUsers.delete(uId);
    clusterOnlineUsers.delete(uId);
    activeChats.delete(uId);
    lastTrueOfflineAt.set(uId, Date.now());
    emitClusterEvent('presence:delta', { uId, online: false });
    if (io) {
        io.to('verified_lounge').emit('userOffline', uId);
        schedulePublicStatsBroadcast();
        void notifyConnectionsOffline(uId);
    }

    // Persist accurate last_seen_at timestamp in database profile metadata
    prisma.profiles.findUnique({
        where: { user_id: uId },
        select: { metadata: true }
    }).then(prof => {
        if (prof) {
            const meta = (prof.metadata as any) || {};
            return prisma.profiles.update({
                where: { user_id: uId },
                data: {
                    metadata: {
                        ...meta,
                        last_seen_at: new Date().toISOString()
                    }
                }
            });
        }
    }).catch(() => {});
};

export const removeSocketFromOnlineUser = (socket: Socket | any, targetUserId?: string) => {
    const uId = targetUserId || socket.data?.trackedUserId || socket.data?.user?.userId;
    if (!uId) return;

    if (socket.data) {
        socket.data.trackedUserId = undefined;
    }

    if (isRedisReady() && socket?.id) {
        const sockHashKey = `${REDIS_ONLINE_SOCK_PREFIX}${uId}`;
        getRedisClient()!.hdel(sockHashKey, socket.id).catch(() => {});
    }

    const socketSet = userSockets.get(uId);
    if (socketSet) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
            userSockets.delete(uId);
            activeChats.delete(uId);
            if (isRedisReady()) {
                getRedisClient()!.del(`${REDIS_ACTIVE_CHAT_PREFIX}${String(uId).trim().toLowerCase()}`).catch(() => {});
            }
            if (!offlineGraceTimers.has(uId)) {
                const timer = setTimeout(() => { void finalizeUserOffline(uId); }, OFFLINE_GRACE_MS);
                if (typeof timer.unref === 'function') timer.unref();
                offlineGraceTimers.set(uId, timer);
            }
        } else {
            onlineUsers.set(uId, socketSet.size);
        }
    } else if (!offlineGraceTimers.has(uId)) {
        void finalizeUserOffline(uId);
    }
};

const getGlobalLoungeParticipants = async (): Promise<LoungeParticipant[]> => {
    const now = Date.now();
    if (isRedisReady()) {
        try {
            const rawMap = await getRedisClient()!.hgetall(REDIS_LOUNGE_HASH);
            const staleKeys: string[] = [];
            const active: LoungeParticipant[] = [];
            for (const [sockId, rawJson] of Object.entries(rawMap)) {
                try {
                    const parsed = JSON.parse(rawJson) as LoungeParticipant;
                    if (!parsed?.userId || (parsed.updatedAt && now - parsed.updatedAt > 6 * 3600 * 1000)) {
                        staleKeys.push(sockId);
                        continue;
                    }
                    active.push(parsed);
                } catch {
                    staleKeys.push(sockId);
                }
            }
            if (staleKeys.length > 0) {
                getRedisClient()!.hdel(REDIS_LOUNGE_HASH, ...staleKeys).catch(() => {});
            }
            return active;
        } catch {}
    }
    return Array.from(communityUsers.values());
};

const broadcastCommunityUsersLocal = async () => {
    if (!io) return;
    const room = io.sockets.adapter.rooms.get('verified_lounge');
    schedulePublicStatsBroadcast();
    if (!room || room.size === 0) {
        return;
    }

    const list = await getGlobalLoungeParticipants();
    const uniqueList = Array.from(new Map(list.map(u => [u.userId, u])).values());

    const viewerIds = new Set<string>();
    for (const sockId of room) {
        const s = io.sockets.sockets.get(sockId);
        const vId = s?.data?.user?.userId;
        if (vId) viewerIds.add(vId);
    }

    const viewerAccess = new Map<string, { blockedSet: Set<string>; connectedSet: Set<string> }>();
    await Promise.all(Array.from(viewerIds).map(async (vId) => {
        const [blockedSet, connectedSet] = await Promise.all([
            getBlockedUserIdSet(prisma, vId),
            getConnectedUserIdSet(prisma, vId)
        ]);
        viewerAccess.set(vId, { blockedSet, connectedSet });
    }));

    for (const sockId of room) {
        const s = io.sockets.sockets.get(sockId);
        const vId = s?.data?.user?.userId;
        if (!s || !vId) continue;
        const access = viewerAccess.get(vId);
        if (!access) continue;

        const viewerList = uniqueList
            .filter(u => !access.blockedSet.has(u.userId))
            .map(u => {
                const isBlurred = Boolean(u.isShielded && u.userId !== vId && !access.connectedSet.has(u.userId));
                return {
                    id: u.id,
                    userId: u.userId,
                    name: u.name,
                    photo: isBlurred ? '' : u.photo,
                    isVerified: u.isVerified,
                    photo_privacy: u.isShielded ? 'blurred_until_accept' : 'public',
                    isBlurred
                };
            });
        s.emit('update_community_users', viewerList);
    }
};

const broadcastCommunityUsers = async () => {
    emitClusterEvent('lounge:roster_changed');
    await broadcastCommunityUsersLocal();
};

const deliverCommunityMessageLocal = async (payload: {
    id: string;
    from: string;
    user: { name: string; photo: string; isShielded?: boolean };
    sanitizedText: string;
    timestamp: string | Date;
}) => {
    if (!io) return;
    const room = io.sockets.adapter.rooms.get('verified_lounge');
    if (!room || room.size === 0) return;

    const viewerIds = new Set<string>();
    for (const sockId of room) {
        const s = io.sockets.sockets.get(sockId);
        const vId = s?.data?.user?.userId;
        if (vId) viewerIds.add(vId);
    }

    const accessMap = new Map<string, { blockedSet: Set<string>; connectedSet: Set<string> }>();
    await Promise.all(Array.from(viewerIds).map(async (vId) => {
        const [blockedSet, connectedSet] = await Promise.all([
            getBlockedUserIdSet(prisma, vId),
            getConnectedUserIdSet(prisma, vId)
        ]);
        accessMap.set(vId, { blockedSet, connectedSet });
    }));

    for (const sockId of room) {
        const s = io.sockets.sockets.get(sockId);
        const vId = s?.data?.user?.userId;
        if (!s || !vId) continue;
        const access = accessMap.get(vId);
        if (!access || access.blockedSet.has(payload.from)) continue;

        const isBlurred = Boolean(payload.user.isShielded && vId !== payload.from && !access.connectedSet.has(payload.from));
        s.emit('receive_community_message', {
            id: payload.id,
            text: payload.sanitizedText,
            sender: {
                id: payload.from,
                userId: payload.from,
                name: payload.user.name,
                photo: isBlurred ? null : payload.user.photo,
                isVerified: true,
                photo_privacy: payload.user.isShielded ? 'blurred_until_accept' : 'public',
                isBlurred
            },
            timestamp: payload.timestamp
        });
    }
};

const seedClusterPresenceFromRedis = async () => {
    if (!isRedisReady()) return;
    try {
        const cutoff = Date.now() - 15 * 60 * 1000;
        const recentIds = await getRedisClient()!.zrevrangebyscore(REDIS_ONLINE_ZSET, '+inf', cutoff, 'LIMIT', 0, 5000);
        for (const id of recentIds) {
            if (!userSockets.has(id)) {
                clusterOnlineUsers.add(id);
            }
        }
    } catch {
        // Non-fatal
    }
};

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        maxHttpBufferSize: 1e7 // 10MB to safely handle larger media packets
    });

    const adapterClients = createSocketRedisClients();
    if (adapterClients) {
        io.adapter(createAdapter(adapterClients.pubClient, adapterClients.subClient, {
            key: process.env.SOCKET_REDIS_PREFIX || 'lp_socket',
            requestsTimeout: 3000
        }));
        hasRedisAdapter = true;

        setClusterCacheBroadcaster((msg: CacheInvalidationMessage) => {
            emitClusterEvent('cache:invalidate', msg);
        });

        io.on('cache:invalidate', (msg: CacheInvalidationMessage) => {
            applyRemoteCacheInvalidation(msg);
        });

        io.on('presence:delta', (data: { uId?: string; online?: boolean }) => {
            if (!data?.uId) return;
            if (data.online) {
                if (!userSockets.has(data.uId)) {
                    if (clusterOnlineUsers.size > 200_000) clusterOnlineUsers.clear();
                    clusterOnlineUsers.add(data.uId);
                }
            } else {
                clusterOnlineUsers.delete(data.uId);
            }
        });

        io.on('lounge:roster_changed', () => {
            broadcastCommunityUsersLocal().catch(console.error);
        });

        io.on('lounge:message', (payload: any) => {
            if (payload) {
                deliverCommunityMessageLocal(payload).catch(console.error);
            }
        });

        if (adapterClients.pubClient.status === 'ready') {
            seedClusterPresenceFromRedis().catch(() => {});
        } else {
            adapterClients.pubClient.once('ready', () => {
                seedClusterPresenceFromRedis().catch(() => {});
            });
        }

        // Refresh Redis TTLs for long-lived connections on this instance every 4 minutes
        const heartbeatInterval = setInterval(() => {
            if (!isRedisReady()) return;
            const redis = getRedisClient()!;
            const now = Date.now();
            const entries = Array.from(userSockets.keys());
            for (const uid of entries) {
                redis.expire(`${REDIS_ONLINE_SOCK_PREFIX}${uid}`, 900).catch(() => {});
                redis.zadd(REDIS_ONLINE_ZSET, now, uid).catch(() => {});
            }
        }, 4 * 60 * 1000);
        if (typeof heartbeatInterval.unref === 'function') heartbeatInterval.unref();

        console.log('✅ Socket.io Redis Adapter attached for horizontal scaling');
    }

    // Initialize Speed Dating Matchmaker Loop
    SpeedDatingManager.getInstance().init(io);

    // MIDDLEWARE: Authentication (Relaxed for Guests)
    io.use((socket, next) => {
        let token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token && socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie.split(';').reduce((acc: any, currentStr: string) => {
                const [key, val] = currentStr.split('=');
                if (key && val) {
                    acc[key.trim()] = val.trim();
                }
                return acc;
            }, {});
            token = cookies['token'];
        }

        if (!token) {
            socket.data.isGuest = true;
            return next();
        }

        if (typeof token === 'string' && token.startsWith('Bearer ')) {
            token = token.slice(7).trim();
        }

        // JWT_SECRET guaranteed by startup guard in server.ts (throws if missing)
        const secret = process.env.JWT_SECRET!;
        try {
            const decoded = jwt.verify(token as string, secret);
            socket.data.user = decoded; // Store user info in socket session
            socket.data.isGuest = false;
        } catch {
            // Invalid token? Treat as guest.
            socket.data.isGuest = true;
        }
        return next();
    });

    io.on('connection', (socket: Socket) => {
        let userId = socket.data.user?.userId;
        const getUserId = () => socket.data.user?.userId || socket.data.trackedUserId || userId;
        const isGuest = socket.data.isGuest;
        console.log(`Socket Connected: ${socket.id} (User: ${userId || 'Guest'})`);

        // Join Public Updates Room (Stats)
        socket.join('public_updates');

        // Send initial stats on connect
        const loungeList = Array.from(communityUsers.values());
        const loungeCount = new Set(loungeList.map(u => u.userId)).size;

        socket.emit('public_stats', {
            onlineCount: Math.max(onlineUsers.size + clusterOnlineUsers.size, 1),
            loungeCount: loungeCount
        });

        // Send bounded online sample even to initial connects (prevents massive payloads at scale)
        socket.emit('onlineUsers', getSampledOnlineUserIds(200));

        if (userId) {
            addSocketToOnlineUser(socket, userId);
        }

        const leaveCommunity = () => {
            const hadLocal = communityUsers.has(socket.id);
            if (hadLocal) {
                communityUsers.delete(socket.id);
            }
            if (isRedisReady()) {
                getRedisClient()!.hdel(REDIS_LOUNGE_HASH, socket.id).catch(() => {});
            }
            if (hadLocal) {
                broadcastCommunityUsers().catch(console.error);
            }
        };

        // User Greeting
        socket.emit('me', socket.id);

        // Disconnect
        socket.on('disconnect', () => {
            // Only notify the specific call partner, NOT every connected user.
            // Broadcasting callEnded to everyone breaks ongoing calls between other users.
            if (socket.data.callPartnerId) {
                io.to(socket.data.callPartnerId).emit('callEnded');
                clearPendingCallForUser(socket.data.callPartnerId);
                socket.data.callPartnerId = null;
            }

            const activeUserId = socket.data.trackedUserId || socket.data.user?.userId || userId;
            if (activeUserId) {
                clearPendingCallForUser(activeUserId);
                removeSocketFromOnlineUser(socket, activeUserId);
            }

            leaveCommunity();
            // Automatically remove user from speed dating queue/active match
            SpeedDatingManager.getInstance().leaveLobby(socket.id, activeUserId);
            if (activeUserId) {
                SpeedDatingManager.getInstance().endActiveMatch(activeUserId);
                // End any active live speed dating rooms hosted by this user
                try {
                    const { endUserLiveEvents } = require('./routes/dates');
                    endUserLiveEvents(activeUserId).catch(console.error);
                } catch (e) {}
            }
        });

        // Personal room handling (authenticated session must match room ID)
        socket.on('join-room', (uId: string) => {
            const authUserId = socket.data.user?.userId;
            if (!authUserId || !uId || typeof uId !== 'string' || authUserId !== uId) {
                return;
            }
            socket.join(uId);
            socket.data.trackedUserId = uId;
            if (!userId) userId = uId;
            addSocketToOnlineUser(socket, uId);
            console.log(`Socket ${socket.id} joined personal room: ${uId}`);
            void deliverPendingCall(socket, uId);
        });

        // Live Singles Radar - Real-Time Wave Interaction
        socket.on('live_wave', async (data: { toUserId: string; senderName?: string; senderPhoto?: string }) => {
            const senderId = getUserId();
            if (!data?.toUserId || !senderId || data.toUserId === senderId) return;

            try {
                if (await areUsersBlocked(senderId, data.toUserId)) return;
                const [senderUser, connected] = await Promise.all([
                    prisma.users.findUnique({
                        where: { id: senderId },
                        select: {
                            full_name: true,
                            avatar_url: true,
                            is_banned: true,
                            is_deactivated: true,
                            deactivated_until: true,
                            profiles: { select: { metadata: true } }
                        }
                    }),
                    areUsersConnected(prisma, senderId, data.toUserId)
                ]);
                if (!isUserAccountActive(senderUser)) return;
                const meta = (senderUser?.profiles?.metadata as any) || {};
                const isBlurred = isNotificationPhotoBlurred(meta, connected);
                const senderName = senderUser?.full_name || data.senderName || 'A member';
                const senderPhoto = isBlurred ? null : (senderUser?.avatar_url ? sanitizePhotoUrl(senderUser.avatar_url, senderName) : null);

                const wavePayload = {
                    fromUserId: senderId,
                    senderName,
                    senderPhoto,
                    isBlurred,
                    timestamp: Date.now()
                };

                const targetSockets = userSockets.get(data.toUserId);
                if (targetSockets && targetSockets.size > 0) {
                    targetSockets.forEach(sockId => {
                        io.to(sockId).emit('live_wave_received', wavePayload);
                    });
                }
                io.to(data.toUserId).emit('live_wave_received', wavePayload);
            } catch (err) {
                console.error('[live_wave] Error:', err);
            }
        });

        socket.on('checkPendingCall', () => {
            const currentUserId = socket.data.user?.userId || socket.data.trackedUserId || userId;
            if (currentUserId) {
                void deliverPendingCall(socket, currentUserId);
            }
        });

        socket.on('authenticate', (data: { token?: string }) => {
            let token = data?.token || socket.handshake.auth?.token;
            if (!token) return;
            if (typeof token === 'string' && token.startsWith('Bearer ')) {
                token = token.slice(7).trim();
            }
            try {
                const secret = process.env.JWT_SECRET!;
                const decoded: any = jwt.verify(token, secret);
                if (!decoded?.userId) return;
                const uId = decoded.userId;
                userId = uId;
                socket.data.user = decoded;
                socket.data.trackedUserId = uId;
                socket.data.isGuest = false;

                socket.join(uId);
                addSocketToOnlineUser(socket, uId);
                console.log(`Socket ${socket.id} authenticated post-connect as User ${uId}`);
                void deliverPendingCall(socket, uId);
            } catch (err) {
                console.warn(`Socket authentication error:`, err);
            }
        });

        // --- ACTIVE CHAT TRACKING (SUPPRESS PUSH NOTIFICATIONS WHILE USER IS CHATTING) ---
        socket.on('enter_chat', (data: { partnerId: string; userId?: string; connectionId?: string }) => {
            const currentUserId = socket.data.user?.userId || socket.data.trackedUserId || userId;
            const targetPartner = data?.partnerId || data?.connectionId;
            if (currentUserId && targetPartner) {
                const u = String(currentUserId).trim().toLowerCase();
                let p = String(targetPartner).trim().toLowerCase();
                if (data?.partnerId) p = String(data.partnerId).trim().toLowerCase();
                if (data?.connectionId) p = String(data.connectionId).trim().toLowerCase();
                activeChats.set(u, p);
                if (isRedisReady()) {
                    getRedisClient()!.set(`${REDIS_ACTIVE_CHAT_PREFIX}${u}`, p, 'EX', 7200).catch(() => {});
                }
                socket.data.activePartnerId = String(targetPartner);
                console.log(`[Active Chat] User ${u} entered chat with partner ${p}`);
            }
        });

        socket.on('leave_chat', () => {
            const currentUserId = socket.data.user?.userId || socket.data.trackedUserId || userId;
            if (currentUserId) {
                const u = String(currentUserId).trim().toLowerCase();
                activeChats.delete(u);
                if (isRedisReady()) {
                    getRedisClient()!.del(`${REDIS_ACTIVE_CHAT_PREFIX}${u}`).catch(() => {});
                }
                socket.data.activePartnerId = null;
                console.log(`[Active Chat] User ${u} left chat`);
            }
        });

        // --- MESSAGE STATUS TRACKING ---
        socket.on('messageDelivered', async (data: { messageId: string, senderId: string }) => {
            if (!userId || !data.messageId) return;
            try {
                // Update DB safely
                await prisma.messages.updateMany({
                    where: { id: data.messageId, delivery_status: "sent" },
                    data: { delivery_status: "delivered" }
                });

                // Notify original sender that their message was delivered
                io.to(data.senderId).emit('updateMessageStatus', {
                    messageId: data.messageId,
                    status: "delivered"
                });
            } catch (e) {
                console.error("Failed to update delivery status:", e);
            }
        });

        /**
         * CALL USER
         */
        socket.on("callUser", async ({ userToCall, signalData, name, type, _speedDateMode }: any) => {
            const from = socket.data.user?.userId || socket.data.trackedUserId || userId;
            if (!from || !userToCall || userToCall === from) {
                console.warn(`[callUser] Rejected unauthenticated, self-call, or invalid target: from ${from} to ${userToCall}`);
                return;
            }
            console.log(`Call Initiated: ${from} -> ${userToCall} (${type || 'video'})`);

            try {
                if (await areUsersBlocked(from, userToCall)) {
                    console.warn(`[callUser] Blocked call attempt: ${from} -> ${userToCall}`);
                    return;
                }

                // Fetch caller name, location, status, and avatar for call UI
                const [callerData, isConnected] = await Promise.all([
                    prisma.users.findUnique({
                        where: { id: from },
                        select: {
                            city: true,
                            location_name: true,
                            full_name: true,
                            avatar_url: true,
                            is_banned: true,
                            is_deactivated: true,
                            deactivated_until: true,
                            profiles: {
                                select: {
                                    photos: true,
                                    metadata: true
                                }
                            }
                        }
                    }),
                    areUsersConnected(prisma, from, userToCall)
                ]);

                if (!isUserAccountActive(callerData)) {
                    return;
                }

                const meta = (callerData?.profiles?.metadata as any) || {};
                const secureName = callerData?.full_name?.trim() || meta.name?.trim() || name?.trim() || 'Someone';
                const isBlurred = isNotificationPhotoBlurred(meta, isConnected);

                let rawPhoto: string | null | undefined = callerData?.avatar_url;
                if (!rawPhoto && Array.isArray(callerData?.profiles?.photos) && (callerData.profiles.photos as any).length > 0) {
                    rawPhoto = String((callerData.profiles.photos as any)[0] || '');
                }
                if (rawPhoto && rawPhoto.startsWith('data:image')) {
                    rawPhoto = null;
                }
                const callerAvatar = isBlurred
                    ? null
                    : (rawPhoto
                        ? sanitizePhotoUrl(rawPhoto, secureName)
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(secureName)}&background=e11d48&color=fff&size=256`);

                const userLocation = (callerData?.city || callerData?.location_name || (typeof meta.location?.city === 'string' ? meta.location.city : null) || null) as string | null;

                // Cache active pending call for 45s so receiver can pick up even after launching via push notification
                const pendingCallPayload: PendingCall = {
                    callerId: from,
                    userToCall,
                    signalData,
                    name: secureName,
                    type: type || 'video',
                    location: userLocation,
                    avatarUrl: callerAvatar,
                    photoUrl: callerAvatar,
                    isBlurred,
                    _speedDateMode,
                    createdAt: Date.now()
                };
                pendingCalls.set(userToCall, pendingCallPayload);
                if (isRedisReady()) {
                    getRedisClient()!.set(`${REDIS_PENDING_CALL_PREFIX}${userToCall}`, JSON.stringify(pendingCallPayload), 'EX', 45).catch(() => {});
                }

                io.to(userToCall).emit("callUser", {
                    signal: signalData,
                    from,
                    name: secureName,
                    type,
                    location: userLocation,
                    avatarUrl: callerAvatar,
                    photoUrl: callerAvatar,
                    isBlurred,
                    _speedDateMode
                });

                // Track call partner on this socket so disconnect only notifies them
                socket.data.callPartnerId = userToCall;

                // Incoming Call Push notification: Alert target user with caller's clear name and answer action
                const lastPush = (socket as any).lastPushTime || 0;
                
                if (Date.now() - lastPush > 8000) {
                    (socket as any).lastPushTime = Date.now();
                    const callTypeDisplay = type === 'audio' ? 'Voice Call' : 'Video Call';
                    const callIcon = type === 'audio' ? '📞' : '📹';
                    const pushTitle = `${callIcon} ${secureName} is calling (${callTypeDisplay})`;
                    const pushBody = `${secureName} is calling you on LifePartner AI. Tap to answer!`;
                    const safePushPhoto = callerAvatar || '';
                    const callUrl = `/chat/${from}?action=answer_call&callType=${type || 'video'}&callerId=${from}&callerName=${encodeURIComponent(secureName)}${callerAvatar ? `&callerPhoto=${encodeURIComponent(callerAvatar)}` : ''}`;

                    const { NotificationService } = require('./services/notification');
                    NotificationService.getInstance().sendToUser(
                        userToCall,
                        pushTitle,
                        pushBody,
                        {
                            type: 'incoming_call',
                            senderId: from,
                            callerId: from,
                            from: from,
                            fromUserId: from,
                            senderName: secureName,
                            callerName: secureName,
                            fromUserName: secureName,
                            senderPhoto: safePushPhoto,
                            callerPhoto: safePushPhoto,
                            avatarUrl: safePushPhoto,
                            fromUserPhoto: safePushPhoto,
                            isBlurred: isBlurred ? 'true' : 'false',
                            callType: type || 'video',
                            url: callUrl
                        }
                    ).catch(console.error);
                }

            } catch (e) {
                console.error("Call Relay Error", e);
            }
        });

        /**
         * ANSWER CALL
         */
        socket.on("answerCall", (data) => {
            io.to(data.to).emit("callAccepted", data.signal);
            if (data?.to) clearPendingCallForUser(data.to);
            if (userId) clearPendingCallForUser(userId);
        });

        /**
         * STOP RINGING (called by receiver when they pick up, so caller stops looping ring)
         */
        socket.on("answerCall_stop_ringing", ({ to }) => {
            io.to(to).emit("callAnsweredByPeer");
        });

        /**
         * END CALL
         */
        socket.on("endCall", ({ to }) => {
            io.to(to).emit("callEnded");
            if (to) clearPendingCallForUser(to);
            if (userId) clearPendingCallForUser(userId);
            if (userId) SpeedDatingManager.getInstance().endActiveMatch(userId);
            if (to) SpeedDatingManager.getInstance().endActiveMatch(to);
        });

        /**
         * BUZZ CALL (Immediate push & socket alert to notify offline/unresponsive partner)
         */
        socket.on("buzz_call", async ({ to, type }) => {
            if (!to || !userId) return;
            try {
                const caller = await prisma.users.findUnique({
                    where: { id: userId },
                    select: { full_name: true, avatar_url: true }
                });
                const callerName = caller?.full_name || 'Your match';
                const callType = type || 'video';

                io.to(to).emit("call_buzz", {
                    callerId: userId,
                    callerName,
                    callerAvatar: caller?.avatar_url,
                    callType
                });

                const { NotificationService } = require('./services/notification');
                NotificationService.getInstance().sendToUser(
                    to,
                    `📞 Call Alert from ${callerName}`,
                    `${callerName} is calling you. Tap to connect!`,
                    {
                        type: 'call_buzz',
                        callerId: userId,
                        callerName,
                        callType,
                        url: '/dashboard?tab=connections'
                    }
                ).catch(() => {});
            } catch (e) {
                console.error("Socket buzz_call error:", e);
            }
        });

        /**
         * TYPING
         */
        socket.on("typing", ({ to }) => {
            io.to(to).emit("typing", { from: userId });
        });

        /**
         * REAL-TIME GAME INVITATIONS & MULTIPLAYER RELAY
         */
        socket.on("game_invite", ({ to, senderName, gameType }) => {
            if (to) {
                console.log(`Game Invite: ${userId} -> ${to} (${gameType || 'snakes'})`);
                io.to(to).emit("game_invite", { from: userId, senderName: senderName || 'Your Match', gameType });
            }
        });

        socket.on("game_accept", ({ to }) => {
            if (to) {
                io.to(to).emit("game_accept", { from: userId });
            }
        });

        socket.on("game_decline", ({ to }) => {
            if (to) {
                io.to(to).emit("game_decline", { from: userId });
            }
        });

        socket.on("game_move", (data) => {
            if (data?.to) {
                io.to(data.to).emit("game_move", { ...data, from: userId });
            }
        });

        socket.on("game_voice", (data) => {
            if (data?.to) {
                io.to(data.to).emit("game_voice", { ...data, from: userId });
            }
        });

        socket.on("game_audio_signal", (data) => {
            if (data?.to) {
                io.to(data.to).emit("game_audio_signal", { ...data, from: userId });
            }
        });

        socket.on("game_leave", ({ to }) => {
            if (to) {
                io.to(to).emit("game_leave", { from: userId });
            }
        });

        socket.on("game_sync_request", ({ to }) => {
            if (to) {
                io.to(to).emit("game_sync_request", { from: userId });
            }
        });

        socket.on("game_sync_response", (data) => {
            if (data?.to) {
                io.to(data.to).emit("game_sync_response", { ...data, from: userId });
            }
        });

        socket.on("music_play_sync", (data) => {
            if (data?.to) {
                io.to(data.to).emit("music_play_sync", { ...data, from: userId });
            }
        });

        socket.on("music_stop_sync", (data) => {
            if (data?.to) {
                io.to(data.to).emit("music_stop_sync", { ...data, from: userId });
            }
        });

        socket.on("incognito_toggle", (data) => {
            const senderId = getUserId();
            if (data?.to && senderId) {
                io.to(data.to).emit("incognito_toggle", { ...data, from: senderId });
                io.to(data.to).emit("disappearing_toggle", { ...data, from: senderId });
            }
        });

        socket.on("disappearing_toggle", (data) => {
            const senderId = getUserId();
            if (data?.to && senderId) {
                io.to(data.to).emit("disappearing_toggle", { ...data, from: senderId });
                io.to(data.to).emit("incognito_toggle", { ...data, from: senderId });
            }
        });

        socket.on("incognito_vanish", (data) => {
            const senderId = getUserId();
            if (data?.to && senderId) {
                io.to(data.to).emit("incognito_vanish", { ...data, from: senderId });
                io.to(data.to).emit("disappearing_vanish", { ...data, from: senderId });
            }
        });

        socket.on("disappearing_vanish", (data) => {
            const senderId = getUserId();
            if (data?.to && senderId) {
                io.to(data.to).emit("disappearing_vanish", { ...data, from: senderId });
                io.to(data.to).emit("incognito_vanish", { ...data, from: senderId });
            }
        });

        socket.on("storyLike", ({ to, storyId }) => {
            if (to && userId) {
                io.to(to).emit("storyLike", { from: userId, storyId });
            }
        });

        socket.on("storyView", ({ to, storyId }) => {
            if (to && userId) {
                io.to(to).emit("storyView", { from: userId, storyId });
            }
        });

        /**
         * SPEED DATING LOGIC
         */
        socket.on("join_speed_dating_lobby", (data?: { targetGender?: string }) => {
            if (userId) SpeedDatingManager.getInstance().joinLobby(socket, userId, data?.targetGender);
        });

        socket.on("leave_speed_dating_lobby", () => {
            if (userId) SpeedDatingManager.getInstance().leaveLobby(socket.id, userId);
            socket.leave('speed_dating_lobby');
        });

        socket.on("anonymous_chat_skip", (data: { partnerId: string }) => {
            if (userId) {
                SpeedDatingManager.getInstance().endActiveMatch(userId);
                if (data?.partnerId) {
                    SpeedDatingManager.getInstance().endActiveMatch(data.partnerId);
                    io.to(data.partnerId).emit("anonymous_chat_partner_skipped");
                }
                SpeedDatingManager.getInstance().joinLobby(socket, userId);
            }
        });

        const areUsersBlocked = async (a: string, b: string): Promise<boolean> => {
            try {
                const found = await prisma.blocks.findFirst({
                    where: {
                        OR: [
                            { blocker_id: a, blocked_id: b },
                            { blocker_id: b, blocked_id: a }
                        ]
                    },
                    select: { blocker_id: true }
                });
                return !!found;
            } catch {
                return false;
            }
        };

        socket.on("anonymous_chat_reveal_request", async (data: { partnerId: string }) => {
            if (userId && data?.partnerId) {
                if (await areUsersBlocked(userId, data.partnerId)) return;
                io.to(data.partnerId).emit("anonymous_chat_reveal_requested", { fromUserId: userId });
            }
        });

        socket.on("anonymous_chat_reveal_accept", async (data: { partnerId: string }) => {
            if (userId && data?.partnerId) {
                if (await areUsersBlocked(userId, data.partnerId)) return;
                try {
                    // Save mutual match & accepted connection in Prisma so unblurring persists
                    await prisma.matches.createMany({
                        data: [
                            { user_a_id: userId, user_b_id: data.partnerId, status: "accepted" },
                            { user_a_id: data.partnerId, user_b_id: userId, status: "accepted" }
                        ],
                        skipDuplicates: true
                    });

                    const existingReq = await prisma.interactions.findFirst({
                        where: {
                            type: 'REQUEST',
                            OR: [
                                { from_user_id: userId, to_user_id: data.partnerId },
                                { from_user_id: data.partnerId, to_user_id: userId }
                            ]
                        },
                        select: { id: true }
                    });
                    if (existingReq) {
                        await prisma.interactions.update({
                            where: { id: existingReq.id },
                            data: { status: 'connected' }
                        });
                    } else {
                        await prisma.interactions.create({
                            data: {
                                from_user_id: userId,
                                to_user_id: data.partnerId,
                                type: 'REQUEST',
                                status: 'connected'
                            }
                        });
                    }

                    try {
                        const { matchCache } = require('./routes/matches');
                        matchCache?.deletePrefix(userId);
                        matchCache?.deletePrefix(data.partnerId);
                    } catch {}

                    // Fetch real user profiles
                    const [me, partner] = await Promise.all([
                        prisma.users.findUnique({
                            where: { id: userId },
                            select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } }
                        }),
                        prisma.users.findUnique({
                            where: { id: data.partnerId },
                            select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } }
                        })
                    ]);

                    const formatRevealed = (u: any) => u ? ({
                        id: u.id,
                        full_name: u.full_name,
                        avatar_url: sanitizePhotoUrl(u.avatar_url, u.full_name || 'Member'),
                        photo_privacy: isPhotoPrivacyShieldEnabled(u.profiles?.metadata) ? 'blurred_until_accept' : 'public',
                        isBlurred: false
                    }) : null;

                    io.to(userId).emit("anonymous_chat_identity_revealed", { realUser: formatRevealed(partner) });
                    io.to(data.partnerId).emit("anonymous_chat_identity_revealed", { realUser: formatRevealed(me) });
                } catch (err) {
                    console.error("Reveal Accept Error", err);
                }
            }
        });

        socket.on("anonymous_chat_reveal_decline", (data: { partnerId: string }) => {
            if (userId && data?.partnerId) {
                io.to(data.partnerId).emit("anonymous_chat_reveal_declined", { fromUserId: userId });
            }
        });

        socket.on("anonymous_chat_message", async ({ to, text }: { to: string; text: string }) => {
            if (userId && to && text) {
                if (await areUsersBlocked(userId, to)) {
                    socket.emit("anonymous_chat_partner_skipped");
                    return;
                }
                const sanitizedText = sanitizeContent(text);
                io.to(to).emit("anonymous_chat_message", {
                    from: userId,
                    text: sanitizedText,
                    timestamp: Date.now()
                });
            }
        });

        /**
         * CHAT LOGIC
         */
        socket.on("sendMessage", async ({ to, text }) => {
            console.warn("Legacy sendMessage event received. Client should use API.");
            // DEPRECATED: Logic moved to API route to prevent double-writes.
            // Leaving empty handler just in case of cached clients.
        });

        /**
         * COMMUNITY LOUNGE LOGIC
         */
        socket.on('join_community', async () => {
            const currentUserId = getUserId();
            if (!currentUserId) {
                socket.emit('community_error', { 
                    message: "Authentication required to join community.",
                    code: "AUTH_REQUIRED" 
                });
                return;
            }

            // Check if user is active and verified (Open to all verified users)
            const user = await prisma.users.findUnique({
                where: { id: currentUserId },
                select: {
                    is_verified: true,
                    is_banned: true,
                    is_deactivated: true,
                    deactivated_until: true,
                    full_name: true,
                    avatar_url: true,
                    profiles: { select: { metadata: true } }
                }
            });

            if (!isUserAccountActive(user)) {
                socket.emit('community_error', {
                    message: "Account is not active.",
                    code: "ACCOUNT_INACTIVE"
                });
                return;
            }

            if (!user || !user.is_verified) {
                socket.emit('community_error', {
                    message: "The Community Lounge is for Verified Members only. Please verify your profile to join.",
                    code: "VERIFICATION_REQUIRED"
                });
                return;
            }

            socket.join('verified_lounge');

            const isShielded = isPhotoPrivacyShieldEnabled(user.profiles?.metadata);
            const safePhoto = sanitizePhotoUrl(user.avatar_url, user.full_name || 'Verified Member');

            const loungeParticipant: LoungeParticipant = {
                id: currentUserId,
                userId: currentUserId,
                name: user.full_name || 'Verified Member',
                photo: safePhoto,
                isVerified: true,
                isShielded,
                updatedAt: Date.now()
            };
            // Add to Community Map + distributed Redis hash
            communityUsers.set(socket.id, loungeParticipant);
            if (isRedisReady()) {
                const redis = getRedisClient()!;
                redis.hset(REDIS_LOUNGE_HASH, socket.id, JSON.stringify(loungeParticipant))
                    .then(() => redis.expire(REDIS_LOUNGE_HASH, 86400))
                    .catch(() => {});
            }

            await broadcastCommunityUsers();

            // Lounge History Fetch & Cleanup
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            try {
                // Auto-cleanup old messages asynchronously
                prisma.lounge_messages.deleteMany({
                    where: { created_at: { lt: fiveDaysAgo } }
                }).catch(console.error);

                // Fetch user's block & connection relationships
                const [blockedUserIds, connectedSet] = await Promise.all([
                    getBlockedUserIdSet(prisma, currentUserId),
                    getConnectedUserIdSet(prisma, currentUserId)
                ]);

                // Fetch recent messages
                const historyRaw = await prisma.lounge_messages.findMany({
                    where: { created_at: { gte: fiveDaysAgo } },
                    orderBy: { created_at: 'asc' },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true,
                                profiles: { select: { metadata: true } }
                            }
                        }
                    }
                });

                const history = historyRaw
                    .filter(msg => !blockedUserIds.has(msg.users.id))
                    .map(msg => {
                        const senderShielded = isPhotoPrivacyShieldEnabled(msg.users.profiles?.metadata);
                        const isBlurred = senderShielded && msg.users.id !== currentUserId && !connectedSet.has(msg.users.id);
                        return {
                            id: msg.id,
                            text: msg.text,
                            sender: {
                                id: msg.users.id,
                                userId: msg.users.id,
                                name: msg.users.full_name || 'Member',
                                photo: isBlurred ? null : sanitizePhotoUrl(msg.users.avatar_url, msg.users.full_name || 'Member'),
                                isVerified: true,
                                photo_privacy: senderShielded ? 'blurred_until_accept' : 'public',
                                isBlurred
                            },
                            timestamp: msg.created_at
                        };
                    });

                socket.emit('joined_community', {
                    success: true,
                    message: "Welcome to the Verified Lounge 💎",
                    history,
                    blockedUserIds: Array.from(blockedUserIds)
                });
            } catch (err) {
                console.error("Failed to fetch lounge history:", err);
                socket.emit('joined_community', { success: true, message: "Welcome to the Verified Lounge 💎" });
            }

            console.log(`User ${currentUserId} joined verified_lounge`);
        });

        socket.on('leave_community', () => {
            socket.leave('verified_lounge');
            leaveCommunity();
        });

        socket.on('send_community_message', async ({ text }) => {
            const from = getUserId();
            if (!from || !communityUsers.has(socket.id)) {
                socket.emit('community_error', { message: "Not authorized or not in community." });
                return;
            }

            const user = communityUsers.get(socket.id);
            if (!user || !text || typeof text !== 'string' || !text.trim()) return;

            const sanitizedText = sanitizeContent(text);

            try {
                // Save to DB
                const saved = await prisma.lounge_messages.create({
                    data: {
                        sender_id: from,
                        text: sanitizedText
                    }
                });

                const loungePayload = {
                    id: saved.id,
                    from,
                    user: { name: user.name, photo: user.photo, isShielded: user.isShielded },
                    sanitizedText,
                    timestamp: saved.created_at
                };
                emitClusterEvent('lounge:message', loungePayload);
                await deliverCommunityMessageLocal(loungePayload);
            } catch (createErr) {
                console.error("Failed to save lounge message:", createErr);
            }
        });

        socket.on('delete_community_message', async ({ messageId }) => {
            const currentUserId = getUserId();
            if (!currentUserId || !messageId) return;

            try {
                const msg = await prisma.lounge_messages.findUnique({
                    where: { id: messageId }
                });

                if (!msg) return;

                // Strictly only the sender can delete their own message
                if (msg.sender_id !== currentUserId) {
                    socket.emit('community_error', { message: "You can only delete your own messages." });
                    return;
                }

                await prisma.lounge_messages.delete({
                    where: { id: messageId }
                });

                // Broadcast deletion to all users in verified_lounge room
                io.to('verified_lounge').emit('community_message_deleted', { messageId });
            } catch (delErr) {
                console.error("Failed to delete lounge message via socket:", delErr);
            }
        });
    });

    console.log("✅ Socket.io Initialized");
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const isUserOnline = (userId: string): boolean => {
    if (!userId) return false;
    if (isUserOnlineLocalOrCluster(userId)) return true;
    if (io) {
        const room = io.sockets.adapter.rooms.get(userId);
        if (room && room.size > 0) return true;
    }
    return false;
};

export const getOnlineUserIds = (): string[] => {
    const combined = new Set<string>(userSockets.keys());
    for (const id of clusterOnlineUsers) {
        combined.add(id);
    }
    return Array.from(combined);
};

export const isUserActiveInChat = (userId: string, partnerId: string): boolean => {
    if (!userId || !partnerId) return false;
    const u = String(userId).trim().toLowerCase();
    const p = String(partnerId).trim().toLowerCase();

    // Check direct activeChats mapping with case-insensitivity & sub-string containment
    for (const [k, v] of activeChats.entries()) {
        const key = String(k).trim().toLowerCase();
        const val = String(v).trim().toLowerCase();
        if (key === u && (val === p || val.includes(p) || p.includes(val))) {
            return true;
        }
    }
    return false;
};

export const isUserActiveInChatAsync = async (userId: string, partnerId: string): Promise<boolean> => {
    if (isUserActiveInChat(userId, partnerId)) return true;
    if (!userId || !partnerId || !isRedisReady()) return false;
    try {
        const u = String(userId).trim().toLowerCase();
        const p = String(partnerId).trim().toLowerCase();
        const valRaw = await getRedisClient()!.get(`${REDIS_ACTIVE_CHAT_PREFIX}${u}`);
        if (!valRaw) return false;
        const val = valRaw.trim().toLowerCase();
        return val === p || val.includes(p) || p.includes(val);
    } catch {
        return false;
    }
};

export const closeSocketServer = async (): Promise<void> => {
    // Clean up local sockets from distributed presence sets before shutting down
    if (isRedisReady()) {
        const redis = getRedisClient()!;
        const cleanups: Promise<any>[] = [];
        for (const [uid, sockSet] of userSockets.entries()) {
            const ids = Array.from(sockSet);
            if (ids.length > 0) {
                cleanups.push(redis.hdel(`${REDIS_ONLINE_SOCK_PREFIX}${uid}`, ...ids));
            }
        }
        const loungeIds = Array.from(communityUsers.keys());
        if (loungeIds.length > 0) {
            cleanups.push(redis.hdel(REDIS_LOUNGE_HASH, ...loungeIds));
        }
        await Promise.allSettled(cleanups);
    }
    if (io) {
        await Promise.race([
            new Promise<void>((resolve) => io.close(() => resolve())),
            new Promise<void>((resolve) => setTimeout(resolve, 2500))
        ]);
    }
};

