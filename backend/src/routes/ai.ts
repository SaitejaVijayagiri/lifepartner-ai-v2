import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini (Will fail gracefully if key is missing)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');

// Curated Icebreaker Library (Simulating AI for Reliability/Speed)
const ICEBREAKERS = {
    travel: [
        "I see you like traveling! What's the one place you'd love to go back to?",
        "If you could teleport anywhere right now, where would you go?",
        "Beach vacation or Mountain trek? The debate ends today."
    ],
    food: [
        "I noticed you're a foodie. What's the best dish you've ever had?",
        "If you had to eat one cuisine for the rest of your life, what would it be?",
        "Pineapple on pizza: Yes or Illegal?"
    ],
    movies: [
        "What's a movie you can watch a hundred times without getting bored?",
        "If they made a movie about your life, who would play you?",
        "Netflix and chill or Cinema popcorn?"
    ],
    music: [
        "What's the last song you listened to on repeat?",
        "If they made a movie about your life, who would play you?",
        "Concerts or Headphones?"
    ],
    default: [
        "Hi! Your profile vibe is awesome. How's your week going?",
        "I'm bad at starting conversations, but I really wanted to say hi.",
        "Quick question: What's the highlight of your day so far?",
        "I bet you have a great story behind that profile picture."
    ]
};

// POST /ai/icebreaker
router.post('/icebreaker', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: "Missing targetUserId" });
        }

        // 1. Fetch Target User's Profile
        const target = await prisma.users.findUnique({
            where: { id: targetUserId },
            select: {
                full_name: true,
                profiles: {
                    select: { metadata: true }
                }
            }
        });

        if (!target) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fix name property map if needed
        const targetName = target.full_name;
        // Extract interests from metadata (hobbies or interests)
        const meta = (target.profiles?.metadata as any) || {};
        const interests = (meta.interests || meta.hobbies || []) as string[];

        // 2. MONETIZATION CHECK (Future: deduction logic here)
        // For now, it's a "Teaser" feature (Always free or limited)

        // 3. Generate Suggestions (Heuristic AI)
        let suggestions: string[] = [];

        // Strategy: 1 Interest-based + 2 Random/General
        interests.forEach((interest: string) => {
            const key = interest.toLowerCase();
            if (ICEBREAKERS[key as keyof typeof ICEBREAKERS]) {
                suggestions.push(...ICEBREAKERS[key as keyof typeof ICEBREAKERS]);
            }
        });

        // Fill remaining with generic high-quality openers
        // Shuffle defaults
        const shuffledDefaults = ICEBREAKERS.default.sort(() => 0.5 - Math.random());

        while (suggestions.length < 3) {
            if (shuffledDefaults.length > 0) {
                suggestions.push(shuffledDefaults.pop()!);
            } else {
                break; // Should not happen
            }
        }

        // Slice to max 3
        const finalSuggestions = suggestions.slice(0, 3);

        res.json({
            suggestions: finalSuggestions,
            context: `Based on ${targetName}'s interests: ${interests.join(', ')}`
        });

    } catch (error) {
        console.error("AI Icebreaker Error:", error);
        res.status(500).json({ error: "Failed to generate magic" });
    }
});

// POST /ai/chat (The Love Guru Chatbot)
router.post('/chat', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ error: "AI Chatbot is currently offline. Please set GEMINI_API_KEY." });
        }

        // Fetch user data to make AI personalized
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { full_name: true, age: true, gender: true }
        });

        const name = user?.full_name || 'User';

        const systemInstruction = `
            You are "LifePartner AI Guru", an expert Indian Matchmaker and Dating Coach. 
            You are talking to ${name} (${user?.age || 'unknown'} years old, ${user?.gender || 'unknown'}).
            Be warm, witty, encouraging, and culturally aware of modern Indian dating (respecting traditions while embracing modern romance).
            Your goal is to give them actionable advice on their dating profile, how to talk to matches, and relationship red/green flags.
            Keep your answers concise, formatted nicely with emojis, and highly engaging. Do not be overly robotic.
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction,
        });

        // Format history for Gemini
        // Gemini expects: { role: "user" | "model", parts: [{ text: "..." }] }
        const formattedHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        res.json({ reply: responseText });

    } catch (error: any) {
        console.error("AI Chatbot Error:", error);
        res.status(500).json({ error: "Guru is meditating. Please try again later." });
    }
});



export default router;
