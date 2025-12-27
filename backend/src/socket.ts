import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from './prisma'; // Use Prisma
import jwt from 'jsonwebtoken';

let io: Server;
const onlineUsers = new Set<string>();

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // MIDDLEWARE: Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        jwt.verify(token as string, process.env.JWT_SECRET as string, (err, decoded) => {
            if (err) return next(new Error("Authentication error"));
            socket.data.user = decoded; // Store user info in socket session
            next();
        });
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.userId;
        console.log(`Socket User Connected: ${socket.id} (User: ${userId})`);

        if (userId) {
            socket.join(userId);

            // Add to Online Set
            onlineUsers.add(userId);

            // Send CURRENT online list to THIS user
            socket.emit('onlineUsers', Array.from(onlineUsers));

            // Notify OTHERS that this user is online
            socket.broadcast.emit('userOnline', userId);
        }

        // User Greeting
        socket.emit('me', socket.id);

        // Disconnect
        socket.on('disconnect', () => {
            socket.broadcast.emit('callEnded');

            if (userId) {
                // Check if truly offline (no other sockets for this user)
                // We check rooms. If room for userId is empty or undefined, they are gone.
                const room = io.sockets.adapter.rooms.get(userId);
                if (!room || room.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('userOffline', userId);
                }
            }
        });

        // JOIN "Personal Room" (using userId as room name)
        // Auto-join based on auth, ignore client param if it doesn't match (or just force it)
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} auto-joined room ${userId}`);
        }

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
         * TYPING
         */
        socket.on("typing", ({ to }) => {
            io.to(to).emit("typing", { from: userId });
        });

        /**
         * CHAT LOGIC
         */
        socket.on("sendMessage", async ({ to, text }) => {
            const from = userId; // Secure source
            // console.log(`Msg: ${from} -> ${to}: ${text}`);

            try {
                // 1. Save to DB
                await prisma.messages.create({
                    data: {
                        sender_id: from,
                        receiver_id: to,
                        content: text
                    }
                });

                // 2. Emit to Receiver
                io.to(to).emit("receiveMessage", {
                    text,
                    senderId: from,
                    timestamp: new Date()
                });
            } catch (e) {
                console.error("Message Persistence Error:", e);
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
