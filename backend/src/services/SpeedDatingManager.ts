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
    country: string;
    motherTongue: string;
    interests: string[];
    age: number;
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
            this.matchLoopInterval = setInterval(() => this.processMatchmaking(), 1000);
            console.log("🚀 Speed Dating Manager Initialized (1s Fast Cycle).");
        }
    }

    public async joinLobby(socket: Socket, userId: string, targetGender?: string) {
        if (this.activeMatches.has(userId)) {
            socket.emit('speed_date_error', { message: "You are already in an active session." });
            return;
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
                profiles: { select: { metadata: true } }
            }
        });

        if (!user || !user.gender || !user.full_name) {
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
        
        console.log(`[SPEED DATING] ${userId} (${gender}, seeking ${effectiveTargetGender}, ${country}, ${motherTongue || 'All'}) joined. Lobby Stats: M:${this.maleQueue.size} F:${this.femaleQueue.size}`);
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
            const maleCount = this.maleQueue.size;
            const femaleCount = this.femaleQueue.size;
            const waitingCount = maleCount + femaleCount;
            this.io.to('speed_dating_lobby').emit('speed_date_stats', { 
                waitingCount,
                maleCount,
                femaleCount
            });
        }
    }

    private async processMatchmaking() {
        if (!this.io) return;

        const males = Array.from(this.maleQueue.values());
        const females = Array.from(this.femaleQueue.values());
        const now = Date.now();

        // 1. Peer-to-Peer Socket Matching with MNC Proximity, Language & Affinity Intelligence
        for (const maleUser of males) {
            const eligibleFemales = females.filter(f => 
                (maleUser.targetGender === 'any' || maleUser.targetGender === 'female') &&
                (f.targetGender === 'any' || f.targetGender === 'male')
            );

            if (eligibleFemales.length === 0) continue;

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

                console.log(`[SPEED DATING] Live Matched ${maleUser.userId} with ${femaleUser.userId} (Affinity: ${scoredCandidates[0].score})`);

                this.io.to(maleUser.socketId).emit('speed_date_match_found', {
                    partner: {
                        id: femaleUser.userId,
                        name: "Anonymous Stranger",
                        photoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=" + femaleUser.userId,
                        location: femaleUser.location,
                        age: femaleUser.age || 24,
                        gender: femaleUser.gender,
                        realName: femaleUser.name,
                        realPhotoUrl: femaleUser.photoUrl
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
                        gender: maleUser.gender,
                        realName: maleUser.name,
                        realPhotoUrl: maleUser.photoUrl
                    },
                    initiator: false
                });

                this.broadcastLobbyStats();
            }
        }

        // Notify remaining queued users if lobby is empty of opposite gender
        const allQueued = [...Array.from(this.maleQueue.values()), ...Array.from(this.femaleQueue.values())];
        for (const queued of allQueued) {
            const hasOppositeInQueue = queued.gender === 'male' ? this.femaleQueue.size > 0 : this.maleQueue.size > 0;
            if (!hasOppositeInQueue) {
                const targetLabel = queued.targetGender === 'female' ? 'Single Females' : 'Single Males';
                this.io.to(queued.socketId).emit('speed_date_waiting', {
                    message: `Right now no ${targetLabel} are online in the lobby. Staying in queue...`
                });
            }
        }
    }
}
