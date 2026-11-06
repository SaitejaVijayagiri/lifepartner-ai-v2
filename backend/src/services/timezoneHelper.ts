/**
 * Timezone & Local Time Service for LifePartner AI
 *
 * Ensures all time-dependent push notifications, greetings (morning tea, lunch, evening chai, night thoughts),
 * and cron campaigns are dispatched strictly according to each user's local timezone and time-of-day.
 * Protects users worldwide against middle-of-the-night disturbance (quiet hours).
 */

export interface UserLocalTime {
    hour: number;        // 0 - 23
    minute: number;      // 0 - 59
    dayOfWeek: number;   // 0 = Sun, 1 = Mon, ..., 6 = Sat
    timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'late_night';
    isQuietHours: boolean; // 11:00 PM - 7:59 AM (Sleep protection)
    isOptimalCampaignHour: boolean; // 9 AM, 1 PM, 6 PM, 9 PM
    timezone: string;
}

// Fallback default timezone for India
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Validates whether a timezone identifier is supported by Intl
export function isValidTimezone(tz?: string | null): boolean {
    if (!tz || typeof tz !== 'string') return false;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/**
 * Resolves the user's accurate IANA timezone using:
 * 1. Explicit timezone stored in user profile metadata (e.g. 'Asia/Kolkata', 'America/New_York')
 * 2. Country & city heuristics based on profile location
 * 3. Fallback to 'Asia/Kolkata' (IST)
 */
export function resolveUserTimezone(userOrLocation?: any): string {
    if (!userOrLocation) return DEFAULT_TIMEZONE;

    // If a raw timezone string was passed directly
    if (typeof userOrLocation === 'string') {
        const trimmed = userOrLocation.trim();
        if (isValidTimezone(trimmed)) return trimmed;
    }

    const metadata = userOrLocation?.profiles?.metadata || userOrLocation?.metadata || {};
    const metaLocation = metadata.location || {};

    // 1. Check explicit timezone in metadata
    const explicitTz = metadata.timezone || metaLocation.timezone || userOrLocation.timezone;
    if (isValidTimezone(explicitTz)) {
        return explicitTz;
    }

    // 2. Extract country, city, and state
    const countryRaw = (metaLocation.country || userOrLocation.country || '').toString().trim().toLowerCase();
    const cityRaw = (metaLocation.city || userOrLocation.city || userOrLocation.location_name || '').toString().trim().toLowerCase();
    const stateRaw = (metaLocation.state || userOrLocation.state || '').toString().trim().toLowerCase();
    const fullLoc = `${cityRaw} ${stateRaw} ${countryRaw}`.toLowerCase();

    // United States / Canada
    if (countryRaw.includes('united states') || countryRaw === 'usa' || countryRaw === 'us' || fullLoc.includes('usa') || fullLoc.includes('united states')) {
        // Pacific (UTC-8 / UTC-7)
        if (fullLoc.includes('los angeles') || fullLoc.includes('san francisco') || fullLoc.includes('california') || fullLoc.includes('seattle') || fullLoc.includes('san diego') || fullLoc.includes('san jose') || fullLoc.includes('portland') || fullLoc.includes('las vegas') || fullLoc.includes('nevada') || fullLoc.includes('washington state')) {
            return 'America/Los_Angeles';
        }
        // Mountain (UTC-7 / UTC-6)
        if (fullLoc.includes('denver') || fullLoc.includes('colorado') || fullLoc.includes('phoenix') || fullLoc.includes('arizona') || fullLoc.includes('salt lake') || fullLoc.includes('utah')) {
            return 'America/Denver';
        }
        // Central (UTC-6 / UTC-5)
        if (fullLoc.includes('chicago') || fullLoc.includes('illinois') || fullLoc.includes('texas') || fullLoc.includes('dallas') || fullLoc.includes('houston') || fullLoc.includes('austin') || fullLoc.includes('minneapolis') || fullLoc.includes('st. louis')) {
            return 'America/Chicago';
        }
        // Default Eastern (UTC-5 / UTC-4) (New York, Florida, Boston, Atlanta, DC, NJ, etc.)
        return 'America/New_York';
    }

    if (countryRaw.includes('canada') || fullLoc.includes('canada')) {
        if (fullLoc.includes('vancouver') || fullLoc.includes('british columbia')) return 'America/Vancouver';
        if (fullLoc.includes('calgary') || fullLoc.includes('edmonton') || fullLoc.includes('alberta')) return 'America/Edmonton';
        return 'America/Toronto';
    }

    // United Kingdom & Ireland
    if (countryRaw.includes('united kingdom') || countryRaw === 'uk' || countryRaw === 'gb' || fullLoc.includes('london') || fullLoc.includes('manchester') || fullLoc.includes('birmingham') || fullLoc.includes('england') || fullLoc.includes('scotland')) {
        return 'Europe/London';
    }
    if (countryRaw.includes('ireland') || fullLoc.includes('dublin')) {
        return 'Europe/Dublin';
    }

    // Middle East / Gulf (GCC)
    if (countryRaw.includes('emirates') || countryRaw.includes('uae') || fullLoc.includes('dubai') || fullLoc.includes('abu dhabi') || fullLoc.includes('sharjah')) {
        return 'Asia/Dubai'; // UTC+4
    }
    if (countryRaw.includes('saudi') || fullLoc.includes('riyadh') || fullLoc.includes('jeddah')) {
        return 'Asia/Riyadh'; // UTC+3
    }
    if (countryRaw.includes('qatar') || fullLoc.includes('doha')) {
        return 'Asia/Qatar'; // UTC+3
    }
    if (countryRaw.includes('kuwait')) return 'Asia/Kuwait';
    if (countryRaw.includes('bahrain') || fullLoc.includes('manama')) return 'Asia/Bahrain';
    if (countryRaw.includes('oman') || fullLoc.includes('muscat')) return 'Asia/Muscat';

    // South East Asia
    if (countryRaw.includes('singapore') || fullLoc.includes('singapore')) {
        return 'Asia/Singapore'; // UTC+8
    }
    if (countryRaw.includes('malaysia') || fullLoc.includes('kuala lumpur') || fullLoc.includes('penang')) {
        return 'Asia/Kuala_Lumpur'; // UTC+8
    }
    if (countryRaw.includes('philippines') || fullLoc.includes('manila') || fullLoc.includes('cebu')) {
        return 'Asia/Manila'; // UTC+8
    }
    if (countryRaw.includes('indonesia') || fullLoc.includes('jakarta') || fullLoc.includes('bali')) {
        return 'Asia/Jakarta'; // UTC+7
    }
    if (countryRaw.includes('thailand') || fullLoc.includes('bangkok')) {
        return 'Asia/Bangkok'; // UTC+7
    }
    if (countryRaw.includes('vietnam') || fullLoc.includes('ho chi minh') || fullLoc.includes('hanoi')) {
        return 'Asia/Ho_Chi_Minh'; // UTC+7
    }

    // Australia & New Zealand
    if (countryRaw.includes('australia') || fullLoc.includes('sydney') || fullLoc.includes('melbourne') || fullLoc.includes('brisbane')) {
        if (fullLoc.includes('perth') || fullLoc.includes('western australia')) return 'Australia/Perth';
        if (fullLoc.includes('adelaide')) return 'Australia/Adelaide';
        return 'Australia/Sydney'; // UTC+10 / +11
    }
    if (countryRaw.includes('new zealand') || fullLoc.includes('auckland') || fullLoc.includes('wellington')) {
        return 'Pacific/Auckland';
    }

    // Europe
    if (countryRaw.includes('germany') || fullLoc.includes('berlin') || fullLoc.includes('munich') || fullLoc.includes('frankfurt')) return 'Europe/Berlin';
    if (countryRaw.includes('france') || fullLoc.includes('paris')) return 'Europe/Paris';
    if (countryRaw.includes('netherlands') || fullLoc.includes('amsterdam')) return 'Europe/Amsterdam';
    if (countryRaw.includes('poland') || fullLoc.includes('warsaw')) return 'Europe/Warsaw';
    if (countryRaw.includes('finland') || fullLoc.includes('helsinki')) return 'Europe/Helsinki';
    if (countryRaw.includes('spain') || fullLoc.includes('madrid') || fullLoc.includes('barcelona')) return 'Europe/Madrid';
    if (countryRaw.includes('italy') || fullLoc.includes('rome') || fullLoc.includes('milan')) return 'Europe/Rome';
    if (countryRaw.includes('sweden') || fullLoc.includes('stockholm')) return 'Europe/Stockholm';
    if (countryRaw.includes('switzerland') || fullLoc.includes('zurich') || fullLoc.includes('geneva')) return 'Europe/Zurich';

    // South Asia
    if (countryRaw.includes('bangladesh') || fullLoc.includes('dhaka')) return 'Asia/Dhaka';
    if (countryRaw.includes('pakistan') || fullLoc.includes('karachi') || fullLoc.includes('lahore')) return 'Asia/Karachi';
    if (countryRaw.includes('sri lanka') || fullLoc.includes('colombo')) return 'Asia/Colombo';
    if (countryRaw.includes('nepal') || fullLoc.includes('kathmandu')) return 'Asia/Kathmandu';

    // India Default (encompassing all Indian cities & states)
    return DEFAULT_TIMEZONE;
}

/**
 * Returns the exact current local time information for a given timezone.
 */
export function getUserLocalTime(timezone: string = DEFAULT_TIMEZONE, baseDate: Date = new Date()): UserLocalTime {
    const validTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: validTz,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            weekday: 'short'
        });
        const parts = formatter.formatToParts(baseDate);
        let hour = 0;
        let minute = 0;
        let weekdayStr = '';

        for (const part of parts) {
            if (part.type === 'hour') hour = parseInt(part.value, 10);
            if (part.type === 'minute') minute = parseInt(part.value, 10);
            if (part.type === 'weekday') weekdayStr = part.value;
        }

        // Intl returns 24:00 for midnight in some engines
        if (hour === 24) hour = 0;

        const dayMap: Record<string, number> = {
            'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };
        const dayOfWeek = dayMap[weekdayStr] ?? baseDate.getUTCDay();

        // Semantic time of day
        let timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'late_night';
        if (hour >= 5 && hour < 12) {
            timeOfDay = 'morning';      // 5:00 AM - 11:59 AM (Breakfast & morning tea)
        } else if (hour >= 12 && hour < 15) {
            timeOfDay = 'lunch';        // 12:00 PM - 2:59 PM (Lunch break)
        } else if (hour >= 15 && hour < 17) {
            timeOfDay = 'afternoon';    // 3:00 PM - 4:59 PM (Afternoon check-in)
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';      // 5:00 PM - 8:59 PM (Evening chai & unwind)
        } else if (hour >= 21 && hour < 23) {
            timeOfDay = 'night';        // 9:00 PM - 10:59 PM (Night reflections)
        } else {
            timeOfDay = 'late_night';   // 11:00 PM - 4:59 AM (Quiet sleeping hours)
        }

        // Sleep protection: 11:00 PM - 7:59 AM
        const isQuietHours = hour >= 23 || hour < 8;

        // Optimal engagement campaign windows: 9 AM (morning), 1 PM (lunch), 6 PM (evening chai), 9 PM (night)
        const isOptimalCampaignHour = [9, 13, 18, 21].includes(hour);

        return {
            hour,
            minute,
            dayOfWeek,
            timeOfDay,
            isQuietHours,
            isOptimalCampaignHour,
            timezone: validTz
        };
    } catch {
        // Fallback calculation for IST (+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(baseDate.getTime() + istOffset);
        const hour = istDate.getUTCHours();
        const minute = istDate.getUTCMinutes();
        const dayOfWeek = istDate.getUTCDay();

        let timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'late_night' = 'afternoon';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 15) timeOfDay = 'lunch';
        else if (hour >= 15 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
        else if (hour >= 21 && hour < 23) timeOfDay = 'night';
        else timeOfDay = 'late_night';

        return {
            hour,
            minute,
            dayOfWeek,
            timeOfDay,
            isQuietHours: hour >= 23 || hour < 8,
            isOptimalCampaignHour: [9, 13, 18, 21].includes(hour),
            timezone: DEFAULT_TIMEZONE
        };
    }
}
