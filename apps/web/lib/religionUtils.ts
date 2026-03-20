/** Religion symbol/emoji map for display across the app */
export const RELIGION_SYMBOLS: Record<string, string> = {
    'Hindu': '🕉️',
    'Muslim': '☪️',
    'Christian': '✝️',
    'Sikh': '🛕',
    'Jain': '🔆',
    'Buddhist': '☸️',
    'Parsi': '🔥',
    'Other': '🙏',
};

/**
 * Returns the emoji symbol for a given religion string.
 * Falls back to 🙏 if no symbol is found.
 */
export function getReligionSymbol(religion?: string | null): string {
    if (!religion) return '🙏';
    const key = Object.keys(RELIGION_SYMBOLS).find(
        k => k.toLowerCase() === religion.toLowerCase()
    );
    return key ? RELIGION_SYMBOLS[key] : '🙏';
}

/** Formatted list for dropdowns: each entry has a value and displayed label with emoji */
export const RELIGION_OPTIONS = Object.entries(RELIGION_SYMBOLS).map(([name, symbol]) => ({
    value: name,
    label: `${symbol} ${name}`
}));

// ─────────────────────────────────────────────
// Zodiac Signs
// ─────────────────────────────────────────────

/** Zodiac sign symbol/emoji map */
export const ZODIAC_SYMBOLS: Record<string, string> = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',
};

/**
 * Returns the zodiac emoji for a given sign string.
 * Falls back to ⭐ if not found.
 */
export function getZodiacSymbol(sign?: string | null): string {
    if (!sign) return '⭐';
    const key = Object.keys(ZODIAC_SYMBOLS).find(
        k => k.toLowerCase() === sign.toLowerCase()
    );
    return key ? ZODIAC_SYMBOLS[key] : '⭐';
}

/** Formatted list for dropdowns */
export const ZODIAC_OPTIONS = Object.entries(ZODIAC_SYMBOLS).map(([name, symbol]) => ({
    value: name,
    label: `${symbol} ${name}`
}));
