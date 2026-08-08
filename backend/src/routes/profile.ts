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
import { uploadToCloudinary, uploadFileToCloudinary, deleteFromCloudinary, isConfigured as cloudinaryConfigured } from '../services/cloudinaryStorage';



/**
 * Upload a profile image with fallback chain:
 *   1. Cloudinary (free 25 GB, no egress fees, global CDN) — primary
 *   2. Return null so caller stores base64 as last resort
 *
 * If the input is already an https URL (not base64), it is returned as-is.
 */
async function uploadOptimizedImage(base64: string, userId: string): Promise<string | null> {
    if (!base64 || !ImageOptimizer.isBase64(base64)) return base64; // Already a URL

    // We store only in Cloudinary
    if (cloudinaryConfigured()) {
        const cloudinaryUrl = await uploadToCloudinary(base64, userId);
        if (cloudinaryUrl) return cloudinaryUrl;
        console.warn('[profile] Cloudinary upload failed.');
    } else {
        console.warn('[profile] Cloudinary not configured.');
    }

    return null; // Fallback to base64 as last resort
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
            full_name: user.full_name,
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
            photos: (user.profiles?.photos as any[]) || meta.photos || [],
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

let featuredCache: { data: any, timestamp: number } | null = null;

// Get Featured Public Profiles (For Landing Page)
router.get('/public/featured', async (req, res) => {
    try {
        const now = Date.now();
        if (featuredCache && (now - featuredCache.timestamp < 60000)) {
            res.setHeader('Cache-Control', 'public, max-age=60');
            return res.json(featuredCache.data);
        }

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

        const activeFilter = {
            is_banned: false,
            OR: [
                { is_deactivated: false },
                { is_deactivated: null },
                { deactivated_until: { lt: new Date() } }
            ]
        };

        // 1. Prioritize these specific users
        const specificUsers = await prisma.users.findMany({
            where: {
                AND: [
                    activeFilter,
                    {
                        OR: orConditions,
                        NOT: { OR: excludeConditions }
                    }
                ]
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
                    is_banned: false,
                    OR: [
                        { is_deactivated: false },
                        { is_deactivated: null },
                        { deactivated_until: { lt: new Date() } }
                    ],
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
                photos: ((user.profiles?.photos as any[]) || meta.photos || [user.avatar_url]).map((p: string) => sanitizePhotoUrl(p, user.full_name || user.id)),
                location: locationStr,
                profession: meta.career?.profession || "Professional",
                isVerified: true
            };
        });

        // Split into two distinct rows
        const mid = Math.ceil(allProfiles.length / 2);
        const topRow = allProfiles.slice(0, mid);
        const bottomRow = allProfiles.slice(mid);

        const responseData = { success: true, topRow, bottomRow };
        featuredCache = { data: responseData, timestamp: now };

        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(responseData);


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

        if (!user || user.is_banned) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.is_deactivated && (!user.deactivated_until || new Date() <= new Date(user.deactivated_until))) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch Requester (if logged in)
        const requesterId = req.user?.userId;
        let isRequesterPremium = false;
        let matchStatus: string | null = null;
        let isLiked = false;

        if (requesterId) {
            const [requester, sentRequest, receivedRequest, matchRecord] = await Promise.all([
                prisma.users.findUnique({ where: { id: requesterId }, select: { is_premium: true } }),
                prisma.interactions.findUnique({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: requesterId,
                            to_user_id: id,
                            type: 'REQUEST'
                        }
                    },
                    select: { status: true }
                }),
                prisma.interactions.findUnique({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: id,
                            to_user_id: requesterId,
                            type: 'REQUEST'
                        }
                    },
                    select: { status: true }
                }),
                prisma.matches.findUnique({
                    where: {
                        user_a_id_user_b_id: {
                            user_a_id: requesterId,
                            user_b_id: id
                        }
                    },
                    select: { is_liked: true }
                })
            ]);
            isRequesterPremium = requester?.is_premium || false;
            matchStatus = sentRequest?.status || receivedRequest?.status || null;
            isLiked = matchRecord?.is_liked || false;
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
            photos: ((user.profiles?.photos as any[]) || meta.photos || [user.avatar_url]).map((url: string) => sanitizePhotoUrl(url, user.full_name || user.id)),
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
            stories: ((user.profiles?.stories as any[]) || []).filter((s: any) => new Date(s.expiresAt) > new Date()),
            match_status: matchStatus,
            is_liked: isLiked,
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

        // Fetch user's existing gender to enforce read-only protection
        const existingUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true }
        });

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

        // Lock Gender: If gender is already set in the database, do not allow changing it.
        let finalGender = gender;
        if (existingUser && existingUser.gender) {
            finalGender = existingUser.gender;
        }

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
                        gender: finalGender,
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
                if (finalAge && finalGender) {
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





// 5a. GET /stories/feed (Get active stories from opposite-gender users only)
router.get('/stories/feed', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const me = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true }
        });

        if (!me) return res.status(404).json({ error: 'User not found' });

        // Determine opposite gender for cross-gender story feed (case-insensitive)
        const myGender = (me.gender || '').toLowerCase();
        let oppositeGenders: string[] = [];
        if (myGender === 'male') oppositeGenders = ['Female', 'female', 'FEMALE'];
        else if (myGender === 'female') oppositeGenders = ['Male', 'male', 'MALE'];
        // If gender is unset/other, show all

        const whereClause: any = {
            id: { not: userId }, // Exclude self
            is_banned: false,
            OR: [
                { is_deactivated: false },
                { is_deactivated: null },
                { deactivated_until: { lt: new Date() } }
            ]
        };
        if (oppositeGenders.length > 0) {
            whereClause.gender = { in: oppositeGenders };
        }

        const usersWithStories = await prisma.users.findMany({
            where: whereClause,
            select: {
                id: true,
                full_name: true,
                avatar_url: true,
                profiles: { select: { stories: true, metadata: true } }
            },
        });

        const now = new Date();
        const feed: any[] = [];

        for (const user of usersWithStories) {
            // Stories can be in profiles.stories column OR profiles.metadata.stories (legacy)
            const directStories: any[] = (user.profiles?.stories as any[]) || [];
            const metaStories: any[] = (user.profiles as any)?.metadata?.stories || [];
            // Merge and deduplicate by id, prefer directStories
            const allIds = new Set(directStories.map((s: any) => s.id));
            const stories = [...directStories, ...metaStories.filter((s: any) => !allIds.has(s.id))];
            const activeStories = stories.filter((s: any) => new Date(s.expiresAt) > now);
            if (activeStories.length > 0) {
                feed.push({
                    id: user.id,
                    name: user.full_name,
                    photoUrl: user.avatar_url,
                    stories: activeStories
                });
            }
        }

        res.json({ feed });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch story feed', details: e.message });
    }
});

// 5b. POST /stories (Upload Story)
router.post('/stories', authenticateToken, (req, res, next) => {
    upload.array('media', 10)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req: any, res) => {
    let filePaths: string[] = [];
    try {
        const userId = req.user.userId;
        logDebug(`[POST /stories] User: ${userId} Requesting Upload`);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No media file" });
        }

        const files = req.files as Express.Multer.File[];
        filePaths = files.map(f => f.path);

        // Premium Restriction for Stories (Bypassed to allow free accounts to post stories)
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        const currentStories = (user?.profiles?.stories as any[]) || [];

        // AUTO-CLEANUP: Filter out expired stories
        const now = new Date();
        const validStories = currentStories.filter((s: any) => new Date(s.expiresAt) > now);

        let publicUrl = '';
        let publicId = '';
        let type = files[0].mimetype.startsWith('video') ? 'video' : 'image';

        logDebug(`Starting upload to Cloudinary...`);

        if (files.length > 1) {
            // MULTI-IMAGE SLIDESHOW
            type = 'video'; // The final output is a video
            const publicIds: string[] = [];
            
            for (const file of files) {
                const uploadResult = await uploadFileToCloudinary(file.path, userId);
                if (uploadResult) {
                    publicIds.push(uploadResult.publicId);
                }
            }

            if (publicIds.length > 0) {
                // Generate the slideshow URL
                const { generateSlideshowUrl } = require('../services/cloudinaryStorage');
                publicUrl = generateSlideshowUrl(publicIds) || '';
                publicId = publicIds[0]; // Track the first one for deletion (though we'd need to delete all ideally)
                logDebug(`Generated Slideshow URL: ${publicUrl}`);
            } else {
                throw new Error("Failed to upload images to Cloudinary");
            }
        } else {
            // SINGLE FILE UPLOAD
            const file = files[0];
            const uploadOptions: any = {};
            if (req.body.startTime !== undefined) uploadOptions.startOffset = parseFloat(req.body.startTime);
            if (req.body.endTime !== undefined) uploadOptions.endOffset = parseFloat(req.body.endTime);
            
            const uploadResult = await uploadFileToCloudinary(file.path, userId, uploadOptions);
            
            if (uploadResult) {
                publicUrl = uploadResult.url;
                publicId = uploadResult.publicId;
                logDebug(`Upload Success: ${publicUrl}`);
            } else {
                throw new Error("Failed to upload story to Cloudinary. Supabase uploads are disabled.");
            }
        }

        const newStory: any = {
            id: Date.now().toString(),
            url: publicUrl,
            publicId: publicId,
            type,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            views: [] // Initialize views array
        };
        
        if (req.body.music) {
            newStory.music = req.body.music;
        }
        if (req.body.texts) {
            try {
                newStory.texts = JSON.parse(req.body.texts);
            } catch(e) {
                console.error("Failed to parse story texts", e);
            }
        }

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

        // Notification & Realtime push for New Story to connections
        try {
            // Find all connected users
            const connections = await prisma.interactions.findMany({
                where: {
                    OR: [
                        { from_user_id: userId },
                        { to_user_id: userId }
                    ],
                    status: 'connected'
                },
                select: {
                    from_user_id: true,
                    to_user_id: true
                }
            });

            const connectionUserIds = connections
                .map(c => c.from_user_id === userId ? c.to_user_id : c.from_user_id)
                .filter(Boolean) as string[];

            if (connectionUserIds.length > 0 && user) {
                const myName = user.full_name || "Someone";
                const msg = `${myName} added a new story! 📸`;
                
                // Get photo
                const meta = (user.profiles?.metadata as any) || {};
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                let rawPhotoUrl = user.avatar_url || meta.photos?.[0] || null;
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                const fromUserPhoto = rawPhotoUrl
                    ? sanitizePhotoUrl(rawPhotoUrl, myName)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=256`;

                const { getIO } = require('../socket');
                const io = getIO();

                const { NotificationService } = await import('../services/notification');
                const pushService = NotificationService.getInstance();

                for (const connId of connectionUserIds) {
                    // Persist notification for connection
                    prisma.notifications.create({
                        data: {
                            user_id: connId,
                            type: 'story',
                            message: msg,
                            data: { fromUserId: userId, storyId: newStory.id }
                        }
                    }).catch(console.error);

                    // Emit realtime notification
                    io.to(connId).emit('notification:new', {
                        type: 'story',
                        message: msg,
                        timestamp: new Date(),
                        fromUserId: userId,
                        fromUserName: myName,
                        fromUserPhoto: fromUserPhoto,
                        storyId: newStory.id
                    });

                    // Send offline push notification to connection's device
                    pushService.sendToUser(
                        connId,
                        "New Connection Story! 📸",
                        msg,
                        { type: 'story', from: userId, screen: 'matches' }
                    ).catch((e: any) => console.warn("Push failed in story notification", e));
                }
            }
        } catch (storyNotifErr) {
            console.error("Failed to trigger story notification:", storyNotifErr);
        }

        res.json({ success: true, story: newStory });

    } catch (e: any) {
        logDebug("Story Upload Error", e);
        res.status(500).json({ error: "Upload failed", details: e.message });
    } finally {
        for (const filePath of filePaths) {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupErr) {
                    console.error("Cleanup error", cleanupErr);
                }
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
        
        const storyToDelete = currentStories.find((s: any) => s.id === storyId);
        if (!storyToDelete) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Delete from Storage to save space
        if (storyToDelete.publicId) {
            await deleteFromCloudinary(storyToDelete.publicId);
        } else if (storyToDelete.url && storyToDelete.url.includes('supabase.co')) {
            const oldPath = storyToDelete.url.split('stories/')[1];
            if (oldPath) {
                supabase.storage.from('stories').remove([oldPath]).catch(e => console.error("Storage delete error", e));
            }
        }

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

// 6.4 POST /stories/:targetUserId/:storyId/like
router.post('/stories/:targetUserId/:storyId/like', authenticateToken, async (req: any, res) => {
    try {
        const likerId = req.user.userId;
        const { targetUserId, storyId } = req.params;
        const { liked } = req.body;

        if (likerId === targetUserId) return res.json({ success: true, ignored: true });

        const liker = await prisma.users.findUnique({ where: { id: likerId } });
        if (!liker) return res.status(404).json({ error: 'Liker not found' });

        const targetProfile = await prisma.profiles.findUnique({ where: { user_id: targetUserId } });
        if (!targetProfile) return res.status(404).json({ error: 'Target profile not found' });

        const stories = (targetProfile.stories as any[]) || [];
        const storyIndex = stories.findIndex(s => s.id === storyId);
        if (storyIndex === -1) return res.status(404).json({ error: 'Story not found' });

        const story = stories[storyIndex];
        let likes: any[] = story.likes || [];

        if (liked) {
            if (!likes.some((l: any) => l.userId === likerId)) {
                likes.push({ userId: likerId, name: liker.full_name, likedAt: new Date().toISOString() });
            }
        } else {
            likes = likes.filter((l: any) => l.userId !== likerId);
        }

        stories[storyIndex].likes = likes;

        await prisma.profiles.update({
            where: { user_id: targetUserId },
            data: { stories: stories as any }
        });

        res.json({ success: true, likes: likes.length });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to track like', details: e.message });
    }
});

// 6.5 POST /stories/:targetUserId/:storyId/view
router.post('/stories/:targetUserId/:storyId/view', authenticateToken, async (req: any, res) => {
    try {
        const viewerId = req.user.userId;
        const { targetUserId, storyId } = req.params;

        // Skip tracking if the user is viewing their own story
        if (viewerId === targetUserId) {
            return res.json({ success: true, ignored: true });
        }

        // Fetch viewer details to store in the view array
        const viewer = await prisma.users.findUnique({
            where: { id: viewerId },
            include: { profiles: true }
        });
        if (!viewer) return res.status(404).json({ error: "Viewer not found" });

        const targetProfile = await prisma.profiles.findUnique({ where: { user_id: targetUserId } });
        if (!targetProfile) return res.status(404).json({ error: "Target profile not found" });

        const stories = (targetProfile.stories as any[]) || [];
        const storyIndex = stories.findIndex(s => s.id === storyId);

        if (storyIndex === -1) {
            return res.status(404).json({ error: "Story not found" });
        }

        const story = stories[storyIndex];
        const views = story.views || [];

        // Check if already viewed
        if (!views.some((v: any) => v.userId === viewerId)) {
            views.push({
                userId: viewerId,
                name: viewer.full_name,
                photoUrl: sanitizePhotoUrl(viewer.avatar_url, viewer.full_name || viewer.id),
                viewedAt: new Date().toISOString()
            });

            stories[storyIndex].views = views;

            // Update in DB
            await prisma.profiles.update({
                where: { user_id: targetUserId },
                data: { stories }
            });

            // Trigger offline/real-time notification to the story owner
            try {
                const viewerName = viewer.full_name || "Someone";
                const msg = `${viewerName} viewed your Story! 🎥`;

                // Persist notification
                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: targetUserId,
                        type: 'story',
                        message: msg,
                        data: { fromUserId: viewerId, storyId }
                    }
                });

                // Get photo
                let rawPhotoUrl = viewer.avatar_url || (viewer.profiles?.photos as any)?.[0] || null;
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                const fromUserPhoto = rawPhotoUrl
                    ? sanitizePhotoUrl(rawPhotoUrl, viewerName)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewerName)}&background=random&color=fff&size=256`;

                // Socket real-time alert
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(targetUserId).emit('notification:new', {
                    id: dbNotif.id,
                    type: 'story',
                    message: msg,
                    fromUserName: viewerName,
                    fromUserPhoto: fromUserPhoto,
                    fromUserId: viewerId,
                    timestamp: new Date()
                });

                // Push alert for offline delivery
                const { NotificationService } = require('../services/notification');
                await NotificationService.getInstance().sendToUser(
                    targetUserId,
                    `${viewerName}`,
                    `viewed your Story! 🎥`,
                    {
                        type: 'story',
                        fromUserId: viewerId,
                        fromUserName: viewerName,
                        fromUserPhoto: fromUserPhoto,
                        storyId
                    }
                ).catch((e: any) => console.warn("Push failed in story view", e));

            } catch (notifErr) {
                console.error("Failed to notify story view:", notifErr);
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Track Story View Error", e);
        res.status(500).json({ error: "Failed to track view" });
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

// Deactivate account temporarily (for 15 days by default)
router.post('/deactivate', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const days = parseInt(req.body.days) || 15;

        const deactivatedUntil = new Date();
        deactivatedUntil.setDate(deactivatedUntil.getDate() + days);

        await prisma.users.update({
            where: { id: userId },
            data: {
                is_deactivated: true,
                deactivated_until: deactivatedUntil
            }
        });

        console.log(`🔒 Temporarily deactivated account for user ${userId} for ${days} days.`);
        res.json({ success: true, message: `Account deactivated successfully for ${days} days.` });
    } catch (e) {
        console.error("Deactivate account error", e);
        res.status(500).json({ error: "Failed to deactivate account" });
    }
});

// Delete account permanently
router.delete('/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        console.log(`🗑️ Initiating permanent deletion for user: ${userId}`);

        // 1. Delete blocks
        await prisma.blocks.deleteMany({
            where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] }
        });

        // 2. Delete call_logs
        await prisma.call_logs.deleteMany({
            where: { OR: [{ caller_id: userId }, { receiver_id: userId }] }
        });

        // 3. Delete games
        await prisma.games.deleteMany({
            where: { OR: [{ player_a_id: userId }, { player_b_id: userId }, { winner_id: userId }] }
        });

        // 4. Delete interactions
        await prisma.interactions.deleteMany({
            where: { OR: [{ from_user_id: userId }, { to_user_id: userId }] }
        });

        // 5. Find matches involving the user
        const userMatches = await prisma.matches.findMany({
            where: { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
            select: { id: true }
        });
        const matchIds = userMatches.map(m => m.id);

        // 6. Delete messages
        await prisma.messages.deleteMany({
            where: { 
                OR: [
                    { match_id: { in: matchIds } },
                    { sender_id: userId },
                    { receiver_id: userId }
                ]
            }
        });

        // 7. Delete matches
        if (matchIds.length > 0) {
            await prisma.matches.deleteMany({
                where: { id: { in: matchIds } }
            });
        }

        // 8. Delete reports
        await prisma.reports.deleteMany({
            where: { OR: [{ reporter_id: userId }, { reported_id: userId }] }
        });

        // 9. Delete transactions
        await prisma.transactions.deleteMany({
            where: { user_id: userId }
        });

        // 10. Finally, delete the user row itself
        await prisma.users.delete({
            where: { id: userId }
        });

        console.log(`✅ Successfully permanently deleted user: ${userId}`);
        res.json({ success: true, message: "Account deleted permanently." });
    } catch (e) {
        console.error("Delete account error", e);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

export default router;
