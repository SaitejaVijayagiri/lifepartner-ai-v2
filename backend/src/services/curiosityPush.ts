import { formatFirstName } from './femaleMatchReminders';

export interface CuriosityPushData {
    title: string;
    body: string;
    bannerUrl: string;
    targetUrl: string;
    templateId: string;
}

/**
 * Generates an irresistible, psychology-backed curiosity push notification
 * based on user context, pending requests, day of week, and time of day.
 */
export function generateCuriosityPush(
    userName?: string | null,
    city?: string | null,
    pendingRequests: number = 0,
    oppositeCount: number = 20,
    oppositeLabel: string = 'verified singles'
): CuriosityPushData {
    const firstName = formatFirstName(userName);
    const userCity = (city || '').trim() || 'your city';
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hour = now.getHours();

    // 1. HIGHEST CURIOSITY: Actual Pending Requests (FOMO + Human Validation)
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
        // Monday: Secret Admirer Hook
        case 1:
            return {
                templateId: 'monday_profile_viewer',
                title: `👀 ${firstName}, someone in ${userCity} viewed your profile...`,
                body: `A verified profile spent time looking through your bio and photos today. Tap to see who's eyeing you!`,
                bannerUrl: '/images/campaigns/profile_viewer.png',
                targetUrl: '/dashboard?tab=matches'
            };

        // Tuesday: 95% Compatibility Drop Hook
        case 2:
            return {
                templateId: 'tuesday_compatibility_drop',
                title: `✨ 96% Compatibility Match Detected, ${firstName}!`,
                body: `Our AI matched your lifestyle & partner criteria with someone new in ${userCity}. View compatibility report →`,
                bannerUrl: '/images/campaigns/ai_spotlight.png',
                targetUrl: '/dashboard?tab=matches'
            };

        // Wednesday: Love Guru Bio Attraction Hook
        case 3:
            return {
                templateId: 'wednesday_bio_guru',
                title: `💅 ${firstName}, your profile bio called...`,
                body: `It wants a polish! Ask the Love Guru to review your bio and attract 8x more verified suitors in ${userCity}.`,
                bannerUrl: '/images/campaigns/guru.png',
                targetUrl: '/profile'
            };

        // Thursday: Evening Chai & Relaxed Vibe
        case 4:
            return {
                templateId: 'thursday_evening_chai',
                title: `☕ ${firstName}, evening chai tastes better with two...`,
                body: `Over ${oppositeCount}+ ${oppositeLabel} in ${userCity} are looking for genuine conversations right now. Say hello!`,
                bannerUrl: '/images/campaigns/tea.png',
                targetUrl: '/dashboard?tab=matches'
            };

        // Friday: Weekend Spark & Date Vibe
        case 5:
            return {
                templateId: 'friday_weekend_spark',
                title: `🎉 Weekend plans, ${firstName}? Skip the solo scrolling`,
                body: `Someone who shares your sense of humor just joined LifePartner AI. Break the ice before Saturday!`,
                bannerUrl: '/images/campaigns/lunch.png',
                targetUrl: '/dashboard?tab=matches'
            };

        // Saturday: Witty Chemistry Hook
        case 6:
            return {
                templateId: 'saturday_chemistry_spark',
                title: `😉 ${firstName}, are you a keyboard?`,
                body: `Because you're just our type. Let's see which verified profiles in ${userCity} match your type today!`,
                bannerUrl: '/images/campaigns/keyboard.png',
                targetUrl: '/dashboard?tab=matches'
            };

        // Sunday: Weekly Reflection & Sunday Special
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
