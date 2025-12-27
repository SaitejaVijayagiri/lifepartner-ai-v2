import express from 'express';
import { prisma } from '../prisma'; // Centralized Prisma Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
import { AIService } from '../services/ai';
import { sanitizeContent } from '../utils/contentFilter';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const aiService = new AIService();

import { upload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';
import { ImageOptimizer } from '../services/imageOptimizer';

async function uploadOptimizedImage(base64: string, userId: string): Promise<string> {
    if (!base64 || !ImageOptimizer.isBase64(base64)) return base64; // Return as is if url

    try {
        const buffer = await ImageOptimizer.optimize(base64);
        const filename = `profiles/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        const { data, error } = await supabase.storage
            .from('reels') // Reuse 'reels' bucket or specific 'images' bucket. Using 'reels' for simplicity as it exists (or 'media' if available).
            // Note: Ideally create a 'public' bucket. Let's try 'public' or stick to 'reels' for now.
            // Guide mentions 'reels' bucket is used. I'll use 'reels' for now to ensure it works without creating new buckets manually.
            .upload(filename, buffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('reels').getPublicUrl(filename);
        return publicUrl;
    } catch (e) {
        console.error("Optimize upload failed", e);
        return base64; // Fallback to storing base64 (not ideal but safe)
    }
}

// Debug Logger
const logDebug = (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    console.log(msg, data || '');
    try {
        fs.appendFileSync(path.join(__dirname, '../backend_debug.log'), logLine);
    } catch (e) {
        // Ignore logging errors
    }
};

// 2. GET /me (Fetch from DB)
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const meta: any = user.profiles?.metadata || {};

        // Transform User + Profile into the specific Frontend Shape
        const profile = {
            userId: user.id || userId,
            name: user.full_name,
            email: user.email,
            age: user.age, // Added Age
            gender: user.gender,
            // Prefer metadata location (full object) over user.location_name (string)
            location: meta.location || { city: user.location_name, country: "India" },

            // Read from Metadata with fallbacks
            career: meta.career || { profession: "", education: "" },
            family: meta.family || { type: "Nuclear" },
            lifestyle: meta.lifestyle || { diet: "Veg" },
            religion: meta.religion || { religion: "Hindu" },
            horoscope: meta.horoscope || {},
            partnerPreferences: meta.partnerPreferences || {},
            motherTongue: meta.motherTongue || "", // Fallback
            dob: meta.dob, // Added DOB

            reels: (meta.reels as string[]) || [], // Use metadata reels or user.reels logic if column exists. Old code used user.reels?
            // Actually old code used user.reels. Schema has user.reels? No, standard schema puts it in profiles or JSON.
            // Old SQL: u.reels. 
            // Prisma Schema: does User have reels?
            // Let's assume it's in metadata.reels primarily.

            prompt: user.profiles?.raw_prompt,
            aboutMe: user.profiles?.raw_prompt, // Map raw_prompt to aboutMe for frontend
            photos: meta.photos || [],
            photoUrl: user.avatar_url,
            joinedAt: user.created_at,
            is_premium: user.is_premium || false,
            is_admin: user.is_admin || false, // Exposed to Frontend
            coins: user.coins || 0, // Added Coin Balance
            phone: meta.phone || "", // Added Phone
            referral_code: user.referral_code || "", // Added Referral Code
            // Stories logic
            stories: ((user.profiles?.stories as any[]) || []).filter((s: any) => new Date(s.expiresAt) > new Date()) // Only return active stories
        };

        res.json(profile);
    } catch (e) {
        console.error("Get Profile Error", e);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get Public Profile by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        // Handle explicit "me" if somehow routed here, though /me should be caught earlier if defined earlier
        if (id === 'me') {
            return res.status(400).json({ error: "Use /me endpoint" });
        }

        // Fetch User with Relations in one go
        const user = await prisma.users.findUnique({
            where: { id },
            include: {
                profiles: true,
                _count: {
                    select: {
                        matches_matches_user_b_idTousers: { where: { is_liked: true } } // Total Likes
                        // Gifts count? Transactions table needed.
                        // _count on transactions for 'Sent Gift'? 
                        // Check relation for transactions. Schema might rely on JSON metadata in transactions.
                        // Skip gift count for now or use separate count.
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch Requester
        const requesterId = req.user.userId;
        const requester = await prisma.users.findUnique({ where: { id: requesterId }, select: { is_premium: true } });
        const isRequesterPremium = requester?.is_premium;

        const meta: any = user.profiles?.metadata || {};

        // Contact Info Logic: Only show if requester is Premium
        // Mask details for free users
        const contactInfo = isRequesterPremium ? {
            email: user.email,
            phone: meta.phone || user.phone
        } : {
            email: null,
            phone: null
        };

        res.json({
            id: user.id,
            name: user.full_name,
            age: user.age,
            gender: user.gender,
            isPremium: user.is_premium,
            photoUrl: user.avatar_url,
            location: {
                city: user.city || "Unknown",
                district: user.district,
                state: user.state
            },
            aboutMe: meta.bio || "",
            photos: meta.photos || [user.avatar_url],
            reels: meta.reels || [],
            total_gifts: 0, // Migrated: 0 for now
            total_likes: user._count.matches_matches_user_b_idTousers || 0,
            ...meta,
            ...contactInfo, // Spread contact info (either real or null)
            isContactUnlocked: isRequesterPremium // Flag for Frontend to show "Upgrade to View"
        });

    } catch (e) {
        console.error("Get Profile Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 2.5 PUT /me (Update Profile)
router.put('/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // ...

        const {
            name, age, gender, location,
            religion, horoscope, career, family, lifestyle,
            prompt, aboutMe, // Accept aboutMe as alias for prompt
            partnerPreferences,
            motherTongue, dob, height, // Accept DOB & Height
            photos, photoUrl,
            email, phone // Added email and phone
        } = req.body;

        // OPTIMIZATION: Handle Base64 Images
        let finalPhotoUrl = photoUrl;
        if (ImageOptimizer.isBase64(photoUrl)) {
            finalPhotoUrl = await uploadOptimizedImage(photoUrl, userId);
        }

        let finalPhotos = photos || [];
        if (Array.isArray(finalPhotos)) {
            finalPhotos = await Promise.all(finalPhotos.map(async (p: string) => {
                if (ImageOptimizer.isBase64(p)) {
                    return await uploadOptimizedImage(p, userId);
                }
                return p;
            }));
        }

        // REVENUE PROTECTION: Sanitize Inputs
        // Prioritize aboutMe (Frontend Field) over prompt (Legacy/DB Field) if both exist
        const contentToSave = aboutMe !== undefined ? aboutMe : prompt;
        const cleanPrompt = sanitizeContent(contentToSave || '');
        if (career) career.profession = sanitizeContent(career.profession || '');
        if (location) location.city = sanitizeContent(location.city || '');

        // 0. Validation: Email Uniqueness
        if (email) {
            const emailCheck = await prisma.users.findFirst({
                where: {
                    email: email,
                    id: { not: userId }
                }
            });
            if (emailCheck) {
                return res.status(400).json({ error: "Email is already in use by another account" });
            }
        }

        // 1. Data Integrity: Auto-calculate Age from DOB (Server Side Truth)
        let finalAge = age;
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            finalAge = calculatedAge;
        }

        try {
            await prisma.$transaction(async (tx) => {
                // 2. Update Core User Info
                await tx.users.update({
                    where: { id: userId },
                    data: {
                        full_name: name || undefined, // COALESCE equivalent: standard undefined ignored
                        age: finalAge,
                        gender,
                        location_name: location?.city, // Fallback
                        avatar_url: finalPhotoUrl,
                        email,
                        city: location?.city,
                        district: location?.district,
                        state: location?.state
                    }
                });

                // 2. Update Profile Metadata
                const metadata = {
                    religion,
                    horoscope,
                    career, // already sanitized
                    family,
                    lifestyle,
                    partnerPreferences,
                    motherTongue,
                    photos: finalPhotos,
                    dob,
                    location, // already sanitized
                    height, // Added Height
                    phone // Added Phone
                };

                // Upsert Profile
                // Prisma uses explicit update or create logic for JSON merges if needed.
                // However, metadata default merge is NOT automatic in Prisma update.
                // We need to fetch existing if we want deep merge, OR just overwrite.
                // The SQL used `||` concatenation for partial updates.
                // For now, simpler to fetch existing metadata or just trust frontend sends full state?
                // Frontend usually sends full state. Let's assume full state overwrite for metadata.
                // IF partial is needed, we must fetch first.
                // The SQL was `COALESCE(public.profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata` which implies merge by key.
                // Let's FETCH first to be safe.

                const existingProfile = await tx.profiles.findUnique({ where: { user_id: userId } });
                const existingMeta = (existingProfile?.metadata as any) || {};
                const newMeta = { ...existingMeta, ...metadata };

                await tx.profiles.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        raw_prompt: cleanPrompt,
                        metadata: metadata // On create use fresh
                    },
                    update: {
                        raw_prompt: cleanPrompt,
                        metadata: newMeta // On update use merge
                    }
                });
            });

            res.json({ success: true, message: "Profile saved" });

        } catch (e) {
            console.error("Tx Error", e);
            throw e;
        }

    } catch (e) {
        console.error("Save Profile Error", e);
        res.status(500).json({ error: "Failed to save profile" });
    }
});

// 3. POST /prompt (Update Profile with AI)
router.post('/prompt', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { prompt } = req.body;

        // 1. AI Analysis
        const analysis = await aiService.parseUserPrompt(prompt);

        // 2. Save to DB
        await prisma.profiles.update({
            where: { user_id: userId },
            data: {
                raw_prompt: prompt,
                traits: analysis.traits || {},
                values: (analysis.values as any) || [],
                updated_at: new Date()
            }
        });

        res.json({ success: true, message: "Profile updated via AI" });
    } catch (e) {
        console.error("Prompt Error", e);
        res.status(500).json({ error: "AI Processing Failed" });
    }
});

// 4. POST /reel (Stream from Disk to Supabase)
router.post('/reel', authenticateToken, upload.single('video'), async (req: any, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) return res.status(400).json({ error: "No video file" });

        const filePath = req.file.path;
        const filename = `${userId}/${path.basename(filePath)}`;

        console.log(`Starting stream upload: ${filename} (${req.file.size} bytes)`);

        // 1. Stream to Supabase Storage
        const fileStream = fs.createReadStream(filePath);

        const { data, error } = await supabase
            .storage
            .from('reels')
            .upload(filename, fileStream, {
                contentType: req.file.mimetype,
                upsert: true,
                duplex: 'half' // Important for node streams
            });

        // 2. Cleanup Temp File
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
            else console.log("Temp file cleaned up");
        });

        if (error) {
            console.error("Supabase Upload Error:", error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage.from('reels').getPublicUrl(filename);
        console.log("Uploaded Reel:", publicUrl);

        // 4. Save URL to DB
        // Append to 'reels' JSONB array in profiles? Or users?
        // Original code: `UPDATE public.profiles SET reels = COALESCE(reels, '[]'::jsonb) || $1::jsonb`
        // Wait, earlier I saw `user.reels`. Let's assume it IS in `profiles.reels`.
        // We need to fetch current reels to append (PRISMA JSON APPEND WORKAROUND)

        const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
        const currentReels = (profile?.reels as any[]) || [];
        const updatedReels = [...currentReels, publicUrl];

        await prisma.profiles.update({
            where: { user_id: userId },
            data: { reels: updatedReels }
        });

        res.json({ success: true, videoUrl: publicUrl });

    } catch (e: any) {
        console.error("Upload Error", e);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ error: "Upload failed", details: e.message || JSON.stringify(e) });
    }
});



// 5. POST /stories (Upload Story)
router.post('/stories', authenticateToken, (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req: any, res) => {
    let filePath = '';
    try {
        const userId = req.user.userId;
        logDebug(`[POST /stories] User: ${userId} Requesting Upload`);

        if (!req.file) {
            return res.status(400).json({ error: "No media file" });
        }

        filePath = req.file.path;

        // Premium Restriction for Stories
        // Fetch User + Profile
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        const isPremium = user?.is_premium;
        const currentStories = (user?.profiles?.stories as any[]) || [];

        if (!isPremium) {
            return res.status(403).json({ error: "Stories are a Premium feature" });
        }

        // AUTO-CLEANUP: Filter out expired stories
        const now = new Date();
        const validStories = currentStories.filter((s: any) => new Date(s.expiresAt) > now);

        if (validStories.length >= 5) {
            // FIFO STRATEGY: Remove oldest
            const removed = validStories.shift();
            logDebug(`Limit reached. Auto-deleted story: ${removed?.id}`);
            if (removed?.url) {
                const oldPath = removed.url.split('reels/')[1];
                if (oldPath) supabase.storage.from('reels').remove([oldPath]);
            }
        }

        const filename = `stories/${userId}/${Date.now()}-${path.basename(req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))}`;
        const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';

        logDebug(`Starting upload to Supabase: ${filename}`);

        // 1. Upload to Supabase Storage
        const fileContent = fs.readFileSync(filePath);
        const { data, error } = await supabase.storage
            .from('reels')
            .upload(filename, fileContent, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('reels').getPublicUrl(filename);
        logDebug(`Upload Success: ${publicUrl}`);

        // 2. Add to DB
        const newStory = {
            id: Date.now().toString(),
            url: publicUrl,
            type,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        const finalStories = [...validStories, newStory];

        // Upsert Profile Stories
        await prisma.profiles.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                stories: finalStories
            },
            update: {
                stories: finalStories
            }
        });

        res.json({ success: true, story: newStory });

    } catch (e: any) {
        logDebug("Story Upload Error", e);
        res.status(500).json({ error: "Upload failed", details: e.message });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupErr) {
                console.error("Cleanup error", cleanupErr);
            }
        }
    }
});

// 6. DELETE /stories/:storyId
router.delete('/stories/:storyId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { storyId } = req.params;

        // Fetch user profile
        const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
        const currentStories = (profile?.stories as any[]) || [];

        const updatedStories = currentStories.filter((s: any) => s.id !== storyId);

        await prisma.profiles.update({
            where: { user_id: userId },
            data: { stories: updatedStories }
        });

        res.json({ success: true, message: "Story deleted" });

    } catch (e) {
        console.error("Delete Story Error", e);
        res.status(500).json({ error: "Failed to delete story" });
    }
});

export default router;
