import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Defined directly here or imported from types
const QUESTIONS = [
    { id: 1, text: "Ideal Vacation?", options: ["Relaxing Beach 🏖️", "Adventure Hike 🏔️"] },
    { id: 2, text: "Friday Night?", options: ["Netflix & Chill 🍿", "Party Out 💃"] },
    { id: 3, text: "Money Style?", options: ["Save for Future 💰", "Live in Moment 💸"] },
    { id: 4, text: "Conflict?", options: ["Solve Immediately 🗣️", "Cool Down First 🧊"] },
    { id: 5, text: "Social Battery?", options: ["Small Group 👯", "Big Crowd 🏟️"] }
];

// Start a Game (Classic)
router.post('/start', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { partnerId } = req.body;

        if (!partnerId) return res.status(400).json({ error: "Partner ID required" });

        // Check if active game exists? For simplicity, we create a new one.
        const game = await prisma.games.create({
            data: {
                player_a_id: userId,
                player_b_id: partnerId,
                status: 'ACTIVE'
            }
        });

        res.json({ success: true, gameId: game.id, questions: QUESTIONS });
    } catch (e: any) {
        console.error("Start Game Error", e);
        res.status(500).json({ error: "Failed to start game" });
    }
});

// Start AI Scenario (Phase 2)
router.post('/scenario/start', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { partnerId } = req.body;

        console.log(`Generating AI Scenario for ${userId} & ${partnerId}`);

        // 1. Fetch Profiles
        const p1 = await prisma.profiles.findUnique({
            where: { user_id: userId },
            select: { metadata: true }
        });
        const p2 = await prisma.profiles.findUnique({
            where: { user_id: partnerId },
            select: { metadata: true }
        });

        const profileA = { bio: (p1?.metadata as any)?.bio || "Unknown" };
        const profileB = { bio: (p2?.metadata as any)?.bio || "Unknown" };

        // 2. Generate Scenario
        const { AIService } = await import('../services/ai');
        const aiService = new AIService();

        const scenario = await aiService.generateRelationshipScenario(profileA, profileB);

        res.json({ success: true, scenario });

    } catch (e) {
        console.error("Scenario Error", e);
        res.status(500).json({ error: "Failed to generate scenario" });
    }
});

// Submit Answer
router.post('/:id/answer', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params; // Game ID
        const userId = req.user.userId;
        const { questionId, optionIndex } = req.body;

        // 1. Verify Game Participation
        const game = await prisma.games.findUnique({
            where: { id }
        });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.player_a_id !== userId && game.player_b_id !== userId) {
            return res.status(403).json({ error: "Not a player in this game" });
        }

        // 2. Save Answer
        await prisma.game_moves.upsert({
            where: {
                // Assuming "game_id_question_id_player_id" based on previous scripts.
                game_id_question_id_player_id: {
                    game_id: id,
                    question_id: questionId,
                    player_id: userId
                }
            },
            create: {
                game_id: id,
                question_id: questionId,
                player_id: userId,
                answer_index: optionIndex
            },
            update: {} // DO NOTHING
        });

        // 3. Check for Match immediately (Optional)
        // Ensure player_a_id and player_b_id are valid strings for this logic
        const pA = game.player_a_id || "";
        const pB = game.player_b_id || "";
        const partnerId = (pA === userId) ? pB : pA;

        const partnerMove = await prisma.game_moves.findFirst({
            where: {
                game_id: id,
                question_id: questionId,
                player_id: partnerId
            },
            select: { answer_index: true }
        });

        let partnerChoice = null;
        if (partnerMove) {
            partnerChoice = partnerMove.answer_index;
        }

        res.json({ success: true, partnerChoice });

    } catch (e) {
        console.error("Game Answer Error", e);
        res.status(500).json({ error: "Failed to submit answer" });
    }
});

// Get Game State (For polling or initial load)
router.get('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verify Auth
        const game = await prisma.games.findUnique({
            where: { id }
        });

        if (!game) return res.status(404).json({ error: "Game not found" });

        // Fetch Moves
        const moves = await prisma.game_moves.findMany({
            where: { game_id: id },
            select: { question_id: true, player_id: true, answer_index: true }
        });

        // Reconstruct State
        const pA = game.player_a_id || "";
        const pB = game.player_b_id || "";
        const partnerId = (pA === userId) ? pB : pA;

        const questionsWithAnswers = QUESTIONS.map(q => {
            const myMove = moves.find((m: any) => m.question_id === q.id && m.player_id === userId);
            const otherMove = moves.find((m: any) => m.question_id === q.id && m.player_id !== userId);

            return {
                ...q,
                answers: {
                    [userId]: myMove ? myMove.answer_index : undefined,
                    [partnerId]: otherMove ? otherMove.answer_index : undefined
                }
            };
        });

        res.json({ success: true, gameId: id, questions: questionsWithAnswers });

    } catch (e) {
        console.error("Get Game Error", e);
        res.status(500).json({ error: "Failed to fetch game" });
    }
});

export default router;
