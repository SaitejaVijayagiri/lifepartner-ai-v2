import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma'; // Centralized Prisma Client
import { createClient } from '@supabase/supabase-js';

let _supabaseClient: any = null;
function getSupabase() {
    if (!_supabaseClient && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        try {
            _supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        } catch (e: any) {
            console.warn('[profile] Supabase client init error:', e?.message || e);
        }
    }
    return _supabaseClient;
}
import { AIService } from '../services/ai';
import { sanitizeContent } from '../utils/contentFilter';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const aiService = new AIService();
import { AstrologyService } from '../services/astrology';
const astrologyService = new AstrologyService();

import { upload } from '../middleware/upload';
import { authenticateToken, authenticateOptional } from '../middleware/auth';
import { trackGrowthEvent } from '../services/growthAnalytics';
import { ImageOptimizer } from '../services/imageOptimizer';
import { sanitizePhotoUrl, extractPhotosList, isPhotoPrivacyShieldEnabled, isNotificationPhotoBlurred, redactStoriesIfBlurred, getBlockedUserIdSet, getConnectedUserIdSet, areUsersConnected, resolveMatchStatus } from '../utils/photoUrl';
import { ModerationService } from '../services/moderation';
import { deleteFromCloudinary } from '../services/cloudinaryStorage';
import { isR2Configured, uploadBase64ToR2, uploadBufferToR2, deleteFromR2 } from '../services/r2Storage';
import { isUserOnline } from '../socket';
import { isStory24hActive, isStoryHighlight, isStoryActive, filterActive24hStories, filterHighlights, filterActiveStories, mergeStoriesHelper } from '../utils/story';
import { getApprovedVerificationUserIds, hasMetadataIdVerification, isUserIdVerified } from '../utils/idVerification';
export { isStory24hActive, isStoryHighlight, isStoryActive, filterActive24hStories, filterHighlights, filterActiveStories, mergeStoriesHelper };

/**
 * Upload a profile image with Cloudflare R2 as exclusive primary storage:
 *   1. Cloudflare R2 (zero egress fees, unlimited storage, global CDN) — primary
 *   2. Supabase Storage — fallback
 *   3. Return base64 as resilient fallback so user NEVER loses their photo
 *
 * If the input is already an https URL (not base64), it is returned as-is.
 */
async function uploadOptimizedImage(base64: string, userId: string, photoIndex = 0): Promise<string | null> {
    if (!base64 || !ImageOptimizer.isBase64(base64)) return base64; // Already a URL

    const uniqueSuffix = `${Date.now()}_${photoIndex}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Cloudflare R2 Storage (Exclusive primary remote storage)
    if (isR2Configured()) {
        try {
            const key = `profiles/${userId}/photo_${uniqueSuffix}.jpg`;
            const r2Url = await uploadBase64ToR2(base64, key, true);
            if (r2Url) return r2Url;
            console.warn('[profile] Cloudflare R2 upload returned null.');
        } catch (r2Err: any) {
            console.warn('[profile] Cloudflare R2 error:', r2Err?.message || r2Err);
        }
    }

    // 2. Supabase Storage fallback
    const sb = getSupabase();
    if (sb) {
        try {
            let mimeType = 'image/jpeg';
            let rawB64 = base64;
            if (base64.startsWith('data:')) {
                const match = base64.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    mimeType = match[1];
                    rawB64 = match[2];
                }
            }
            const buffer = Buffer.from(rawB64, 'base64');
            const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : 'jpg');
            const filename = `profiles/${userId}/photo_${uniqueSuffix}.${ext}`;
            const { error } = await sb.storage.from('profiles').upload(filename, buffer, { contentType: mimeType, upsert: true });
            if (!error) {
                const { data: { publicUrl } } = sb.storage.from('profiles').getPublicUrl(filename);
                if (publicUrl) return publicUrl;
            } else {
                console.warn('[profile] Supabase storage upload failed:', error.message);
            }
        } catch (sbErr: any) {
            console.warn('[profile] Supabase storage exception:', sbErr?.message || sbErr);
        }
    }

    // 3. Return base64 as resilient fallback so user NEVER loses their photo
    return base64;
}

// Debug Logger (non-blocking async writes so request threads never stall)
const LOG_DIR = path.join(process.cwd(), 'logs');
let logDirReady = false;
const logDebug = (msg: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(msg, data || '');
    }
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    void (async () => {
        try {
            if (!logDirReady) {
                await fs.promises.mkdir(LOG_DIR, { recursive: true });
                logDirReady = true;
            }
            await fs.promises.appendFile(path.join(LOG_DIR, 'backend_debug.log'), logLine);
        } catch {
            // Ignore logging errors — never block a request due to log failure
        }
    })();
};

export function calculateProfileCompleteness(user: any, meta: any = {}, photos: any[] = [], isIdVerifiedOverride?: boolean) {
    let score = 0;
    const missingSections: Array<{ key: string; label: string; points: number; actionUrl: string }> = [];

    // 1. Basic Identity (20 points)
    if (user?.full_name && user?.age && user?.gender && (user?.location_name || meta?.location?.city)) {
        score += 20;
    } else {
        missingSections.push({
            key: 'identity',
            label: 'Basic Info (Age, Gender, City)',
            points: 20,
            actionUrl: '/onboarding'
        });
    }

    // 2. Photos (25 points) — Requires real photos beyond default fallback
    const photoCount = Array.isArray(photos) ? photos.length : 0;
    const hasAvatar = user?.avatar_url && !user.avatar_url.includes('dicebear');
    if (photoCount >= 2 || (photoCount >= 1 && hasAvatar)) {
        score += 25;
    } else if (photoCount >= 1 || hasAvatar) {
        score += 15;
        missingSections.push({
            key: 'photos',
            label: 'Upload 2+ Profile Photos (+50 Coins)',
            points: 10,
            actionUrl: '/onboarding'
        });
    } else {
        missingSections.push({
            key: 'photos',
            label: 'Upload Profile Photos (+50 Coins)',
            points: 25,
            actionUrl: '/onboarding'
        });
    }

    // 3. Career & Education (15 points)
    const hasProfession = Boolean(meta?.career?.profession);
    const hasEduOrIncome = Boolean(meta?.career?.education || meta?.career?.income);
    if (hasProfession && hasEduOrIncome) {
        score += 15;
    } else if (hasProfession || hasEduOrIncome) {
        score += 8;
        missingSections.push({
            key: 'career',
            label: 'Add Education & Income Range',
            points: 7,
            actionUrl: '/onboarding'
        });
    } else {
        missingSections.push({
            key: 'career',
            label: 'Career, Education & Income',
            points: 15,
            actionUrl: '/onboarding'
        });
    }

    // 4. Religion & Community (15 points)
    const hasReligion = Boolean(meta?.religion?.religion || meta?.religion?.faith);
    const hasCasteOrLang = Boolean(meta?.motherTongue || meta?.religion?.caste);
    if (hasReligion && hasCasteOrLang) {
        score += 15;
    } else if (hasReligion || hasCasteOrLang) {
        score += 8;
        missingSections.push({
            key: 'religion',
            label: 'Add Caste & Mother Tongue',
            points: 7,
            actionUrl: '/onboarding'
        });
    } else {
        missingSections.push({
            key: 'religion',
            label: 'Religion, Caste & Mother Tongue',
            points: 15,
            actionUrl: '/onboarding'
        });
    }

    // 5. Family & Lifestyle (15 points)
    const hasFamily = Boolean(meta?.family?.type || meta?.family?.values);
    const hasLifestyle = Boolean(meta?.lifestyle?.diet || (meta?.interests && meta?.interests.length > 0));
    if (hasFamily && hasLifestyle) {
        score += 15;
    } else if (hasFamily || hasLifestyle) {
        score += 8;
        missingSections.push({
            key: 'lifestyle',
            label: 'Family Values & Lifestyle Details',
            points: 7,
            actionUrl: '/onboarding'
        });
    } else {
        missingSections.push({
            key: 'lifestyle',
            label: 'Family Values, Diet & Hobbies',
            points: 15,
            actionUrl: '/onboarding'
        });
    }

    // 6. About Me & Expectations (10 points)
    const bioText = meta?.aboutMe || meta?.bio || user?.profiles?.raw_prompt || meta?.expectations || "";
    if (bioText.trim().length >= 15) {
        score += 10;
    } else {
        missingSections.push({
            key: 'bio',
            label: 'About Me & Partner Preferences',
            points: 10,
            actionUrl: '/onboarding'
        });
    }

    // Badge Level Requirements:
    // Gold Verified requires BOTH 90%+ completeness AND true ID verification!
    const isUserVerified = typeof isIdVerifiedOverride === 'boolean' ? isIdVerifiedOverride : hasMetadataIdVerification(meta);
    let badgeLevel = 'Basic';
    if (score >= 90 && isUserVerified) {
        badgeLevel = 'Gold Verified';
    } else if (score >= 70) {
        badgeLevel = 'Silver';
    }

    return {
        completenessScore: score,
        missingSections,
        badgeLevel,
        isComplete: score >= 90
    };
}

/**
 * Safely deep-merges profile metadata updates into existing metadata.
 * - If an update field is undefined, preserves existing field.
 * - Deep merges nested plain objects (career, religion, horoscope, family, lifestyle, partnerPreferences, location).
 * - Arrays and primitives replace old values when provided.
 */
export function deepMergeMeta(existing: any, updates: any): any {
    const result: Record<string, any> = { ...(existing || {}) };
    if (!updates || typeof updates !== 'object') return result;

    for (const [key, val] of Object.entries(updates)) {
        if (val === undefined) continue;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            result[key] = {
                ...(result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) ? result[key] : {}),
                ...val
            };
        } else {
            result[key] = val;
        }
    }
    return result;
}

export function formatFullProfile(user: any, profileRecord: any, isIdVerifiedOverride?: boolean): any {
    if (!user) return null;
    const meta: any = profileRecord?.metadata || {};
    const photosList = (profileRecord?.photos as any[]) || meta.photos || [];
    const isIdVerified = typeof isIdVerifiedOverride === 'boolean' ? isIdVerifiedOverride : hasMetadataIdVerification(meta);

    const completeness = calculateProfileCompleteness(user, meta, photosList, isIdVerified);

    const locationObj = {
        city: meta.location?.city || user.city || user.location_name || "",
        district: meta.location?.district || user.district || "",
        state: meta.location?.state || user.state || "",
        country: meta.location?.country || "India",
        lat: meta.location?.lat,
        lng: meta.location?.lng,
        live_enabled: meta.location?.live_enabled !== false && meta.location?.live_enabled !== 'false'
    };

    const hobbiesList = Array.isArray(meta.interests) && meta.interests.length > 0
        ? meta.interests
        : (typeof meta.lifestyle?.hobbies === 'string'
            ? meta.lifestyle.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(meta.lifestyle?.hobbies) ? meta.lifestyle.hobbies : (profileRecord?.traits as any)?.hobbies || []));

    let resolvedAge = user.age;
    if (!resolvedAge || isNaN(resolvedAge)) {
        if (meta.dob) {
            const birthDate = new Date(meta.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            if (calculatedAge >= 18 && calculatedAge <= 100) {
                resolvedAge = calculatedAge;
            }
        } else if (meta.age && parseInt(meta.age) >= 18) {
            resolvedAge = parseInt(meta.age);
        }
    }

    let resolvedGender = user.gender;
    if (!resolvedGender && meta.gender) {
        resolvedGender = String(meta.gender).trim();
    }
    if (resolvedGender) {
        resolvedGender = String(resolvedGender).trim().toLowerCase() === 'female' ? 'Female' : 'Male';
    }

    const resolvedName = user.full_name || meta.name || user.email?.split('@')[0] || "Member";
    const isFemaleResolved = resolvedGender === 'Female';

    const isOnboardingCompleted = Boolean(
        meta.onboarding_completed === true || 
        (meta.onboarding_completed !== false && (meta.bio || meta.aboutMe || profileRecord?.raw_prompt) && photosList.length > 0 && resolvedAge && resolvedGender && (locationObj.city || user.city))
    );

    return {
        id: user.id,
        userId: user.id,
        name: resolvedName,
        full_name: resolvedName,
        email: user.email,
        age: resolvedAge,
        gender: resolvedGender,
        onboarding_completed: isOnboardingCompleted,
        location: locationObj,
        city: locationObj.city,
        district: locationObj.district,
        state: locationObj.state,
        country: locationObj.country,

        career: {
            profession: meta.career?.profession || "",
            company: meta.career?.company || "",
            education: meta.career?.education || meta.career?.educationLevel || "",
            college: meta.career?.college || "",
            degree: meta.career?.degree || "",
            income: meta.career?.income || ""
        },
        profession: meta.career?.profession || "",
        education: meta.career?.education || meta.career?.educationLevel || "",
        family: meta.family || {},
        lifestyle: {
            ...meta.lifestyle,
            smoking: meta.lifestyle?.smoking || meta.lifestyle?.smoke || "No",
            smoke: meta.lifestyle?.smoke || meta.lifestyle?.smoking || "No",
            drinking: meta.lifestyle?.drinking || meta.lifestyle?.drink || "No",
            drink: meta.lifestyle?.drink || meta.lifestyle?.drinking || "No",
            hobbies: Array.isArray(meta.lifestyle?.hobbies) ? meta.lifestyle.hobbies.join(', ') : (meta.lifestyle?.hobbies || hobbiesList.join(', '))
        },
        religion: meta.religion || {},
        horoscope: (() => {
            const userAstro = astrologyService.resolveUserAstrology({
                id: user.id,
                full_name: user.full_name,
                dob: meta.dob,
                horoscope: meta.horoscope
            });
            return {
                ...meta.horoscope,
                zodiacSign: meta.horoscope?.zodiacSign || userAstro.zodiacSign,
                nakshatra: meta.horoscope?.nakshatra || userAstro.nakshatra,
                rashi: userAstro.rashi,
                rashiLord: userAstro.rashiLord,
                gana: userAstro.gana,
                yoni: userAstro.yoni,
                nadi: userAstro.nadi
            };
        })(),
        partnerPreferences: meta.partnerPreferences || {},
        motherTongue: meta.motherTongue || "",
        maritalStatus: meta.maritalStatus || "",
        dob: meta.dob,
        interests: hobbiesList,

        reels: (meta.reels as string[]) || [],

        expectations: meta.expectations || "",
        prompt: meta.expectations || "",
        aboutMe: meta.aboutMe || meta.bio || profileRecord?.raw_prompt || "",
        bio: meta.bio || meta.aboutMe || profileRecord?.raw_prompt || "",
        height: meta.height || "",
        photos: photosList.map((p: string) => sanitizePhotoUrl(p, user.full_name || user.id)),
        photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
        avatar_url: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
        joinedAt: user.created_at,
        is_premium: isFemaleResolved ? true : (user.is_premium || false),
        is_admin: user.is_admin || false,
        free_direct_messages: isFemaleResolved ? 999999 : (user.free_direct_messages ?? 3),
        coins: isFemaleResolved ? Math.max(user.coins || 0, 100) : (user.coins || 0),
        phone: user.phone || meta.phone || "",
        referral_code: user.referral_code || "",
        profile_id: user.referral_code ? `LP-${user.referral_code.toUpperCase()}` : `LP-${user.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`,
        handle: `@${user.full_name ? user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'member'}${user.referral_code ? '_' + user.referral_code.toLowerCase().slice(-4) : ''}`,
        premium_expiry: user.premium_expiry,
        is_profile_completed_reward_claimed: meta.profile_completed_reward || false,
        muted_users: meta.muted_users || [],
        emergency_contact: meta.emergency_contact || null,
        photo_privacy: meta.photo_privacy || meta.photoPrivacy || 'public',
        managed_by: meta.managed_by || meta.managedBy || 'Self',
        metadata: {
            ...meta,
            emergency_contact: meta.emergency_contact || null,
            photo_privacy: meta.photo_privacy || meta.photoPrivacy || 'public',
            managed_by: meta.managed_by || meta.managedBy || 'Self'
        },

        completenessScore: completeness.completenessScore,
        missingSections: completeness.missingSections,
        badgeLevel: completeness.badgeLevel,
        isComplete: completeness.isComplete,
        isVerified: isIdVerified,
        isIdVerified,
        isEmailVerified: Boolean(user.is_verified),

        stories: (() => {
            const direct: any[] = (profileRecord?.stories as any[]) || [];
            const metaStories: any[] = (meta?.stories as any[]) || [];
            return mergeStoriesHelper(direct, metaStories);
        })()
    };
}

// 2. GET /me (Fetch from DB)
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const isIdVerified = await isUserIdVerified(user.id, user.profiles?.metadata);
        const profile = formatFullProfile(user, user.profiles, isIdVerified);

        // Self-Healing: Asynchronously persist healed fields to database so subsequent queries have them immediately
        const isFemaleResolved = profile.gender === 'Female';
        const needsFemaleVipHeal = isFemaleResolved && (!user.is_premium || (user.free_direct_messages ?? 0) < 999999 || (user.coins ?? 0) === 0);

        if ((!user.age && profile.age) || (!user.gender && profile.gender) || (!user.full_name && profile.name) || needsFemaleVipHeal) {
            prisma.users.update({
                where: { id: user.id },
                data: {
                    age: (!user.age && profile.age) ? profile.age : undefined,
                    gender: (!user.gender && profile.gender) ? profile.gender : undefined,
                    full_name: (!user.full_name && profile.name) ? profile.name : undefined,
                    ...(needsFemaleVipHeal ? {
                        is_premium: true,
                        free_direct_messages: 999999,
                        coins: Math.max(user.coins || 0, 100)
                    } : {})
                }
            }).catch(e => console.warn('[profile /me self-heal users row error]:', e?.message));
        }

        res.json(profile);
    } catch (e) {
        console.error("Get Profile Error", e);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

let featuredCache: { data: any, timestamp: number } | null = null;

export const clearFeaturedCache = () => {
    featuredCache = null;
};

// Get Featured Public Profiles (For Landing Page - Balanced Boys & Girls, Multi-Photo First)
router.get('/public/featured', async (req, res) => {
    try {
        const now = Date.now();
        if (featuredCache && (now - featuredCache.timestamp < 60000)) {
            res.setHeader('Cache-Control', 'public, max-age=60');
            return res.json(featuredCache.data);
        }

        const excludeConditions = [
            { full_name: { contains: 'archana', mode: 'insensitive' as const } },
            { full_name: { contains: 'archna', mode: 'insensitive' as const } },
            { full_name: { equals: 'sb', mode: 'insensitive' as const } },
            { full_name: { contains: 'sidham', mode: 'insensitive' as const } }
        ];

        const basePublicWhere = {
            is_verified: true,
            age: { not: null },
            avatar_url: { not: null },
            is_banned: false,
            OR: [
                { is_deactivated: false },
                { is_deactivated: null },
                { deactivated_until: { lt: new Date() } }
            ],
            NOT: {
                OR: [
                    ...excludeConditions,
                    { avatar_url: { contains: 'dicebear', mode: 'insensitive' as const } }
                ]
            }
        };

        // Fetch balanced real female & male pools in parallel so both girls and boys always appear
        const [femaleCandidates, maleCandidates] = await Promise.all([
            prisma.users.findMany({
                where: {
                    ...basePublicWhere,
                    gender: { equals: 'Female', mode: 'insensitive' as const }
                },
                take: 80,
                include: { profiles: true },
                orderBy: { created_at: 'desc' }
            }),
            prisma.users.findMany({
                where: {
                    ...basePublicWhere,
                    gender: { equals: 'Male', mode: 'insensitive' as const }
                },
                take: 80,
                include: { profiles: true },
                orderBy: { created_at: 'desc' }
            })
        ]);

        const allCandidates = [...(femaleCandidates || []), ...(maleCandidates || [])];
        const approvedFeaturedIds = await getApprovedVerificationUserIds(allCandidates.map(u => u.id));

        const nameAliasMap: Record<string, string> = {
            'gk': 'Giridhar Kumar',
            'g.k.': 'Giridhar Kumar',
        };
        const countryOverrideMap: Record<string, string> = {
            'hamoudi': 'Indonesia',
            'awais': 'United Arab Emirates',
            'sunny': 'United States',
        };

        const isPlaceholderUrl = (url: any): boolean => {
            if (!url || typeof url !== 'string') return true;
            const u = url.trim().toLowerCase();
            return (
                !u ||
                u.includes('dicebear.com') ||
                u.includes('ui-avatars.com') ||
                u.includes('googleusercontent.com') ||
                u.includes('avatar-fallback') ||
                u.includes('default-avatar') ||
                u.includes('/uploads/') ||
                u.startsWith('data:image/svg') ||
                u === '/avatar-fallback.svg'
            );
        };

        const isProfileBlurredOrPrivate = (user: any, meta: any): boolean => {
            const privacyMode = String(
                meta?.photo_privacy ||
                meta?.photoPrivacy ||
                user?.profiles?.photo_privacy ||
                ''
            ).toLowerCase();
            return Boolean(
                isPhotoPrivacyShieldEnabled(meta) ||
                meta?.isBlurred ||
                meta?.blur ||
                meta?.blurPhotos ||
                privacyMode.includes('blur') ||
                privacyMode.includes('private') ||
                privacyMode.includes('hidden')
            );
        };

        const formatCandidate = (user: any) => {
            const meta = (user.profiles?.metadata as any) || {};
            if (isProfileBlurredOrPrivate(user, meta)) {
                return null;
            }

            const rawPhotos = extractPhotosList(user.profiles, meta, user.avatar_url)
                .map((p: string) => sanitizePhotoUrl(p, user.full_name || user.id));
            const uniqueRealPhotos = Array.from(new Set(rawPhotos)).filter((p) => !isPlaceholderUrl(p));

            if (uniqueRealPhotos.length === 0) {
                return null;
            }

            const rawFirstName = (user.full_name?.split(' ')[0] || 'Member').toLowerCase();
            const displayName = nameAliasMap[rawFirstName] || (user.full_name?.split(' ')[0] || 'Member');
            const country = countryOverrideMap[rawFirstName] || meta.location?.country || (user.state && user.state !== 'India' ? user.state : null) || 'India';

            let locationStr = 'India';
            const userCity = user.city?.trim() || meta.location?.city?.trim() || user.location_name?.trim();
            const cleanCountry = country?.trim() || 'India';

            if (userCity && cleanCountry) {
                if (userCity.toLowerCase() === cleanCountry.toLowerCase()) {
                    locationStr = cleanCountry;
                } else {
                    locationStr = `${userCity}, ${cleanCountry}`;
                }
            } else {
                locationStr = userCity || cleanCountry || 'Worldwide';
            }

            return {
                id: user.id,
                name: displayName,
                age: user.age,
                gender: user.gender,
                photoUrl: uniqueRealPhotos[0],
                photos: uniqueRealPhotos,
                location: locationStr,
                profession: meta.career?.profession || 'Professional',
                managed_by: user.profiles?.managed_by || meta.managed_by || 'Self',
                isVerified: approvedFeaturedIds.has(user.id) || hasMetadataIdVerification(meta),
                photo_privacy: meta.photo_privacy || meta.photoPrivacy || 'public',
                isBlurred: false
            };
        };

        const rankByMultiPhoto = (pool: any[]) => {
            const formatted = pool.map(formatCandidate).filter(Boolean) as any[];
            const multiPhoto = formatted.filter(p => p.photos.length >= 2)
                .sort((a, b) => (b.photos.length - a.photos.length) || (Number(b.isVerified) - Number(a.isVerified)));
            const singlePhoto = formatted.filter(p => p.photos.length === 1);
            // Strictly prioritize multi-photo members; only backfill single-photo members if fewer than 6 multi-photo exist
            return [...multiPhoto, ...(multiPhoto.length < 6 ? singlePhoto : [])].slice(0, 14);
        };

        const girls = rankByMultiPhoto(femaleCandidates || []);
        const boys = rankByMultiPhoto(maleCandidates || []);

        // Interleave girls & boys so both appear prominently in topRow and bottomRow
        const interleaved: any[] = [];
        const maxLen = Math.max(girls.length, boys.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < girls.length) interleaved.push(girls[i]);
            if (i < boys.length) interleaved.push(boys[i]);
        }

        const mid = Math.ceil(interleaved.length / 2);
        const topRow = interleaved.slice(0, mid);
        const bottomRow = interleaved.slice(mid);

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

        // Check if id is a standard UUID or a Profile ID / Handle
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let user: any = null;

        const includeConfig = {
            profiles: true,
            _count: {
                select: {
                    matches_matches_user_b_idTousers: { where: { is_liked: true } } // Total Likes
                }
            }
        };

        if (isUUID) {
            user = await prisma.users.findUnique({
                where: { id },
                include: includeConfig
            });
        } else {
            // Support lookup by Matrimony ID (LP-XXXX), @handle, referral_code, or exact full_name
            const cleanHandle = id.replace(/^@/, '').trim();
            const cleanLP = id.replace(/^lp-?/i, '').trim();

            user = await prisma.users.findFirst({
                where: {
                    OR: [
                        { referral_code: { equals: cleanLP, mode: 'insensitive' } },
                        { referral_code: { equals: cleanHandle, mode: 'insensitive' } },
                        { referral_code: { equals: id, mode: 'insensitive' } },
                        { full_name: { equals: cleanHandle, mode: 'insensitive' } }
                    ]
                },
                include: includeConfig
            });
        }

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
        let requesterUser: any = null;

        if (requesterId) {
            const [requester, sentRequest, receivedRequest, matchRecord] = await Promise.all([
                prisma.users.findUnique({
                    where: { id: requesterId },
                    select: {
                        id: true,
                        full_name: true,
                        is_premium: true,
                        profiles: { select: { metadata: true } }
                    }
                }),
                prisma.interactions.findUnique({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: requesterId,
                            to_user_id: user.id,
                            type: 'REQUEST'
                        }
                    },
                    select: { status: true }
                }),
                prisma.interactions.findUnique({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: user.id,
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
                            user_b_id: user.id
                        }
                    },
                    select: { is_liked: true }
                })
            ]);
            requesterUser = requester;
            isRequesterPremium = requester?.is_premium || false;
            matchStatus = resolveMatchStatus(sentRequest?.status, receivedRequest?.status);
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

        const profileId = user.referral_code ? `LP-${user.referral_code.toUpperCase()}` : `LP-${user.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
        const handle = `@${user.full_name ? user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'member'}${user.referral_code ? '_' + user.referral_code.toLowerCase().slice(-4) : ''}`;

        const isBlurred = isPhotoPrivacyShieldEnabled(meta) && matchStatus !== 'accepted' && matchStatus !== 'connected' && user.id !== requesterId;
        const isIdVerified = await isUserIdVerified(user.id, meta);

        const targetAstro = astrologyService.resolveUserAstrology({
            id: user.id,
            full_name: user.full_name,
            dob: meta.dob,
            horoscope: meta.horoscope
        });

        const reqMeta = (requesterUser?.profiles?.metadata as any) || {};
        const kundli = (requesterId && requesterUser && requesterId !== user.id)
            ? astrologyService.calculateCompatibility(
                {
                    id: requesterUser.id,
                    full_name: requesterUser.full_name,
                    dob: reqMeta.dob,
                    horoscope: reqMeta.horoscope
                },
                {
                    id: user.id,
                    full_name: user.full_name,
                    dob: meta.dob,
                    horoscope: meta.horoscope
                }
            )
            : null;

        res.json({
            id: user.id,
            profile_id: profileId,
            handle: handle,
            referral_code: user.referral_code || null,
            name: user.full_name,
            age: user.age,
            gender: user.gender,
            isPremium: user.is_premium,
            isVerified: isIdVerified,
            isIdVerified,
            photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
            avatar_url: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
            location: {
                city: meta?.location?.city || user.city || user.location_name || "",
                district: meta?.location?.district || user.district || "",
                state: meta?.location?.state || user.state || "",
                country: meta?.location?.country || "India",
                lat: meta?.location?.lat,
                lng: meta?.location?.lng,
                live_enabled: meta?.location?.live_enabled !== false && meta?.location?.live_enabled !== 'false'
            },
            city: meta?.location?.city || user.city || user.location_name || "",
            district: meta?.location?.district || user.district || "",
            state: meta?.location?.state || user.state || "",
            country: meta?.location?.country || "India",
            aboutMe: (user.profiles?.raw_prompt && user.profiles.raw_prompt.trim()) || meta.aboutMe || meta.bio || "",
            bio: meta.bio || meta.aboutMe || (user.profiles?.raw_prompt && user.profiles.raw_prompt.trim()) || "",
            expectations: meta.expectations || "",
            height: meta.height || "",
            profession: meta.career?.profession || "",
            education: meta.career?.education || meta.career?.educationLevel || "",
            photos: extractPhotosList(user.profiles, meta, user.avatar_url).map((url: string) => sanitizePhotoUrl(url, user.full_name || user.id)),
            reels: meta.reels || [],
            total_gifts: 0,
            total_likes: user._count.matches_matches_user_b_idTousers || 0,
            // Explicit meta fields — NO blind ...meta spread (prevents location/country duplication)
            career: meta.career || {},
            religion: meta.religion || {},
            horoscope: {
                ...meta.horoscope,
                zodiacSign: meta.horoscope?.zodiacSign || targetAstro.zodiacSign,
                nakshatra: meta.horoscope?.nakshatra || targetAstro.nakshatra,
                rashi: targetAstro.rashi,
                rashiLord: targetAstro.rashiLord,
                gana: targetAstro.gana,
                yoni: targetAstro.yoni,
                nadi: targetAstro.nadi
            },
            kundli: kundli || {
                score: 0,
                total: 36,
                details: []
            },
            family: meta.family || {},
            lifestyle: meta.lifestyle || {},
            partnerPreferences: meta.partnerPreferences || {},
            motherTongue: meta.motherTongue || "",
            maritalStatus: meta.maritalStatus || "",
            dob: meta.dob || null,
            interests: Array.isArray(meta.interests) && meta.interests.length > 0
                ? meta.interests
                : (typeof meta.lifestyle?.hobbies === 'string'
                    ? meta.lifestyle.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (Array.isArray(meta.lifestyle?.hobbies) ? meta.lifestyle.hobbies : [])),
            summary: meta.summary || "",
            stories: (() => {
                const direct: any[] = (user.profiles?.stories as any[]) || [];
                const metaStories: any[] = (meta?.stories as any[]) || [];
                const combined = mergeStoriesHelper(direct, metaStories);
                return redactStoriesIfBlurred(combined, isBlurred);
            })(),
            match_status: matchStatus,
            is_liked: isLiked,
            isOnline: isUserOnline(user.id),
            photo_privacy: meta.photo_privacy || meta.photoPrivacy || 'public',
            isBlurred,
            managed_by: meta.managed_by || meta.managedBy || 'Self',
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

        // Fetch user's existing gender and avatar to enforce read-only protection & preserve avatars
        const existingUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true, avatar_url: true, full_name: true, phone: true, is_premium: true }
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
            interests, // Added interests/hobbies
            emergency_contact,
            photo_privacy,
            photoPrivacy,
            managed_by,
            managedBy,
            timezone,
            metadata: rawMetadata
        } = req.body;

        // IMMUTABLE GENDER LOCK:
        // Once a user has registered their gender, it is permanently locked and CANNOT be altered
        // via profile editing! This guarantees that males cannot flip to female (or vice versa),
        // preventing gender queue pollution, female VIP coin exploits, and cross-gender mismatching.
        const gLower = gender ? String(gender).trim().toLowerCase() : '';
        const normalizedGender = (gLower === 'female' || gLower === 'woman' || gLower === 'women' || gLower === 'f')
            ? 'Female'
            : ((gLower === 'male' || gLower === 'man' || gLower === 'men' || gLower === 'm') ? 'Male' : undefined);

        // Retain existing registered gender permanently; only allow setting if no gender exists yet
        let finalGender = existingUser?.gender || undefined;
        if (!finalGender && normalizedGender) {
            finalGender = normalizedGender;
        }

        let finalPhotos: string[] = [];
        const rawPhotos = photos || [];
        if (Array.isArray(rawPhotos)) {
            // Support up to 10 profile photos cleanly with bounded concurrent moderation & upload
            const photosToProcess = rawPhotos.slice(0, 10);
            const processedSlots: Array<string | null> = new Array(photosToProcess.length).fill(null);

            const processPhotoAt = async (index: number) => {
                const p = photosToProcess[index];
                if (!p || typeof p !== 'string') return;

                // Skip photos that are already stored URLs (not base64) - no processing needed
                if (!ImageOptimizer.isBase64(p)) {
                    processedSlots[index] = p;
                    return;
                }

                const isFirstPhoto = index === 0;
                let modResult: any = { isValid: true, isProhibited: false };
                try {
                    modResult = await ModerationService.validateProfilePhoto(p, isFirstPhoto);
                } catch (modErr: any) {
                    console.warn(`[profile] Photo ${index} moderation warning (soft-passing):`, modErr?.message || modErr);
                }

                if (modResult && modResult.isProhibited) {
                    console.warn(`🚨 [profile] Photo ${index} rejected due to prohibited content: ${modResult.reason}`);
                    if (photosToProcess.length === 1) {
                        throw Object.assign(new Error(modResult.reason || 'This photo contains prohibited or adult content.'), { status: 400 });
                    }
                    return; // Skip prohibited photo but preserve valid photos in multi-upload
                }

                if (isFirstPhoto && modResult && !modResult.isValid) {
                    console.warn(`⚠️ [profile] Primary avatar rejected: ${modResult.reason}`);
                    if (photosToProcess.length === 1) {
                        throw Object.assign(new Error(modResult.reason || 'Primary profile photo must show a clear human face.'), { status: 400 });
                    }
                    return;
                }

                const uploaded = await uploadOptimizedImage(p, userId, index);
                if (uploaded) {
                    processedSlots[index] = uploaded;
                } else {
                    processedSlots[index] = p;
                }
            };

            // Process primary photo first, then remaining base64 uploads in concurrent batches of 3
            if (photosToProcess.length > 0) {
                await processPhotoAt(0);
            }
            for (let start = 1; start < photosToProcess.length; start += 3) {
                const batchIndices = [];
                for (let j = start; j < Math.min(start + 3, photosToProcess.length); j++) {
                    batchIndices.push(j);
                }
                await Promise.all(batchIndices.map(processPhotoAt));
            }

            finalPhotos = processedSlots.filter((p): p is string => typeof p === 'string' && p.length > 0);
        }

        // If user has custom uploaded photos (Cloudinary, Supabase, R2, base64),
        // strip any imported Google placeholder avatar so real photos are prioritized as main photo
        const hasCustomPhotos = finalPhotos.some((p: string) =>
            typeof p === 'string' && (p.includes('cloudinary') || p.includes('supabase') || p.includes('r2.dev') || p.includes('r2.cloudflarestorage.com') || p.includes('/photo/r2/') || p.startsWith('data:image') || p.startsWith('/uploads/'))
        );
        if (hasCustomPhotos) {
            finalPhotos = finalPhotos.filter((p: string) => typeof p === 'string' && !p.includes('googleusercontent.com'));
        }

        // Derive finalPhotoUrl: never allow saving an empty string ""
        let finalPhotoUrl: string;
        if (finalPhotos.length > 0 && typeof finalPhotos[0] === 'string' && finalPhotos[0].trim()) {
            finalPhotoUrl = finalPhotos[0].trim();
        } else if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() && (!hasCustomPhotos || !photoUrl.includes('googleusercontent.com'))) {
            finalPhotoUrl = photoUrl.trim();
        } else if (existingUser?.avatar_url && existingUser.avatar_url.trim() && (!hasCustomPhotos || !existingUser.avatar_url.includes('googleusercontent.com'))) {
            finalPhotoUrl = existingUser.avatar_url.trim();
        } else {
            const seed = (name || existingUser?.full_name || userId || 'Member').trim();
            finalPhotoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
        }

        // Separate: aboutMe → raw_prompt (personal bio), expectations/prompt → metadata.expectations
        const isUserPremium = Boolean(existingUser?.is_premium);
        const cleanBio = sanitizeContent(aboutMe || '', { isPremium: isUserPremium });
        const cleanExpectations = sanitizeContent(expectations || prompt || '', { isPremium: isUserPremium });
        // Legacy: if only prompt is provided but no bio, fallback for compatibility
        const finalBio = cleanBio || (aboutMe === undefined ? cleanExpectations : '');
        const cleanPrompt = finalBio;
        if (career) {
            career.profession = typeof career.profession === 'string' ? career.profession.trim() : (career.profession || '');
            if (career.education && !career.educationLevel) {
                career.educationLevel = career.education;
            }
        }
        if (location) location.city = typeof location.city === 'string' ? location.city.trim() : (location.city || '');

        // Normalize lifestyle habits and synchronize hobbies
        if (lifestyle) {
            lifestyle.smoking = lifestyle.smoking || lifestyle.smoke || 'No';
            lifestyle.smoke = lifestyle.smoke || lifestyle.smoking || 'No';
            lifestyle.drinking = lifestyle.drinking || lifestyle.drink || 'No';
            lifestyle.drink = lifestyle.drink || lifestyle.drinking || 'No';
            if (interests && Array.isArray(interests) && interests.length > 0) {
                lifestyle.hobbies = lifestyle.hobbies || interests.join(', ');
            }
        }

        const emergencyContact = emergency_contact || rawMetadata?.emergency_contact || undefined;

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

        // 1. Data Integrity: Auto-calculate Age from DOB (Server Side Truth, only if valid 18..99)
        let parsedAgeNum = parseInt(age as string, 10);
        let finalAge: number | undefined = (!isNaN(parsedAgeNum) && parsedAgeNum >= 18 && parsedAgeNum <= 99) ? parsedAgeNum : undefined;

        if (dob) {
            const birthDate = new Date(dob);
            if (!isNaN(birthDate.getTime())) {
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                if (calculatedAge >= 18 && calculatedAge <= 99) {
                    finalAge = calculatedAge;
                }
            }
        }

        // 1.5 Auto-Geocode city → lat/lng if not already provided via GPS
        if (location && location.city && !location.lat && !location.lng) {
            try {
                const { LocationService } = require('../services/location');
                const cityQuery = [location.city, location.district, location.state, location.country].filter(Boolean).join(', ');
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
        let existingRawPrompt: string | null = null;
        let existingPhotos: any[] = [];
        try {
            const existingProfile = await prisma.profiles.findUnique({ where: { user_id: userId } });
            existingMeta = (existingProfile?.metadata as any) || {};
            existingRawPrompt = existingProfile?.raw_prompt || null;
            existingPhotos = (existingProfile?.photos as any[]) || [];
        } catch (e) {
            console.warn('[profile] Could not pre-fetch existing profile, proceeding with empty meta', e);
        }

        const finalName = name?.trim() || req.body.full_name?.trim() || undefined;
        const inputCity = location?.city !== undefined ? location.city.trim() : undefined;
        const inputDistrict = location?.district !== undefined ? (location.district.trim() || inputCity) : undefined;
        const inputState = location?.state !== undefined ? location.state.trim() : undefined;

        const resolvedBio = cleanBio || finalBio;
        const resolvedRawPrompt = resolvedBio ? resolvedBio : (existingRawPrompt || undefined);

        const metadataUpdates: any = {
            religion,
            horoscope,
            career,
            family,
            lifestyle,
            partnerPreferences,
            motherTongue: motherTongue || undefined,
            maritalStatus: maritalStatus || undefined,
            photos: finalPhotos.length > 0 ? finalPhotos : undefined,
            dob: dob || undefined,
            location: location ? {
                ...(existingMeta?.location || {}),
                ...location,
                live_enabled: location.live_enabled !== undefined 
                    ? Boolean(location.live_enabled) 
                    : (existingMeta?.location?.live_enabled !== undefined ? existingMeta.location.live_enabled : true)
            } : undefined,
            height: height || undefined,
            phone: phone || existingUser?.phone || undefined,
            bio: resolvedBio || undefined,
            aboutMe: resolvedBio || undefined,
            expectations: cleanExpectations || undefined,
            savedStickers: savedStickers || undefined,
            interests: interests !== undefined 
                ? interests 
                : (lifestyle?.hobbies ? (typeof lifestyle.hobbies === 'string' ? lifestyle.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : lifestyle.hobbies) : undefined),
            emergency_contact: emergencyContact || undefined,
            photo_privacy: photo_privacy || photoPrivacy || rawMetadata?.photo_privacy || undefined,
            managed_by: managed_by || managedBy || rawMetadata?.managed_by || undefined,
            onboarding_completed: true,
            age: finalAge || undefined,
            gender: finalGender || undefined,
            timezone: timezone || rawMetadata?.timezone || (location?.timezone || undefined)
        };

        const newMeta = deepMergeMeta(existingMeta, metadataUpdates);

        try {
            await prisma.$transaction(async (tx) => {
                const isFemaleUser = Boolean(finalGender && String(finalGender).trim().toLowerCase() === 'female');
                // 2. Update Core User Info
                await tx.users.update({
                    where: { id: userId },
                    data: {
                        full_name: finalName,
                        age: finalAge,
                        gender: finalGender,
                        location_name: (() => {
                            const c = inputCity;
                            const s = inputState;
                            const co = location?.country?.trim();
                            if (c && co && c.toLowerCase() === co.toLowerCase()) {
                                return s ? `${s}, ${co}` : co;
                            }
                            return c ? `${c}, ${co || ''}`.trim().replace(/,$/, '') : (s && co ? `${s}, ${co}` : undefined);
                        })(),
                        avatar_url: finalPhotoUrl,
                        email: email?.trim() ? email.trim() : undefined, // FIX: Never allow explicitly saving a blank email
                        phone: phone || undefined,
                        city: inputCity,
                        district: inputDistrict,
                        state: inputState,
                        ...(isFemaleUser 
                            ? { free_direct_messages: 999999, is_premium: true } 
                            : (existingUser?.is_premium && !isFemaleUser
                                ? { is_premium: false, free_direct_messages: 3 }
                                : {})
                        )
                    }
                });

                await tx.profiles.upsert({
                    where: { user_id: userId },
                    create: {
                        user_id: userId,
                        raw_prompt: resolvedRawPrompt || "",
                        metadata: newMeta,
                        photos: finalPhotos.length > 0 ? finalPhotos : existingPhotos
                    },
                    update: {
                        raw_prompt: resolvedRawPrompt,
                        metadata: newMeta,
                        photos: finalPhotos.length > 0 ? finalPhotos : (existingPhotos.length > 0 ? existingPhotos : undefined)
                    }
                });

                // --- PHOTO UPLOAD BONUS (50 COINS) ---
                if (finalPhotos && finalPhotos.length > 0) {
                    try {
                        const existingPhotoBonus = await tx.transactions.findFirst({
                            where: {
                                user_id: userId,
                                type: 'REWARD',
                                description: 'Bonus for uploading profile photo'
                            }
                        });

                        if (!existingPhotoBonus) {
                            console.log(`🎉 Awarding 50 Photo Bonus Coins to User ${userId}`);
                            await tx.users.update({
                                where: { id: userId },
                                data: { coins: { increment: 50 } }
                            });
                            await tx.transactions.create({
                                data: {
                                    user_id: userId,
                                    amount: 50,
                                    type: 'REWARD',
                                    status: 'SUCCESS',
                                    description: 'Bonus for uploading profile photo',
                                    metadata: { reason: 'PHOTO_UPLOAD_BONUS' }
                                }
                            });
                        }
                    } catch (photoBonusErr: any) {
                        console.error("Photo bonus processing error:", photoBonusErr.message);
                    }
                }

                // --- WELCOME ONBOARDING BONUS ---
                // Standard: 25 coins. Female VIP Queen: 100 coins.
                try {
                    const existingWelcomeBonus = await tx.transactions.findFirst({
                        where: {
                            user_id: userId,
                            type: 'REWARD',
                            description: { contains: 'Welcome bonus' }
                        }
                    });

                    if (!existingWelcomeBonus) {
                        const bonusCoins = isFemaleUser ? 100 : 25;
                        const bonusDesc = isFemaleUser ? 'Welcome Queen VIP bonus for completing onboarding' : 'Welcome bonus for completing onboarding';
                        console.log(`🎉 Minting ${bonusCoins} Welcome Coins for User ${userId} (Female VIP: ${isFemaleUser})`);
                        await tx.users.update({
                            where: { id: userId },
                            data: { coins: { increment: bonusCoins } }
                        });
                        await tx.transactions.create({
                            data: {
                                user_id: userId,
                                amount: bonusCoins,
                                type: 'REWARD',
                                status: 'SUCCESS',
                                description: bonusDesc,
                                metadata: { reason: 'WELCOME_ONBOARDING_BONUS', isFemaleVIP: isFemaleUser }
                            }
                        });
                    }
                } catch (welcomeBonusErr: any) {
                    console.error("Welcome bonus processing error:", welcomeBonusErr.message);
                }

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
                            trackGrowthEvent('profile_completed', { userId: currentUser.id, gender: finalGender }).catch(() => {});
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

            // Invalidate match cache so updated profile immediately reflects everywhere
            try { require('./matches').matchCache.clear(); } catch (_) {}

            // Fetch freshly updated user with profile to return full consistent shape to frontend
            const updatedUser = await prisma.users.findUnique({
                where: { id: userId },
                include: { profiles: true }
            });

            const profileData = formatFullProfile(updatedUser, updatedUser?.profiles);

            res.json({
                success: true,
                message: "Profile saved",
                onboarding_completed: true,
                profile: profileData
            });

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

// Toggle or update live location manually
router.post('/live-location', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { enabled, lat, lng, city, state, country } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: "Field 'enabled' (boolean) is required" });
        }

        const profile = await prisma.profiles.findUnique({
            where: { user_id: userId },
            select: { metadata: true }
        });

        const currentMeta: any = profile?.metadata || {};
        const currentLocation: any = currentMeta.location || {};

        const parsedLat = lat !== undefined && lat !== null && !isNaN(Number(lat)) ? Number(lat) : currentLocation.lat;
        const parsedLng = lng !== undefined && lng !== null && !isNaN(Number(lng)) ? Number(lng) : currentLocation.lng;

        const updatedLocation = {
            ...currentLocation,
            live_enabled: enabled,
            ...(parsedLat !== undefined ? { lat: parsedLat } : {}),
            ...(parsedLng !== undefined ? { lng: parsedLng } : {}),
            ...(city ? { city } : {}),
            ...(state ? { state } : {}),
            ...(country ? { country } : {})
        };

        const newMeta = {
            ...currentMeta,
            location: updatedLocation
        };

        await prisma.profiles.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                metadata: newMeta
            },
            update: {
                metadata: newMeta
            }
        });

        // If coordinates provided or available and enabled, update PostGIS in users table
        if (enabled && updatedLocation.lat && updatedLocation.lng) {
            try {
                const numericLat = parseFloat(updatedLocation.lat);
                const numericLng = parseFloat(updatedLocation.lng);
                if (!isNaN(numericLat) && !isNaN(numericLng)) {
                    await prisma.$executeRaw`
                        UPDATE users 
                        SET location_coords = ST_SetSRID(ST_MakePoint(${numericLng}, ${numericLat}), 4326)::geography 
                        WHERE id = ${userId}::uuid
                    `;
                }
            } catch (postgisErr) {
                console.warn('[profile] PostGIS update skipped:', postgisErr);
            }
        }

        try { require('./matches').matchCache.deletePrefix(`${userId}_`); } catch (_) {}

        res.json({
            success: true,
            live_enabled: enabled,
            location: updatedLocation
        });
    } catch (e: any) {
        console.error("Failed to toggle live location:", e);
        res.status(500).json({ error: "Failed to update live location" });
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

        // Filter at SQL level to users who actually have non-empty stories instead of scanning 500k+ rows in JS RAM
        const activeStoryUsersRaw = typeof (prisma as any).$queryRaw === 'function'
            ? await prisma.$queryRaw<Array<{ id: string }>>`
                SELECT u.id
                FROM users u
                INNER JOIN profiles p ON p.user_id = u.id
                WHERE u.id != ${userId}::uuid
                  AND COALESCE(u.is_banned, false) = false
                  AND (COALESCE(u.is_deactivated, false) = false OR (u.deactivated_until IS NOT NULL AND u.deactivated_until < NOW()))
                  AND (
                      ${oppositeGenders.length > 0 ? Prisma.sql`u.gender IN (${Prisma.join(oppositeGenders)})` : Prisma.sql`TRUE`}
                  )
                  AND (
                      (p.stories IS NOT NULL AND jsonb_typeof(p.stories::jsonb) = 'array' AND jsonb_array_length(p.stories::jsonb) > 0)
                      OR (p.metadata IS NOT NULL AND jsonb_typeof(p.metadata->'stories') = 'array' AND jsonb_array_length((p.metadata->'stories')::jsonb) > 0)
                  )
                ORDER BY p.updated_at DESC NULLS LAST
                LIMIT 120
            `.catch(() => null)
            : null;

        const storyUserIds = Array.isArray(activeStoryUsersRaw) ? activeStoryUsersRaw.map(r => r.id) : null;
        if (Array.isArray(storyUserIds) && storyUserIds.length === 0) {
            return res.json({ feed: [] });
        }

        const [blockedIds, connectedIds, usersWithStories] = await Promise.all([
            getBlockedUserIdSet(prisma, userId),
            getConnectedUserIdSet(prisma, userId),
            prisma.users.findMany({
                where: storyUserIds ? { id: { in: storyUserIds } } : whereClause,
                ...(storyUserIds ? {} : { take: 250 }),
                select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
                    profiles: { select: { stories: true, metadata: true } }
                },
            })
        ]);

        const now = new Date();
        const feed: any[] = [];

        for (const user of usersWithStories) {
            if (blockedIds.has(user.id)) continue;
            // Stories can be in profiles.stories column OR profiles.metadata.stories (legacy)
            const directStories: any[] = (user.profiles?.stories as any[]) || [];
            const meta: any = (user.profiles as any)?.metadata || {};
            const metaStories: any[] = meta.stories || [];
            // Merge and deduplicate by id, prefer directStories
            const stories = mergeStoriesHelper(directStories, metaStories, false, now);
            const activeStories = filterActive24hStories(stories, now);

            if (activeStories.length > 0) {
                const isBlurred = isPhotoPrivacyShieldEnabled(meta) && !connectedIds.has(user.id);
                feed.push({
                    id: user.id,
                    name: user.full_name,
                    photoUrl: sanitizePhotoUrl(user.avatar_url, user.full_name || user.id),
                    photo_privacy: meta.photo_privacy || meta.photoPrivacy || 'public',
                    isBlurred,
                    stories: redactStoriesIfBlurred(activeStories, isBlurred)
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
        const validStories = filterActiveStories(currentStories);

        let publicUrl = '';
        let publicId = '';
        let type = files[0].mimetype.startsWith('video') ? 'video' : 'image';

        logDebug(`Starting upload to Cloudflare R2...`);

        let newStory: any = null;
        const createdStories: any[] = [];

        if (files.length > 1) {
            // MULTI-IMAGE / MULTI-FILE STORY BATCH
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileType = file.mimetype.startsWith('video') ? 'video' : 'image';
                const ext = path.extname(file.originalname || file.path) || (fileType === 'video' ? '.mp4' : '.jpg');
                const key = `stories/${userId}/story_${Date.now()}_${i}${ext}`;
                const fileBuf = fs.readFileSync(file.path);
                const r2Result = await uploadBufferToR2(fileBuf, key, file.mimetype, true);
                if (r2Result) {
                    const item: any = {
                        id: `${Date.now()}_${i}`,
                        url: r2Result.url,
                        publicId: r2Result.key,
                        type: fileType,
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        views: []
                    };
                    if (req.body.music) item.music = req.body.music;
                    createdStories.push(item);
                    logDebug(`R2 Story Batch Upload [${i}]: ${r2Result.url}`);
                }
            }

            if (createdStories.length === 0) {
                throw new Error("Failed to upload images to Cloudflare R2");
            }
            newStory = createdStories[0];
        } else {
            // SINGLE FILE UPLOAD
            const file = files[0];
            const ext = path.extname(file.originalname || file.path) || (type === 'video' ? '.mp4' : '.jpg');
            const key = `stories/${userId}/story_${Date.now()}${ext}`;
            const fileBuf = fs.readFileSync(file.path);
            const r2Result = await uploadBufferToR2(fileBuf, key, file.mimetype, true);
            
            if (r2Result) {
                publicUrl = r2Result.url;
                publicId = r2Result.key;
                logDebug(`R2 Story Upload Success: ${publicUrl}`);
            } else {
                throw new Error("Failed to upload story to Cloudflare R2.");
            }

            newStory = {
                id: Date.now().toString(),
                url: publicUrl,
                publicId: publicId,
                type,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                views: []
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
            if (req.body.stickers) {
                try {
                    newStory.stickers = JSON.parse(req.body.stickers);
                } catch(e) {
                    console.error("Failed to parse story stickers", e);
                }
            }
            createdStories.push(newStory);
        }

        const finalStories = [...validStories, ...createdStories];

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

            const connectionUserIds = Array.from(new Set(connections
                .map(c => c.from_user_id === userId ? c.to_user_id : c.from_user_id)
                .filter(Boolean) as string[]));

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
                    }).then((dbNotif) => {
                        // Emit realtime notification with dbNotif.id
                        io.to(connId).emit('notification:new', {
                            id: dbNotif.id,
                            type: 'story',
                            message: msg,
                            timestamp: new Date(),
                            fromUserId: userId,
                            fromUserName: myName,
                            fromUserPhoto: fromUserPhoto,
                            storyId: newStory.id
                        });
                    }).catch(console.error);

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
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const directStories: any[] = (profile.stories as any[]) || [];
        const metadataObj: any = (profile.metadata as any) || {};
        const metaStories: any[] = metadataObj?.stories || [];
        
        // Delete from Storage if publicId or URL exists
        const storyToDelete = [...directStories, ...metaStories].find((s: any) => String(s.id) === String(storyId));
        if (storyToDelete) {
            if (storyToDelete.publicId) {
                if (storyToDelete.publicId.startsWith('stories/') || storyToDelete.publicId.startsWith('profiles/') || storyToDelete.publicId.startsWith('chat/')) {
                    await deleteFromR2(storyToDelete.publicId).catch(e => console.error("R2 delete error", e));
                } else {
                    await deleteFromCloudinary(storyToDelete.publicId).catch(e => console.error("Cloudinary delete error", e));
                }
            } else if (storyToDelete.url) {
                if (storyToDelete.url.includes('r2.dev') || storyToDelete.url.includes('r2.cloudflarestorage.com') || storyToDelete.url.includes('/photo/r2/')) {
                    const match = storyToDelete.url.match(/stories\/[^\/\?]+/);
                    if (match) {
                        await deleteFromR2(match[0]).catch(e => console.error("R2 delete error", e));
                    }
                } else if (storyToDelete.url.includes('supabase.co')) {
                    const oldPath = storyToDelete.url.split('stories/')[1];
                    if (oldPath) {
                        const sb = getSupabase();
                        if (sb) {
                            sb.storage.from('stories').remove([oldPath]).catch((e: any) => console.error("Storage delete error", e));
                        }
                    }
                }
            }
        }

        // Filter out deleted story using loose string comparison
        const updatedDirect = directStories.filter((s: any) => String(s.id) !== String(storyId));
        const updatedMeta = metaStories.filter((s: any) => String(s.id) !== String(storyId));

        if (metadataObj && metadataObj.stories) {
            metadataObj.stories = updatedMeta;
        }

        await prisma.profiles.update({
            where: { user_id: userId },
            data: { 
                stories: updatedDirect,
                metadata: metadataObj
            }
        });

        res.json({ success: true, message: "Story deleted successfully" });

    } catch (e) {
        console.error("Delete Story Error", e);
        res.status(500).json({ error: "Failed to delete story" });
    }
});

// Shared gate for story interactions: checks blocks, target active status, Privacy Shield, and masks actor photo if shielded
async function resolveStoryInteractionAccess(actorId: string, targetUserId: string) {
    const block = await prisma.blocks.findFirst({
        where: {
            OR: [
                { blocker_id: actorId, blocked_id: targetUserId },
                { blocker_id: targetUserId, blocked_id: actorId }
            ]
        }
    });
    if (block) {
        return { allowed: false as const, status: 403, error: 'Cannot interact with blocked user' };
    }

    const [actor, targetUser, connected] = await Promise.all([
        prisma.users.findUnique({ where: { id: actorId }, include: { profiles: true } }),
        prisma.users.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                is_banned: true,
                is_deactivated: true,
                deactivated_until: true,
                profiles: true
            }
        }),
        areUsersConnected(prisma, actorId, targetUserId)
    ]);

    if (!actor) return { allowed: false as const, status: 404, error: 'User not found' };
    const targetDeactivated = targetUser?.is_deactivated && (!targetUser.deactivated_until || new Date(targetUser.deactivated_until) > new Date());
    if (!targetUser || !targetUser.profiles || targetUser.is_banned || targetDeactivated) {
        return { allowed: false as const, status: 404, error: 'Target profile not found' };
    }

    if (isPhotoPrivacyShieldEnabled(targetUser.profiles.metadata) && !connected) {
        return { allowed: false as const, status: 403, error: 'Privacy Shield active: connect to interact with stories' };
    }

    const actorName = actor.full_name || 'Someone';
    const actorShielded = isNotificationPhotoBlurred(actor.profiles?.metadata, connected);
    let rawPhotoUrl = actor.avatar_url || (actor.profiles as any)?.photos?.[0] || null;
    if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
        rawPhotoUrl = null;
    }
    const actorPhoto = actorShielded
        ? null
        : (rawPhotoUrl
            ? sanitizePhotoUrl(rawPhotoUrl, actorName)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&background=random&color=fff&size=256`);

    return {
        allowed: true as const,
        actor,
        targetProfile: targetUser.profiles,
        actorName,
        actorPhoto,
        actorShielded
    };
}

// 6.4 POST /stories/:targetUserId/:storyId/like
router.post('/stories/:targetUserId/:storyId/like', authenticateToken, async (req: any, res) => {
    try {
        const likerId = req.user.userId;
        const { targetUserId, storyId } = req.params;
        const { liked } = req.body;

        if (likerId === targetUserId) return res.json({ success: true, ignored: true });

        const access = await resolveStoryInteractionAccess(likerId, targetUserId);
        if (!access.allowed) return res.status(access.status).json({ error: access.error });
        const { actor: liker, targetProfile, actorName: likerName, actorPhoto: fromUserPhoto, actorShielded } = access;

        const stories = (targetProfile.stories as any[]) || [];
        const storyIndex = stories.findIndex(s => s.id === storyId);
        if (storyIndex === -1) return res.status(404).json({ error: 'Story not found' });

        const story = stories[storyIndex];
        let likes: any[] = story.likes || [];

        if (liked) {
            if (!likes.some((l: any) => l.userId === likerId)) {
                likes.push({ userId: likerId, name: liker.full_name, likedAt: new Date().toISOString() });
            }

            // Trigger real-time notification to the story owner
            try {
                const msg = `${likerName} liked your story! ❤️`;

                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: targetUserId,
                        type: 'story_like',
                        message: msg,
                        data: { fromUserId: likerId, storyId }
                    }
                });

                const { getIO } = require('../socket');
                const io = getIO();
                io.to(targetUserId).emit('notification:new', {
                    id: dbNotif.id,
                    type: 'story_like',
                    message: msg,
                    fromUserName: likerName,
                    fromUserPhoto: fromUserPhoto,
                    isBlurred: actorShielded,
                    fromUserId: likerId,
                    storyId,
                    timestamp: new Date()
                });

                const { NotificationService } = require('../services/notification');
                NotificationService.getInstance().sendToUser(
                    targetUserId,
                    "New Story Like! ❤️",
                    msg,
                    { type: 'story_like', fromUserId: likerId, fromUserPhoto, isBlurred: actorShielded, storyId }
                ).catch((e: any) => console.warn("Push failed for story like alert", e));
            } catch (notifErr) {
                console.error("Failed to notify story owner of like:", notifErr);
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

        const access = await resolveStoryInteractionAccess(viewerId, targetUserId);
        if (!access.allowed) return res.status(access.status).json({ error: access.error });
        const { targetProfile, actorName: viewerName, actorPhoto: fromUserPhoto, actorShielded } = access;

        const stories = (targetProfile.stories as any[]) || [];
        const storyIndex = stories.findIndex(s => s.id === storyId);

        if (storyIndex === -1) {
            return res.status(404).json({ error: "Story not found" });
        }

        const story = stories[storyIndex];
        let views = story.views || [];

        const existingIdx = views.findIndex((v: any) => v.userId === viewerId || v.user_id === viewerId);

        if (existingIdx !== -1) {
            views[existingIdx].viewedAt = new Date().toISOString();
            views[existingIdx].photoUrl = fromUserPhoto;
            views[existingIdx].isBlurred = actorShielded;
        } else {
            views.push({
                userId: viewerId,
                name: viewerName,
                photoUrl: fromUserPhoto,
                isBlurred: actorShielded,
                viewedAt: new Date().toISOString()
            });
        }

        stories[storyIndex].views = views;

        // Update in DB
        await prisma.profiles.update({
            where: { user_id: targetUserId },
            data: { stories }
        });

        // Trigger offline/real-time notification to the story owner
        try {
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

            // Socket real-time alert
            const { getIO } = require('../socket');
            const io = getIO();
            io.to(targetUserId).emit('notification:new', {
                id: dbNotif.id,
                type: 'story',
                message: msg,
                fromUserName: viewerName,
                fromUserPhoto: fromUserPhoto,
                isBlurred: actorShielded,
                fromUserId: viewerId,
                timestamp: new Date()
            });

            // Emit dedicated story:viewed event for live UI viewers update
            io.to(targetUserId).emit('story:viewed', {
                storyId,
                targetUserId,
                viewerId,
                viewerName,
                viewerPhoto: fromUserPhoto,
                isBlurred: actorShielded,
                viewedAt: new Date().toISOString()
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
                        isBlurred: actorShielded,
                        storyId
                    }
                ).catch((e: any) => console.warn("Push failed in story view", e));

            } catch (notifErr) {
                console.error("Failed to notify story view:", notifErr);
            }

        res.json({ success: true });
    } catch (e) {
        console.error("Track Story View Error", e);
        res.status(500).json({ error: "Failed to track view" });
    }
});

// 6.6 POST /stories/:targetUserId/:storyId/react (Story Quick Reactions)
router.post('/stories/:targetUserId/:storyId/react', authenticateToken, async (req: any, res) => {
    try {
        const reactorId = req.user.userId;
        const { targetUserId, storyId } = req.params;
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ error: 'Emoji is required' });
        if (reactorId === targetUserId) return res.json({ success: true, ignored: true });

        const access = await resolveStoryInteractionAccess(reactorId, targetUserId);
        if (!access.allowed) return res.status(access.status).json({ error: access.error });
        const { actor: reactor, targetProfile, actorName: reactorName, actorPhoto: fromUserPhoto, actorShielded } = access;

        const stories = (targetProfile.stories as any[]) || [];
        const storyIndex = stories.findIndex(s => s.id === storyId);
        if (storyIndex === -1) return res.status(404).json({ error: 'Story not found' });

        const story = stories[storyIndex];
        let reactions: any[] = story.reactions || [];

        // Remove existing reaction from this user if present, then push new one
        reactions = reactions.filter((r: any) => r.userId !== reactorId);
        reactions.push({
            userId: reactorId,
            name: reactor.full_name,
            emoji,
            reactedAt: new Date().toISOString()
        });

        stories[storyIndex].reactions = reactions;

        await prisma.profiles.update({
            where: { user_id: targetUserId },
            data: { stories: stories as any }
        });

        // Trigger real-time notification to the story owner
        try {
            const msg = `${reactorName} reacted ${emoji} to your story!`;

            const dbNotif = await prisma.notifications.create({
                data: {
                    user_id: targetUserId,
                    type: 'story_reaction',
                    message: msg,
                    data: { fromUserId: reactorId, storyId, emoji }
                }
            });

            const { getIO } = require('../socket');
            const io = getIO();
            io.to(targetUserId).emit('notification:new', {
                id: dbNotif.id,
                type: 'story_reaction',
                message: msg,
                fromUserName: reactorName,
                fromUserPhoto: fromUserPhoto,
                isBlurred: actorShielded,
                fromUserId: reactorId,
                storyId,
                emoji,
                timestamp: new Date()
            });

            const { NotificationService } = require('../services/notification');
            NotificationService.getInstance().sendToUser(
                targetUserId,
                "Story Reaction! ✨",
                msg,
                { type: 'story_reaction', fromUserId: reactorId, fromUserPhoto, isBlurred: actorShielded, storyId, emoji }
            ).catch((e: any) => console.warn("Push failed for story reaction alert", e));
        } catch (notifErr) {
            console.error("Failed to notify story owner of reaction:", notifErr);
        }

        res.json({ success: true, reactions: reactions.length });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to record story reaction', details: e.message });
    }
});

// 6.7 POST /stories/:storyId/highlight (Toggle Story Highlight status)
router.post('/stories/:storyId/highlight', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { storyId } = req.params;

        const myProfile = await prisma.profiles.findUnique({ where: { user_id: userId } });
        if (!myProfile) return res.status(404).json({ error: 'Profile not found' });

        const directStories = (myProfile.stories as any[]) || [];
        const metadataObj: any = (myProfile.metadata as any) || {};
        const metaStories: any[] = metadataObj?.stories || [];
        
        const allStories = mergeStoriesHelper(directStories, metaStories);
        const storyToToggle = allStories.find(s => String(s.id) === String(storyId));
        
        if (!storyToToggle) {
            return res.status(404).json({ error: 'Story not found' });
        }

        const newStatus = !Boolean(storyToToggle.isHighlight);
        
        const updatedStories = allStories.map((s: any) => 
            String(s.id) === String(storyId) ? { ...s, isHighlight: newStatus } : s
        );

        if (metadataObj) {
            metadataObj.stories = updatedStories;
        }

        await prisma.profiles.update({
            where: { user_id: userId },
            data: { 
                stories: updatedStories,
                metadata: metadataObj
            }
        });

        try { require('./matches').matchCache.clear(); } catch(e) {}

        res.json({ success: true, isHighlight: newStatus });
    } catch (e: any) {
        console.error("Highlight Error:", e);
        res.status(500).json({ error: 'Failed to toggle story highlight', details: e.message });
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

        try { require('./matches').matchCache.clear(); } catch (_) {}

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

        try { require('./matches').matchCache.clear(); } catch (_) {}

        trackGrowthEvent('account_deleted', { userId }).catch(() => {});
        console.log(`✅ Successfully permanently deleted user: ${userId}`);
        res.json({ success: true, message: "Account deleted permanently." });
    } catch (e) {
        console.error("Delete account error", e);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

export default router;
