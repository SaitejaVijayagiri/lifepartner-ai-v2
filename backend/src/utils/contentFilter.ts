
/**
 * Revenue Protection Filter
 * Detects and masks contact information to prevent platform leakage.
 */

export function sanitizeContent(text: string): string {
    if (!text) return "";

    // Bypass sanitization entirely for machine-generated media and system attachments
    // to prevent regex matching on Base64 Data URIs, URLs, and timestamps
    if (
        text.startsWith("[IMAGE]") || 
        text.startsWith("[AUDIO]") || 
        text.startsWith("[STICKER]") ||
        text.startsWith("[STORY_REPLY:") ||
        text.startsWith("[DATE_INVITE:") ||
        text.startsWith("[INSTANT:") ||
        text.startsWith("[LOCATION:") ||
        text.startsWith("[GAME:") ||
        text.startsWith("[CALL:")
    ) {
        return text;
    }

    let sanitized = text;

    // Temporarily replace URLs so 10-digit version numbers/timestamps aren't matched as phone numbers
    const urls: string[] = [];
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, (url) => {
        urls.push(url);
        return `__URL_PLACEHOLDER_${urls.length - 1}__`;
    });

    // 1. Email Regex
    // Matches: test@gmail.com, name.surname@co.in, etc.
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    sanitized = sanitized.replace(emailRegex, "[Hidden Contact - Upgrade to Share]");

    // 2. Phone Number Regex
    // Matches: 
    // 9876543210 (10 digits)
    // +91 98765 43210 (International + spaces)
    // 987-654-3210 (Hyphens)
    const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\b\d{10}\b/g;
    sanitized = sanitized.replace(phoneRegex, "[Hidden Contact - Upgrade to Share]");

    // Restore protected URLs
    urls.forEach((url, i) => {
        sanitized = sanitized.replace(`__URL_PLACEHOLDER_${i}__`, url);
    });

    return sanitized;
}
