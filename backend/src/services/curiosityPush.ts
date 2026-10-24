import { formatFirstName } from './femaleMatchReminders';

export interface CuriosityPushData {
    title: string;
    body: string;
    bannerUrl: string;
    targetUrl: string;
    templateId: string;
}

export interface FemaleCuriosityTemplate {
    id: string;
    title: (name: string, city: string) => string;
    body: (name: string, city: string, count?: number) => string;
    bannerUrl: string;
    targetUrl: string;
    category: 'admirer' | 'kundali' | 'shield' | 'first_move' | 'brunch' | 'elite' | 'guru' | 'evening_tea';
}

/**
 * Dedicated curiosity push notification templates tailored specifically for female users.
 * Centers on high intent, respect, verified gentlemen, privacy/safety, and genuine companionship.
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
        title: (name, city) => `✨ 96% Cosmic Match Detected, ${name}!`,
        body: (name, city) => `Rare alignment! A verified professional in ${city} shares a 32/36 Guna compatibility score with your profile. View compatibility report →`,
        bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'kundali'
    },
    {
        id: 'female_shield',
        title: (name, city) => `👑 You're in total control, ${name}`,
        body: (name, city) => `Browse 100% ID-verified gentlemen in ${city} with complete peace of mind. Your photos & contact stay strictly protected until you connect 🛡️`,
        bannerUrl: '/images/campaigns/female_queen_shield.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'shield'
    },
    {
        id: 'female_first_move',
        title: (name, city) => `💌 Someone made the first move for you, ${name}!`,
        body: (name, city) => `A verified suitor in ${city} took time to write a thoughtful opening message based on your bio. Don't leave him waiting 💖`,
        bannerUrl: '/images/campaigns/female_thoughtful_note.png',
        targetUrl: '/dashboard?tab=requests',
        category: 'first_move'
    },
    {
        id: 'female_brunch',
        title: (name, city) => `🥐 Weekend plans, ${name}? Skip the endless small talk`,
        body: (name, city) => `Someone with great taste in food, travel & humor in ${city} wants to start a genuine conversation. Say hello!`,
        bannerUrl: '/images/campaigns/female_weekend_brunch.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'brunch'
    },
    {
        id: 'female_elite',
        title: (name, city) => `💼 High-intent verified bachelors matched your criteria, ${name}`,
        body: (name, city, count = 25) => `Over ${count}+ verified doctors, engineers & entrepreneurs in ${city} are seeking serious marriage. 100% ID verified, zero games 💎`,
        bannerUrl: '/images/campaigns/female_verified_elite.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'elite'
    },
    {
        id: 'female_guru',
        title: (name, city) => `💅 ${name}, the Love Guru analyzed your profile...`,
        body: (name, city) => `You're getting 4x more attention than average! One small bio touch-up could attract your exact dream partner in ${city}. Tap for a free AI glow-up ✨`,
        bannerUrl: '/images/campaigns/female_guru_glow.png',
        targetUrl: '/profile',
        category: 'guru'
    },
    {
        id: 'female_evening_tea',
        title: (name, city) => `☕ Evening chai tastes better with someone who listens, ${name}...`,
        body: (name, city) => `Verified gentlemen in ${city} are online right now looking for authentic, meaningful conversations tonight. Find someone who shares your vibe.`,
        bannerUrl: '/images/campaigns/female_evening_tea.png',
        targetUrl: '/dashboard?tab=matches',
        category: 'evening_tea'
    }
];

/**
 * Generates an irresistible, psychology-backed curiosity push notification
 * based on user context, gender, pending requests, day of week, and time of day.
 */
export function generateCuriosityPush(
    userName?: string | null,
    city?: string | null,
    pendingRequests: number = 0,
    oppositeCount: number = 20,
    oppositeLabel: string = 'verified singles',
    gender?: string | null
): CuriosityPushData {
    const firstName = formatFirstName(userName);
    const userCity = (city || '').trim() || 'your city';
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hour = now.getHours();

    const isFemale = (gender || '').toLowerCase() === 'female' || (oppositeLabel || '').toLowerCase().includes('men');

    // ========================================================
    // 1. FEMALE USER SPECIALIZED CURIOSITY PUSH NOTIFICATIONS
    // ========================================================
    if (isFemale) {
        // High Intent: Actual Pending Requests
        if (pendingRequests > 0) {
            return {
                templateId: 'female_pending_interest',
                title: `💌 ${firstName}, a verified gentleman sent you an interest request!`,
                body: `He took time to read your bio and introduce himself. Tap to review his profile & compatibility before it expires! 💖`,
                bannerUrl: '/images/campaigns/female_thoughtful_note.png',
                targetUrl: '/dashboard?tab=requests'
            };
        }

        // Late Night (9:00 PM - 2:00 AM): Relaxed, Authentic Companionship
        if (hour >= 21 || hour < 2) {
            return {
                templateId: 'female_night_thoughts',
                title: `💭 Late night thoughts, ${firstName}?`,
                body: `Tired of surface-level small talk? A verified gentleman in ${userCity} who shares your family values is online now.`,
                bannerUrl: '/images/campaigns/female_evening_tea.png',
                targetUrl: '/dashboard?tab=matches'
            };
        }

        // Lunch Time (12:00 PM - 3:00 PM): Secret Admirer / Bookmark Hook
        if (hour >= 12 && hour <= 15) {
            return {
                templateId: 'female_afternoon_admirer',
                title: `👀 Someone in ${userCity} just bookmarked your profile, ${firstName}`,
                body: `A verified bachelor spent over 3 minutes reading your lifestyle & values. Take a sneak peek at his profile! ✨`,
                bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
                targetUrl: '/dashboard?tab=matches'
            };
        }

        // Morning (8:00 AM - 11:59 AM): Fresh Curated Matches
        if (hour >= 8 && hour < 12) {
            return {
                templateId: 'female_morning_picks',
                title: `🥐 Good morning, ${firstName}! The AI Matchmaker found 3 new picks`,
                body: `Handpicked verified professionals in ${userCity} matching your exact partner checklist. Start your day with a spark! 💖`,
                bannerUrl: '/images/campaigns/female_weekend_brunch.png',
                targetUrl: '/dashboard?tab=matches'
            };
        }

        // Day-of-the-Week Evening Progression (4:00 PM - 8:59 PM)
        switch (dayOfWeek) {
            case 1: // Monday: Secret Admirer
                return {
                    templateId: 'female_monday_admirer',
                    title: `👀 ${firstName}, a verified gentleman in ${userCity} viewed your profile`,
                    body: `He spent time going through your photos & lifestyle preferences. Tap to see if he's your type! ✨`,
                    bannerUrl: '/images/campaigns/female_gentleman_admirer.png',
                    targetUrl: '/dashboard?tab=matches'
                };
            case 2: // Tuesday: Cosmic & 36 Guna Kundali
                return {
                    templateId: 'female_tuesday_kundali',
                    title: `✨ 96% Cosmic Alignment Match Detected, ${firstName}!`,
                    body: `32/36 Guna compatibility detected with a verified professional in ${userCity}. View your compatibility report →`,
                    bannerUrl: '/images/campaigns/female_cosmic_kundali.png',
                    targetUrl: '/dashboard?tab=matches'
                };
            case 3: // Wednesday: Love Guru Glow-Up
                return {
                    templateId: 'female_wednesday_glow',
                    title: `💅 ${firstName}, the Love Guru analyzed your profile...`,
                    body: `You're getting 4x more attention than average! One small bio touch-up could attract your exact dream partner in ${userCity}.`,
                    bannerUrl: '/images/campaigns/female_guru_glow.png',
                    targetUrl: '/profile'
                };
            case 4: // Thursday: High-Intent Verified Bachelors
                return {
                    templateId: 'female_thursday_elite',
                    title: `💼 High-intent verified bachelors in ${userCity} matched your criteria`,
                    body: `Over ${oppositeCount}+ verified doctors, engineers & entrepreneurs are seeking serious marriage. 100% ID verified, zero games 💎`,
                    bannerUrl: '/images/campaigns/female_verified_elite.png',
                    targetUrl: '/dashboard?tab=matches'
                };
            case 5: // Friday: Weekend Date & Coffee
                return {
                    templateId: 'female_friday_weekend',
                    title: `🥐 Weekend plans, ${firstName}? Skip the solo scrolling`,
                    body: `Someone with great taste in travel & food is hoping to break the ice with you before Saturday. Say hello!`,
                    bannerUrl: '/images/campaigns/female_weekend_brunch.png',
                    targetUrl: '/dashboard?tab=matches'
                };
            case 6: // Saturday: Thoughtful First Move
                return {
                    templateId: 'female_saturday_thoughtful',
                    title: `💌 Someone made the first move for you, ${firstName}...`,
                    body: `A verified gentleman sent a personalized connection note. Check out who took the first step! 💖`,
                    bannerUrl: '/images/campaigns/female_thoughtful_note.png',
                    targetUrl: '/dashboard?tab=requests'
                };
            case 0: // Sunday: Queen Shield & Empowerment
            default:
                return {
                    templateId: 'female_sunday_shield',
                    title: `👑 You are in total control, ${firstName}`,
                    body: `Explore verified matches in ${userCity} with complete safety. Your photos & phone stay strictly protected until you choose 🛡️`,
                    bannerUrl: '/images/campaigns/female_queen_shield.png',
                    targetUrl: '/dashboard?tab=matches'
                };
        }
    }

    // ========================================================
    // 2. STANDARD / MALE USER CURIOSITY PUSH NOTIFICATIONS
    // ========================================================
    // 1. HIGHEST CURIOSITY: Actual Pending Requests
    if (pendingRequests > 0) {
        return {
            templateId: 'pending_requests_curiosity',
            title: `💌 ${firstName}, someone sent you a match request!`,
            body: `Someone took the first step to connect with you. Don't leave them waiting — tap to view their profile before it expires! 💖`,
            bannerUrl: '/images/campaigns/match_spark.png',
            targetUrl: '/dashboard?tab=requests'
        };
    }

    // 2. TIME-OF-DAY ADAPTIVE CURIOSITY HOOKS
    // Late Night (9:00 PM - 2:00 AM)
    if (hour >= 21 || hour < 2) {
        return {
            templateId: 'late_night_thoughts',
            title: `💭 Late night thoughts, ${firstName}?`,
            body: `Skip the overthinking. Someone who shares your values in ${userCity} is online right now.`,
            bannerUrl: '/images/campaigns/night.png',
            targetUrl: '/dashboard?tab=matches'
        };
    }

    // Lunch Time (12:00 PM - 3:00 PM)
    if (hour >= 12 && hour <= 15) {
        let cityFood = 'lunch';
        const lowerCity = userCity.toLowerCase();
        if (lowerCity.includes('hyderabad')) cityFood = 'Hyderabadi Biryani 🍛';
        else if (lowerCity.includes('mumbai')) cityFood = 'Vada Pav 🍔';
        else if (lowerCity.includes('bangalore') || lowerCity.includes('bengaluru')) cityFood = 'Masala Dosa 🍽️';
        else if (lowerCity.includes('delhi')) cityFood = 'Butter Chicken 🍛';
        else if (lowerCity.includes('chennai')) cityFood = 'Idli Sambhar 🍲';

        return {
            templateId: 'lunch_break_curiosity',
            title: `🍽️ Hey ${firstName}, eating ${cityFood} alone again?`,
            body: `Your future partner is probably doing the same. Tap to see who just matched your vibe today!`,
            bannerUrl: '/images/campaigns/lunch.png',
            targetUrl: '/dashboard?tab=matches'
        };
    }

    // Morning Chai (8:00 AM - 11:00 AM)
    if (hour >= 8 && hour < 12) {
        return {
            templateId: 'morning_chai_curiosity',
            title: `☕ ${firstName}, your morning tea is feeling lonely...`,
            body: `A warm cup of chai is best shared with someone special. Discover new verified profiles in ${userCity}!`,
            bannerUrl: '/images/campaigns/tea.png',
            targetUrl: '/dashboard?tab=matches'
        };
    }

    // 3. DAY-OF-THE-WEEK CURIOSITY PROGRESSION (For 4:00 PM - 8:59 PM Evening)
    switch (dayOfWeek) {
        case 1:
            return {
                templateId: 'monday_profile_viewer',
                title: `👀 ${firstName}, someone in ${userCity} viewed your profile...`,
                body: `A verified profile spent time looking through your bio and photos today. Tap to see who's eyeing you!`,
                bannerUrl: '/images/campaigns/profile_viewer.png',
                targetUrl: '/dashboard?tab=matches'
            };
        case 2:
            return {
                templateId: 'tuesday_compatibility_drop',
                title: `✨ 96% Compatibility Match Detected, ${firstName}!`,
                body: `Our AI matched your lifestyle & partner criteria with someone new in ${userCity}. View compatibility report →`,
                bannerUrl: '/images/campaigns/ai_spotlight.png',
                targetUrl: '/dashboard?tab=matches'
            };
        case 3:
            return {
                templateId: 'wednesday_bio_guru',
                title: `💅 ${firstName}, your profile bio called...`,
                body: `It wants a polish! Ask the Love Guru to review your bio and attract 8x more verified suitors in ${userCity}.`,
                bannerUrl: '/images/campaigns/guru.png',
                targetUrl: '/profile'
            };
        case 4:
            return {
                templateId: 'thursday_evening_chai',
                title: `☕ ${firstName}, evening chai tastes better with two...`,
                body: `Over ${oppositeCount}+ ${oppositeLabel} in ${userCity} are looking for genuine conversations right now. Say hello!`,
                bannerUrl: '/images/campaigns/tea.png',
                targetUrl: '/dashboard?tab=matches'
            };
        case 5:
            return {
                templateId: 'friday_weekend_spark',
                title: `🎉 Weekend plans, ${firstName}? Skip the solo scrolling`,
                body: `Someone who shares your sense of humor just joined LifePartner AI. Break the ice before Saturday!`,
                bannerUrl: '/images/campaigns/lunch.png',
                targetUrl: '/dashboard?tab=matches'
            };
        case 6:
            return {
                templateId: 'saturday_chemistry_spark',
                title: `😉 ${firstName}, are you a keyboard?`,
                body: `Because you're just our type. Let's see which verified profiles in ${userCity} match your type today!`,
                bannerUrl: '/images/campaigns/keyboard.png',
                targetUrl: '/dashboard?tab=matches'
            };
        case 0:
        default:
            return {
                templateId: 'sunday_curiosity_digest',
                title: `🤫 Don't look now, ${firstName}...`,
                body: `Someone highly compatible was just browsing profiles in ${userCity}. Tap to see if the spark is mutual.`,
                bannerUrl: '/images/campaigns/secret.png',
                targetUrl: '/dashboard?tab=matches'
            };
    }
}
