
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
            ORDER BY RANDOM()
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
            .sort((a, b) => b.score - a.score);

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

        // 2. Get Me
        const meRes = await client.query("SELECT gender, is_premium, district, state, metadata FROM public.users u LEFT JOIN public.profiles p ON u.id = p.user_id WHERE u.id = $1", [userId]);
        const me = meRes.rows[0];
        const myGender = (me?.gender || "").trim().toLowerCase();
        const isPremium = me?.is_premium;
        if (!me.metadata) me.metadata = {};

        // --- HELPER: Build & Run Query ---
        const buildAndRunQuery = async (strictness: 'strict' | 'relaxed') => {
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

            // Base Filters (Always Apply)
            if (myGender === 'male') {
                sql += ` AND LOWER(u.gender) = 'female' `;
            } else if (myGender === 'female') {
                sql += ` AND LOWER(u.gender) = 'male' `;
            }

            // Age (Always Apply, maybe broaden in relaxed?)
            if (filters.minAge) {
                const age = strictness === 'strict' ? filters.minAge : Math.max(18, filters.minAge - 5);
                sql += ` AND u.age >= $${pIdx} `;
                params.push(age);
                pIdx++;
            }
            if (filters.maxAge) {
                const age = strictness === 'strict' ? filters.maxAge : filters.maxAge + 5;
                sql += ` AND u.age <= $${pIdx} `;
                params.push(age);
                pIdx++;
            }

            // --- STRICT MODE FILTERS ---
            if (strictness === 'strict') {
                // Profession
                if (filters.profession) {
                    const AIService = require('../services/ai').AIService;
                    const synonyms = AIService.SYNONYMS[filters.profession] || [];
                    if (synonyms.length > 0) {
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
                        sql += ` AND p.metadata->'career'->>'profession' ILIKE $${pIdx} `;
                        params.push(`%${filters.profession}%`);
                        pIdx++;
                    }
                }

                // Location
                if (filters.location) {
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

                // Religion, Caste
                if (filters.religion) {
                    sql += ` AND p.metadata->'religion'->>'faith' ILIKE $${pIdx} `;
                    params.push(`%${filters.religion}%`);
                    pIdx++;
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
                // Habits
                if (filters.smoking === 'No') {
                    sql += ` AND (p.metadata->'lifestyle'->>'smoking' = 'No' OR p.metadata->'lifestyle'->>'smoking' IS NULL) `;
                }
                if (filters.drinking === 'No') {
                    sql += ` AND (p.metadata->'lifestyle'->>'drinking' = 'No' OR p.metadata->'lifestyle'->>'drinking' IS NULL) `;
                }

                // Education Strict
                if (filters.education) {
                    sql += ` AND (p.metadata->'career'->>'educationLevel' ILIKE $${pIdx} OR p.metadata->'career'->>'college' ILIKE $${pIdx}) `;
                    params.push(`%${filters.education}%`);
                    pIdx++;
                }

            } else {
                // --- RELAXED MODE (PARTIAL MATCH) ---
                // If strict failed, we loosen constraints to be "OR" instead of "AND".
                // We heavily penalize scores later, but we WANT to show relevant people.
                let conditions: string[] = [];

                // Profession OR
                if (filters.profession) {
                    conditions.push(`p.metadata->'career'->>'profession' ILIKE $${pIdx}`);
                    params.push(`%${filters.profession}%`);
                    pIdx++;
                }

                // Location OR
                if (filters.location) {
                    conditions.push(`(
                        u.location_name ILIKE $${pIdx} OR 
                        u.city ILIKE $${pIdx} OR 
                        u.state ILIKE $${pIdx} OR
                        p.metadata->'location'->>'city' ILIKE $${pIdx} OR 
                        p.metadata->'location'->>'state' ILIKE $${pIdx}
                    )`);
                    params.push(`%${filters.location}%`);
                    pIdx++;
                }

                // Religion OR
                if (filters.religion) {
                    conditions.push(`p.metadata->'religion'->>'faith' ILIKE $${pIdx}`);
                    params.push(`%${filters.religion}%`);
                    pIdx++;
                }

                // If we have any conditions, combine them with OR
                if (conditions.length > 0) {
                    sql += ` AND (${conditions.join(' OR ')}) `;
                }
            }

            sql += ` LIMIT 50`;
            return client.query(sql, params);
        };

        // 3. Execution Strategy: Strict -> Fallback
        let result = await buildAndRunQuery('strict');
        let rows = result.rows;
        let isBroad = false;

        if (rows.length < 5) {
            console.log("⚠️ Low Strict Results. Running Broad Search...");
            const broadResult = await buildAndRunQuery('relaxed');

            // Deduplicate
            const existingIds = new Set(rows.map((r: any) => r.id));
            const newRows = broadResult.rows.filter((r: any) => !existingIds.has(r.id));
            rows = [...rows, ...newRows];
            isBroad = true;
        }

        client.release();

        // 4. Scoring & Mapping
        const parseHeightToInches = (hStr: string): number => {
            if (!hStr) return 0;
            const str = hStr.toLowerCase().replace(/[^0-9.]/g, ' ');
            const parts = str.trim().split(/\s+/).map(Number);
            if (hStr.includes("'") || parts.length >= 2) return (parts[0] * 12) + (parts[1] || 0);
            if (hStr.toLowerCase().includes('cm')) return Math.round(parts[0] / 2.54);
            if (parts.length === 1 && parts[0] < 8) return parts[0] * 12;
            return 0;
        };
        const parseIncome = (str: string): number => {
            if (!str) return 0;
            const nums = str.match(/(\d+)/);
            return nums ? parseInt(nums[0]) : 0;
        };

        let scoredMatches = rows.map((c: any) => {
            const meta = c.metadata || {};
            let locString = "India";
            if (meta.location && typeof meta.location === 'object') locString = meta.location.city || locString;
            else if (c.location_name) locString = c.location_name;

            const profileHeight = meta.height || "";
            const heightInches = parseHeightToInches(profileHeight);

            // Strict Income Filter (Even in relaxed mode? Maybe relax it too? Let's keep strictly applied locally for now)
            if (filters.minIncome && !isBroad) { // Only strict income in strict mode? No, let's keep it generally unless very desperate.
                const incVal = parseIncome(meta.career?.income || "");
                if (incVal < filters.minIncome) return null; // Filter out low income
            }

            let score = 70;
            const reasons: string[] = [];

            // Scoring Logic (Soft Filters)

            // Profession
            if (filters.profession) {
                const AIService = require('../services/ai').AIService;
                const synonyms = AIService.SYNONYMS[filters.profession] || [];
                const prof = (meta.career?.profession || "").toLowerCase();

                if (prof.includes(filters.profession.toLowerCase()) || synonyms.some((s: string) => prof.includes(s.toLowerCase()))) {
                    score += 20;
                    reasons.push("Career Match");
                }
            }

            // Location
            if (filters.location) {
                const loc = [c.location_name, c.city, c.state, meta.location?.city, meta.location?.state].join(" ").toLowerCase();
                if (loc.includes(filters.location.toLowerCase())) {
                    score += 20;
                    // reasons.push("Location Match");
                } else {
                    score -= 10;
                }
            }

            // Height
            if (filters.minHeightInches && filters.maxHeightInches) {
                if (heightInches >= filters.minHeightInches && heightInches <= filters.maxHeightInches) {
                    score += 20;
                    reasons.push(`Perfect Height (${profileHeight})`);
                } else if (heightInches > 0) {
                    const diff = Math.min(Math.abs(heightInches - filters.minHeightInches), Math.abs(heightInches - filters.maxHeightInches));
                    score -= (diff * 2);
                    if (score < 40) reasons.push(`Height Mismatch (${profileHeight})`);
                }
            }

            // Habits
            if (filters.smoking === 'No' && meta.lifestyle?.smoking === 'Yes') {
                score -= 30;
                reasons.push("Smoker (Mismatch)");
            }

            // Keyword/Appearance
            if (filters.keywords && filters.keywords.length > 0) {
                const bio = ((c.raw_prompt || "") + " " + (meta.aboutMe || "")).toLowerCase();
                const hobbies = Array.isArray(meta.hobbies) ? meta.hobbies.map((h: string) => h.toLowerCase()) : [];
                let keyMatchCount = 0;
                filters.keywords.forEach((k: string) => {
                    const kw = k.toLowerCase();
                    if (bio.includes(kw) || hobbies.some((h: string) => h.includes(kw))) keyMatchCount++;
                });
                if (keyMatchCount > 0) {
                    score += (keyMatchCount * 10);
                    reasons.push(`${keyMatchCount} Interest Match${keyMatchCount > 1 ? 'es' : ''}`);
                }
            }

            return {
                id: c.user_id || c.id,
                name: c.full_name,
                age: c.age,
                height: meta.height || "Not Specified",
                location: locString,
                role: meta.career?.profession || "Member",
                photoUrl: c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
                score: Math.max(0, Math.min(score, 99)),
                match_reasons: reasons.length > 0 ? reasons : isBroad ? ["Broader Match"] : ["AI Suggestion"],
                analysis: { emotional: 80 + (c.id % 15), vision: 85 + (c.id % 10) },
                isOnline: Math.random() > 0.3,
                summary: (c.raw_prompt || meta.aboutMe || "No bio yet.").substring(0, 150),
                reels: meta.reels || c.reels || [],
                photos: meta.photos || [],
                career: meta.career || {},
                family: meta.family || {},
                religion: meta.religion || {},
                horoscope: meta.horoscope || {},
                lifestyle: meta.lifestyle || {},
                stories: c.stories || [],
                phone: isPremium ? (c.phone || meta.phone) : null,
                email: isPremium ? (c.email || meta.email) : null,
                voiceBioUrl: c.voice_bio_url || null,
                kundli: astrologyService.calculateCompatibility(me.metadata?.horoscope?.nakshatra, meta.horoscope?.nakshatra)
            };
        }).filter((m: any) => m !== null);

        // 5. Semantic Re-ranking
        if (query && scoredMatches.length > 0) {
            try {
                const aiService = new (require('../services/ai').AIService)();
                console.log("🧠 Semantic Ranking", scoredMatches.length, "candidates...");

                if (true) {
                    const queryVector = await aiService.generateEmbedding(query);
                    // Helper Cosine
                    const cosineSimilarity = (vecA: number[], vecB: number[]) => {
                        let dot = 0; let nA = 0; let nB = 0;
                        for (let i = 0; i < vecA.length; i++) {
                            dot += vecA[i] * vecB[i];
                            nA += vecA[i] * vecA[i];
                            nB += vecB[i] * vecB[i];
                        }
                        return dot / (Math.sqrt(nA) * Math.sqrt(nB));
                    };

                    await Promise.all(scoredMatches.map(async (m: any) => {
                        const bio = m.summary || "";
                        if (bio.length > 10) {
                            const bioVector = await aiService.generateEmbedding(bio);
                            const similarity = cosineSimilarity(queryVector, bioVector);
                            if (similarity > 0.3) {
                                m.score += (similarity * 30);
                                m.match_reasons.push(`✨ Conceptual Match (${Math.round(similarity * 100)}%)`);
                            }
                            const sentiment = await aiService.analyzeSentiment(bio);
                            if (sentiment === 'POSITIVE') m.score += 5;
                            else if (sentiment === 'NEGATIVE') m.score -= 5;
                        }
                    }));
                }
            } catch (e) {
                console.error("Semantic Ranking Failed", e);
            }
        }

        // Sort & Finalize
        scoredMatches.sort((a: any, b: any) => (b?.score || 0) - (a?.score || 0));

        const finalMatches = scoredMatches.slice(0, 20).map((m: any) => ({
            ...m,
            isOnline: m.id ? isUserOnline(m.id) : (m.user_id ? isUserOnline(m.user_id) : false),
            analysis: { emotional: m?.score || 50, vision: m?.score || 50 }
        }));

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
