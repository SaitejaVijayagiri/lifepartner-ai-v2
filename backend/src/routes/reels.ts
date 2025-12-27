import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../prisma';
import { upload } from '../middleware/upload';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { sanitizeContent } from '../utils/contentFilter';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const router = express.Router();

// 1. Get Reels Feed (Viral Algorithm)
router.get('/feed', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user?.userId;

        // 1. Get Current User's Gender & Location
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                profiles: {
                    select: { metadata: true }
                }
            }
        });

        const userLoc: any = (user?.profiles?.metadata as any)?.location || {};
        const myGender = (user?.gender || "").trim().toLowerCase();
        const myDistrict = userLoc.district || "";
        const myState = userLoc.state || "";

        console.log(`Feeding Reels for ${myGender} in ${myDistrict}, ${myState}`);

        // Gender Filter Logic
        let genderFilter = "";
        if (myGender === 'male') genderFilter = "AND LOWER(u.gender) = 'female'";
        else if (myGender === 'female') genderFilter = "AND LOWER(u.gender) = 'male'";

        // Algorithm:
        // Use Prisma Raw Query for complex scoring
        // Note: Prisma raw query returns dictionaries, need explicit casting if complex
        const reels = await prisma.$queryRaw`
            SELECT 
                r.*,
                u.full_name as author_name,
                u.avatar_url as author_photo,
                u.location_name as author_city,
                u.age as author_age,
                p.metadata->'location' as author_loc,
                (
                    (EXTRACT(EPOCH FROM r.created_at) * 0.0001) + 
                    (r.likes * 2) + 
                    (r.views * 0.1) +
                    (CASE 
                        WHEN (p.metadata->'location'->>'district') IS NOT NULL AND LOWER(p.metadata->'location'->>'district') = LOWER(${myDistrict}) THEN 50
                        WHEN (p.metadata->'location'->>'state') IS NOT NULL AND LOWER(p.metadata->'location'->>'state') = LOWER(${myState}) THEN 20
                        ELSE 0
                    END)
                ) as score,
                EXISTS(SELECT 1 FROM interactions i WHERE i.from_user_id = ${userId} AND i.to_user_id = r.user_id AND i.type = 'LIKE') as "is_liked_author",
                EXISTS(SELECT 1 FROM reel_likes rl WHERE rl.user_id = ${userId} AND rl.reel_id = r.id) as "is_liked"
            FROM reels r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN profiles p ON r.user_id = p.user_id
            WHERE r.user_id != ${userId} 
            -- Can't easily inject dynamic string in Prisma Raw without unsafe, relying on simple logic or fetch all and filter?
            -- Safe way: Use multiple queries or fixed string if trusted. 
            -- But genderFilter is derived from trusted enum.
            -- Actually, simpler: just filter by gender code if possible.
            -- Let's put the gender filter in the WHERE clause if needed manually or accept we fetch mixed for now?
            -- Or better: Use user.target_gender preference if available?
            -- Sticking to literal inject for this specific line since it is hardcoded logic above, BUT safer to remove dynamic SQL construction.
            -- Instead:
            AND (
                CASE 
                    WHEN ${myGender} = 'male' THEN LOWER(u.gender) = 'female'
                    WHEN ${myGender} = 'female' THEN LOWER(u.gender) = 'male'
                    ELSE TRUE -- Show all if unspecified
                END
            )
            ORDER BY score DESC
            LIMIT 20;
        ` as any[];

        // Map to Frontend Format
        const mappedReels = reels.map(row => ({
            id: row.id,
            url: row.video_url, // Supabase URL
            caption: row.caption || "",
            user: {
                id: row.user_id,
                name: row.author_name || "User",
                photoUrl: row.author_photo || "",
                location: {
                    city: row.author_city || "India",
                    district: row.author_loc?.district,
                    state: row.author_loc?.state
                },
                age: row.author_age
            },
            isMe: false, // Filtered out above
            likes: row.likes || 0,
            isLiked: row.is_liked || false,
            commentCount: row.comments_count || 0
        }));

        res.json(mappedReels);
    } catch (e) {
        console.error("Fetch Reels Error", e);
        res.status(500).json({ error: "Failed to fetch reels" });
    }
});

// 2. Upload Reel (Protected)
router.post('/upload', authenticateToken, upload.single('video'), async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        if (!req.file) return res.status(400).json({ error: "No video file" });

        const filePath = req.file.path;
        const filename = `reels/${userId}/${Date.now()}-${path.basename(filePath)}`;
        const caption = req.body.caption || "";

        // REVENUE PROTECTION: Check Premium Status
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { is_premium: true } });

        if (!user?.is_premium) {
            fs.unlink(filePath, () => { }); // Cleanup uploaded temp file
            return res.status(403).json({
                error: "Premium Required",
                message: "Reel uploads are exclusive to Premium Members. Upgrade to share your vibe!"
            });
        }

        console.log(`Starting Reel upload: ${filename}`);

        // REVENUE PROTECTION: Caption
        const cleanCaption = sanitizeContent(caption);

        // 0. AI Vibe Analysis
        let vibeSummary = "";
        try {
            console.log("Analyzing Reel Vibe...");
            const { analyzeVibe } = await import('../services/vibeAnalysis');
            const vibeResult = await analyzeVibe(filePath, 'VIDEO');
            if (vibeResult && vibeResult.summary) {
                vibeSummary = `\n\n✨ AI Vibe: ${vibeResult.vibe} (${vibeResult.tags.slice(0, 3).join(', ')})`;
            }
        } catch (aiErr) {
            console.error("Reel AI Analysis Failed", aiErr);
        }

        // 1. Upload to Supabase
        const fileStream = fs.createReadStream(filePath);
        const { error } = await supabase.storage
            .from('reels')
            .upload(filename, fileStream, {
                contentType: req.file.mimetype,
                upsert: true,
                duplex: 'half'
            });

        // Cleanup
        fs.unlink(filePath, () => { });

        if (error) {
            console.error("Supabase Upload Error:", error);
            return res.status(500).json({ error: "Upload failed" });
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('reels').getPublicUrl(filename);

        // 3. Save to DB
        const finalCaption = cleanCaption + vibeSummary;

        const result = await prisma.reels.create({
            data: {
                user_id: userId,
                video_url: publicUrl,
                caption: finalCaption
            }
        });

        res.json({
            success: true,
            reelId: result.id,
            vibe: vibeSummary // Return to UI for immediate feedback
        });

    } catch (e) {
        console.error("Reel Upload Error", e);
        if (req.file?.path) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: "Server Error" });
    }
});

// 3. Like Reel
router.post('/:id/like', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        // Toggle Like
        const existingLike = await prisma.reel_likes.findFirst({
            where: { user_id: userId, reel_id: id }
        });

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.reel_likes.deleteMany({
                    where: { user_id: userId, reel_id: id }
                }),
                prisma.reels.update({
                    where: { id },
                    data: { likes: { decrement: 1 } }
                })
            ]);
        } else {
            // Like
            await prisma.$transaction([
                prisma.reel_likes.create({
                    data: { user_id: userId, reel_id: id }
                }),
                prisma.reels.update({
                    where: { id },
                    data: { likes: { increment: 1 } }
                })
            ]);
        }

        res.sendStatus(200);
    } catch (e) {
        console.error("Like Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 4. Comment on Reel (Protected)
router.post('/:id/comment', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { text } = req.body;

        if (!text) return res.status(400).json({ error: "Missing text" });

        const cleanText = sanitizeContent(text);

        const newComment = await prisma.$transaction(async (tx) => {
            const comment = await tx.reel_comments.create({
                data: {
                    user_id: userId,
                    reel_id: id,
                    text: cleanText
                }
            });

            await tx.reels.update({
                where: { id },
                data: { comments_count: { increment: 1 } }
            });

            return comment;
        });

        res.json({
            id: newComment.id,
            text: cleanText,
            user: "You" // Frontend handles lazy loading of name if needed
        });

    } catch (e) {
        console.error("Comment Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 5. Get Comments
router.get('/:id/comments', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        const comments = await prisma.reel_comments.findMany({
            where: { reel_id: id },
            include: { users: { select: { full_name: true } } },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        const formattedComments = comments.map(c => ({
            id: c.id,
            text: c.text,
            user: c.users?.full_name || "User"
        }));

        res.json(formattedComments);

    } catch (e) {
        console.error("Get Comments Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 6. Track View
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reels.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        res.sendStatus(200);
    } catch (e) {
        console.error("Track View Error", e);
        res.sendStatus(500);
    }
});

export default router;
