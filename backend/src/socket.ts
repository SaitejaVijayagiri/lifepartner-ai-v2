import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from './prisma'; // Use Prisma
import jwt from 'jsonwebtoken';
import { SpeedDatingManager } from './services/SpeedDatingManager';

let io: Server;
// userId -> count of active sockets
const onlineUsers = new Map<string, number>();

// Track users explicitly in the Verified Lounge
// socketId -> { userId, name, photo }
const communityUsers = new Map<string, { userId: string, name: string, photo: string }>();

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
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

        if (userId) {
            socket.join(userId);

            // Add to Online Map (track connection count)
            const currentCount = onlineUsers.get(userId) || 0;
            onlineUsers.set(userId, currentCount + 1);

            // Send CURRENT online list to THIS user
            socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

            // Notify OTHERS that this user is online ONLY if they just came online
            if (currentCount === 0) {
                socket.broadcast.emit('userOnline', userId);
                io.to('public_updates').emit('public_stats', { onlineCount: onlineUsers.size, loungeCount: new Set(Array.from(communityUsers.values()).map(u => u.userId)).size });

                // Find active connections to send witty online alerts
                (async () => {
                    try {
                        const userDetails = await prisma.users.findUnique({
                            where: { id: userId },
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
                                        { from_user_id: userId },
                                        { to_user_id: userId }
                                    ],
                                    status: 'connected'
                                },
                                select: {
                                    from_user_id: true,
                                    to_user_id: true
                                }
                            });

                            const name = userDetails.full_name || 'Someone';
                            const meta = (userDetails.profiles?.metadata as any) || {};
                            const { sanitizePhotoUrl } = require('./utils/photoUrl');
                            let rawPhoto = userDetails.avatar_url || (userDetails.profiles?.photos as any)?.[0] || null;
                            if (rawPhoto && rawPhoto.startsWith('data:image')) {
                                rawPhoto = null;
                            }
                            const fromUserPhoto = rawPhoto 
                                ? sanitizePhotoUrl(rawPhoto, name)
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;

                            // De-duplicate target user IDs in case of multiple interaction rows between the same two users
                            const uniqueTargetUserIds = new Set<string>();
                            for (const conn of connectionsList) {
                                const targetUserId = conn.from_user_id === userId ? conn.to_user_id : conn.from_user_id;
                                if (targetUserId) {
                                    uniqueTargetUserIds.add(targetUserId);
                                }
                            }

                            for (const targetUserId of uniqueTargetUserIds) {
                                const targetOnlineCount = onlineUsers.get(targetUserId) || 0;

                                const wittyMsgs = [
                                    `Your match ${name} just logged on! Strike a conversation while they are active! ⚡`,
                                    `${name} is online now! Send a quick hello to see what they are up to. 💬`,
                                    `Look who is online! ${name} is active now. Don't keep them waiting! 😉`,
                                    `⚡ Chemistry alert! ${name} just came online. Perfect time to ask them about their day!`
                                ];
                                const msg = wittyMsgs[Math.floor(Math.random() * wittyMsgs.length)];

                                if (targetOnlineCount > 0) {
                                    io.to(targetUserId).emit('notification:new', {
                                        id: `conn-online-${userId}-${Date.now()}`,
                                        type: 'connection_online',
                                        message: msg,
                                        timestamp: new Date(),
                                        fromUserId: userId,
                                        fromUserName: name,
                                        fromUserPhoto: fromUserPhoto
                                    });
                                } else {
                                    // Target user is offline: Send push notification to bring them online!
                                    try {
                                        const { NotificationService } = require('./services/notification');
                                        NotificationService.getInstance().sendToUser(
                                            targetUserId,
                                            `Match Active ⚡`,
                                            msg,
                                            {
                                                type: 'connection_online',
                                                fromUserId: userId,
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
                })();
            }
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

            if (userId) {
                const currentCount = onlineUsers.get(userId) || 0;
                if (currentCount <= 1) {
                    // Last connection dying
                    onlineUsers.delete(userId);
                    io.emit('userOffline', userId);
                    io.emit('public_stats', { onlineCount: onlineUsers.size, loungeCount: new Set(Array.from(communityUsers.values()).map(u => u.userId)).size });
                } else {
                    onlineUsers.set(userId, currentCount - 1);
                }
            }

            leaveCommunity();
            // Automatically remove user from speed dating queue/active match
            SpeedDatingManager.getInstance().leaveLobby(socket.id, userId);
            if (userId) {
                SpeedDatingManager.getInstance().endActiveMatch(userId);
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
                    socket.join(uId);

                    const currentCount = onlineUsers.get(uId) || 0;
                    if (currentCount === 0) {
                        onlineUsers.set(uId, 1);
                        socket.broadcast.emit('userOnline', uId);
                    }
                    socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
                    console.log(`Socket ${socket.id} authenticated post-connect as User ${uId}`);
                });
            } catch (err) {
                console.warn(`Socket authentication error:`, err);
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
        socket.on("callUser", async ({ userToCall, signalData, name, type }) => {
            const from = userId; // Secure source
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
                    photoUrl: callerAvatar
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
                    userId: userId,
                    name: user.full_name || 'Verified Member',
                    photo: user.avatar_url || ''
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

            try {
                // Save to DB
                const saved = await prisma.lounge_messages.create({
                    data: {
                        sender_id: from,
                        text: text
                    }
                });

                const msgPayload = {
                    id: saved.id,
                    text,
                    sender: {
                        id: from,
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

                // Only sender or admin can delete
                if (msg.sender_id !== userId) {
                    const userRecord = await prisma.users.findUnique({
                        where: { id: userId },
                        select: { is_admin: true }
                    });
                    if (!userRecord?.is_admin) {
                        socket.emit('community_error', { message: "You can only delete your own messages." });
                        return;
                    }
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
    if (!io) return false;
    const room = io.sockets.adapter.rooms.get(userId);
    return !!room && room.size > 0;
};
