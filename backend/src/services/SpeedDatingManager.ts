import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';
import { getRedisClient, isRedisReady } from './redisClient';

const REDIS_SD_MALES = 'lp:sd:males';
const REDIS_SD_FEMALES = 'lp:sd:females';
const REDIS_SD_ACTIVE = 'lp:sd:active';
const REDIS_SD_SOCK_MAP = 'lp:sd:sock_map';
const REDIS_SD_LOCK = 'lp:sd:match_lock';
const UNLOCK_LUA = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

interface QueuedUser {
    socketId: string;
    userId: string;
    gender: string;
    targetGender: string;
    name: string;
    photoUrl: string;
    location: string;
    country: string;
    motherTongue: string;
    interests: string[];
    age: number;
    joinedAt: number;
}

export class SpeedDatingManager {
    private static instance: SpeedDatingManager;
    private io: Server | null = null;
    private readonly instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

    private maleQueue: Map<string, QueuedUser> = new Map();
    private femaleQueue: Map<string, QueuedUser> = new Map();
    private activeMatches: Set<string> = new Set(); // store userId that is currently in a call

    private matchLoopInterval: NodeJS.Timeout | null = null;
    private isProcessingCycle = false;

    private constructor() { }

    public static getInstance(): SpeedDatingManager {
        if (!SpeedDatingManager.instance) {
            SpeedDatingManager.instance = new SpeedDatingManager();
        }
        return SpeedDatingManager.instance;
    }

    public init(io: Server) {
        this.io = io;
        if (!this.matchLoopInterval) {
            this.matchLoopInterval = setInterval(() => {
                void this.processMatchmaking();
            }, 1000);
            if (typeof this.matchLoopInterval.unref === 'function') {
                this.matchLoopInterval.unref();
            }
            console.log("🚀 Speed Dating Manager Initialized (1s Fast Cycle).");
        }
    }

    public async joinLobby(socket: Socket, userId: string, targetGender?: string) {
        const now = Date.now();
        if (this.activeMatches.has(userId)) {
            socket.emit('speed_date_error', { message: "You are already in an active session." });
            return;
        }
        if (isRedisReady()) {
            try {
                const activeRaw = await getRedisClient()!.hget(REDIS_SD_ACTIVE, userId);
                if (activeRaw && now - Number(activeRaw) < 2 * 3600 * 1000) {
                    socket.emit('speed_date_error', { message: "You are already in an active session." });
                    return;
                }
                if (activeRaw) {
                    await getRedisClient()!.hdel(REDIS_SD_ACTIVE, userId);
                }
            } catch {}
        }

        // Fetch User Gender, Location, and Profile Metadata
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                age: true,
                full_name: true,
                avatar_url: true,
                city: true,
                state: true,
                location_name: true,
                is_banned: true,
                is_deactivated: true,
                deactivated_until: true,
                profiles: { select: { metadata: true } }
            }
        });

        const isDeactivatedActive = user?.is_deactivated && (!user.deactivated_until || new Date(user.deactivated_until) > new Date());
        if (!user || user.is_banned || isDeactivatedActive) {
            socket.emit('speed_date_error', { message: "Account is unavailable for speed dating." });
            return;
        }
        if (!user.gender || !user.full_name) {
            socket.emit('speed_date_error', { message: "Incomplete profile. Please set your gender and name." });
            return;
        }

        const meta = (user.profiles?.metadata as any) || {};
        const gender = user.gender.toLowerCase();
        const effectiveTargetGender = targetGender || (gender === 'male' ? 'female' : 'male');
        const locString = user.city ? (user.state ? `${user.city}, ${user.state}` : user.city) : (user.location_name || 'Verified Location');
        const country = meta.location?.country || (user.state || user.city ? 'India' : 'Global');
        const motherTongue = meta.motherTongue || '';
        const interests = Array.isArray(meta.interests) ? meta.interests : [];

        const queuedUser: QueuedUser = {
            socketId: socket.id,
            userId: userId,
            gender: gender,
            targetGender: effectiveTargetGender,
            name: user.full_name,
            photoUrl: user.avatar_url || '',
            location: locString,
            country: country,
            motherTongue: motherTongue,
            interests: interests,
            age: user.age || 24,
            joinedAt: Date.now()
        };

        const isFemale = gender === 'female';
        if (isFemale) {
            this.femaleQueue.set(userId, queuedUser);
        } else {
            // Default non-binary or unassigned to male queue for matchmaking
            this.maleQueue.set(userId, queuedUser);
        }

        if (isRedisReady()) {
            try {
                const redis = getRedisClient()!;
                const queueKey = isFemale ? REDIS_SD_FEMALES : REDIS_SD_MALES;
                const bucketTag = isFemale ? 'F' : 'M';
                await Promise.all([
                    redis.hset(queueKey, userId, JSON.stringify(queuedUser)),
                    redis.hset(REDIS_SD_SOCK_MAP, socket.id, `${bucketTag}:${userId}`),
                    redis.expire(queueKey, 3600),
                    redis.expire(REDIS_SD_SOCK_MAP, 3600)
                ]);
            } catch {}
        }

        socket.join('speed_dating_lobby');
        socket.emit('speed_date_joined', { message: "Joined Lobby. Searching for an instant match..." });
        
        console.log(`[SPEED DATING] ${userId} (${gender}, seeking ${effectiveTargetGender}, ${country}, ${motherTongue || 'All'}) joined.`);
        await this.broadcastLobbyStats();

        // Trigger Zero-Wait Instant Matchmaking immediately
        void this.processMatchmaking();
    }

    public leaveLobby(socketId: string, userId?: string) {
        let removedLocal = false;
        if (!userId) {
            for (const [id, user] of this.maleQueue.entries()) {
                if (user.socketId === socketId) {
                    this.maleQueue.delete(id);
                    removedLocal = true;
                    break;
                }
            }
            if (!removedLocal) {
                for (const [id, user] of this.femaleQueue.entries()) {
                    if (user.socketId === socketId) {
                        this.femaleQueue.delete(id);
                        removedLocal = true;
                        break;
                    }
                }
            }
        } else {
            if (this.maleQueue.delete(userId)) removedLocal = true;
            if (this.femaleQueue.delete(userId)) removedLocal = true;
        }

        if (isRedisReady()) {
            const redis = getRedisClient()!;
            (async () => {
                try {
                    if (userId) {
                        await Promise.all([
                            redis.hdel(REDIS_SD_MALES, userId),
                            redis.hdel(REDIS_SD_FEMALES, userId),
                            redis.hdel(REDIS_SD_SOCK_MAP, socketId)
                        ]);
                    } else {
                        const mapped = await redis.hget(REDIS_SD_SOCK_MAP, socketId);
                        if (mapped) {
                            const [bucketTag, mappedUid] = mapped.split(':');
                            await Promise.all([
                                redis.hdel(bucketTag === 'F' ? REDIS_SD_FEMALES : REDIS_SD_MALES, mappedUid),
                                redis.hdel(REDIS_SD_SOCK_MAP, socketId)
                            ]);
                        }
                    }
                    await this.broadcastLobbyStats();
                } catch {}
            })();
            return;
        }

        if (removedLocal) {
            void this.broadcastLobbyStats();
        }
    }

    public endActiveMatch(userId: string) {
        this.activeMatches.delete(userId);
        if (isRedisReady()) {
            getRedisClient()!.hdel(REDIS_SD_ACTIVE, userId).catch(() => {});
        }
    }

    private async broadcastLobbyStats() {
        if (!this.io) return;
        let maleCount = this.maleQueue.size;
        let femaleCount = this.femaleQueue.size;
        if (isRedisReady()) {
            try {
                const redis = getRedisClient()!;
                const [rM, rF] = await Promise.all([redis.hlen(REDIS_SD_MALES), redis.hlen(REDIS_SD_FEMALES)]);
                maleCount = Math.max(maleCount, rM);
                femaleCount = Math.max(femaleCount, rF);
            } catch {}
        }
        const waitingCount = maleCount + femaleCount;
        this.io.to('speed_dating_lobby').emit('speed_date_stats', {
            waitingCount,
            maleCount,
            femaleCount
        });
    }

    private parseRedisQueueEntries(rawMap: Record<string, string>, queueKey: string, now: number): QueuedUser[] {
        const result: QueuedUser[] = [];
        const staleIds: string[] = [];
        const maxAgeMs = 15 * 60 * 1000;
        for (const [uid, jsonStr] of Object.entries(rawMap)) {
            try {
                const parsed = JSON.parse(jsonStr) as QueuedUser;
                if (!parsed?.userId || !parsed?.socketId || (now - parsed.joinedAt > maxAgeMs)) {
                    staleIds.push(uid);
                    continue;
                }
                result.push(parsed);
            } catch {
                staleIds.push(uid);
            }
        }
        if (staleIds.length > 0 && isRedisReady()) {
            getRedisClient()!.hdel(queueKey, ...staleIds).catch(() => {});
        }
        return result;
    }

    private async processMatchmaking() {
        if (!this.io || this.isProcessingCycle) return;
        this.isProcessingCycle = true;

        const redisReady = isRedisReady();
        const redis = redisReady ? getRedisClient()! : null;
        let acquiredRedisLock = false;

        try {
            const now = Date.now();
            let males: QueuedUser[] = [];
            let females: QueuedUser[] = [];

            if (redis) {
                const lockOk = await redis.set(REDIS_SD_LOCK, this.instanceId, 'PX', 1500, 'NX');
                if (!lockOk) {
                    return; // Another cluster instance owns this 1s matchmaking tick
                }
                acquiredRedisLock = true;
                const [rawMales, rawFemales] = await Promise.all([
                    redis.hgetall(REDIS_SD_MALES),
                    redis.hgetall(REDIS_SD_FEMALES)
                ]);
                males = this.parseRedisQueueEntries(rawMales, REDIS_SD_MALES, now);
                females = this.parseRedisQueueEntries(rawFemales, REDIS_SD_FEMALES, now);
            } else {
                males = Array.from(this.maleQueue.values());
                females = Array.from(this.femaleQueue.values());
            }

            if (males.length === 0 && females.length === 0) return;

            // Fetch active block pairs among queued users so blocked members never pair
            const blockedPairSet = new Set<string>();
            if (males.length > 0 && females.length > 0) {
                const queuedIds = [...males.map(u => u.userId), ...females.map(u => u.userId)];
                try {
                    const blocks = await prisma.blocks.findMany({
                        where: {
                            OR: [
                                { blocker_id: { in: queuedIds } },
                                { blocked_id: { in: queuedIds } }
                            ]
                        },
                        select: { blocker_id: true, blocked_id: true }
                    });
                    for (const b of blocks) {
                        blockedPairSet.add(`${b.blocker_id}:${b.blocked_id}`);
                        blockedPairSet.add(`${b.blocked_id}:${b.blocker_id}`);
                    }
                } catch (err) {
                    console.warn('[SPEED DATING] Failed to load block filters:', err);
                }
            }

            const unmatchedMales: QueuedUser[] = [];

            // 1. Peer-to-Peer Socket Matching with MNC Proximity, Language & Affinity Intelligence
            for (const maleUser of males) {
                const eligibleFemales = females.filter(f =>
                    !blockedPairSet.has(`${maleUser.userId}:${f.userId}`) &&
                    (maleUser.targetGender === 'any' || maleUser.targetGender === 'female') &&
                    (f.targetGender === 'any' || f.targetGender === 'male')
                );

                if (eligibleFemales.length === 0) {
                    unmatchedMales.push(maleUser);
                    continue;
                }

                // Score each eligible female candidate against the male user
                const scoredCandidates = eligibleFemales.map(f => {
                    let affinity = 50;

                    // A. Country / Location Affinity
                    const mCountry = (maleUser.country || '').trim().toLowerCase();
                    const fCountry = (f.country || '').trim().toLowerCase();
                    if (mCountry && fCountry && mCountry === fCountry) {
                        affinity += 40;
                    } else if (mCountry && fCountry && mCountry !== 'india' && fCountry !== 'india') {
                        affinity += 20; // Shared international diaspora
                    }

                    // B. Language Affinity
                    const mLang = (maleUser.motherTongue || '').trim().toLowerCase();
                    const fLang = (f.motherTongue || '').trim().toLowerCase();
                    if (mLang && fLang && mLang === fLang) {
                        affinity += 30;
                    } else if (mLang === 'english' || fLang === 'english') {
                        affinity += 15;
                    }

                    // C. Age Compatibility
                    const ageDiff = Math.abs((maleUser.age || 25) - (f.age || 24));
                    if (ageDiff <= 3) {
                        affinity += 20;
                    } else if (ageDiff <= 6) {
                        affinity += 10;
                    }

                    // D. Shared Interests
                    if (Array.isArray(maleUser.interests) && Array.isArray(f.interests)) {
                        const shared = maleUser.interests.filter(i => f.interests.includes(i));
                        affinity += Math.min(shared.length * 5, 15);
                    }

                    // E. Graceful Waiting Time Boost (Ensures no user waits endlessly in queue)
                    const maxWait = Math.max(now - maleUser.joinedAt, now - f.joinedAt);
                    if (maxWait > 30000) {
                        affinity += 100;
                    } else if (maxWait > 15000) {
                        affinity += 50;
                    }

                    return { candidate: f, score: affinity };
                });

                // Pick the highest scoring candidate
                scoredCandidates.sort((a, b) => b.score - a.score);
                const bestCandidate = scoredCandidates[0].candidate;
                const candidateIndex = females.findIndex(f => f.userId === bestCandidate.userId);

                if (candidateIndex > -1) {
                    const femaleUser = females.splice(candidateIndex, 1)[0];

                    this.maleQueue.delete(maleUser.userId);
                    this.femaleQueue.delete(femaleUser.userId);
                    this.activeMatches.add(maleUser.userId);
                    this.activeMatches.add(femaleUser.userId);

                    if (redis) {
                        await Promise.all([
                            redis.hdel(REDIS_SD_MALES, maleUser.userId),
                            redis.hdel(REDIS_SD_FEMALES, femaleUser.userId),
                            redis.hdel(REDIS_SD_SOCK_MAP, maleUser.socketId, femaleUser.socketId),
                            redis.hset(REDIS_SD_ACTIVE, maleUser.userId, String(now), femaleUser.userId, String(now)),
                            redis.expire(REDIS_SD_ACTIVE, 7200)
                        ]).catch(() => {});
                    }

                    console.log(`[SPEED DATING] Live Matched ${maleUser.userId} with ${femaleUser.userId} (Affinity: ${scoredCandidates[0].score})`);

                    this.io.to(maleUser.socketId).emit('speed_date_match_found', {
                        partner: {
                            id: femaleUser.userId,
                            name: "Anonymous Stranger",
                            photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + femaleUser.userId,
                            location: femaleUser.location,
                            age: femaleUser.age || 24,
                            gender: femaleUser.gender
                        },
                        initiator: true
                    });

                    this.io.to(femaleUser.socketId).emit('speed_date_match_found', {
                        partner: {
                            id: maleUser.userId,
                            name: "Anonymous Stranger",
                            photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + maleUser.userId,
                            location: maleUser.location,
                            age: maleUser.age || 25,
                            gender: maleUser.gender
                        },
                        initiator: false
                    });

                    await this.broadcastLobbyStats();
                } else {
                    unmatchedMales.push(maleUser);
                }
            }

            // Notify remaining queued users if lobby is empty of opposite gender
            const remainingAll = [...unmatchedMales, ...females];
            for (const queued of remainingAll) {
                const hasOppositeInQueue = queued.gender === 'male' ? females.length > 0 : unmatchedMales.length > 0;
                if (!hasOppositeInQueue) {
                    const targetLabel = queued.targetGender === 'female' ? 'Single Females' : 'Single Males';
                    this.io.to(queued.socketId).emit('speed_date_waiting', {
                        message: `Right now no ${targetLabel} are online in the lobby. Staying in queue...`
                    });
                }
            }
        } catch (err) {
            console.warn('[SPEED DATING] Matchmaking cycle warning:', err);
        } finally {
            if (acquiredRedisLock && redis) {
                redis.eval(UNLOCK_LUA, 1, REDIS_SD_LOCK, this.instanceId).catch(() => {});
            }
            this.isProcessingCycle = false;
        }
    }
}
