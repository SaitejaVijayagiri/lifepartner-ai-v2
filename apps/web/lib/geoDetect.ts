// Lightweight zero-latency client-side geo & curiosity detection
// Uses Intl timezone and locale heuristics with zero external API dependencies

export interface VisitorGeo {
  country: string;
  city: string;
  flag: string;
  countryCode: string;
  activeCount: number;
  recentJoinedMinutes: number;
}

const COUNTRY_DATA: Record<string, { country: string; flag: string; countryCode: string; defaultCity: string; baseActive: number }> = {
  US: { country: 'United States', flag: '🇺🇸', countryCode: 'US', defaultCity: 'New York', baseActive: 46 },
  CA: { country: 'Canada', flag: '🇨🇦', countryCode: 'CA', defaultCity: 'Toronto', baseActive: 28 },
  GB: { country: 'United Kingdom', flag: '🇬🇧', countryCode: 'GB', defaultCity: 'London', baseActive: 39 },
  AU: { country: 'Australia', flag: '🇦🇺', countryCode: 'AU', defaultCity: 'Sydney', baseActive: 24 },
  AE: { country: 'United Arab Emirates', flag: '🇦🇪', countryCode: 'AE', defaultCity: 'Dubai', baseActive: 32 },
  QA: { country: 'Qatar', flag: '🇶🇦', countryCode: 'QA', defaultCity: 'Doha', baseActive: 19 },
  CN: { country: 'China / Hong Kong', flag: '🇨🇳', countryCode: 'CN', defaultCity: 'Hong Kong', baseActive: 22 },
  SG: { country: 'Singapore', flag: '🇸🇬', countryCode: 'SG', defaultCity: 'Singapore', baseActive: 21 },
  IN: { country: 'India', flag: '🇮🇳', countryCode: 'IN', defaultCity: 'Delhi / Mumbai', baseActive: 88 },
  DE: { country: 'Germany', flag: '🇩🇪', countryCode: 'DE', defaultCity: 'Berlin', baseActive: 25 },
  FR: { country: 'France', flag: '🇫🇷', countryCode: 'FR', defaultCity: 'Paris', baseActive: 23 },
};

export function detectVisitorGeo(): VisitorGeo {
  if (typeof window === 'undefined') {
    return {
      country: 'Worldwide',
      city: 'Global',
      flag: '🌍',
      countryCode: 'GLOBAL',
      activeCount: 142,
      recentJoinedMinutes: 4
    };
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let matchedCode = 'IN'; // default fallback
    let detectedCity = '';

    if (tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Los_Angeles') || 
        tz.startsWith('America/Denver') || tz.startsWith('America/Phoenix') || tz.startsWith('America/Detroit') || 
        tz.startsWith('America/Indiana') || tz.startsWith('America/Boise')) {
      matchedCode = 'US';
      detectedCity = tz.split('/')[1]?.replace(/_/g, ' ') || 'New York';
    } else if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal') || tz.startsWith('America/Edmonton')) {
      matchedCode = 'CA';
      detectedCity = tz.split('/')[1]?.replace(/_/g, ' ') || 'Toronto';
    } else if (tz.startsWith('Europe/London')) {
      matchedCode = 'GB';
      detectedCity = 'London';
    } else if (tz.startsWith('Australia/')) {
      matchedCode = 'AU';
      detectedCity = tz.split('/')[1]?.replace(/_/g, ' ') || 'Sydney';
    } else if (tz.startsWith('Asia/Dubai')) {
      matchedCode = 'AE';
      detectedCity = 'Dubai';
    } else if (tz.startsWith('Asia/Qatar')) {
      matchedCode = 'QA';
      detectedCity = 'Doha';
    } else if (tz.startsWith('Asia/Shanghai') || tz.startsWith('Asia/Hong_Kong') || tz.startsWith('Asia/Chongqing')) {
      matchedCode = 'CN';
      detectedCity = 'Hong Kong';
    } else if (tz.startsWith('Asia/Singapore')) {
      matchedCode = 'SG';
      detectedCity = 'Singapore';
    } else if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Munich') || tz.startsWith('Europe/Frankfurt')) {
      matchedCode = 'DE';
      detectedCity = 'Berlin';
    } else if (tz.startsWith('Europe/Paris')) {
      matchedCode = 'FR';
      detectedCity = 'Paris';
    } else if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) {
      matchedCode = 'IN';
      detectedCity = 'India';
    } else {
      // General worldwide
      return {
        country: 'Worldwide',
        city: 'Global Singles',
        flag: '🌍',
        countryCode: 'GLOBAL',
        activeCount: 140 + (new Date().getMinutes() % 25),
        recentJoinedMinutes: (new Date().getMinutes() % 12) + 2
      };
    }

    const conf = COUNTRY_DATA[matchedCode] || COUNTRY_DATA.IN;
    // Add small dynamic time-based variation so it feels genuinely real-time
    const minuteFactor = (new Date().getMinutes() % 15);
    const activeCount = conf.baseActive + minuteFactor;
    const recentJoinedMinutes = (minuteFactor % 9) + 3;

    return {
      country: conf.country,
      city: detectedCity || conf.defaultCity,
      flag: conf.flag,
      countryCode: conf.countryCode,
      activeCount,
      recentJoinedMinutes
    };
  } catch (err) {
    return {
      country: 'Worldwide',
      city: 'Global Singles',
      flag: '🌍',
      countryCode: 'GLOBAL',
      activeCount: 120,
      recentJoinedMinutes: 5
    };
  }
}
