import axios from 'axios';
import { prisma } from '../prisma';
import { callGeminiGenerate, isGeminiConfigured } from '../utils/geminiClient';

export interface SeoTopicItem {
    topic: string;
    category: 'women-first' | 'indian-metros' | 'nri' | 'astrology' | 'safety' | 'general';
    keywords: string[];
}

export const HIGH_VALUE_SEO_TOPICS: SeoTopicItem[] = [
    // 🌸 High-Priority Women-First, Privacy & Female Reach Topics
    {
        topic: "Safe Matrimony for Working Women in India: Privacy, Autonomy & Equality",
        category: "women-first",
        keywords: ["safe matrimony for women", "career women marriage", "privacy in matrimony apps", "women first matrimony"]
    },
    {
        topic: "How Women Can Spot Online Matrimonial Catfish and Scammers Before Meeting",
        category: "women-first",
        keywords: ["matrimonial fraud prevention", "safe online matchmaking for women", "catfish detection matrimony"]
    },
    {
        topic: "Why Career-Oriented Women Prefer Modern AI Matchmaking Over Traditional Family Brokers",
        category: "women-first",
        keywords: ["working women matrimony", "arranged marriage alternatives", "modern brides india"]
    },
    {
        topic: "The Ultimate First Date Safety Checklist for Indian Women Meeting Online Matches",
        category: "women-first",
        keywords: ["first date safety tips", "meeting safely in india", "women safety checklist"]
    },
    {
        topic: "Setting Financial Boundaries Before Marriage: What Every Indian Bride Should Ask",
        category: "women-first",
        keywords: ["financial compatibility marriage", "pre marriage questions", "indian women financial independence"]
    },
    {
        topic: "How to Find a Respectful Life Partner Without Exposing Your Phone Number Online",
        category: "women-first",
        keywords: ["matrimony without phone number leak", "masked contact matrimony", "private matrimony for women"]
    },
    {
        topic: "Photo Privacy in Matrimony: Why Blur-Until-Accept Protects Women from Misuse",
        category: "women-first",
        keywords: ["blur photo matrimony app", "screenshot proof matrimony", "safe photo sharing matrimony"]
    },
    {
        topic: "No More Telemarketer Spam: Why Women Are Leaving Legacy Matrimony Sites",
        category: "women-first",
        keywords: ["matrimony without spam calls", "shaadi alternative for women", "respectful matrimony app"]
    },
    {
        topic: "Green Flags vs Red Flags in Early Matrimony Chats: A Practical Guide for Women",
        category: "women-first",
        keywords: ["matrimony red flags", "green flags in arranged marriage", "how to judge a match online"]
    },
    {
        topic: "Independent Women & Marriage in 2026: Balancing Ambition, Relocation & Family",
        category: "women-first",
        keywords: ["independent women matrimony", "relocation after marriage discussion", "modern indian bride guide"]
    },
    {
        topic: "Safe Video Calls Before Meeting: Questions Every Woman Should Ask a Potential Partner",
        category: "safety",
        keywords: ["video call questions before marriage", "safe matrimony video call", "pre marriage compatibility questions"]
    },
    {
        topic: "How Parent-Managed vs Self-Managed Profiles Affect Modern Women's Matchmaking",
        category: "women-first",
        keywords: ["self managed matrimony", "involving parents in matrimony safely", "modern arranged marriage india"]
    },
    {
        topic: "Protecting Your Emotional Peace While Searching for a Life Partner Online",
        category: "women-first",
        keywords: ["matrimony burnout women", "mindful matchmaking", "healthy boundaries in matchmaking"]
    },
    {
        topic: "Second Marriage & Divorced Women Matrimony in India: Finding Dignity and Respect",
        category: "women-first",
        keywords: ["second marriage matrimony for women", "divorced women matrimony india", "respectful remarriage platform"]
    },

    // 🇮🇳 Indian Metro & Regional Matrimony Hubs (Women-Focused)
    {
        topic: "Tech Singles in Bengaluru: Finding a Respectful Life Partner Amid Startup Hours",
        category: "indian-metros",
        keywords: ["Bangalore matrimony", "tech women matrimony bangalore", "software engineer matrimony india"]
    },
    {
        topic: "Hyderabad Matrimony Guide for Women: Blending Heritage with Modern Compatibility",
        category: "indian-metros",
        keywords: ["Hyderabad matrimony", "Telugu matrimony for women", "IT professionals marriage hyderabad"]
    },
    {
        topic: "Mumbai Matrimony Guide: Fast-Paced Careers and Meaningful Lifelong Commitments",
        category: "indian-metros",
        keywords: ["Mumbai matrimony", "working women marriage mumbai", "safe matrimony mumbai"]
    },
    {
        topic: "Delhi NCR Matchmaking: Navigating Modern Expectations with Real Verification",
        category: "indian-metros",
        keywords: ["Delhi matrimony", "NCR verified matrimony", "Gurgaon marriage singles"]
    },
    {
        topic: "Chennai & Tamil Matrimony: Preserving Values while Embracing Progressive Compatibility",
        category: "indian-metros",
        keywords: ["Tamil matrimony", "Chennai matrimony for women", "tamil brides and grooms"]
    },
    {
        topic: "Pune Singles Matrimony: Where Cultural Roots Meet Cosmopolitan Ambitions",
        category: "indian-metros",
        keywords: ["Pune matrimony", "Marathi matrimony safe", "pune working professionals matrimony"]
    },
    {
        topic: "Kolkata & Bengali Matrimony: Intellectual Conversations and Lifelong Partnerships",
        category: "indian-metros",
        keywords: ["Bengali matrimony", "Kolkata matrimony", "intellectual matchmaking india"]
    },

    // ✈️ NRI & International Diaspora Matrimony
    {
        topic: "NRI Matrimony in the USA for Indian Women: Navigating Visas, Values & Distance",
        category: "nri",
        keywords: ["NRI matrimony USA", "Indian women USA matrimony", "verified NRI grooms"]
    },
    {
        topic: "Indian Women in the UK: Finding a Verified Life Partner Across London and Beyond",
        category: "nri",
        keywords: ["NRI matrimony UK", "British Indian matrimony", "London Indian brides and grooms"]
    },
    {
        topic: "Canada NRI Matchmaking: Connecting Verified Indian Singles in Toronto and Vancouver",
        category: "nri",
        keywords: ["NRI matrimony Canada", "Toronto Indian matrimony", "verified Indian singles Canada"]
    },
    {
        topic: "Dubai & UAE NRI Matrimony: Finding a Trusted Spouse in the Gulf",
        category: "nri",
        keywords: ["Dubai Indian matrimony", "UAE matrimony", "Gulf NRI matchmaking"]
    },
    {
        topic: "Australia NRI Matrimony: Safe Matchmaking in Sydney, Melbourne & Brisbane",
        category: "nri",
        keywords: ["NRI matrimony Australia", "Indian singles Sydney", "Melbourne Indian matchmaking"]
    },
    {
        topic: "Singapore Indian Matrimony: High-Achieving Professionals Finding Lasting Love",
        category: "nri",
        keywords: ["Singapore Indian matrimony", "NRI singles Singapore", "verified matrimony singapore"]
    },

    // 🔮 Astrology, Kundali & Modern Compatibility
    {
        topic: "Understanding Ashtakoot Guna Milan: 36 Points of Kundli Matching Explained Clearly",
        category: "astrology",
        keywords: ["36 gun milan", "kundli matching for marriage", "guna milan points explained"]
    },
    {
        topic: "Manglik Dosha in Modern Times: Myths, Facts and Real Relationship Impact",
        category: "astrology",
        keywords: ["manglik dosha marriage", "manglik compatibility", "vedic astrology marriage"]
    },
    {
        topic: "When Kundali Matches but Personalities Don't: Why Emotional Compatibility Matters Most",
        category: "astrology",
        keywords: ["kundli vs personality", "modern arranged marriage", "psychological compatibility"]
    },

    // 💡 Trust, Verification & Safe Matchmaking Insights
    {
        topic: "Why Women Should Never Pay Just to Reply to a Mutual Matrimony Match",
        category: "general",
        keywords: ["free matrimony for women", "free shaadi alternative", "free jeevansathi alternative"]
    },
    {
        topic: "How In-App Encrypted Chat & HD Video Calls Eliminate Matrimony Middlemen",
        category: "general",
        keywords: ["direct chat matrimony", "safe video call matrimony", "private matrimony messaging"]
    },
    {
        topic: "Matrimony Tips for Introverted Women: Forming Deep Connections Without Burnout",
        category: "general",
        keywords: ["matrimony for introverts", "deep compatibility questions", "authentic matchmaking"]
    },
    {
        topic: "How Identity & Photo Verification Stops Fake Matrimony Profiles Before They Reach You",
        category: "safety",
        keywords: ["id verified matrimony", "verified matrimony profiles india", "anti catfish matrimony"]
    }
];

const EVERGREEN_LOCATIONS = [
    "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Chennai", "Delhi NCR", "Kolkata", "Ahmedabad",
    "Kochi", "Chandigarh", "Jaipur", "London", "New York", "San Francisco Bay Area",
    "Toronto", "Dubai", "Singapore", "Sydney", "Melbourne"
];

const EVERGREEN_ANGLES: Array<{
    titleTemplate: (loc: string) => string;
    category: SeoTopicItem['category'];
    keywords: (loc: string) => string[];
}> = [
    {
        titleTemplate: (loc) => `Safe & Privacy-First Matrimony for Working Women in ${loc}`,
        category: "women-first",
        keywords: (loc) => [`safe matrimony ${loc}`, `working women matrimony ${loc}`, "privacy first matrimony", "LifePartner AI"]
    },
    {
        titleTemplate: (loc) => `How Women in ${loc} Can Verify Genuine Matches & Avoid Scams`,
        category: "safety",
        keywords: (loc) => [`verified matrimony ${loc}`, `matrimony safety tips ${loc}`, "id verified profiles", "LifePartner AI"]
    },
    {
        titleTemplate: (loc) => `Values-First AI Matchmaking for Serious Singles in ${loc}`,
        category: "indian-metros",
        keywords: (loc) => [`AI matrimony ${loc}`, `serious matchmaking ${loc}`, "compatibility matching", "LifePartner AI"]
    },
    {
        titleTemplate: (loc) => `Pre-Marriage Compatibility Checklist for Couples in ${loc}`,
        category: "women-first",
        keywords: (loc) => [`compatibility checklist ${loc}`, `pre marriage questions ${loc}`, "modern matrimony guide", "LifePartner AI"]
    }
];

export function buildSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 120);
}

export function generateDynamicWomenSeoTopic(existingSlugs: Set<string>): SeoTopicItem | null {
    for (const angle of EVERGREEN_ANGLES) {
        for (const loc of EVERGREEN_LOCATIONS) {
            const topic = angle.titleTemplate(loc);
            const slug = buildSlug(topic);
            if (!existingSlugs.has(slug)) {
                return {
                    topic,
                    category: angle.category,
                    keywords: angle.keywords(loc)
                };
            }
        }
    }
    return null;
}

function buildFallbackArticleContent(
    topic: string,
    category: SeoTopicItem['category'],
    keywords: string[]
): { title: string; excerpt: string; meta_title: string; meta_description: string; content: string } {
    const title = `${topic} | LifePartner AI`;
    const meta_title = `${topic.length > 55 ? topic.substring(0, 55).trim() : topic} | LifePartner AI`;
    const excerpt = `Practical, safety-first guide on ${topic}. Learn how women and serious singles evaluate compatibility, protect privacy, and connect authentically on LifePartner AI.`;
    const meta_description = `Explore ${topic}. Built for women's safety, verified profiles, masked contact privacy, and values-first compatibility on LifePartner AI.`;

    const categorySection: Record<SeoTopicItem['category'], string> = {
        'women-first': `<h3>Why Women-First Privacy Controls Matter</h3>
<p>Many women hesitate to join online matchmaking because of unsolicited phone calls, leaked contact numbers, and unmoderated DMs. LifePartner AI puts control back in your hands:</p>
<ol>
    <li><strong>Masked Contact Details:</strong> Phone numbers and social handles stay hidden until you choose to share them.</li>
    <li><strong>Blur-Until-Accept Photo Privacy:</strong> Keep profile photos private or blurred until you approve a mutual match.</li>
    <li><strong>AI Anti-Creep &amp; Anti-Scam Shield:</strong> Automatically filters explicit harassment and suspicious financial requests.</li>
    <li><strong>100% Free VIP for Women:</strong> Direct messaging and in-app video calls without forced paywalls.</li>
</ol>`,
        'safety': `<h3>Essential Verification &amp; Meetup Safeguards</h3>
<p>Before moving a conversation offline or getting families involved, follow a structured verification routine:</p>
<ul>
    <li><strong>Prefer ID-Verified Profiles:</strong> Prioritize members who have completed identity &amp; selfie review rather than relying on email-only accounts.</li>
    <li><strong>Have a Short In-App Video Call First:</strong> Verify tone, warmth, and consistency directly inside the app without exposing WhatsApp or phone numbers.</li>
    <li><strong>Use Safe Public Venues &amp; Share Check-Ins:</strong> Schedule your first meetup during daylight in a public cafe and use LifePartner AI's Angel Timer &amp; emergency contact check-in.</li>
</ul>`,
        'nri': `<h3>Navigating Cross-Border &amp; NRI Matchmaking</h3>
<p>Balancing global careers, visa timelines, and family traditions takes honest alignment early in the conversation:</p>
<ul>
    <li><strong>Clarify Relocation &amp; Career Flexibility Early:</strong> Discuss city, visa, and remote-work expectations within the first few calls.</li>
    <li><strong>Test Real Chemistry Over Video:</strong> Use in-app HD video dates across time zones before committing to international travel.</li>
    <li><strong>Align on Values, Not Just Biodata:</strong> Compare financial goals, family involvement, and day-to-day lifestyle habits.</li>
</ul>`,
        'astrology': `<h3>Combining Vedic Insights with Emotional Compatibility</h3>
<p>Traditional Ashtakoot Guna Milan provides helpful cultural context for many families, while modern psychometric compatibility reveals how two people actually communicate, resolve conflict, and support each other's ambitions day to day.</p>`,
        'indian-metros': `<h3>Standing Out in Busy Metro Matchmaking</h3>
<p>In fast-paced cities, specific details beat generic bios every time. Highlight your real weekend routines, non-negotiable values, and communication style so high-intent matches immediately see who you are.</p>`,
        'general': `<h3>Intentional Matchmaking Without Pressure</h3>
<p>Finding a life partner shouldn't require paying thousands of rupees just to say hello or enduring daily broker sales calls. Focus on shared values, transparent intent, and steady, respectful conversations.</p>`
    };

    const content = `<h2>${topic}</h2>
<p>Choosing a life partner is one of the most meaningful decisions you will ever make, yet traditional platforms often force women and serious singles to navigate fake profiles, aggressive sales calls, and paywalls. When looking into <strong>${keywords[0] || topic}</strong>, clarity, safety, and emotional alignment matter most.</p>

<h3>What to Look For in a Genuine Match</h3>
<ul>
    <li><strong>Verified Identity &amp; Consistent Story:</strong> Look for genuine photos, thoughtful answers about life goals, and willingness to video chat inside the platform.</li>
    <li><strong>Shared Core Values:</strong> Long-term marriage harmony depends on aligned views on family, career growth, finances, and mutual respect.</li>
    <li><strong>Zero Pressure &amp; Respectful Boundaries:</strong> A trustworthy match respects your pace and never pushes for personal phone numbers or financial favors.</li>
</ul>

${categorySection[category]}

<h3>Quick Checklist Before Saying Yes to a First Meet</h3>
<ol>
    <li>Discuss long-term living location, career goals, and family expectations clearly.</li>
    <li>Confirm comfort and consistency through an in-app voice or video call.</li>
    <li>Keep your personal contact private until mutual trust is firmly established.</li>
</ol>

<h3>Start Safely on LifePartner AI</h3>
<p>Ready to meet verified, values-aligned matches in a respectful space built around women's privacy? Explore our <a href="https://www.lifepartnerai.in/for-women">Women-First Safety Standard</a>, read our <a href="https://www.lifepartnerai.in/safety">Safety Guide</a>, or <a href="https://www.lifepartnerai.in/register?gender=Female">create your free profile today</a>.</p>`;

    return { title, excerpt, meta_title, meta_description, content };
}

async function generateArticleWithAI(
    topic: string,
    category: SeoTopicItem['category'],
    keywords: string[]
): Promise<{ title: string; excerpt: string; meta_title: string; meta_description: string; content: string } | null> {
    const prompt = `Write a helpful, culturally grounded, high-trust SEO article for Indian & NRI women and serious singles on LifePartner AI.
Topic: "${topic}"
Category: "${category}"
Target keywords: ${keywords.join(', ')}

Requirements:
- Tone: Warm, respectful, empowering for women, practical, trustworthy (no clickbait, no slang).
- Output STRICT JSON ONLY (no markdown fences) with keys:
  - "title": engaging SEO title under 85 characters
  - "meta_title": under 65 characters ending with "| LifePartner AI"
  - "excerpt": 1-2 crisp sentences (max 180 chars)
  - "meta_description": compelling 140-158 char search description
  - "content": rich 650-900 word HTML body using <h2>, <h3>, <p>, <ul>/<li>, <ol>/<li>, <strong>, including 3 actionable takeaways, a brief 2-question FAQ, and natural internal links to https://www.lifepartnerai.in/for-women, https://www.lifepartnerai.in/safety, and https://www.lifepartnerai.in/register?gender=Female. Do NOT include <html>, <head>, <body>, or <script> tags.`;

    const parseJsonResult = (raw: string) => {
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!parsed?.title || !parsed?.content || String(parsed.content).length < 250) {
            return null;
        }
        return {
            title: String(parsed.title).slice(0, 250),
            excerpt: String(parsed.excerpt || `Practical guide on ${topic}.`).slice(0, 500),
            meta_title: String(parsed.meta_title || parsed.title).slice(0, 250),
            meta_description: String(parsed.meta_description || parsed.excerpt || topic).slice(0, 320),
            content: String(parsed.content)
        };
    };

    if (isGeminiConfigured()) {
        const preferred = process.env.GEMINI_BLOG_MODEL || process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
        try {
            const geminiRes = await callGeminiGenerate({
                prompt,
                temperature: 0.7,
                maxOutputTokens: 2400,
                responseMimeType: 'application/json',
                timeoutMs: 15000,
                models: [preferred, 'gemini-2.5-flash']
            });
            if (geminiRes.text) {
                const parsed = parseJsonResult(geminiRes.text);
                if (parsed) return parsed;
            }
        } catch (err: any) {
            console.warn(`[BlogGenerator] Gemini AI generation skipped: ${err?.message || err}`);
        }
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (nvidiaKey && nvidiaKey.length > 10) {
        try {
            const response = await axios.post(
                'https://integrate.api.nvidia.com/v1/chat/completions',
                {
                    model: 'google/gemma-4-31b-it',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1800,
                    temperature: 0.7,
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${nvidiaKey}`
                    },
                    timeout: 20000
                }
            );
            const text = response.data?.choices?.[0]?.message?.content;
            if (text) {
                const parsed = parseJsonResult(text);
                if (parsed) return parsed;
            }
        } catch (err: any) {
            console.warn(`[BlogGenerator] NVIDIA fallback generation skipped: ${err?.message || err}`);
        }
    }

    return null;
}

export async function generateBlogPost(topicInput?: string): Promise<boolean> {
    try {
        let selectedTopicObj = HIGH_VALUE_SEO_TOPICS.find(t => t.topic === topicInput);

        const existingPosts = await prisma.blog_posts.findMany({
            select: { slug: true }
        });
        const existingSlugs = new Set(existingPosts.map(p => p.slug));

        if (!selectedTopicObj && !topicInput) {
            for (const item of HIGH_VALUE_SEO_TOPICS) {
                const slugCandidate = buildSlug(item.topic);
                if (!existingSlugs.has(slugCandidate)) {
                    selectedTopicObj = item;
                    break;
                }
            }
        }

        if (!selectedTopicObj && !topicInput) {
            selectedTopicObj = generateDynamicWomenSeoTopic(existingSlugs) || undefined;
        }

        const topic = selectedTopicObj
            ? selectedTopicObj.topic
            : (topicInput || `Safe & Values-First Matrimony Insights (${new Date().toISOString().slice(0, 10)})`);
        const category: SeoTopicItem['category'] = selectedTopicObj ? selectedTopicObj.category : 'women-first';
        const keywords = selectedTopicObj
            ? selectedTopicObj.keywords
            : [topic, 'safe matrimony for women', 'verified matchmaking', 'LifePartner AI'];

        let slug = buildSlug(topic);
        if (existingSlugs.has(slug)) {
            slug = `${slug}-${new Date().toISOString().slice(0, 10)}`;
        }
        if (existingSlugs.has(slug)) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        console.log(`\n🤖 Generating SEO Blog Post for: "${topic}" (Slug: ${slug})...`);

        const articleData =
            (await generateArticleWithAI(topic, category, keywords)) ||
            buildFallbackArticleContent(topic, category, keywords);

        await prisma.blog_posts.create({
            data: {
                title: articleData.title,
                slug,
                excerpt: articleData.excerpt,
                meta_title: articleData.meta_title,
                meta_description: articleData.meta_description,
                keywords,
                content: articleData.content
            }
        });

        console.log(`✅ Successfully generated and saved SEO Blog Post: ${articleData.title}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to generate blog post:', error);
        return false;
    }
}
