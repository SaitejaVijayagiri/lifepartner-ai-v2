import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from './prisma'; // Use Prisma
import jwt from 'jsonwebtoken';

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

        const secret = process.env.JWT_SECRET || 'dev_secret_key_123';
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
                io.emit('public_stats', { onlineCount: onlineUsers.size, loungeCount: new Set(Array.from(communityUsers.values()).map(u => u.userId)).size });
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
            socket.broadcast.emit('callEnded');

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
        });

        // JOIN "Personal Room" (using userId as room name)
        // Auto-join based on auth, ignore client param if it doesn't match (or just force it)
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} auto-joined room ${userId}`);
        }

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
                // REVENUE PROTECTION: Check if Caller is Premium
                // Simple validation to prevent crashes if 'from' is 'me' or invalid
                if (from) {
                    const user = await prisma.users.findUnique({
                        where: { id: from },
                        select: { is_premium: true }
                    });

                    if (!user || !user.is_premium) {
                        console.log(`Blocked Call from Free User: ${from}`);
                        io.to(socket.id).emit("callError", {
                            message: "Voice & Video Calls are Premium Features. Upgrade to Plan to Unlock.",
                            code: "PREMIUM_REQUIRED"
                        });
                        return;
                    }
                }

                io.to(userToCall).emit("callUser", {
                    signal: signalData,
                    from,
                    name,
                    type // Pass the type (audio/video)
                });

                // Offline Ringing logic: Push notification if target user is disconnected
                const targetOnlineCount = onlineUsers.get(userToCall) || 0;
                if (targetOnlineCount === 0) {
                    const { notificationService } = require('./services/notification');
                    notificationService.sendToUser(
                        userToCall,
                        `Incoming ${type === 'audio' ? 'Audio' : 'Video'} Call 📞`,
                        `${name || 'Someone'} is calling you. Tap to answer!`,
                        {
                            type: 'incoming_call',
                            callerId: from,
                            callerName: name || '',
                        }
                    ).catch(console.error);
                }


            } catch (e) {
                console.error("Call Gating Error", e);
            }
        });

        /**
         * ANSWER CALL
         */
        socket.on("answerCall", (data) => {
            // console.log(`Call Answered by ${userId}`);
            io.to(data.to).emit("callAccepted", data.signal);
        });

        /**
         * END CALL
         */
        socket.on("endCall", ({ to }) => {
            io.to(to).emit("callEnded");
        });

        /**
         * TYPING
         */
        socket.on("typing", ({ to }) => {
            io.to(to).emit("typing", { from: userId });
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

            socket.emit('joined_community', { success: true, message: "Welcome to the Verified Lounge 💎" });

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
            if (!user) return; // Should not happen if communityUsers.has(socket.id) is true

            const msgPayload = {
                text,
                sender: {
                    id: from,
                    name: user.name,
                    photo: user.photo,
                    isVerified: true
                },
                timestamp: new Date()
            };

            // Emit to everyone in the 'verified_lounge' room
            io.to('verified_lounge').emit('receive_community_message', msgPayload);
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
