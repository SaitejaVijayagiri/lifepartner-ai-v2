import { analyzeMessageSafety, sanitizeContent } from '../src/utils/contentFilter';
import {
    HIGH_VALUE_SEO_TOPICS,
    buildSlug,
    generateDynamicWomenSeoTopic
} from '../src/services/blogGenerator';
import { hasMetadataIdVerification } from '../src/utils/idVerification';
import { AIService } from '../src/services/ai';

describe('Trust, Safety & Daily Women-First SEO', () => {
    describe('Anti-Creep & Anti-Scam Safety Shield', () => {
        it('flags and masks explicit sexual harassment even for premium users', () => {
            const res = analyzeMessageSafety('send nudes baby', { isPremium: true });
            expect(res.isFlagged).toBe(true);
            expect(res.reasons).toContain('Harassment / Explicit Solicitation');
            expect(res.sanitized).toContain('[Blocked by AI Anti-Creep Shield 🛡️]');
        });

        it('flags and masks romance scam & financial solicitation messages', () => {
            const upiRes = analyzeMessageSafety('Urgent emergency please send ₹5000 on gpay now', { isPremium: true });
            expect(upiRes.isFlagged).toBe(true);
            expect(upiRes.reasons).toContain('Financial / Scam Solicitation');
            expect(upiRes.sanitized).toContain('[Flagged by Anti-Scam Safety Shield ⚠️]');

            const otpRes = analyzeMessageSafety('please share your otp and bank details for verification', { isPremium: false });
            expect(otpRes.isFlagged).toBe(true);
            expect(otpRes.reasons).toContain('Financial / Scam Solicitation');
        });

        it('preserves safe casual Hinglish conversations without false positives', () => {
            const safe = analyzeMessageSafety('insta hai kya? chai pe milte hain kabhi', { isPremium: false });
            expect(safe.isFlagged).toBe(false);
            expect(safe.sanitized).toBe('insta hai kya? chai pe milte hain kabhi');
            expect(sanitizeContent('Hello, nice profile!')).toBe('Hello, nice profile!');
        });
    });

    describe('Daily SEO Women-First Topics & Dynamic Generator', () => {
        it('prioritizes women-first and safety topics in HIGH_VALUE_SEO_TOPICS', () => {
            const firstTen = HIGH_VALUE_SEO_TOPICS.slice(0, 10);
            expect(firstTen.every(t => t.category === 'women-first')).toBe(true);
            expect(HIGH_VALUE_SEO_TOPICS.length).toBeGreaterThanOrEqual(30);
        });

        it('generates non-duplicate evergreen women-focused topics once curated topics are used', () => {
            const usedSlugs = new Set(HIGH_VALUE_SEO_TOPICS.map(t => buildSlug(t.topic)));
            const firstDynamic = generateDynamicWomenSeoTopic(usedSlugs);
            expect(firstDynamic).not.toBeNull();
            expect(['women-first', 'safety', 'indian-metros']).toContain(firstDynamic!.category);

            usedSlugs.add(buildSlug(firstDynamic!.topic));
            const secondDynamic = generateDynamicWomenSeoTopic(usedSlugs);
            expect(secondDynamic).not.toBeNull();
            expect(secondDynamic!.topic).not.toBe(firstDynamic!.topic);
        });
    });

    describe('Identity Verification Metadata Helper', () => {
        it('returns true only when id_verified is explicitly true', () => {
            expect(hasMetadataIdVerification(undefined)).toBe(false);
            expect(hasMetadataIdVerification({})).toBe(false);
            expect(hasMetadataIdVerification({ id_verified: false })).toBe(false);
            expect(hasMetadataIdVerification({ id_verified: true })).toBe(true);
        });
    });

    describe('AIService Compatibility & Personality Analysis Fallbacks', () => {
        const originalGeminiKey = process.env.GEMINI_API_KEY;
        beforeEach(() => {
            delete process.env.GEMINI_API_KEY;
        });
        afterAll(() => {
            if (originalGeminiKey !== undefined) process.env.GEMINI_API_KEY = originalGeminiKey;
        });

        it('generates grounded deep analysis Markdown instead of static placeholder text', async () => {
            const service = new AIService();
            const report = await service.generateDeepAnalysis(
                { full_name: 'Ananya', age: 27, interests: ['Travel', 'Reading'] },
                { full_name: 'Vikram', age: 29, interests: ['Travel', 'Cooking'] }
            );
            expect(report).toContain('# Compatibility Report');
            expect(report).toContain('Ananya');
            expect(report).toContain('Vikram');
            expect(report).toContain('%');
        });

        it('generates relationship scenario & rule-based personality insights without external keys', async () => {
            const service = new AIService();
            const scenario = await service.generateRelationshipScenario(
                { bio: 'Software engineer who loves calm weekends' },
                { bio: 'Doctor passionate about family and travel' }
            );
            expect(scenario.length).toBeGreaterThan(20);

            const personality = await service.analyzePersonalityFromText('I love reading books, travel, and family values.');
            expect(personality).toHaveProperty('vibe');
            expect(Array.isArray(personality.tags)).toBe(true);
            expect(personality.tags.length).toBeGreaterThan(0);
        });
    });
});
