import { formatFirstName } from './femaleMatchReminders';
import { resolveUserTimezone, getUserLocalTime } from './timezoneHelper';

export interface CuriosityPushData {
    title: string;
    body: string;
    bannerUrl: string;
    targetUrl: string;
    templateId: string;
}

export interface CuriosityPushOptions {
    userId?: string;
    country?: string | null;
    religion?: string | null;
    recentTemplateIds?: string[];
}

export interface FemaleCuriosityTemplate {
    id: string;
    title: (name: string, city: string) => string;
    body: (name: string, city: string, count?: number) => string;
    bannerUrl: string;
    targetUrl: string;
    category: 'admirer' | 'kundali' | 'shield' | 'first_move' | 'brunch' | 'elite' | 'guru' | 'evening_tea' | 'nearby' | 'spark' | 'lounge' | 'spotlight';
}

interface RotatingTemplate {
    id: string;
    timeSlots: Array<'morning' | 'afternoon' | 'evening' | 'night' | 'any'>;
    audience: 'female' | 'male' | 'all';
    indiaOnly?: boolean;
    kundaliEligibleOnly?: boolean;
    title: (ctx: TemplateContext) => string;
    body: (ctx: TemplateContext) => string;
    bannerUrl: string;
    targetUrl: string;
}

interface TemplateContext {
    firstName: string;
    city: string;
    countryLabel: string;
    oppositeCount: number;
    oppositeLabel: string;
    cityFood: string;
    isIndia: boolean;
}

/**
 * Dedicated curiosity push notification templates exposed for admin campaigns & previews.
 */
export const FEMALE_CURIOSITY_TEMPLATES: FemaleCuriosityTemplate[] = [
    {
        id: 'female_admirer',
        title: (name, city) => `👀 ${name}, a verified gentleman in ${city} viewed your profile...`,
        body: (name, city) => `He spent over 3 minutes reading through your bio and lifestyle values. Take a sneak peek to see if he's your type! ✨`,
        bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'admirer'
    },
    {
        id: 'female_kundali',
        title: (name, city) => `✨ 96% Deep Values Match Detected, ${name}!`,
        body: (name, city) => `Rare alignment! A verified professional in ${city} shares remarkably high compatibility with your life vision. View compatibility report →`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'kundali'
    },
    {
        id: 'female_shield',
        title: (name, city) => `👑 You're in total control, ${name}`,
        body: (name, city) => `Browse 100% verified gentlemen in ${city} with complete peace of mind. Your photos & contact stay strictly protected until you connect 🛡️`,
        bannerUrl: '/images/campaigns/female_queen_shield.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'shield'
    },
    {
        id: 'female_first_move',
        title: (name, city) => `💌 Someone is ready to make the first move, ${name}!`,
        body: (name, city) => `A verified suitor in ${city} loved your profile vibe. Tap to see who matches your energy today 💖`,
        bannerUrl: '/images/campaigns/female_thoughtful_note.png',
        targetUrl: '/dashboard?tab=requests',
        category: 'first_move'
    },
    {
        id: 'female_brunch',
        title: (name, city) => `🥐 Weekend plans, ${name}? Skip the endless small talk`,
        body: (name, city) => `Someone with great taste in food, travel & humor in ${city} wants a real conversation. Say hello!`,
        bannerUrl: '/images/campaigns/female_weekend_brunch.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'brunch'
    },
    {
        id: 'female_elite',
        title: (name, city) => `💼 High-intent verified bachelors matched your criteria, ${name}`,
        body: (name, city, count = 25) => `Over ${count}+ verified doctors, engineers & founders in ${city} are seeking something real. Zero games 💎`,
        bannerUrl: '/images/campaigns/female_verified_elite.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'elite'
    },
    {
        id: 'female_guru',
        title: (name, city) => `💅 ${name}, the AI Love Guru found a 4x boost tip...`,
        body: (name, city) => `You're getting strong attention! One bio touch-up could attract your exact dream partner in ${city}. Tap for your free glow-up ✨`,
        bannerUrl: '/images/campaigns/female_guru_glow.png',
        targetUrl: '/profile',
        category: 'guru'
    },
    {
        id: 'female_evening_tea',
        title: (name, city) => `☕ Evening unwind tastes better with great company, ${name}...`,
        body: (name, city) => `Verified gentlemen in ${city} are active right now looking for authentic, meaningful conversations tonight.`,
        bannerUrl: '/images/campaigns/female_evening_tea.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'evening_tea'
    },
    {
        id: 'female_nearby_drop',
        title: (name, city) => `📍 Fresh nearby profiles just landed in ${city}, ${name}!`,
        body: (name, city) => `Verified professionals near you updated their photos & stories today. Discover who is closest to you →`,
        bannerUrl: '/images/campaigns/female_verified_elite.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'nearby'
    },
    {
        id: 'female_daily_spark',
        title: (name, city) => `⚡ Today's Daily Chemistry Spark is live, ${name}!`,
        body: (name, city) => `Vote on today's question to earn +15 free coins and unlock someone in ${city} who answered just like you.`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'spark'
    }
];

const ROTATING_TEMPLATES: RotatingTemplate[] = [
    // ========================
    // FEMALE POOL (Diverse Daily Rotation Across Morning / Afternoon / Evening / Night)
    // ========================
    {
        id: 'f_morning_spotlight',
        timeSlots: ['morning'],
        audience: 'female',
        title: ({ firstName }) => `🥐 Good morning, ${firstName}! Today's AI Soulmate Spotlight is ready`,
        body: ({ city }) => `Our AI handpicked 3 high-compatibility gentlemen in ${city} matching your life goals. Start your morning with a genuine spark! ✨`,
        bannerUrl: '/images/campaigns/female_weekend_brunch.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_morning_coffee_vibe',
        timeSlots: ['morning'],
        audience: 'female',
        title: ({ firstName, city }) => `☕ Coffee tastes better with real conversation, ${firstName}`,
        body: ({ oppositeCount, city: c }) => `${oppositeCount}+ verified professionals in ${c} share your values and are open to serious connections today.`,
        bannerUrl: '/images/campaigns/female_evening_tea.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_morning_nearby_arrivals',
        timeSlots: ['morning', 'afternoon'],
        audience: 'female',
        title: ({ firstName, city }) => `📍 New verified men near ${city} joined overnight, ${firstName}!`,
        body: ({ countryLabel }) => `Fresh profiles with multiple photos just went live in ${countryLabel}. Be among the first to discover them! 🌟`,
        bannerUrl: '/images/campaigns/female_verified_elite.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_afternoon_admirer',
        timeSlots: ['afternoon'],
        audience: 'female',
        title: ({ firstName, city }) => `👀 Someone in ${city} lingered on your profile, ${firstName}`,
        body: () => `A verified bachelor spent extra time reading your story and lifestyle values. Peek at today's matches to spot the mutual spark! ✨`,
        bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_afternoon_chemistry_spark',
        timeSlots: ['afternoon', 'any'],
        audience: 'female',
        title: ({ firstName }) => `⚡ ${firstName}, today's Chemistry Spark question is unlocked!`,
        body: ({ city }) => `Share your pick in 5 seconds, earn +15 coins, and discover singles in ${city} who think just like you 💖`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_afternoon_icebreaker',
        timeSlots: ['afternoon', 'evening'],
        audience: 'female',
        title: ({ firstName }) => `💬 Skip the boring "Hi" today, ${firstName}`,
        body: ({ city }) => `Your AI icebreakers are ready for thoughtful, verified gentlemen in ${city}. One message can start something unforgettable.`,
        bannerUrl: '/images/campaigns/female_thoughtful_note.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_kundali',
        timeSlots: ['evening'],
        audience: 'female',
        indiaOnly: true,
        kundaliEligibleOnly: true,
        title: ({ firstName }) => `✨ 96% Cosmic Alignment Detected, ${firstName}!`,
        body: ({ city }) => `32/36 Guna compatibility detected with a verified professional in ${city}. View your full AI compatibility breakdown →`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_values_alignment',
        timeSlots: ['evening'],
        audience: 'female',
        title: ({ firstName }) => `✨ 96% Deep Values Match Detected, ${firstName}!`,
        body: ({ city }) => `Rare emotional, career & lifestyle alignment found with a verified gentleman in ${city}. View your compatibility report →`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_chai_unwind',
        timeSlots: ['evening'],
        audience: 'female',
        indiaOnly: true,
        title: ({ firstName }) => `☕ Evening chai tastes warmer with someone who listens, ${firstName}...`,
        body: ({ city }) => `Verified gentlemen in ${city} are active now looking for genuine, zero-drama conversations.`,
        bannerUrl: '/images/campaigns/female_evening_tea.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_hobby_spark',
        timeSlots: ['evening'],
        audience: 'female',
        title: ({ firstName }) => `🎨 Shared passion alert, ${firstName}!`,
        body: ({ city }) => `Someone in ${city} matches your travel, music, and relationship goals. Tap to explore today's curated cards!`,
        bannerUrl: '/images/campaigns/female_weekend_brunch.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_shield_confidence',
        timeSlots: ['evening', 'any'],
        audience: 'female',
        title: ({ firstName }) => `👑 Your privacy stays in your hands, ${firstName}`,
        body: ({ city }) => `Explore verified profiles across ${city} & worldwide safely — your photos & contact stay protected until you say yes 🛡️`,
        bannerUrl: '/images/campaigns/female_queen_shield.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_evening_guru_glow',
        timeSlots: ['evening', 'afternoon'],
        audience: 'female',
        title: ({ firstName }) => `💅 ${firstName}, unlock a 4x match glow-up tonight`,
        body: ({ city }) => `Add a fresh prompt or photo story to attract even stronger compatible suitors in ${city}. Ask the Love Guru →`,
        bannerUrl: '/images/campaigns/female_guru_glow.png',
        targetUrl: '/profile'
    },
    {
        id: 'f_night_starlight',
        timeSlots: ['night'],
        audience: 'female',
        title: ({ firstName }) => `🌙 Quiet evening reflection, ${firstName}?`,
        body: ({ city }) => `Someone in ${city} who genuinely values loyalty, warmth & shared dreams is online right now. Take a calm peek ✨`,
        bannerUrl: '/images/campaigns/female_evening_tea.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'f_night_lounge_pulse',
        timeSlots: ['night'],
        audience: 'female',
        title: ({ firstName }) => `💫 Late evening spark, ${firstName}?`,
        body: ({ countryLabel }) => `Verified singles across ${countryLabel} are sharing stories & live vibes tonight. See who matches your energy →`,
        bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
        targetUrl: '/dashboard?tab=matches'
    },

    // ========================
    // MALE / GENERAL POOL (Diverse Daily Rotation Across Morning / Afternoon / Evening / Night)
    // ========================
    {
        id: 'm_morning_spotlight',
        timeSlots: ['morning'],
        audience: 'male',
        title: ({ firstName }) => `✨ Good morning, ${firstName}! Fresh curated matches are live`,
        body: ({ city }) => `Start today with 3 high-compatibility profiles in ${city} tailored to your values and personality. Tap to meet them!`,
        bannerUrl: '/images/campaigns/ai_spotlight.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_morning_chai',
        timeSlots: ['morning'],
        audience: 'male',
        indiaOnly: true,
        title: ({ firstName }) => `☕ ${firstName}, your morning chai is missing a story...`,
        body: ({ city }) => `Verified profiles in ${city} who love meaningful morning talks just became active. Say hello today!`,
        bannerUrl: '/images/campaigns/tea.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_morning_coffee_global',
        timeSlots: ['morning'],
        audience: 'male',
        title: ({ firstName, countryLabel }) => `☕ Fresh coffee & fresh connections in ${countryLabel}, ${firstName}`,
        body: ({ city }) => `Verified singles near ${city} updated their stories today. Open now while top picks are online!`,
        bannerUrl: '/images/campaigns/tea.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_afternoon_lunch_vibe',
        timeSlots: ['afternoon'],
        audience: 'male',
        title: ({ firstName, cityFood }) => `🍽️ Hey ${firstName}, enjoying ${cityFood} solo again?`,
        body: () => `Your ideal partner might be on lunch break too. See who matches your humor & vibe right now!`,
        bannerUrl: '/images/campaigns/lunch.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_afternoon_nearby_radar',
        timeSlots: ['afternoon', 'any'],
        audience: 'male',
        title: ({ firstName, city }) => `📍 Singles near ${city} are active on Live Radar, ${firstName}!`,
        body: () => `Turn on Nearby Discovery to see verified matches closest to you and spark a real local meetup ✨`,
        bannerUrl: '/images/campaigns/profile_viewer.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_afternoon_chemistry_spark',
        timeSlots: ['afternoon', 'any'],
        audience: 'male',
        title: ({ firstName }) => `⚡ Daily Chemistry Spark unlocked, ${firstName}!`,
        body: ({ city }) => `Vote on today's prompt to earn +15 free coins and match with ${oppositeFallback(city)} singles who share your mindset!`,
        bannerUrl: '/images/campaigns/ai_spotlight.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_evening_profile_viewer',
        timeSlots: ['evening'],
        audience: 'male',
        title: ({ firstName, city }) => `👀 ${firstName}, new eyes checked your vibe in ${city}...`,
        body: () => `Verified members explored profiles matching your lifestyle today. Tap to see your top compatibility picks!`,
        bannerUrl: '/images/campaigns/profile_viewer.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_evening_compatibility_drop',
        timeSlots: ['evening'],
        audience: 'male',
        title: ({ firstName }) => `💫 96% Compatibility Match Detected, ${firstName}!`,
        body: ({ city }) => `Our AI found remarkable alignment between your values & someone new in ${city}. View full compatibility report →`,
        bannerUrl: '/images/campaigns/ai_spotlight.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_evening_story_highlights',
        timeSlots: ['evening'],
        audience: 'male',
        title: ({ firstName }) => `📸 Fresh Story Highlights went live tonight, ${firstName}`,
        body: ({ countryLabel }) => `See authentic real-life moments from verified singles across ${countryLabel}. React to break the ice effortlessly!`,
        bannerUrl: '/images/campaigns/lunch.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_evening_keyboard_wit',
        timeSlots: ['evening'],
        audience: 'male',
        title: ({ firstName }) => `😉 ${firstName}, are you a keyboard?`,
        body: ({ city }) => `Because you're just someone's type. See which verified profiles in ${city} match your personality today!`,
        bannerUrl: '/images/campaigns/keyboard.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_evening_guru_polish',
        timeSlots: ['evening', 'afternoon'],
        audience: 'male',
        title: ({ firstName }) => `🚀 Want 5x more profile views tonight, ${firstName}?`,
        body: () => `Upload a multi-photo moment or get an instant Love Guru tip — profiles with 3+ photos get 5x faster replies!`,
        bannerUrl: '/images/campaigns/guru.png',
        targetUrl: '/profile'
    },
    {
        id: 'm_evening_weekend_plans',
        timeSlots: ['evening'],
        audience: 'male',
        title: ({ firstName }) => `🎉 Ready to trade endless scrolling for a real connection, ${firstName}?`,
        body: ({ oppositeCount, oppositeLabel, city }) => `${oppositeCount}+ ${oppositeLabel} in ${city} are active this week. Send a thoughtful icebreaker tonight!`,
        bannerUrl: '/images/campaigns/secret.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_night_thoughts',
        timeSlots: ['night'],
        audience: 'male',
        title: ({ firstName }) => `💭 Evening thoughts, ${firstName}?`,
        body: ({ city }) => `Skip the guesswork — someone in ${city} who shares your life goals is online right now. Say hello!`,
        bannerUrl: '/images/campaigns/night.png',
        targetUrl: '/dashboard?tab=matches'
    },
    {
        id: 'm_night_global_lounge',
        timeSlots: ['night'],
        audience: 'male',
        title: ({ firstName }) => `🌌 Live Lounge is buzzing tonight, ${firstName}`,
        body: ({ countryLabel }) => `Step into the Live Lounge or check Worldwide & Nearby profiles across ${countryLabel} before calling it a night! ✨`,
        bannerUrl: '/images/campaigns/secret.png',
        targetUrl: '/dashboard?tab=matches'
    }
];

function oppositeFallback(city: string): string {
    return city && city !== 'your city' ? city : 'verified';
}

function getDayOfYear(date: Date, timeZone: string): number {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).formatToParts(date);
        const y = Number(parts.find(p => p.type === 'year')?.value || date.getUTCFullYear());
        const m = Number(parts.find(p => p.type === 'month')?.value || date.getUTCMonth() + 1);
        const d = Number(parts.find(p => p.type === 'day')?.value || date.getUTCDate());
        const utc = Date.UTC(y, m - 1, d);
        const jan1 = Date.UTC(y, 0, 1);
        return Math.floor((utc - jan1) / 86400000) + 1;
    } catch {
        const jan1 = Date.UTC(date.getUTCFullYear(), 0, 1);
        return Math.floor((date.getTime() - jan1) / 86400000) + 1;
    }
}

function hashSeed(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function detectCityFood(city: string): string {
    const lower = city.toLowerCase();
    if (lower.includes('hyderabad')) return 'Hyderabadi Biryani 🍛';
    if (lower.includes('mumbai')) return 'Vada Pav 🍔';
    if (lower.includes('bangalore') || lower.includes('bengaluru')) return 'Masala Dosa 🍽️';
    if (lower.includes('delhi')) return 'Butter Chicken 🍛';
    if (lower.includes('chennai')) return 'Idli Sambhar 🍲';
    if (lower.includes('kolkata')) return 'Kathi Roll 🌯';
    if (lower.includes('pune')) return 'Misal Pav 🍲';
    if (lower.includes('dubai') || lower.includes('sharjah') || lower.includes('doha') || lower.includes('riyadh')) return 'Shawarma 🥙';
    if (lower.includes('new york') || lower.includes('chicago')) return 'Pizza 🍕';
    if (lower.includes('london') || lower.includes('manchester')) return 'lunch 🥪';
    if (lower.includes('singapore') || lower.includes('kuala lumpur')) return 'Chicken Rice 🍛';
    if (lower.includes('tokyo') || lower.includes('osaka')) return 'Ramen 🍜';
    if (lower.includes('seoul')) return 'Bibimbap 🍚';
    if (lower.includes('paris')) return 'a croissant 🥐';
    if (lower.includes('berlin') || lower.includes('munich')) return 'lunch 🥨';
    if (lower.includes('toronto') || lower.includes('sydney') || lower.includes('melbourne')) return 'brunch 🥑';
    return 'lunch';
}

function detectIsIndia(country: string, timeZone: string): boolean {
    const c = country.toLowerCase();
    if (c) {
        if (c.includes('india') || c.includes('nepal') || c.includes('sri lanka') || c.includes('bangladesh') || c.includes('pakistan')) {
            return true;
        }
        return false;
    }
    return (
        timeZone === 'Asia/Kolkata' ||
        timeZone === 'Asia/Calcutta' ||
        timeZone === 'Asia/Colombo' ||
        timeZone === 'Asia/Kathmandu' ||
        timeZone === 'Asia/Dhaka' ||
        timeZone === 'Asia/Karachi'
    );
}

function resolveTimeSlot(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 16) return 'afternoon';
    if (hour >= 16 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Generates an irresistible, culturally-aware, non-repeating daily curiosity push notification.
 * Rotates by Day-of-Year + User seed and automatically excludes recently sent template IDs
 * so users never receive the exact same message day after day.
 */
export function generateCuriosityPush(
    userName?: string | null,
    city?: string | null,
    pendingRequests: number = 0,
    oppositeCount: number = 20,
    oppositeLabel: string = 'verified singles',
    gender?: string | null,
    userOrTimezone?: any,
    baseDate: Date = new Date(),
    options?: CuriosityPushOptions
): CuriosityPushData {
    const firstName = formatFirstName(userName);
    const userCity = (city || '').trim() || 'your city';

    const tz = resolveUserTimezone(userOrTimezone || { city: userCity });
    const local = getUserLocalTime(tz, baseDate);
    const hour = local.hour;
    const timeSlot = resolveTimeSlot(hour);
    const dayOfYear = getDayOfYear(baseDate, tz);

    const isFemale = (gender || '').toLowerCase() === 'female' || (oppositeLabel || '').toLowerCase().includes('men');
    const rawCountry = (options?.country || userOrTimezone?.profiles?.metadata?.location?.country || userOrTimezone?.country || '').toString().trim();
    const isIndia = detectIsIndia(rawCountry, tz);
    const countryLabel = rawCountry || (isIndia ? 'India' : 'your country');
    const rawReligion = (options?.religion || userOrTimezone?.profiles?.metadata?.religion?.religion || '').toString().toLowerCase();
    const isKundaliEligible = Boolean(
        rawReligion.includes('hindu') ||
        rawReligion.includes('jain') ||
        rawReligion.includes('sikh') ||
        (isIndia && (!rawReligion || (!rawReligion.includes('christian') && !rawReligion.includes('muslim') && !rawReligion.includes('islam') && !rawReligion.includes('jew') && !rawReligion.includes('agnostic'))))
    );

    const recentSet = new Set(options?.recentTemplateIds || []);
    const userSeed = hashSeed(`${options?.userId || firstName}:${dayOfYear}`);

    const ctx: TemplateContext = {
        firstName,
        city: userCity,
        countryLabel,
        oppositeCount,
        oppositeLabel,
        cityFood: detectCityFood(userCity),
        isIndia
    };

    // 1. Urgent Pending Requests (Rotating copy so multiple pending days stay fresh)
    if (pendingRequests > 0) {
        const requestVariants: CuriosityPushData[] = isFemale ? [
            {
                templateId: 'female_pending_interest_1',
                title: `💌 ${firstName}, a verified gentleman sent you an interest request!`,
                body: `He read through your bio and introduced himself. Tap to review his profile & compatibility! 💖`,
                bannerUrl: '/images/campaigns/female_thoughtful_note.png',
                targetUrl: '/dashboard?tab=requests'
            },
            {
                templateId: 'female_pending_interest_2',
                title: `✨ ${pendingRequests > 1 ? `${pendingRequests} suitors are` : 'Someone special is'} waiting to connect, ${firstName}!`,
                body: `Review verified requests in your inbox and accept only the people who match your standards 🛡️`,
                bannerUrl: '/images/campaigns/female_queen_shield.png',
                targetUrl: '/dashboard?tab=requests'
            },
            {
                templateId: 'female_pending_interest_3',
                title: `💖 Don't miss a real connection, ${firstName}`,
                body: `You have a waiting match request from a verified member. Peek at his profile & photos now!`,
                bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
                targetUrl: '/dashboard?tab=requests'
            }
        ] : [
            {
                templateId: 'pending_requests_1',
                title: `💌 ${firstName}, someone wants to connect with you!`,
                body: `Someone took the first step toward you. Tap to review their profile before the spark cools! 💖`,
                bannerUrl: '/images/campaigns/match_spark.png',
                targetUrl: '/dashboard?tab=requests'
            },
            {
                templateId: 'pending_requests_2',
                title: `✨ ${pendingRequests > 1 ? `${pendingRequests} waiting requests` : 'New match request'} for you, ${firstName}!`,
                body: `Someone who liked your vibe is waiting in your Requests tab. Tap to say hello! 💬`,
                bannerUrl: '/images/campaigns/ai_spotlight.png',
                targetUrl: '/dashboard?tab=requests'
            },
            {
                templateId: 'pending_requests_3',
                title: `🔥 Good news, ${firstName} — someone just made the first move!`,
                body: `Accept to unlock direct chat, voice & video calling with your new connection today!`,
                bannerUrl: '/images/campaigns/match_spark.png',
                targetUrl: '/dashboard?tab=requests'
            }
        ];

        const unseenReq = requestVariants.filter(v => !recentSet.has(v.templateId));
        const reqPool = unseenReq.length > 0 ? unseenReq : requestVariants;
        return reqPool[userSeed % reqPool.length];
    }

    // 2. Daily Rotating Discovery & Curiosity Pool
    const targetAudience = isFemale ? 'female' : 'male';
    const eligibleByProfile = ROTATING_TEMPLATES.filter(t => {
        if (t.audience !== targetAudience && t.audience !== 'all') return false;
        if (t.indiaOnly && !isIndia) return false;
        if (t.kundaliEligibleOnly && !isKundaliEligible) return false;
        return true;
    });

    // Prefer matching timeSlot first (excluding recently sent), then any unseen timeSlot, then full pool
    const slotMatches = eligibleByProfile.filter(t => t.timeSlots.includes(timeSlot) || t.timeSlots.includes('any'));
    const freshSlotMatches = slotMatches.filter(t => !recentSet.has(t.id));
    const freshAnySlot = eligibleByProfile.filter(t => !recentSet.has(t.id));

    const chosenPool = freshSlotMatches.length > 0
        ? freshSlotMatches
        : (freshAnySlot.length > 0 ? freshAnySlot : (slotMatches.length > 0 ? slotMatches : eligibleByProfile));

    const selected = chosenPool[userSeed % chosenPool.length];

    return {
        templateId: selected.id,
        title: selected.title(ctx),
        body: selected.body(ctx),
        bannerUrl: selected.bannerUrl,
        targetUrl: selected.targetUrl
    };
}
