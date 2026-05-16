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
import { authenticateToken, authenticateOptional } from '../middleware/auth';
import { ImageOptimizer } from '../services/imageOptimizer';
import { sanitizePhotoUrl } from '../utils/photoUrl';
import { ModerationService } from '../services/moderation';
import { uploadToCloudinary, isConfigured as cloudinaryConfigured } from '../services/cloudinaryStorage';
import { exec } from 'child_process';

router.get('/trigger-migration', (req, res) => {
    const scriptPath = path.join(__dirname, '../../scripts/migrate_base64_photos.js');
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration error: ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ success: true, stdout, stderr });
    });
});


/**
 * Upload a profile image with fallback chain:
 *   1. Cloudinary (free 25 GB, no egress fees, global CDN) — primary
 *   2. Supabase storage (legacy, ISP-blocked via proxy)    — secondary
 *   3. Return null so caller stores base64 as last resort
 *
 * If the input is already an https URL (not base64), it is returned as-is.
 */
async function uploadOptimizedImage(base64: string, userId: string): Promise<string | null> {
    if (!base64 || !ImageOptimizer.isBase64(base64)) return base64; // Already a URL

    const buffer = await ImageOptimizer.optimize(base64);

    // ── 1. Try Cloudinary ──────────────────────────────────────────────────────
    if (cloudinaryConfigured()) {
        const cloudinaryUrl = await uploadToCloudinary(base64, userId);
        if (cloudinaryUrl) return cloudinaryUrl;
        console.warn('[profile] Cloudinary upload failed — trying Supabase...');
    }

    // ── 2. Try Supabase ────────────────────────────────────────────────────────
    try {
        const filename = `profiles/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        const { error } = await supabase.storage
            .from('profiles')
            .upload(filename, buffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filename);
        console.log(`✅ [Supabase] Uploaded photo: ${filename}`);
        return publicUrl;
    } catch (e) {
        console.warn('[profile] Supabase upload also failed — falling back to base64.');
        return null; // Caller stores base64 as last resort
    }
}

// Debug Logger
// NOTE: Log file is written to process.cwd()/logs/ (project root) rather than __dirname
// to avoid writing runtime files into the compiled source tree.
const LOG_DIR = path.join(process.cwd(), 'logs');
const logDebug = (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    console.log(msg, data || '');
    try {
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(path.join(LOG_DIR, 'backend_debug.log'), logLine);
    } catch (e) {
        // Ignore logging errors — never block a request due to log failure
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
            location: meta.location || { city: user.location_name },

            // Read from Metadata with fallbacks
            career: meta.career || { profession: "", education: "" },
            family: meta.family || {},
            lifestyle: meta.lifestyle || {},
            religion: meta.religion || {},
            horoscope: meta.horoscope || {},
            partnerPreferences: meta.partnerPreferences || {},
            motherTongue: meta.motherTongue || "",
            maritalStatus: meta.maritalStatus || "", // Removed "Single" default
            dob: meta.dob, // Added DOB
            interests: meta.interests || (user.profiles?.traits as any)?.hobbies || [], // Map interests/hobbies

            reels: (meta.reels as string[]) || [], // Use metadata reels or user.reels logic if column exists. Old code used user.reels?
            // Actually old code used user.reels. Schema has user.reels? No, standard schema puts it in profiles or JSON.
            // Old SQL: u.reels. 
            // Prisma Schema: does User have reels?
            // Let's assume it's in metadata.reels primarily.

            expectations: meta.expectations || "",  // Partner preferences text
            prompt: meta.expectations || "",  // Legacy fallback
            aboutMe: meta.aboutMe || meta.bio || user.profiles?.raw_prompt || "", // About Me bio — separate from expectations
            height: meta.height || "", // Height
            photos: meta.photos || [],
            photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
            joinedAt: user.created_at,
            is_premium: user.is_premium || false,
            is_admin: user.is_admin || false, // Exposed to Frontend
            free_direct_messages: user.free_direct_messages ?? 3,
            coins: user.coins || 0, // Added Coin Balance
            phone: meta.phone || "", // Added Phone
            referral_code: user.referral_code || "", // Added Referral Code
            premium_expiry: user.premium_expiry, // Added Premium Expiry
            is_profile_completed_reward_claimed: meta.profile_completed_reward || false, // Gamification flag
            muted_users: meta.muted_users || [],
            // Stories logic
            stories: ((user.profiles?.stories as any[]) || []).filter((s: any) => new Date(s.expiresAt) > new Date()) // Only return active stories
        };

        res.json(profile);
    } catch (e) {
        console.error("Get Profile Error", e);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Get Featured Public Profiles (For Landing Page)
router.get('/public/featured', async (req, res) => {
    try {
        const targetNames = ['vinay', 'awais anwer', 'gautam v reddy', 'vimal', 'gautam', 'sunny dharod', 'hamoudi', 'sunny', 'giridhar', 'gk'];
        const orConditions = targetNames.map(name => ({
            full_name: { contains: name, mode: 'insensitive' as const }
        }));

        const excludeConditions = [
            { full_name: { contains: 'archana', mode: 'insensitive' as const } },
            { full_name: { contains: 'archna', mode: 'insensitive' as const } },
            { full_name: { equals: 'sb', mode: 'insensitive' as const } },
            { full_name: { contains: 'sidham', mode: 'insensitive' as const } }
        ];

        // 1. Prioritize these specific users
        const specificUsers = await prisma.users.findMany({
            where: {
                OR: orConditions,
                NOT: { OR: excludeConditions }
            },
            include: { profiles: true },
            take: 15
        });

        // 2. Fill the rest with general verified, high-quality users if needed
        const remainingCount = 40 - specificUsers.length;
        let randomUsers: any[] = [];
        if (remainingCount > 0) {
            randomUsers = await prisma.users.findMany({
                where: {
                    is_verified: true,
                    gender: { not: null },
                    age: { not: null },
                    avatar_url: { not: null },
                    NOT: { OR: excludeConditions },
                    id: { notIn: specificUsers.map(u => u.id) }
                },
                take: remainingCount,
                include: { profiles: true },
                orderBy: { created_at: 'desc' }
            });
        }

        const combinedUsers = [...specificUsers, ...randomUsers];
        // Ensure randomize order
        const shuffled = combinedUsers.sort(() => 0.5 - Math.random());

        // Map to public profile format
        const nameAliasMap: Record<string, string> = {
            'gk': 'Giridhar Kumar',
            'g.k.': 'Giridhar Kumar',
        };
        const countryOverrideMap: Record<string, string> = {
            'hamoudi': 'Indonesia',
        };

        const allProfiles = shuffled.map(user => {
            const meta = (user.profiles?.metadata as any) || {};
            const rawFirstName = (user.full_name?.split(' ')[0] || 'User').toLowerCase();
            const displayName = nameAliasMap[rawFirstName] || (user.full_name?.split(' ')[0] || 'User');
            const country = countryOverrideMap[rawFirstName] || meta.location?.country || user.state || 'India';
            const locationStr = user.city ? `${user.city}, ${country}` : country !== 'India' ? country : 'Hidden';

            return {
                id: user.id,
                name: displayName,
                age: user.age,
                gender: user.gender,
                photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
                photos: (meta.photos || [user.avatar_url]).map((p: string) => sanitizePhotoUrl(p, user.full_name || user.id)),
                location: locationStr,
                profession: meta.career?.profession || "Professional",
                isVerified: true
            };
        });

        // Split into two distinct rows
        const mid = Math.ceil(allProfiles.length / 2);
        const topRow = allProfiles.slice(0, mid);
        const bottomRow = allProfiles.slice(mid);

        res.json({ success: true, topRow, bottomRow });


    } catch (e) {
        console.error("Public Featured Error", e);
        res.status(500).json({ error: "Failed to fetch public profiles" });
    }
});

// Toggle Mute Notifications for a User
router.post('/mute/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const targetId = req.params.id;

        if (userId === targetId) {
            return res.status(400).json({ error: "Cannot mute yourself" });
        }

        const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const meta = (profile.metadata as any) || {};
        let mutedUsers = meta.muted_users || [];
        
        let isMuted = false;
        if (mutedUsers.includes(targetId)) {
            mutedUsers = mutedUsers.filter((id: string) => id !== targetId);
            isMuted = false;
        } else {
            mutedUsers.push(targetId);
            isMuted = true;
        }

        const newMeta = { ...meta, muted_users: mutedUsers };

        await prisma.profiles.update({
            where: { user_id: userId },
            data: { metadata: newMeta }
        });

        res.json({ success: true, isMuted });
    } catch (e) {
        console.error("Mute User Error", e);
        res.status(500).json({ error: "Failed to toggle mute" });
    }
});

// Get Public Profile by ID
router.get('/:id', authenticateOptional, async (req: any, res) => {
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
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch Requester (if logged in)
        const requesterId = req.user?.userId;
        let isRequesterPremium = false;

        if (requesterId) {
            const requester = await prisma.users.findUnique({ where: { id: requesterId }, select: { is_premium: true } });
            isRequesterPremium = requester?.is_premium || false;
        }

        const meta: any = user.profiles?.metadata || {};

        // Contact Info Logic: Only show if requester is Premium
        // Mask details for free users AND guests
        const isProtectedUser = user.email === 'saitejavijayagiri123@gmail.com';
        const canViewContact = isRequesterPremium && !isProtectedUser && requesterId !== user.id; // Hide if protected (but they can view their own via /me)

        const contactInfo = canViewContact ? {
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
            photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
            location: {
                city: user.city || "",
                district: user.district || "",
                state: user.state || "",
                country: meta?.location?.country || "India"
            },
            aboutMe: user.profiles?.raw_prompt || meta.bio || "",
            bio: meta.bio || user.profiles?.raw_prompt || "",
            expectations: meta.expectations || "",
            height: meta.height || "",
            photos: (meta.photos || [user.avatar_url]).map((url: string) => sanitizePhotoUrl(url, user.full_name || user.id)),
            reels: meta.reels || [],
            total_gifts: 0,
            total_likes: user._count.matches_matches_user_b_idTousers || 0,
            // Explicit meta fields — NO blind ...meta spread (prevents location/country duplication)
            career: meta.career || {},
            religion: meta.religion || {},
            horoscope: meta.horoscope || {},
            family: meta.family || {},
            lifestyle: meta.lifestyle || {},
            partnerPreferences: meta.partnerPreferences || {},
            motherTongue: meta.motherTongue || "",
            maritalStatus: meta.maritalStatus || "",
            dob: meta.dob || null,
            interests: meta.interests || [],
            summary: meta.summary || "",
            ...contactInfo,
            isContactUnlocked: isRequesterPremium
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
            prompt, aboutMe, expectations, // expectations = partner text; aboutMe = bio
            partnerPreferences,
            motherTongue, dob, height, maritalStatus, // Accept DOB & Height & Marital Status
            photos, photoUrl,
            email, phone, // Added email and phone
            savedStickers,
            interests // Added interests/hobbies
        } = req.body;

        let finalPhotos: string[] = [];
        const rawPhotos = photos || [];
        if (Array.isArray(rawPhotos)) {
            // Cap to 5 photos to prevent payload abuse on onboarding
            const photosToProcess = rawPhotos.slice(0, 5);

            // Run moderation + upload SEQUENTIALLY to prevent WASM/RAM Out Of Memory crashes
            for (let i = 0; i < photosToProcess.length; i++) {
                const p = photosToProcess[i];

                // Skip photos that are already stored URLs (not base64) - no processing needed
                if (!ImageOptimizer.isBase64(p)) {
                    finalPhotos.push(p);
                    continue;
                }

                // Run moderation check — first photo must have a clear face (hard check)
                // Secondary photos are lifestyle-friendly (soft check: skip on fail, don't abort)
                const isFirstPhoto = i === 0;
                const modResult = await ModerationService.validateProfilePhoto(p, isFirstPhoto);

                if (!modResult.isValid) {
                    if (isFirstPhoto) {
                        // Hard reject for primary avatar — show error to user
                        throw Object.assign(new Error(modResult.reason), { status: 400 });
                    } else {
                        // Soft skip for secondary photos — don't block the save
                        console.warn(`[profile] Secondary photo ${i} failed moderation (skipped): ${modResult.reason}`);
                        continue;
                    }
                }

                // Upload to Supabase storage
                const uploaded = await uploadOptimizedImage(p, userId);
                if (uploaded && !ImageOptimizer.isBase64(uploaded)) {
                    // Only keep photos that are proper Supabase URLs optimally
                    finalPhotos.push(uploaded);
                } else {
                    console.warn(`[profile] Photo ${i} upload to Supabase returned null — falling back to database base64 storage.`);
                    // FALLBACK: The frontend Canvas API already heavily compresses images (900px, 0.75 JPEG).
                    // If Supabase is down or sleeping, we store the compressed base64 natively in Postgres 
                    // to prevent users from silently losing the photos they just uploaded!
                    if (p && typeof p === 'string' && p.startsWith('data:image')) {
                        finalPhotos.push(p);
                    } else if (isFirstPhoto && finalPhotos.length === 0) {
                        console.error('[profile] Primary photo upload and fallback failed. User must retry.');
                        throw Object.assign(new Error('Failed to upload your profile photo. Please try again.'), { status: 500 });
                    }
                }
            }
        }

        // Derive finalPhotoUrl from the processed photos array to prevent duplicate uploads
        let finalPhotoUrl = finalPhotos.length > 0 ? finalPhotos[0] : photoUrl;

        // Separate: aboutMe → raw_prompt (personal bio), expectations/prompt → metadata.expectations
        const cleanBio = sanitizeContent(aboutMe || '');
        const cleanExpectations = sanitizeContent(expectations || prompt || '');
        // Legacy: if only prompt is provided but no bio, fallback for compatibility
        const finalBio = cleanBio || (aboutMe === undefined ? cleanExpectations : '');
        const cleanPrompt = finalBio;
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

        // 0.5. Validation: Phone Uniqueness
        if (phone && phone.trim() !== '') {
            const phoneCheck = await prisma.users.findFirst({
                where: {
                    phone: phone,
                    id: { not: userId }
                }
            });
            if (phoneCheck) {
                return res.status(400).json({ error: "Phone number is already in use by another account" });
            }
        }

        // 1. Data Integrity: Auto-calculate Age from DOB (Server Side Truth)
        let finalAge = parseInt(age as string);
        if (isNaN(finalAge)) finalAge = undefined as any;

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

        // 1.5 Auto-Geocode city → lat/lng if not already provided via GPS
        if (location && location.city && !location.lat && !location.lng) {
            try {
                const { LocationService } = require('../services/location');
                const cityQuery = [location.city, location.district, location.state].filter(Boolean).join(', ');
                // Add 5s timeout to prevent geocode hanging the whole save
                const coords = await Promise.race([
                    LocationService.geocodeCity(cityQuery),
                    new Promise(resolve => setTimeout(() => resolve(null), 5000))
                ]);
                if (coords) {
                    location.lat = (coords as any).lat;
                    location.lng = (coords as any).lng;
                    console.log(`🗺️ Auto-geocoded "${cityQuery}" → ${(coords as any).lat}, ${(coords as any).lng}`);
                }
            } catch (e) {
                console.error('Auto-geocode failed (non-blocking):', e);
            }
        }

        // SPEED OPTIMIZATION: Generate the AI Vector OUTSIDE the database transaction
        // External network calls inside transactions cause DB lock timeouts and silent connection crashes!
        const bioTextToEmbed = [
            cleanPrompt,
            career?.profession,
            career?.educationLevel,
            location?.city
        ].filter(Boolean).join(" ");

        // SPEED OPTIMIZATION: Skip embedding if there's no meaningful text
        // This avoids cold-starting the AI service on every basic profile update
        let bioVector: number[] = [];
        if (bioTextToEmbed.length > 20) {
            try {
                // 8-second timeout so embedding never blocks the save
                const embeddingPromise = aiService.generateEmbedding(bioTextToEmbed);
                const timeoutPromise = new Promise<number[]>(resolve => setTimeout(() => resolve([]), 8000));
                bioVector = await Promise.race([embeddingPromise, timeoutPromise]);
            } catch (e) {
                console.error("Failed to generate embedding before tx", e);
            }
        }

        // Pre-fetch existing profile to merge metadata OUTSIDE transaction
        // (to prevent 'prisma find unique() transaction api error' locks)
        let existingMeta: any = {};
        try {
            const existingProfile = await prisma.profiles.findUnique({ where: { user_id: userId } });
            existingMeta = (existingProfile?.metadata as any) || {};
        } catch (e) {
            console.warn('[profile] Could not pre-fetch existing profile, proceeding with empty meta', e);
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
                        location_name: location?.city ? `${location.city}, ${location.country || ''}`.trim().replace(/,$/, '') : undefined, // Better location string
                        avatar_url: finalPhotoUrl,
                        email: email?.trim() ? email.trim() : undefined, // FIX: Never allow explicitly saving a blank email
                        phone: phone || undefined,
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
                    maritalStatus, // Store maritalStatus in metadata too
                    photos: finalPhotos,
                    dob,
                    location, // already sanitized
                    height, // Added Height
                    phone, // Added Phone
                    bio: cleanBio || finalBio, // Sync aboutMe to bio
                    expectations: cleanExpectations || undefined, // Store expectations separately
                    savedStickers,
                    interests
                };

                // Upsert Profile
                const newMeta = { ...existingMeta, ...metadata };

                await tx.profiles.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        raw_prompt: cleanBio || finalBio, // raw_prompt = bio/about me only
                        metadata: metadata // On create use fresh
                    },
                    update: {
                        raw_prompt: cleanBio || finalBio, // raw_prompt = bio/about me only
                        metadata: newMeta // On update use merge
                    }
                });

                // --- REFERRAL BONUS DEFERMENT LOGIC ---
                // If the user just completed core onboarding (Age & Gender provided)
                if (finalAge && gender) {
                    const currentUser = await tx.users.findUnique({
                        where: { id: userId },
                        select: { referred_by: true, id: true }
                    });

                    if (currentUser && currentUser.referred_by) {
                        // Check if they already got the bonus to prevent double-dipping on subsequent profile saves
                        const existingBonus = await tx.transactions.findFirst({
                            where: {
                                user_id: currentUser.id,
                                type: 'REFERRAL_BONUS'
                            }
                        });

                        if (!existingBonus) {
                            console.log(`🎉 Onboarding complete for User ${currentUser.id}. Minting Deferred Referral Coins...`);

                            try {
                                // 1. Credit Referrer (+50 Coins)
                                await tx.users.update({
                                    where: { id: currentUser.referred_by },
                                    data: { coins: { increment: 50 } }
                                });
                                await tx.transactions.create({
                                    data: {
                                        user_id: currentUser.referred_by,
                                        amount: 50,
                                        type: 'REFERRAL_REWARD',
                                        status: 'SUCCESS',
                                        description: 'Referral Bonus',
                                        metadata: { referredUser: currentUser.id }
                                    }
                                });

                                // 2. Credit New User (+20 Coins)
                                await tx.users.update({
                                    where: { id: currentUser.id },
                                    data: { coins: { increment: 20 } }
                                });
                                await tx.transactions.create({
                                    data: {
                                        user_id: currentUser.id,
                                        amount: 20,
                                        type: 'REFERRAL_BONUS',
                                        status: 'SUCCESS',
                                        description: 'Signup Bonus',
                                        metadata: { referrer: currentUser.referred_by }
                                    }
                                });
                            } catch (bonusErr: any) {
                                console.warn('[profile] Referral bonus logic failed, but continuing save:', bonusErr?.message);
                            }
                        }
                    }
                }
                // --- END REFERRAL LOGIC ---

            });

            // Pre-compute Optimization: store pgvector OUTSIDE the main transaction!
            // This prevents a silent transaction abort if the AI vector dimension size mismatches Postgres.
            if (bioVector && bioVector.length > 0) {
                try {
                    const vectorString = `[${bioVector.join(',')}]`;
                    await prisma.$executeRaw`
                        UPDATE profiles 
                        SET embedding = ${vectorString}::vector 
                        WHERE user_id = ${userId}::uuid
                    `;
                } catch (e) {
                    console.error("Failed to save profile embedding during /me update", e);
                }
            }

            // PostGIS Coordinate Sync — OUTSIDE transaction so it never kills the save
            if (location?.lat && location?.lng) {
                try {
                    const lat = parseFloat(location.lat);
                    const lng = parseFloat(location.lng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        await prisma.$executeRaw`
                            UPDATE users 
                            SET location_coords = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography 
                            WHERE id = ${userId}::uuid
                        `;
                        console.log(`🗺️ PostGIS coords updated: (${lat}, ${lng})`);
                    }
                } catch (e: any) {
                    console.warn('[profile] PostGIS update skipped (non-blocking):', e?.message);
                }
            }

            res.json({ success: true, message: "Profile saved" });

        } catch (e: any) {
            console.error("Tx Error", e?.message || e);
            // If it's a Prisma error, bubble up the message instead of hiding it
            if (e?.code && e?.message) {
                throw Object.assign(new Error(`Database error: ${e.message.substring(0, 100)}...`), { status: 500 });
            }
            throw e;
        }

    } catch (e: any) {
        console.error("Save Profile Error (Outer):", e?.message || e);
        const status = e?.status || 500;
        // Show real reason if it's 400 (Validation) or 500 (DB constraint context added)
        const message = e?.message && (status === 400 || e.message.includes('Database error')) ? e.message : 'Failed to save profile';
        res.status(status).json({ error: message });
    }
});

// 3. POST /prompt (Update Profile with AI)
router.post('/prompt', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { prompt } = req.body;

        // 1. AI Analysis
        const analysis = await aiService.parseUserPrompt(prompt);

        // Pre-compute Optimization: Generate pgvector
        let bioVector: number[] = [];
        try {
            bioVector = await aiService.generateEmbedding(prompt);
        } catch (e) {
            console.error("Failed to generate embedding during /prompt", e);
        }

        // 2. Save to DB using Transaction to handle Prisma Update + Raw Vector Update
        await prisma.$transaction(async (tx) => {
            await tx.profiles.update({
                where: { user_id: userId },
                data: {
                    raw_prompt: prompt,
                    traits: analysis.traits || {},
                    values: (analysis.values as any) || [],
                    updated_at: new Date()
                }
            });

            if (bioVector && bioVector.length > 0) {
                const vectorString = `[${bioVector.join(',')}]`;
                await tx.$executeRaw`
                    UPDATE profiles 
                    SET embedding = ${vectorString}::vector 
                    WHERE user_id = ${userId}::uuid
                `;
            }
        });

        res.json({ success: true, message: "Profile updated via AI" });
    } catch (e) {
        console.error("Prompt Error", e);
        res.status(500).json({ error: "AI Processing Failed" });
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
                const oldPath = removed.url.split('stories/')[1];
                if (oldPath) supabase.storage.from('stories').remove([`stories/${oldPath}`]);
            }
        }

        const filename = `stories/${userId}/${Date.now()}-${path.basename(req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))}`;
        const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';

        logDebug(`Starting upload to Supabase: ${filename}`);

        // 1. Upload to Supabase Storage
        const fileContent = fs.readFileSync(filePath);
        const { data, error } = await supabase.storage
            // Using dedicated 'stories' bucket for user story media (public bucket)
            // Create this in: Supabase Dashboard > Storage > New Bucket > name: stories > Enable Public
            .from('stories')
            .upload(filename, fileContent, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(filename);
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

// 7. CLAIM PROFILE COMPLETION REWARD
router.post('/claim-completion', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const meta: any = user.profiles?.metadata || {};

        if (meta.profile_completed_reward) {
            return res.status(400).json({ error: "Reward already claimed." });
        }

        // Basic validation checking if they actually qualify as 'complete' based on what frontend validates
        if (!user.full_name || !user.gender || !user.age) {
             return res.status(400).json({ error: "Profile is not fully complete to claim reward." });
        }

        // Grant 50 coins & update metadata flag
        meta.profile_completed_reward = true;

        await prisma.$transaction([
            prisma.users.update({
                where: { id: userId },
                data: { coins: (user.coins || 0) + 50 }
            }),
            prisma.profiles.update({
                where: { user_id: userId },
                data: { metadata: meta }
            })
        ]);

        res.json({ success: true, coins: (user.coins || 0) + 50, message: "50 coins claimed successfully!" });
    } catch (e) {
        console.error("Claim Completion Error", e);
        res.status(500).json({ error: "Failed to claim reward" });
    }
});

// 11. GET /referrals (Track invites)
router.get('/referrals', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { referral_code: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Count how many people used this user's ID as the referrer
        const referrals = await prisma.users.findMany({
            where: { referred_by: userId },
            select: { 
                id: true, 
                full_name: true, 
                created_at: true, 
                is_verified: true 
            },
            orderBy: { created_at: 'desc' }
        });

        res.json({
            referralCode: user.referral_code,
            totalReferrals: referrals.length,
            referrals
        });

    } catch (e) {
        console.error("Referral Fetch Error", e);
        res.status(500).json({ error: "Failed to fetch referrals" });
    }
});

export default router;
