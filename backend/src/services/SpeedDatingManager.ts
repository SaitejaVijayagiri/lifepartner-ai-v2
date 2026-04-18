import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';

interface QueuedUser {
    socketId: string;
    userId: string;
    gender: string;
    name: string;
    photoUrl: string;
    joinedAt: number;
}

export class SpeedDatingManager {
    private static instance: SpeedDatingManager;
    private io: Server | null = null;

    private maleQueue: Map<string, QueuedUser> = new Map();
    private femaleQueue: Map<string, QueuedUser> = new Map();
    private activeMatches: Set<string> = new Set(); // store userId that is currently in a call

    private matchLoopInterval: NodeJS.Timeout | null = null;

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
            this.matchLoopInterval = setInterval(() => this.processMatchmaking(), 5000);
            console.log("🚀 Speed Dating Manager Initialized.");
        }
    }

    public async joinLobby(socket: Socket, userId: string) {
        if (this.activeMatches.has(userId)) {
            socket.emit('speed_date_error', { message: "You are already in an active session." });
            return;
        }

        // Fetch User Gender and Details
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true, full_name: true, avatar_url: true }
        });

        if (!user || !user.gender || !user.full_name) {
            socket.emit('speed_date_error', { message: "Incomplete profile. Please set your gender and name." });
            return;
        }

        const gender = user.gender.toLowerCase();
        const queuedUser: QueuedUser = {
            socketId: socket.id,
            userId: userId,
            gender: gender,
            name: user.full_name,
            photoUrl: user.avatar_url || '',
            joinedAt: Date.now()
        };

        if (gender === 'male') {
            this.maleQueue.set(userId, queuedUser);
        } else if (gender === 'female') {
            this.femaleQueue.set(userId, queuedUser);
        } else {
            socket.emit('speed_date_error', { message: "Gender matching restriction applies." });
            return;
        }

        socket.join('speed_dating_lobby');
        socket.emit('speed_date_joined', { message: "Joined Lobby. Searching for a match..." });
        
        console.log(`[SPEED DATING] ${userId} (${gender}) joined. Lobby Stats: M:${this.maleQueue.size} F:${this.femaleQueue.size}`);
        this.broadcastLobbyStats();
    }

    public leaveLobby(socketId: string, userId?: string) {
        // Find by socket ID if userId not provided
        if (!userId) {
            for (const [id, user] of this.maleQueue.entries()) {
                if (user.socketId === socketId) {
                    this.maleQueue.delete(id);
                    this.broadcastLobbyStats();
                    return;
                }
            }
            for (const [id, user] of this.femaleQueue.entries()) {
                if (user.socketId === socketId) {
                    this.femaleQueue.delete(id);
                    this.broadcastLobbyStats();
                    return;
                }
            }
        } else {
            if (this.maleQueue.has(userId)) this.maleQueue.delete(userId);
            if (this.femaleQueue.has(userId)) this.femaleQueue.delete(userId);
            this.broadcastLobbyStats();
        }
    }

    public endActiveMatch(userId: string) {
        this.activeMatches.delete(userId);
    }

    private broadcastLobbyStats() {
        if (this.io) {
            const count = this.maleQueue.size + this.femaleQueue.size;
            // Also notify dashboard?
            this.io.to('speed_dating_lobby').emit('speed_date_stats', { 
                waitingCount: count 
            });
        }
    }

    private processMatchmaking() {
        if (!this.io) return;

        // Try to pair male and female
        // In a real system you might sort by `joinedAt` to match the longest waiters first
        const males = Array.from(this.maleQueue.values());
        const females = Array.from(this.femaleQueue.values());

        const pairsToMatch = Math.min(males.length, females.length);

        for (let i = 0; i < pairsToMatch; i++) {
            const maleUser = males[i];
            const femaleUser = females[i];

            // Remove from queue
            this.maleQueue.delete(maleUser.userId);
            this.femaleQueue.delete(femaleUser.userId);

            // Add to active matches
            this.activeMatches.add(maleUser.userId);
            this.activeMatches.add(femaleUser.userId);

            // Notify both they found a match
            console.log(`[SPEED DATING] Matched ${maleUser.userId} with ${femaleUser.userId}`);

            // To Male
            this.io.to(maleUser.socketId).emit('speed_date_match_found', {
                partner: {
                    id: femaleUser.userId,
                    name: "Mystery Date", // Blind match!
                    photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + femaleUser.userId 
                },
                initiator: true // one side must initiate WebRTC
            });

            // To Female
            this.io.to(femaleUser.socketId).emit('speed_date_match_found', {
                partner: {
                    id: maleUser.userId,
                    name: "Mystery Date", // Blind match!
                    photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + maleUser.userId
                },
                initiator: false
            });
        }
        
        if (pairsToMatch > 0) {
            this.broadcastLobbyStats();
        }
    }
}
