
import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { AstrologyService } from '../services/astrology';
import { isUserOnline } from '../socket'; // Correct Import Location

const router = express.Router();
const astrologyService = new AstrologyService();

// Middleware duplications because I'm lazy to make a shared middleware file right now
// FIXED: Using imported getUserId
router.get('/recommendations', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const client = await pool.connect();
        // ... (rest of code)

        // 1. Get Me
        const meRes = await client.query("SELECT * FROM public.users u LEFT JOIN public.profiles p ON u.id = p.user_id WHERE u.id = $1", [userId]);
        if (meRes.rows.length === 0) return res.json({ matches: [] });
        const me = meRes.rows[0];
        const meMeta = me.metadata || {};

        // 2. Get Candidates (Limit 50)
        // Gender Filtering Logic
        let genderFilter = "";
        const myGender = (me.gender || "").trim().toLowerCase();
        console.log(`DEBUG: myId = ${userId}, myGender = ${myGender} `);

        if (myGender === 'male') genderFilter = "AND LOWER(u.gender) = 'female'";
        else if (myGender === 'female') genderFilter = "AND LOWER(u.gender) = 'male'";

        console.log(`DEBUG: Gender Filter SQL: ${genderFilter} `);

        const candRes = await client.query(`
            SELECT u.*, p.*,
    (SELECT COUNT(*) FROM matches m WHERE m.user_b_id = u.id AND m.is_liked = TRUE):: int as total_likes,
        (SELECT m.status FROM matches m WHERE m.user_a_id = $1 AND m.user_b_id = u.id) as match_status,
            (SELECT m.is_liked FROM matches m WHERE m.user_a_id = $1 AND m.user_b_id = u.id) as is_liked
            FROM public.users u 
            LEFT JOIN public.profiles p ON u.id = p.user_id 
            WHERE u.id != $1 ${genderFilter}
            LIMIT 50
        `, [userId]);
        const candidates = candRes.rows;

        client.release();

        const userPrompt = (me.raw_prompt || "").toLowerCase();

        // 3. Score
        const matches = candidates.map(c => {
            const meta = c.metadata || {};
            let score = 50;
            let reasons: string[] = [];

            // Simple Logic mirroring old one
            if (meMeta.religion?.religion && meta.religion?.religion && meMeta.religion.religion === meta.religion.religion) {
                score += 10;
                if (meMeta.religion.caste && meta.religion.caste && meMeta.religion.caste === meta.religion.caste) {
                    score += 10;
                    reasons.push("Same Caste");
                }
            }

            if (meMeta.lifestyle?.diet && meta.lifestyle?.diet && meMeta.lifestyle.diet === meta.lifestyle.diet) {
                score += 10;
                reasons.push("Same diet");
            }

            // Keyword matching
            const otherPrompt = (c.raw_prompt || "").toLowerCase();
            if (userPrompt.includes('doctor') && otherPrompt.includes('doctor')) {
                score += 20;
                reasons.push("Career Match");
            }

            // Cap
            if (score > 99) score = 99;

            // Safe Location Access
            let locString = "India";
            if (meta.location && typeof meta.location === 'object') {
                locString = meta.location.city || locString;
            } else if (c.location_name) {
                locString = c.location_name;
            }

            return {
                id: c.user_id || c.id,
                name: c.full_name,
                age: c.age,
                height: meta.height || "Not Specified", // Real Height
                location: locString,
                role: meta.career?.profession || "Member",
                photoUrl: c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
                score: (c.avatar_url && !c.avatar_url.includes('dicebear')) ? score + 40 : score, // Boost real photos
                match_reasons: reasons,
                analysis: {
                    emotional: 75 + (c.id % 20), // Deterministic pseudo-random based on ID
                    vision: 80 + (c.id % 15)
                },
                summary: (c.raw_prompt || meta.aboutMe || "No bio yet.").substring(0, 150),
                reels: meta.reels || c.reels || [],
                photos: meta.photos || [],

                // Pass Full Details for Modal
                career: meta.career || {},
                family: meta.family || {},
                religion: meta.religion || {},
                horoscope: meta.horoscope || {},
                lifestyle: meta.lifestyle || {},

                stories: c.stories || [], // Stories
                total_likes: c.total_likes || 0,
                is_liked: c.is_liked || false,
                // Premium Data
                phone: me.is_premium ? (c.phone || meta.phone) : null,
                email: me.is_premium ? (c.email || meta.email) : null,
                voiceBioUrl: c.voice_bio_url || null,

                // Astrology
                kundli: astrologyService.calculateCompatibility(meMeta.horoscope?.nakshatra, meta.horoscope?.nakshatra)
            };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        res.json({ matches });

    } catch (e) {
        console.error("Matches Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 3. AI Search Route
router.post('/search', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const { query } = req.body;
        if (!query) return res.json({ matches: [] });

        // 1. Parse Query with AI
        const aiService = new (require('../services/ai').AIService)();
        const filters = await aiService.parseSearchQuery(query);
        console.log("AI Search Filters:", filters);

        const client = await pool.connect();

        // 2. Get Me (for gender filtering & premium status)
        // Need is_premium to decide whether to show contacts
        const meRes = await client.query("SELECT gender, is_premium, district, state, metadata FROM public.users u LEFT JOIN public.profiles p ON u.id = p.user_id WHERE u.id = $1", [userId]);
        const me = meRes.rows[0];
        const myGender = (me?.gender || "").trim().toLowerCase();
        const isPremium = me?.is_premium;
        // Ensure me metadata is available for astrology
        if (!me.metadata) me.metadata = {};

        // 3. Build Dynamic Query
        let sql = `
            SELECT 
                u.id, u.email, u.phone, u.full_name, u.gender, u.age, u.location_name, 
                u.city, u.district, u.state, -- New Location Columns
                u.avatar_url, u.voice_bio_url, u.is_premium,
                p.metadata, p.raw_prompt
            FROM public.users u 
            LEFT JOIN public.profiles p ON u.id = p.user_id 
            WHERE u.id != $1 
        `;
        const params: any[] = [userId];
        let pIdx = 2;

        // Gender Filter (Strict)
        if (myGender === 'male') {
            sql += ` AND LOWER(u.gender) = 'female' `;
        } else if (myGender === 'female') {
            sql += ` AND LOWER(u.gender) = 'male' `;
        }

        // Apply AI Filters
        // Apply AI Filters
        if (filters.profession) {
            // Check for Synonyms to broaden search (e.g. "Software Engineer" -> "Coder", "Developer")
            const AIService = require('../services/ai').AIService;
            const synonyms = AIService.SYNONYMS[filters.profession] || [];

            if (synonyms.length > 0) {
                // OR Logic for Synonyms
                // profession ILIKE %Target% OR profession ILIKE %Synonym1% ...
                const conditions = [`p.metadata->'career'->>'profession' ILIKE $${pIdx}`];
                params.push(`%${filters.profession}%`);
                pIdx++;

                synonyms.forEach((syn: string) => {
                    conditions.push(`p.metadata->'career'->>'profession' ILIKE $${pIdx}`);
                    params.push(`%${syn}%`);
                    pIdx++;
                });

                sql += ` AND (${conditions.join(' OR ')}) `;
            } else {
                // Standard Single Match
                sql += ` AND p.metadata->'career'->>'profession' ILIKE $${pIdx} `;
                params.push(`%${filters.profession}%`);
                pIdx++;
            }
        }

        if (filters.religion) {
            sql += ` AND p.metadata->'religion'->>'faith' ILIKE $${pIdx} `; // 'faith' matches editor field
            params.push(`%${filters.religion}%`);
            pIdx++;
        }

        if (filters.diet) {
            sql += ` AND p.metadata->'lifestyle'->>'diet' ILIKE $${pIdx} `;
            params.push(filters.diet);
            pIdx++;
        }

        // Habits (if present in metadata)
        if (filters.smoking === 'No') {
            // Check if smoking is explicitly 'No' or null (assuming default good)
            sql += ` AND (p.metadata->'lifestyle'->>'smoking' = 'No' OR p.metadata->'lifestyle'->>'smoking' IS NULL) `;
        }
        if (filters.drinking === 'No') {
            sql += ` AND (p.metadata->'lifestyle'->>'drinking' = 'No' OR p.metadata->'lifestyle'->>'drinking' IS NULL) `;
        }

        // Strict Filters (User Request)
        if (filters.location) {
            // Check BOTH explicit columns AND legacy metadata for robustness
            sql += ` AND (
                u.location_name ILIKE $${pIdx} OR 
                u.city ILIKE $${pIdx} OR 
                u.state ILIKE $${pIdx} OR
                p.metadata->'location'->>'city' ILIKE $${pIdx} OR 
                p.metadata->'location'->>'state' ILIKE $${pIdx}
            ) `;
            params.push(`%${filters.location}%`);
            pIdx++;
        }

        // 'Near Me' Filter (Enhanced with Columns)
        if (filters.useMyLocation) {
            const myDist = me.metadata?.location?.district || me.district;
            const myState = me.metadata?.location?.state || me.state;

            if (myDist) {
                // Priority to District (Column OR Metadata)
                sql += ` AND (
                    u.district ILIKE $${pIdx} OR
                    p.metadata->'location'->>'district' ILIKE $${pIdx}
                ) `;
                params.push(myDist);
                pIdx++;
            } else if (myState) {
                // Fallback to State (Column OR Metadata)
                sql += ` AND (
                    u.state ILIKE $${pIdx} OR
                    p.metadata->'location'->>'state' ILIKE $${pIdx}
                ) `;
                params.push(myState);
                pIdx++;
            }
            // If neither is known, ignoring 'near me' silently or could fallback to City.
        }

        if (filters.caste) {
            sql += ` AND p.metadata->'religion'->>'caste' ILIKE $${pIdx} `;
            params.push(`%${filters.caste}%`);
            pIdx++;
        }

        if (filters.gothra) {
            sql += ` AND p.metadata->'religion'->>'gothra' ILIKE $${pIdx} `;
            params.push(`%${filters.gothra}%`);
            pIdx++;
        }

        if (filters.maritalStatus) {
            sql += ` AND p.metadata->'basics'->>'maritalStatus' ILIKE $${pIdx} `;
            params.push(filters.maritalStatus);
            pIdx++;
        }

        if (filters.education) {
            sql += ` AND (p.metadata->'career'->>'educationLevel' ILIKE $${pIdx} OR p.metadata->'career'->>'college' ILIKE $${pIdx}) `;
            params.push(`%${filters.education}%`);
            pIdx++;
        }

        // Age Filters
        if (filters.minAge) {
            sql += ` AND u.age >= $${pIdx} `;
            params.push(filters.minAge);
            pIdx++;
        }
        if (filters.maxAge) {
            sql += ` AND u.age <= $${pIdx} `;
            params.push(filters.maxAge);
            pIdx++;
        }

        sql += ` LIMIT 100`;

        // DEBUG: Write to file (DISABLED for production safety)
        // const fs = require('fs');
        // const debugLog = `...`;
        // fs.appendFileSync('debug_search.log', debugLog);

        console.log(`DEBUG: Filter Query for ${myGender}: ${sql}`);

        const result = await client.query(sql, params);
        client.release();

        // Helper: Height Parser
        const parseHeightToInches = (hStr: string): number => {
            if (!hStr) return 0;
            const str = hStr.toLowerCase().replace(/[^0-9.]/g, ' ');
            const parts = str.trim().split(/\s+/).map(Number);
            // Format: 5'9 or 5 9
            if (hStr.includes("'") || parts.length >= 2) {
                return (parts[0] * 12) + (parts[1] || 0);
            }
            // Format: 175 cm
            if (hStr.toLowerCase().includes('cm')) {
                return Math.round(parts[0] / 2.54);
            }
            // Fallback: Just feet?
            if (parts.length === 1 && parts[0] < 8) return parts[0] * 12;
            return 0;
        };

        // Helper: Income Parser
        const parseIncome = (str: string): number => {
            if (!str) return 0;
            const nums = str.match(/(\d+)/);
            return nums ? parseInt(nums[0]) : 0;
        };

        // Post-Filter: Advanced Weighted Matching
        let scoredMatches = result.rows.map(c => {
            const meta = c.metadata || {};


            // --- NEW: Semantic Re-Ranking (Advanced Offline AI) ---
            if (query && scoredMatches.length > 0) {
                try {
                    // 1. Generate Query Embedding
                    // 1. Generate Query Embedding
                    const aiService = new (require('../services/ai').AIService)();

                    // ALWAYS run Semantic Re-ranking (Hybrid Search)
                    // We use local embeddings (Xenova) which are free and fast
                    console.log("🧠 Running Semantic Re-ranking for", scoredMatches.length, "candidates...");

                    if (true) {
                        const queryVector = await aiService.generateEmbedding(query);

                        // 2. Compute Cosine Similarity for each match
                        await Promise.all(scoredMatches.map(async (m: any) => {
                            const bio = m.summary || "";
                            if (bio.length > 10) {
                                // A. Semantic Similarity
                                const bioVector = await aiService.generateEmbedding(bio);
                                const similarity = cosineSimilarity(queryVector, bioVector);

                                if (similarity > 0.3) {
                                    m.score += (similarity * 30);
                                    m.match_reasons.push(`✨ Conceptual Match (${Math.round(similarity * 100)}%)`);
                                }

                                // B. Sentiment Vibe Check (New Advanced Offline AI)
                                // We analyze the bio's sentiment to gauge "Vibe"
                                const sentiment = await aiService.analyzeSentiment(bio);
                                if (sentiment === 'POSITIVE') {
                                    m.score += 5; // Positive vibes get a boost
                                    // m.match_reasons.push("😊 Positive Vibe"); 
                                } else if (sentiment === 'NEGATIVE') {
                                    m.score -= 5; // Negative vibes get a slight penalty
                                }
                            }
                        }));
                    }
                } catch (e) {
                    console.error("Semantic Ranking Failed", e);
                }
            }

            // Helper: Cosine Similarity
            function cosineSimilarity(vecA: number[], vecB: number[]): number {
                let dotProduct = 0;
                let normA = 0;
                let normB = 0;
                for (let i = 0; i < vecA.length; i++) {
                    dotProduct += vecA[i] * vecB[i];
                    normA += vecA[i] * vecA[i];
                    normB += vecB[i] * vecB[i];
                }
                return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            }

            // Sort by Score DESC and Return Top 10

            // Sort by Score DESC and Return Top 10
            scoredMatches.sort((a: any, b: any) => (b?.score || 0) - (a?.score || 0));

            // 4. Optimization: Skip Real-Time AI Analysis for List View
            const finalMatches = scoredMatches.slice(0, 20).map((m: any) => ({
                ...m,
                isOnline: m.id ? isUserOnline(m.id) : (m.user_id ? isUserOnline(m.user_id) : false),
                analysis: {
                    emotional: m?.score || 50,
                    vision: m?.score || 50
                }
            }));

            // DEBUG: 
            if (finalMatches.length > 0) {
                console.log(`[DEBUG] Returning ${finalMatches.length} matches. User Premium: ${isPremium}`);
            }

            res.json({ matches: finalMatches });

        } catch (e) {
            console.error("Search Error", e);
            res.status(500).json({ error: "Search failed" });
        }
    });

// 4. GET PDF Report (Premium / Free)
router.get('/:id/report', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params; // Partner ID

        const client = await pool.connect();

        // 1. Fetch Both Profiles
        const p1 = await client.query('SELECT u.full_name, u.age, p.metadata FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1', [userId]);
        const p2 = await client.query('SELECT u.full_name, u.age, p.metadata FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1', [id]);

        client.release();

        if (p1.rows.length === 0 || p2.rows.length === 0) {
            return res.status(404).json({ error: "Profiles not found" });
        }

        const profileA = { ...p1.rows[0].metadata, full_name: p1.rows[0].full_name, age: p1.rows[0].age };
        const profileB = { ...p2.rows[0].metadata, full_name: p2.rows[0].full_name, age: p2.rows[0].age };

        // 2. Set Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=compatibility_report_${id}.pdf`);

        // 3. Generate PDF
        const { generatePDFReport } = await import('../services/reportGenerator');
        await generatePDFReport(profileA, profileB, res);

    } catch (e: any) {
        console.error("Report Gen Error", e);
        res.status(500).json({ error: "Failed to generate report" });
    }
});

export default router;
