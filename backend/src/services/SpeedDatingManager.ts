import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma';

interface QueuedUser {
    socketId: string;
    userId: string;
    gender: string;
    targetGender: string;
    name: string;
    photoUrl: string;
    location: string;
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

    public async joinLobby(socket: Socket, userId: string, targetGender?: string) {
        if (this.activeMatches.has(userId)) {
            socket.emit('speed_date_error', { message: "You are already in an active session." });
            return;
        }

        // Fetch User Gender and Details
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true, full_name: true, avatar_url: true, city: true, location_name: true }
        });

        if (!user || !user.gender || !user.full_name) {
            socket.emit('speed_date_error', { message: "Incomplete profile. Please set your gender and name." });
            return;
        }

        const gender = user.gender.toLowerCase();
        const effectiveTargetGender = targetGender || (gender === 'male' ? 'female' : 'male');

        const queuedUser: QueuedUser = {
            socketId: socket.id,
            userId: userId,
            gender: gender,
            targetGender: effectiveTargetGender,
            name: user.full_name,
            photoUrl: user.avatar_url || '',
            location: user.city || user.location_name || 'Unknown Location',
            joinedAt: Date.now()
        };

        if (gender === 'male') {
            this.maleQueue.set(userId, queuedUser);
        } else if (gender === 'female') {
            this.femaleQueue.set(userId, queuedUser);
        } else {
            // Default non-binary or unassigned to male queue for matchmaking
            this.maleQueue.set(userId, queuedUser);
        }

        socket.join('speed_dating_lobby');
        socket.emit('speed_date_joined', { message: "Joined Lobby. Searching for an instant match..." });
        
        console.log(`[SPEED DATING] ${userId} (${gender}, seeking ${effectiveTargetGender}) joined. Lobby Stats: M:${this.maleQueue.size} F:${this.femaleQueue.size}`);
        this.broadcastLobbyStats();

        // Trigger Zero-Wait Instant Matchmaking immediately
        this.processMatchmaking();
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
            this.io.to('speed_dating_lobby').emit('speed_date_stats', { 
                waitingCount: count,
                maleCount: this.maleQueue.size,
                femaleCount: this.femaleQueue.size
            });
        }
    }

    private processMatchmaking() {
        if (!this.io) return;

        const males = Array.from(this.maleQueue.values());
        const females = Array.from(this.femaleQueue.values());

        for (const maleUser of males) {
            // Find a matching female whose target preference is compatible
            const candidateIndex = females.findIndex(f => 
                (maleUser.targetGender === 'any' || maleUser.targetGender === 'female') &&
                (f.targetGender === 'any' || f.targetGender === 'male')
            );

            if (candidateIndex > -1) {
                const femaleUser = females.splice(candidateIndex, 1)[0];

                // Remove from queue
                this.maleQueue.delete(maleUser.userId);
                this.femaleQueue.delete(femaleUser.userId);

                // Add to active matches
                this.activeMatches.add(maleUser.userId);
                this.activeMatches.add(femaleUser.userId);

                console.log(`[SPEED DATING] Matched ${maleUser.userId} (seeking ${maleUser.targetGender}) with ${femaleUser.userId} (seeking ${femaleUser.targetGender})`);

                // To Male
                this.io.to(maleUser.socketId).emit('speed_date_match_found', {
                    partner: {
                        id: femaleUser.userId,
                        name: "Mystery Date", // Blind match!
                        photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + femaleUser.userId,
                        location: femaleUser.location
                    },
                    initiator: true // one side must initiate WebRTC
                });

                // To Female
                this.io.to(femaleUser.socketId).emit('speed_date_match_found', {
                    partner: {
                        id: maleUser.userId,
                        name: "Mystery Date", // Blind match!
                        photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + maleUser.userId,
                        location: maleUser.location
                    },
                    initiator: false
                });

                this.broadcastLobbyStats();
            }
        }
    }
}
