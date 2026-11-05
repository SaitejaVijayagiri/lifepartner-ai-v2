/**
 * Revenue Protection Filter & AI Anti-Creep Shield
 * Detects and masks contact information to prevent platform leakage for non-premium users,
 * while preventing false-positive masking on normal casual conversation (e.g., "insta hai kya").
 * Always enforces the AI Anti-Creep Shield to protect users from unsolicited explicit language.
 */

export interface ContentFilterOptions {
    isPremium?: boolean;
    allowContact?: boolean;
    skipContactMasking?: boolean;
}

const COMMON_CONVERSATIONAL_WORDS = new Set([
    'hai', 'hain', 'kya', 'nahi', 'nahin', 'pe', 'par', 'ko', 'se', 'me', 'mein', 'bhi', 'to',
    'use', 'chalata', 'chalta', 'karte', 'karti', 'karo', 'kare', 'batao', 'dekh', 'dekho',
    'account', 'profile', 'pic', 'pics', 'photo', 'photos', 'story', 'stories', 'dp', 'post', 'posts',
    'id', 'handle', 'number', 'link', 'app', 'group', 'call', 'msg', 'message',
    'bro', 'yaar', 'dear', 'friend', 'friends', 'bhai', 'sister', 'buddy', 'anyone',
    'yes', 'no', 'not', 'and', 'the', 'is', 'are', 'you', 'your', 'my', 'mine', 'our',
    'have', 'has', 'had', 'do', 'does', 'did', 'good', 'morning', 'night', 'evening',
    'please', 'pls', 'send', 'share', 'give', 'tell', 'want', 'need', 'like'
]);

export function sanitizeContent(text: string, options: ContentFilterOptions = {}): string {
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
        // If the URL is specifically an off-platform social handle link, keep it for contact evaluation unless premium
        const isOffPlatformDirect = /^(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|instagram\.com)\/[a-zA-Z0-9_+.\-]+/i.test(url);
        if (isOffPlatformDirect && !options.isPremium && !options.allowContact && !options.skipContactMasking) {
            return "[Hidden Contact - Upgrade to Share]";
        }
        urls.push(url);
        return `__URL_PLACEHOLDER_${urls.length - 1}__`;
    });

    const shouldMaskContacts = !options.isPremium && !options.allowContact && !options.skipContactMasking;

    if (shouldMaskContacts) {
        // 1. Email Regex
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        sanitized = sanitized.replace(emailRegex, "[Hidden Contact - Upgrade to Share]");

        // 2. Off-platform Social Handles & Direct Link Shortcuts:
        // Match direct links (e.g. t.me/username, wa.me/919999999999, telegram.me/username)
        const directLinkRegex = /(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|instagram\.com)\/[a-zA-Z0-9_+.\-]+/gi;
        sanitized = sanitized.replace(directLinkRegex, "[Hidden Contact - Upgrade to Share]");

        // Match explicit @handles (e.g. @Nihasmiley1996, @john_doe)
        sanitized = sanitized.replace(/\B@[a-zA-Z0-9_.]{4,}\b/g, "[Hidden Contact - Upgrade to Share]");

        // Match platform handle patterns (e.g. "insta: my_handle", "telegram @xyz", "t.me/handle")
        // but avoid false positives on casual conversation like "insta hai kya", "whatsapp use karte ho"
        const socialPrefixRegex = /\b(telegram|tg|whatsapp|insta|instagram)\s*(?:id|handle|username)?\s*[:=-]?\s*@?([a-zA-Z0-9_.]{3,})\b/gi;
        sanitized = sanitized.replace(socialPrefixRegex, (match, platform, candidate) => {
            const cleanCandidate = (candidate || '').toLowerCase().trim();
            // If the following word is a common conversational word, do NOT mask
            if (COMMON_CONVERSATIONAL_WORDS.has(cleanCandidate)) {
                return match;
            }
            return "[Hidden Contact - Upgrade to Share]";
        });

        // 3. Phone Number Regex (Indian 10-digit formats with 5+5, 3+3+4, or contiguous, and international)
        const indianPhoneRegex = /(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{4}[\s.-]?\d{5}\b|(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b[6-9]\d{9}\b/g;
        sanitized = sanitized.replace(indianPhoneRegex, "[Hidden Contact - Upgrade to Share]");

        const intlPhoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
        sanitized = sanitized.replace(intlPhoneRegex, "[Hidden Contact - Upgrade to Share]");
    }

    // 4. AI Anti-Creep & Harassment Shield (Protects users from unsolicited explicit language & harassment)
    // Runs ALWAYS, even for premium accounts!
    const harassmentPatterns = [
        /\b(?:send\s+nudes?|send\s+pics?\s+of\s+your|show\s+bobs?|send\s+bobs?|show\s+vagene|send\s+naked|sleep\s+with\s+me|have\s+sex\s+with\s+me|hook\s+up\s+tonight|send\s+nude|booty\s+call)\b/gi,
        /\b(?:boobs?|boobies|breasts?|cleavage|chuchi|chuchiyan|chucho|chut|gaand|lund|choot|vagina|penis)\b/gi,
        /\b(?:send.*(?:naked|nudes?|private\s+pics?|body\s+pics?)|wanna.*hook\s+up|want.*sex)\b/gi
    ];
    for (const pattern of harassmentPatterns) {
        sanitized = sanitized.replace(pattern, "[Blocked by AI Anti-Creep Shield 🛡️]");
    }

    // Restore protected URLs
    urls.forEach((url, i) => {
        sanitized = sanitized.replace(`__URL_PLACEHOLDER_${i}__`, url);
    });

    return sanitized;
}
