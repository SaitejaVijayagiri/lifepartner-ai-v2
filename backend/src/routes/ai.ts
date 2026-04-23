import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { guruResponse, FALLBACK_RESPONSES, personalize, pickRandom } from '../services/guruEngine';

const router = express.Router();

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
        "What's your go-to playlist for a long drive or a chill evening?",
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

// POST /ai/chat — The Love Guru Chatbot (Tier 1: Expert System → Tier 2: Gemini AI)
router.post('/chat', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Fetch user data for personalization
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { full_name: true, age: true, gender: true }
        });

        const name = user?.full_name?.split(' ')[0] || 'friend';
        console.log(`[AI Guru] Message: "${message.substring(0, 40)}..." for user: ${name}`);

        // TIER 1: Expert system — handles relationship/matrimony queries instantly (free, no API)
        let reply = guruResponse(message, name, history || []);

        // TIER 2: Gemini AI — fires only when the expert system doesn't match
        if (!reply && process.env.GEMINI_API_KEY) {
            try {
                const systemPrompt = `You are "Guru", a warm and wise relationship and matrimony coach on the LifePartner AI platform. Your role is to help Indian users navigate dating, marriage, and relationships with cultural sensitivity. The user's name is ${name}. Keep responses concise (2-3 sentences), conversational, and encouraging. Never give medical/legal advice.`;

                // Build conversation history for Gemini
                const geminiHistory = (history || []).slice(-6).map((h: any) => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }]
                }));

                const geminiResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: { parts: [{ text: systemPrompt }] },
                            contents: [
                                ...geminiHistory,
                                { role: 'user', parts: [{ text: message }] }
                            ],
                            generationConfig: { maxOutputTokens: 200, temperature: 0.8 }
                        }),
                        signal: AbortSignal.timeout(8000)
                    }
                );

                if (geminiResponse.ok) {
                    const data: any = await geminiResponse.json();
                    const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (geminiText) {
                        reply = geminiText.trim();
                        console.log(`[AI Guru] Answered via Gemini AI.`);
                    }
                }
            } catch (geminiErr: any) {
                console.warn(`[AI Guru] Gemini fallback failed: ${geminiErr.message}`);
            }
        }

        // TIER 3: Hard-coded fallback (always works, no API needed)
        if (!reply) {
            console.log(`[AI Guru] Answered via absolute fallback.`);
            reply = personalize(pickRandom(FALLBACK_RESPONSES), name);
        }

        res.json({ reply });

    } catch (error: any) {
        console.error("AI Guru Error:", error?.message || error);
        res.status(500).json({
            error: "Guru is meditating. Please try again in a moment.",
        });
    }
});

// POST /ai/profile-roast — The Love Guru Roast & Polish
router.post('/profile-roast', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Fetch entire profile
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user || !user.profiles) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const meta = (user.profiles.metadata as any) || {};

        // Extract key elements for Gemini to roast
        const analysisData = {
            name: user.full_name,
            age: user.age,
            gender: user.gender,
            bio: user.profiles.raw_prompt || meta.bio,
            expectations: meta.expectations || meta.partnerPreferences,
            photos_count: (meta.photos || []).length,
            career: meta.career,
            hobbies: meta.interests || []
        };

        if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY) {
            return res.status(500).json({ error: "Guru's crystal ball (AI) is currently unplugged." });
        }

        const systemPrompt = `You are the "Love Guru" on a matrimonial/dating app. Your job is to analyze the user's profile JSON and provide a humorous, slightly sassy, but highly constructive "Roast and Polish".
Tone: Funny, sharp, but ultimately helpful and culturally sensitive for Indian users.
Output strict JSON with EXACTLY these keys and types — no deviations:
{
  "roast": "string — A 2-3 sentence humorous critique of their profile (e.g. lack of photos, boring bio, contradictory expectations).",
  "score": 7,
  "tips": [
    "string — Tip 1 (Actionable, e.g. Add a picture of you smiling, not just with sunglasses.)",
    "string — Tip 2",
    "string — Tip 3"
  ]
}

IMPORTANT: 'score' MUST be a plain integer (e.g. 6), NOT a string. Do NOT wrap in quotes.
DO NOT use markdown wrappers like \`\`\`json around the output. Only return raw JSON.`;

        // ─── TIER 1: Try Gemini Flash ────────────────────────────────────────
        let roastText: string | null = null;

        try {
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [
                            { role: 'user', parts: [{ text: JSON.stringify(analysisData) }] }
                        ],
                        generationConfig: { maxOutputTokens: 500, temperature: 0.9 }
                    }),
                    signal: AbortSignal.timeout(12000)
                }
            );

            if (geminiResponse.ok) {
                const data: any = await geminiResponse.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    roastText = text;
                    console.log('[profile-roast] Answered via Gemini Flash ✅');
                }
            } else {
                console.warn(`[profile-roast] Gemini returned ${geminiResponse.status} — falling back to NVIDIA Gemma`);
            }
        } catch (geminiErr: any) {
            console.warn(`[profile-roast] Gemini failed: ${geminiErr.message} — falling back to NVIDIA Gemma`);
        }

        // ─── TIER 2: NVIDIA Gemma-4-31B Fallback ─────────────────────────────
        if (!roastText && process.env.NVIDIA_API_KEY) {
            try {
                console.log('[profile-roast] Trying NVIDIA Gemma-4-31B fallback...');
                const nvidiaResponse = await fetch(
                    'https://integrate.api.nvidia.com/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: 'google/gemma-4-31b-it',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: JSON.stringify(analysisData) }
                            ],
                            max_tokens: 600,
                            temperature: 0.9,
                            stream: false
                        }),
                        signal: AbortSignal.timeout(20000)
                    }
                );

                if (nvidiaResponse.ok) {
                    const nvidiaData: any = await nvidiaResponse.json();
                    const text = nvidiaData?.choices?.[0]?.message?.content;
                    if (text) {
                        roastText = text;
                        console.log('[profile-roast] Answered via NVIDIA Gemma-4 ✅');
                    }
                } else {
                    console.error('[profile-roast] NVIDIA also failed:', nvidiaResponse.status);
                }
            } catch (nvidiaErr: any) {
                console.error('[profile-roast] NVIDIA fallback failed:', nvidiaErr.message);
            }
        }

        if (!roastText) {
            return res.status(503).json({ error: "Both AI systems are at capacity. Please try again in a minute!" });
        }

        // Parse and normalize the result from whichever AI responded
        const cleanedText = roastText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        // Normalize: ensure score is always a number, never a string
        const result = {
            ...parsed,
            score: typeof parsed.score === 'string' ? parseInt(parsed.score, 10) || 5 : (parsed.score || 5)
        };

        res.json(result);

    } catch (error: any) {
        console.error("AI Roast Error:", error?.message || error);
        res.status(500).json({ error: "Guru is meditating. Please try again later." });
    }
});

export default router;
