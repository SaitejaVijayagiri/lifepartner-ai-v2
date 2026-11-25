/**
 * Revenue Protection Filter, AI Anti-Creep Shield & Romance Scam Guard
 * Detects and masks contact information to prevent platform leakage for non-premium users,
 * while preventing false-positive masking on normal casual conversation (e.g., "insta hai kya").
 * Always enforces the Anti-Creep Shield and Anti-Scam Shield regardless of user tier.
 */

export interface ContentFilterOptions {
    isPremium?: boolean;
    allowContact?: boolean;
    skipContactMasking?: boolean;
}

export interface SafetyAnalysisResult {
    sanitized: string;
    isFlagged: boolean;
    reasons: string[];
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

const HARASSMENT_PATTERNS: RegExp[] = [
    /\b(?:send\s+nudes?|send\s+pics?\s+of\s+your|show\s+bobs?|send\s+bobs?|show\s+vagene|send\s+naked|sleep\s+with\s+me|have\s+sex\s+with\s+me|hook\s+up\s+tonight|send\s+nude|booty\s+call)\b/gi,
    /\b(?:boobs?|boobies|breasts?|cleavage|chuchi|chuchiyan|chucho|chut|gaand|lund|choot|vagina|penis|randi)\b/gi,
    /\b(?:send.*(?:naked|nudes?|private\s+pics?|body\s+pics?)|wanna.*hook\s+up|want.*sex|video\s+sex|nude\s+(?:call|video)|cam\s+sex|sex\s+chat)\b/gi,
    /\b(?:fwb|one\s+night\s+stand|rate\s+kitna|paid\s+(?:sex|fun|service)|sugar\s+(?:baby|daddy)\s+pay)\b/gi
];

const SCAM_FINANCIAL_PATTERNS: RegExp[] = [
    /\b(?:send|transfer|pay|lend|loan|need)\s+(?:me\s+)?(?:₹|rs\.?|inr|usd|\$|money|cash|amount|funds)\b/gi,
    /\b(?:upi\s*(?:id|pe)|gpay|google\s*pay|phonepe|paytm|bank\s+account|ifsc|wire\s+transfer|western\s+union|gift\s+card|itunes\s+card)\b.*(?:send|pay|transfer|urgent|emergency|stuck)/gi,
    /\b(?:crypto|usdt|binance|forex|trading\s+profit|guaranteed\s+return|double\s+your\s+money)\b/gi,
    /\b(?:share|tell|send)\s+(?:your\s+)?(?:otp|cvv|pin|bank\s+details|aadhaar|pan\s+card)\b/gi
];

export function analyzeMessageSafety(text: string, options: ContentFilterOptions = {}): SafetyAnalysisResult {
    if (!text) {
        return { sanitized: '', isFlagged: false, reasons: [] };
    }

    let coreText = text;
    if (text.startsWith('[REPLY:')) {
        const replyEnd = text.indexOf(']');
        if (replyEnd !== -1) {
            coreText = text.substring(replyEnd + 1).trim();
        }
    }

    if (
        coreText.startsWith('[IMAGE]') ||
        coreText.startsWith('[VIDEO]') ||
        coreText.startsWith('[AUDIO]') ||
        coreText.startsWith('[STICKER]') ||
        coreText.startsWith('[STORY_REPLY:') ||
        coreText.startsWith('[DATE_INVITE:') ||
        coreText.startsWith('[DATE_RESPONSE:') ||
        coreText.startsWith('[MUSIC_SHARE:') ||
        coreText.startsWith('[INSTANT:') ||
        coreText.startsWith('[LOCATION:') ||
        coreText.startsWith('[GAME:') ||
        coreText.startsWith('[CALL:')
    ) {
        return { sanitized: text, isFlagged: false, reasons: [] };
    }

    let sanitized = text;
    const reasons = new Set<string>();

    const urls: string[] = [];
    const urlPattern = /(?:https?:\/\/[^\s"'`<>]+|https?%3A%2F%2F[^\s"'`<>]+|data:(?:image|audio|video)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/g;
    sanitized = sanitized.replace(urlPattern, (url) => {
        const isOffPlatformDirect = /^(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|instagram\.com)\/[a-zA-Z0-9_+.\-]+/i.test(url);
        if (isOffPlatformDirect && !options.isPremium && !options.allowContact && !options.skipContactMasking) {
            return '[Hidden Contact - Upgrade to Share]';
        }
        urls.push(url);
        return `__URL_PLACEHOLDER_${urls.length - 1}__`;
    });

    const shouldMaskContacts = !options.isPremium && !options.allowContact && !options.skipContactMasking;

    if (shouldMaskContacts) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        sanitized = sanitized.replace(emailRegex, '[Hidden Contact - Upgrade to Share]');

        const directLinkRegex = /(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|instagram\.com)\/[a-zA-Z0-9_+.\-]+/gi;
        sanitized = sanitized.replace(directLinkRegex, '[Hidden Contact - Upgrade to Share]');

        sanitized = sanitized.replace(/\B@[a-zA-Z0-9_.]{4,}\b/g, '[Hidden Contact - Upgrade to Share]');

        const socialPrefixRegex = /\b(telegram|tg|whatsapp|insta|instagram)\s*(?:id|handle|username)?\s*[:=-]?\s*@?([a-zA-Z0-9_.]{3,})\b/gi;
        sanitized = sanitized.replace(socialPrefixRegex, (match, _platform, candidate) => {
            const cleanCandidate = (candidate || '').toLowerCase().trim();
            if (COMMON_CONVERSATIONAL_WORDS.has(cleanCandidate)) {
                return match;
            }
            return '[Hidden Contact - Upgrade to Share]';
        });

        const indianPhoneRegex = /(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{4}[\s.-]?\d{5}\b|(?:\+?91[\s.-]?)?(?:\b0)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b[6-9]\d{9}\b/g;
        sanitized = sanitized.replace(indianPhoneRegex, '[Hidden Contact - Upgrade to Share]');

        const intlPhoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
        sanitized = sanitized.replace(intlPhoneRegex, '[Hidden Contact - Upgrade to Share]');
    }

    // AI Anti-Creep & Harassment Shield (Runs ALWAYS, even for premium accounts)
    for (const pattern of HARASSMENT_PATTERNS) {
        const fresh = new RegExp(pattern.source, pattern.flags);
        if (fresh.test(sanitized)) {
            reasons.add('Harassment / Explicit Solicitation');
            sanitized = sanitized.replace(new RegExp(pattern.source, pattern.flags), '[Blocked by AI Anti-Creep Shield 🛡️]');
        }
    }

    // Anti-Scam & Financial Solicitation Shield (Runs ALWAYS, even for premium accounts)
    for (const pattern of SCAM_FINANCIAL_PATTERNS) {
        const fresh = new RegExp(pattern.source, pattern.flags);
        if (fresh.test(sanitized)) {
            reasons.add('Financial / Scam Solicitation');
            sanitized = sanitized.replace(new RegExp(pattern.source, pattern.flags), '[Flagged by Anti-Scam Safety Shield ⚠️]');
        }
    }

    urls.forEach((url, i) => {
        sanitized = sanitized.replace(`__URL_PLACEHOLDER_${i}__`, url);
    });

    return {
        sanitized,
        isFlagged: reasons.size > 0,
        reasons: Array.from(reasons)
    };
}

export function sanitizeContent(text: string, options: ContentFilterOptions = {}): string {
    return analyzeMessageSafety(text, options).sanitized;
}
