
/**
 * Revenue Protection Filter
 * Detects and masks contact information to prevent platform leakage.
 */

export function sanitizeContent(text: string): string {
    if (!text) return "";

    // Check if message is a reply containing structured media
    let coreText = text;
    if (text.startsWith("[REPLY:")) {
        const replyEnd = text.indexOf("]");
        if (replyEnd !== -1) {
            coreText = text.substring(replyEnd + 1).trim();
        }
    }

    // Bypass sanitization entirely for machine-generated media and system attachments
    // to prevent regex matching on Base64 Data URIs, URLs, and timestamps
    if (
        coreText.startsWith("[IMAGE]") || 
        coreText.startsWith("[VIDEO]") || 
        coreText.startsWith("[AUDIO]") || 
        coreText.startsWith("[STICKER]") ||
        coreText.startsWith("[STORY_REPLY:") ||
        coreText.startsWith("[DATE_INVITE:") ||
        coreText.startsWith("[DATE_RESPONSE:") ||
        coreText.startsWith("[MUSIC_SHARE:") ||
        coreText.startsWith("[INSTANT:") ||
        coreText.startsWith("[LOCATION:") ||
        coreText.startsWith("[GAME:") ||
        coreText.startsWith("[CALL:")
    ) {
        return text;
    }

    let sanitized = text;

    // Temporarily replace URLs and Data URIs (both plain and percent-encoded)
    // so numeric IDs, hashes, and timestamps are not mistaken for phone numbers
    const urls: string[] = [];
    const urlPattern = /(?:https?:\/\/[^\s"'`<>]+|https?%3A%2F%2F[^\s"'`<>]+|data:(?:image|audio|video)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/g;
    sanitized = sanitized.replace(urlPattern, (url) => {
        urls.push(url);
        return `__URL_PLACEHOLDER_${urls.length - 1}__`;
    });

    // 1. Email Regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    sanitized = sanitized.replace(emailRegex, "[Hidden Contact - Upgrade to Share]");

    // 2. Social Handles & Messaging Links (Telegram, WhatsApp, Instagram off-platform leakage)
    const handleRegex = /(?:(?:t\.me|telegram\.me|wa\.me|api\.whatsapp\.com)\/[a-zA-Z0-9_+\-]+|\b(?:telegram|tg|whatsapp|insta|instagram)[\s:]+@?[a-zA-Z0-9_.]{3,}|\B@[a-zA-Z0-9_]{5,}\b)/gi;
    sanitized = sanitized.replace(handleRegex, "[Hidden Contact - Upgrade to Share]");

    // 3. Phone Number Regex (Indian 10-digit formats with 5+5, 3+3+4, or contiguous, and international)
    const indianPhoneRegex = /(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{4}[\s.-]?\d{5}\b|(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b[6-9]\d{9}\b/g;
    sanitized = sanitized.replace(indianPhoneRegex, "[Hidden Contact - Upgrade to Share]");

    const intlPhoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
    sanitized = sanitized.replace(intlPhoneRegex, "[Hidden Contact - Upgrade to Share]");

    // Restore protected URLs
    urls.forEach((url, i) => {
        sanitized = sanitized.replace(`__URL_PLACEHOLDER_${i}__`, url);
    });

    return sanitized;
}

