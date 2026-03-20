/** Religion symbol/emoji map for display across the app */
export const RELIGION_SYMBOLS: Record<string, string> = {
    'Hindu': '🕉️',
    'Muslim': '☪️',
    'Christian': '✝️',
    'Sikh': '🛕',   // khanda not available universally; using temple icon
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
    // Case-insensitive lookup
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
