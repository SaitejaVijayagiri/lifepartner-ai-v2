import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from './prisma'; // Use Prisma
import jwt from 'jsonwebtoken';
import { SpeedDatingManager } from './services/SpeedDatingManager';
import { sanitizeContent } from './utils/contentFilter';

let io: Server;
// userId -> count of active sockets
const onlineUsers = new Map<string, number>();

// userId -> active partnerId that user is currently chatting with
// (used to suppress push notifications when recipient is actively viewing the conversation)
const activeChats = new Map<string, string>();

// Track users explicitly in the Verified Lounge
// socketId -> { id, userId, name, photo, isVerified }
const communityUsers = new Map<string, { id?: string, userId: string, name: string, photo: string, isVerified?: boolean }>();

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
            const connectionsList = await prisma.interactions.findMany({
                where: {
                    OR: [
                        { from_user_id: targetUserId },
                        { to_user_id: targetUserId }
                    ],
                    status: 'connected'
                },
                select: {
                    from_user_id: true,
                    to_user_id: true
                }
            });

            const name = userDetails.full_name || 'Someone';
            const { sanitizePhotoUrl } = require('./utils/photoUrl');
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
                const isOtherOnline = (onlineUsers.get(otherUserId) || 0) > 0;

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
                            `Match Active ⚡`,
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

export const addSocketToOnlineUser = (socket: Socket | any, targetUserId: string) => {
    if (!targetUserId) return;

    // Detach any previous user ID tracked by this socket
    if (socket.data?.trackedUserId && socket.data.trackedUserId !== targetUserId) {
        removeSocketFromOnlineUser(socket, socket.data.trackedUserId);
    }

    if (socket.data) {
        socket.data.trackedUserId = targetUserId;
    }
    if (socket.join) {
        socket.join(targetUserId);
    }

    const currentCount = onlineUsers.get(targetUserId) || 0;
    onlineUsers.set(targetUserId, currentCount + 1);

    // Send CURRENT online list to this socket
    if (socket.emit) {
        socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }

    // Notify others that this user is online ONLY if they just came online (0 -> 1)
    if (currentCount === 0) {
        if (socket.broadcast && socket.broadcast.emit) {
            socket.broadcast.emit('userOnline', targetUserId);
        }
        if (io) {
            io.to('public_updates').emit('public_stats', {
                onlineCount: onlineUsers.size,
                loungeCount: new Set(Array.from(communityUsers.values()).map(u => u.userId)).size
            });
        }
        notifyConnectionsOfOnlineStatus(targetUserId);
    }
};

export const removeSocketFromOnlineUser = (socket: Socket | any, targetUserId?: string) => {
    const uId = targetUserId || socket.data?.trackedUserId || socket.data?.user?.userId;
    if (!uId) return;

    if (socket.data) {
        socket.data.trackedUserId = undefined;
    }
    const currentCount = onlineUsers.get(uId) || 0;
    if (currentCount <= 1) {
        onlineUsers.delete(uId);
        activeChats.delete(uId);
        if (io) {
            io.emit('userOffline', uId);
            io.to('public_updates').emit('public_stats', {
                onlineCount: onlineUsers.size,
                loungeCount: new Set(Array.from(communityUsers.values()).map(u => u.userId)).size
            });
        }
    } else {
        onlineUsers.set(uId, currentCount - 1);
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

        // JWT_SECRET guaranteed by startup guard in server.ts (throws if missing)
        const secret = process.env.JWT_SECRET!;
        jwt.verify(token as string, secret, (err, decoded) => {
            if (err) {
                // Invalid token? Treat as guest.
                socket.data.isGuest = true;
                return next();
            }
            socket.data.user = decoded; // Store user info in socket session
            next();
        });
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.userId;
        const isGuest = socket.data.isGuest;
        console.log(`Socket Connected: ${socket.id} (User: ${userId || 'Guest'})`);

        // Join Public Updates Room (Stats)
        socket.join('public_updates');

        // Send initial stats on connect
        const loungeList = Array.from(communityUsers.values());
        const loungeCount = new Set(loungeList.map(u => u.userId)).size;

        socket.emit('public_stats', {
            onlineCount: onlineUsers.size || 1,
            loungeCount: loungeCount
        });

        // Send current online user IDs even to guests/initial connects
        socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

        if (userId) {
            addSocketToOnlineUser(socket, userId);
        }

        const leaveCommunity = () => {
            if (communityUsers.has(socket.id)) {
                communityUsers.delete(socket.id);
                const list = Array.from(communityUsers.values());
                // Use a Map to dedup by userId in case of multiple tabs
                const uniqueList = Array.from(new Map(list.map(u => [u.userId, u])).values());
                io.to('verified_lounge').emit('update_community_users', uniqueList);

                // Broadcast Count to Public
                io.emit('public_stats', { onlineCount: onlineUsers.size, loungeCount: uniqueList.length });
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
                socket.data.callPartnerId = null;
            }

            const activeUserId = socket.data.trackedUserId || socket.data.user?.userId || userId;
            if (activeUserId) {
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

        // Personal room handling and post-connection authentication
        socket.on('join-room', (uId: string) => {
            if (uId && typeof uId === 'string') {
                socket.join(uId);
                console.log(`Socket ${socket.id} joined personal room: ${uId}`);
            }
        });

        socket.on('authenticate', (data: { token?: string }) => {
            const token = data?.token || socket.handshake.auth?.token;
            if (!token) return;
            try {
                const secret = process.env.JWT_SECRET!;
                jwt.verify(token, secret, (err: any, decoded: any) => {
                    if (err || !decoded?.userId) return;
                    const uId = decoded.userId;
                    socket.data.user = decoded;
                    socket.data.isGuest = false;

                    addSocketToOnlineUser(socket, uId);
                    console.log(`Socket ${socket.id} authenticated post-connect as User ${uId}`);
                });
            } catch (err) {
                console.warn(`Socket authentication error:`, err);
            }
        });

        // --- ACTIVE CHAT TRACKING (SUPPRESS PUSH NOTIFICATIONS WHILE USER IS CHATTING) ---
        socket.on('enter_chat', (data: { partnerId: string; userId?: string }) => {
            const currentUserId = socket.data.user?.userId || userId || data?.userId;
            if (currentUserId && data?.partnerId) {
                activeChats.set(currentUserId, String(data.partnerId));
                socket.data.activePartnerId = String(data.partnerId);
                console.log(`[Active Chat] User ${currentUserId} entered chat with ${data.partnerId}`);
            }
        });

        socket.on('leave_chat', () => {
            const currentUserId = socket.data.user?.userId || userId;
            if (currentUserId) {
                activeChats.delete(currentUserId);
                socket.data.activePartnerId = null;
                console.log(`[Active Chat] User ${currentUserId} left chat`);
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
            const from = userId; // Secure source
            if (!userToCall || userToCall === from) {
                console.warn(`[callUser] Rejected self-call or invalid target: from ${from} to ${userToCall}`);
                return;
            }
            console.log(`Call Initiated: ${from} -> ${userToCall} (${type || 'video'})`);

        try {
                // Fetch caller name, location, and avatar for call UI (no premium gate — calls are free for all)
                const callerData = from ? await prisma.users.findUnique({
                    where: { id: from },
                    select: { city: true, location_name: true, full_name: true, avatar_url: true }
                }) : null;

                const userLocation = callerData?.city || callerData?.location_name || null;
                const secureName = callerData?.full_name || name || 'A User';
                const callerAvatar = callerData?.avatar_url || null;

                io.to(userToCall).emit("callUser", {
                    signal: signalData,
                    from,
                    name: secureName,
                    type,
                    location: userLocation,
                    avatarUrl: callerAvatar,
                    photoUrl: callerAvatar,
                    _speedDateMode
                });

                // Track call partner on this socket so disconnect only notifies them
                socket.data.callPartnerId = userToCall;

                // Incoming Call Push notification: Alert target user (always ensure phone rings even if tab is in background)
                const lastPush = (socket as any).lastPushTime || 0;
                
                if (Date.now() - lastPush > 10000) {
                    (socket as any).lastPushTime = Date.now();
                    const { NotificationService } = require('./services/notification');
                    NotificationService.getInstance().sendToUser(
                        userToCall,
                        `Incoming ${type === 'audio' ? 'Audio' : 'Video'} Call 📞`,
                        `${secureName} is calling you. Tap to answer!`,
                        {
                            type: 'incoming_call',
                            callerId: from,
                            callerName: secureName,
                            callerPhoto: callerAvatar || '',
                            callType: type || 'video'
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
            if (data?.to) {
                io.to(data.to).emit("incognito_toggle", { ...data, from: userId });
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

        socket.on("anonymous_chat_reveal_request", (data: { partnerId: string }) => {
            if (userId && data?.partnerId) {
                io.to(data.partnerId).emit("anonymous_chat_reveal_requested", { fromUserId: userId });
            }
        });

        socket.on("anonymous_chat_reveal_accept", async (data: { partnerId: string }) => {
            if (userId && data?.partnerId) {
                try {
                    // Save mutual match in Prisma
                    await prisma.matches.createMany({
                        data: [
                            { user_a_id: userId, user_b_id: data.partnerId, status: "accepted" },
                            { user_a_id: data.partnerId, user_b_id: userId, status: "accepted" }
                        ],
                        skipDuplicates: true
                    });

                    // Fetch real user profiles
                    const me = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, full_name: true, avatar_url: true } });
                    const partner = await prisma.users.findUnique({ where: { id: data.partnerId }, select: { id: true, full_name: true, avatar_url: true } });

                    io.to(userId).emit("anonymous_chat_identity_revealed", { realUser: partner });
                    io.to(data.partnerId).emit("anonymous_chat_identity_revealed", { realUser: me });
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

        socket.on("anonymous_chat_message", ({ to, text }: { to: string; text: string }) => {
            if (userId && to && text) {
                io.to(to).emit("anonymous_chat_message", {
                    from: userId,
                    text: text,
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
            if (!userId) {
                socket.emit('community_error', { message: "Authentication required to join community." });
                return;
            }

            // Check if user is verified (Open to all verified users)
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: { is_verified: true, full_name: true, avatar_url: true }
            });

            if (!user || !user.is_verified) {
                socket.emit('community_error', {
                    message: "The Community Lounge is for Verified Members only. Please verify your profile to join.",
                    code: "VERIFICATION_REQUIRED"
                });
                return;
            }

            socket.join('verified_lounge');

            // Add to Community Map
            if (user) {
                communityUsers.set(socket.id, {
                    id: userId,
                    userId: userId,
                    name: user.full_name || 'Verified Member',
                    photo: user.avatar_url || '',
                    isVerified: true
                });
            }

            // Blast full list to everyone in room
            const list = Array.from(communityUsers.values());
            const uniqueList = Array.from(new Map(list.map(u => [u.userId, u])).values());

            io.to('verified_lounge').emit('update_community_users', uniqueList);
            // Broadcast Count to Public
            io.emit('public_stats', { onlineCount: onlineUsers.size, loungeCount: uniqueList.length });

            // Lounge History Fetch & Cleanup
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            try {
                // Auto-cleanup old messages asynchronously
                prisma.lounge_messages.deleteMany({
                    where: { created_at: { lt: fiveDaysAgo } }
                }).catch(console.error);

                // Fetch recent messages
                const historyRaw = await prisma.lounge_messages.findMany({
                    where: { created_at: { gte: fiveDaysAgo } },
                    orderBy: { created_at: 'asc' },
                    include: {
                        users: {
                            select: { id: true, full_name: true, avatar_url: true }
                        }
                    }
                });

                const history = historyRaw.map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    sender: {
                        id: msg.users.id,
                        userId: msg.users.id,
                        name: msg.users.full_name || 'Member',
                        photo: msg.users.avatar_url,
                        isVerified: true
                    },
                    timestamp: msg.created_at
                }));

                socket.emit('joined_community', { success: true, message: "Welcome to the Verified Lounge 💎", history });
            } catch (err) {
                console.error("Failed to fetch lounge history:", err);
                socket.emit('joined_community', { success: true, message: "Welcome to the Verified Lounge 💎" });
            }

            console.log(`User ${userId} joined verified_lounge`);
        });

        socket.on('leave_community', () => {
            socket.leave('verified_lounge');
            leaveCommunity();
        });

        socket.on('send_community_message', async ({ text }) => {
            const from = userId;
            if (!from || !communityUsers.has(socket.id)) {
                socket.emit('community_error', { message: "Not authorized or not in community." });
                return;
            }

            const user = communityUsers.get(socket.id);
            if (!user) return;

            const sanitizedText = sanitizeContent(text || '');

            try {
                // Save to DB
                const saved = await prisma.lounge_messages.create({
                    data: {
                        sender_id: from,
                        text: sanitizedText
                    }
                });

                const msgPayload = {
                    id: saved.id,
                    text: sanitizedText,
                    sender: {
                        id: from,
                        userId: from,
                        name: user.name,
                        photo: user.photo,
                        isVerified: true
                    },
                    timestamp: saved.created_at
                };

                // Emit to everyone in the 'verified_lounge' room
                io.to('verified_lounge').emit('receive_community_message', msgPayload);
            } catch (createErr) {
                console.error("Failed to save lounge message:", createErr);
            }
        });

        socket.on('delete_community_message', async ({ messageId }) => {
            if (!userId || !messageId) return;

            try {
                const msg = await prisma.lounge_messages.findUnique({
                    where: { id: messageId }
                });

                if (!msg) return;

                // Strictly only the sender can delete their own message
                if (msg.sender_id !== userId) {
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
    if (onlineUsers.has(userId) && (onlineUsers.get(userId) || 0) > 0) return true;
    if (io) {
        const room = io.sockets.adapter.rooms.get(userId);
        if (room && room.size > 0) return true;
    }
    return false;
};

export const getOnlineUserIds = (): string[] => {
    return Array.from(onlineUsers.keys());
};

export const isUserActiveInChat = (userId: string, partnerId: string): boolean => {
    if (!userId || !partnerId) return false;
    return activeChats.get(userId) === String(partnerId);
};

