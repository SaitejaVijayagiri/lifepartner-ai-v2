import express from 'express';

import { pool } from '../db'; // Centralized DB & Storage
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

        const client = await pool.connect();
        const result = await client.query(`
            SELECT u.id as uid, u.*, p.* 
            FROM public.users u
            LEFT JOIN public.profiles p ON u.id = p.user_id
            WHERE u.id = $1
        `, [userId]);

        client.release();

        if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const user = result.rows[0];
        const meta = user.metadata || {};

        // Transform User + Profile into the specific Frontend Shape
        const profile = {
            userId: user.uid || user.id || user.user_id,
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
            motherTongue: meta.motherTongue || user.mother_tongue || "", // Fallback
            dob: meta.dob, // Added DOB

            reels: user.reels || [],
            prompt: user.raw_prompt,
            aboutMe: user.raw_prompt, // Map raw_prompt to aboutMe for frontend
            photos: meta.photos || [],
            photoUrl: user.avatar_url,
            joinedAt: user.created_at,
            is_premium: user.is_premium || false, // Exposed to Frontend
            coins: user.coins || 0, // Added Coin Balance
            phone: meta.phone || "", // Added Phone
            referral_code: user.referral_code || "", // Added Referral Code
            stories: (user.stories || []).filter((s: any) => new Date(s.expiresAt) > new Date()) // Only return active stories
        };

        res.json(profile);
    } catch (e) {
        console.error("Get Profile Error", e);
        res.status(500).json({ error: "Failed to fetch profile" });
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

        const client = await pool.connect();

        // 0. Validation: Email Uniqueness
        if (email) {
            const emailCheck = await client.query("SELECT id FROM public.users WHERE email = $1 AND id != $2", [email, userId]);
            if (emailCheck.rows.length > 0) {
                client.release();
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
            await client.query('BEGIN');

            // 2. Update Core User Info
            await client.query(`
                UPDATE public.users
                SET full_name = COALESCE($1, full_name),
                    age = COALESCE($2, age),
                    gender = COALESCE($3, gender),
                    location_name = COALESCE($4, location_name),
                    avatar_url = COALESCE($5, avatar_url),
                    email = COALESCE($6, email),
                    -- Normalize Location Columns
                    city = COALESCE($4, city), 
                    district = COALESCE($8, district),
                    state = COALESCE($9, state)
                WHERE id = $7
            `, [name, finalAge, gender, location?.city, finalPhotoUrl, email, userId, location?.district, location?.state]);

            // 2. Update Profile Metadata
            // We store extended fields (dob, full location) in metadata
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
            await client.query(`
                INSERT INTO public.profiles (user_id, raw_prompt, metadata, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET
                    raw_prompt = COALESCE(EXCLUDED.raw_prompt, public.profiles.raw_prompt),
                    metadata = COALESCE(public.profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata,
                    updated_at = NOW()
            `, [userId, cleanPrompt, JSON.stringify(metadata)]);

            await client.query('COMMIT');
            res.json({ success: true, message: "Profile saved" });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
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
        // We update the 'profiles' table
        const client = await pool.connect();

        // Upsert logic (unlikely to fail since we create profile on register)
        await client.query(`
            UPDATE public.profiles 
            SET raw_prompt = $1, traits = $2, values = $3, updated_at = NOW()
            WHERE user_id = $4
        `, [prompt, analysis.traits || {}, analysis.values || [], userId]);

        client.release();

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

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('reels')
            .getPublicUrl(filename);

        console.log("Uploaded Reel:", publicUrl);

        // 4. Save URL to DB
        await pool.query(`
            UPDATE public.profiles 
            SET reels = COALESCE(reels, '[]'::jsonb) || $1::jsonb 
            WHERE user_id = $2
        `, [JSON.stringify([publicUrl]), userId]);

        res.json({ success: true, videoUrl: publicUrl });

    } catch (e: any) {
        console.error("Upload Error", e);
        // Try to cleanup if error occurred before cleanup
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ error: "Upload failed", details: e.message || JSON.stringify(e) });
    }
});



// 5. POST /stories (Upload Story)
router.post('/stories', authenticateToken, (req, res, next) => {
    // Custom Error Handling for Multer (File Limit, etc.)
    upload.single('media')(req, res, (err) => {
        if (err) {
            // logDebug("Multer Error:", err);
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
            logDebug("No file received");
            return res.status(400).json({ error: "No media file" });
        }

        filePath = req.file.path;

        // Premium Restriction for Stories
        const authClient = await pool.connect();
        const userRes = await authClient.query('SELECT public.users.is_premium, public.profiles.stories FROM public.users LEFT JOIN public.profiles ON public.users.id = public.profiles.user_id WHERE public.users.id = $1', [userId]);
        const user = userRes.rows[0];

        const isPremium = user?.is_premium;
        let currentStories = (user?.stories || []) as any[];

        authClient.release();

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
                // Async cleanup, don't await
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

        const client = await pool.connect();
        const updateRes = await client.query(`
            UPDATE public.profiles
            SET stories = $1::jsonb
            WHERE user_id = $2
        `, [JSON.stringify(finalStories), userId]);

        if (updateRes.rowCount === 0) {
            await client.query(`
                INSERT INTO public.profiles (user_id, stories)
                VALUES ($1, $2::jsonb)
            `, [userId, JSON.stringify(finalStories)]);
        }

        client.release();

        res.json({ success: true, story: newStory });

    } catch (e: any) {
        logDebug("Story Upload Error", e);
        res.status(500).json({ error: "Upload failed", details: e.message });
    } finally {
        // ALWAYS clean up temp file
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

        const client = await pool.connect();

        // Remove element from JSONB array where id matches
        // Using jsonb_path_query_array or just filtering in application code if DB support is limited
        // Simplest generic approach: Get, Filter, Update

        const { rows } = await client.query('SELECT stories FROM public.profiles WHERE user_id = $1', [userId]);
        const currentStories = rows[0]?.stories || [];
        const updatedStories = currentStories.filter((s: any) => s.id !== storyId);

        await client.query('UPDATE public.profiles SET stories = $1 WHERE user_id = $2', [JSON.stringify(updatedStories), userId]);

        client.release();

        res.json({ success: true, message: "Story deleted" });

    } catch (e) {
        console.error("Delete Story Error", e);
        res.status(500).json({ error: "Failed to delete story" });
    }
});

export default router;
