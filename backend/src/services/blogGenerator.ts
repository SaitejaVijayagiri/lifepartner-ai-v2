import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const HIGH_VALUE_SEO_TOPICS = [
    // 🌸 High-Priority Women-First & Privacy Topics
    {
        topic: "Safe Matrimony for Working Women in India: Privacy, Autonomy & Equality",
        category: "women-first",
        keywords: ["safe matrimony for women", "career women marriage", "privacy in matrimony apps", "women first dating"]
    },
    {
        topic: "How Women Can Spot Online Matrimonial Catfish and Scammers Before Meeting",
        category: "women-first",
        keywords: ["matrimonial fraud prevention", "safe online dating for girls", "catfish detection matrimony"]
    },
    {
        topic: "Why Career-Oriented Women Prefer Modern AI Matchmaking Over Traditional Family Brokers",
        category: "women-first",
        keywords: ["working women matrimony", "arranged marriage alternatives", "modern brides india"]
    },
    {
        topic: "The Ultimate First Date Safety Checklist for Indian Women Meeting Online Matches",
        category: "women-first",
        keywords: ["first date safety tips", "dating safely in india", "safe dating for women"]
    },
    {
        topic: "Setting Financial Boundaries Before Marriage: What Every Indian Bride Should Ask",
        category: "women-first",
        keywords: ["financial compatibility marriage", "pre marriage questions", "indian women financial independence"]
    },

    // 🇮🇳 Indian Metro & Regional Matrimony Hubs
    {
        topic: "Tech Singles in Bengaluru: Finding Love Amid Startup Hours and Commutes",
        category: "indian-metros",
        keywords: ["Bangalore matrimony", "tech singles bangalore", "software engineer matrimony india"]
    },
    {
        topic: "Hyderabad Matrimony Guide: Blending Heritage with Modern Compatibility",
        category: "indian-metros",
        keywords: ["Hyderabad matrimony", "Telugu matrimony", "IT professionals marriage hyderabad"]
    },
    {
        topic: "Mumbai Matrimony & Dating: Fast-Paced Careers and Meaningful Commitments",
        category: "indian-metros",
        keywords: ["Mumbai matrimony", "dating in mumbai", "working professionals marriage mumbai"]
    },
    {
        topic: "Delhi NCR Matchmaking: Navigating Arranged Marriages with Modern Expectations",
        category: "indian-metros",
        keywords: ["Delhi matrimony", "NCR dating", "Gurgaon marriage singles"]
    },
    {
        topic: "Chennai & Tamil Matrimony: Preserving Values while Embracing Progressive Compatibility",
        category: "indian-metros",
        keywords: ["Tamil matrimony", "Chennai matrimony free", "tamil singles worldwide"]
    },
    {
        topic: "Pune Singles Matrimony: Where Cultural Roots Meet Cosmopolitan Ambitions",
        category: "indian-metros",
        keywords: ["Pune matrimony", "Marathi matrimony free", "pune singles dating"]
    },
    {
        topic: "Kolkata & Bengali Matrimony: Intellectual Conversations and Lifelong Partnerships",
        category: "indian-metros",
        keywords: ["Bengali matrimony", "Kolkata matrimony free", "intellectual dating india"]
    },

    // ✈️ NRI & International Diaspora Matrimony
    {
        topic: "NRI Matrimony in the USA: Overcoming Visa Complexities and Cultural Distance",
        category: "nri",
        keywords: ["NRI matrimony USA", "H1B marriage india", "Indian singles bay area", "indian dating new york"]
    },
    {
        topic: "Indian Singles in the UK: Finding a Life Partner Across London and the Midlands",
        category: "nri",
        keywords: ["NRI matrimony UK", "British Indian matrimony", "London Indian singles"]
    },
    {
        topic: "Canada NRI Matchmaking: Connecting Verified Indian Singles in Toronto and Vancouver",
        category: "nri",
        keywords: ["NRI matrimony Canada", "Toronto Indian matrimony", "Punjabi matrimony Canada"]
    },
    {
        topic: "Dubai & Gulf NRI Matrimony: Finding a Spouse in the UAE with Shared Values",
        category: "nri",
        keywords: ["Dubai Indian matrimony", "UAE matrimony", "Gulf NRI matchmaking"]
    },
    {
        topic: "Australia NRI Matrimony: Modern Matchmaking in Sydney, Melbourne & Brisbane",
        category: "nri",
        keywords: ["NRI matrimony Australia", "Indian singles Sydney", "Melbourne Indian matchmaking"]
    },
    {
        topic: "Singapore Indian Matrimony: High-Achieving Professionals Finding Lasting Love",
        category: "nri",
        keywords: ["Singapore Indian matrimony", "NRI singles Singapore", "tech matrimony singapore"]
    },

    // 🔮 Astrology, Kundali & Modern Compatibility
    {
        topic: "Understanding Ashtakoot Guna Milan: 36 Points of Kundli Matching Explained",
        category: "astrology",
        keywords: ["36 gun milan", "kundli matching for marriage", "guna milan points explained"]
    },
    {
        topic: "Manglik Dosha in Modern Times: Myths, Facts and Real Relationship Impact",
        category: "astrology",
        keywords: ["manglik dosha marriage", "manglik compatibility", "vedic astrology marriage"]
    },
    {
        topic: "When Kundali Matches but Personalities Don't: Navigating Emotional Compatibility",
        category: "astrology",
        keywords: ["kundli vs personality", "modern arranged marriage", "psychological compatibility"]
    },

    // 💡 Free Matrimony & Modern Dating Insights
    {
        topic: "Why 100% Free Matrimony Without Forced Subscriptions is the Future of Matchmaking",
        category: "general",
        keywords: ["free matrimony app", "free shaadi alternative", "free jeevansathi alternative"]
    },
    {
        topic: "How Direct In-App Chat and Video Calls Eliminate Marriage Middlemen",
        category: "general",
        keywords: ["direct chat matrimony", "free video call matrimony", "instant messaging matrimony"]
    },
    {
        topic: "Online Dating Tips for Introverts: How to Form Deep Connections Without Burnout",
        category: "general",
        keywords: ["dating for introverts", "introvert matrimony tips", "deep conversation starters"]
    }
];

function generateArticleContent(topic: string, category: string, keywords: string[]): { title: string; excerpt: string; meta_title: string; meta_description: string; content: string } {
    const title = `${topic} | LifePartner AI`;
    const meta_title = `${topic.length > 55 ? topic.substring(0, 55) : topic} | LifePartner AI`;
    const excerpt = `Comprehensive guide on ${topic}. Learn expert insights, practical advice, and modern matchmaking strategies on LifePartner AI.`;
    const meta_description = `Read our comprehensive guide on ${topic}. Discover verified insights, safety standards, and AI compatibility tips. 100% Free registration.`;

    let content = `<h2>Introduction: Understanding ${topic}</h2>
<p>When searching for a lifelong companion, navigating modern dynamics requires a balance between authentic connection, safety, and mutual respect. ${topic} has emerged as an essential consideration for singles across India and the global diaspora.</p>

<h3>Core Principles of Compatibility</h3>
<p>At LifePartner AI, our platform is built on transparency, zero subscription paywalls, and uncompromising privacy protection. Here is how modern couples can navigate this journey successfully:</p>
<ul>
    <li><strong>Honest Communication Early:</strong> Lay the groundwork by discussing life goals, family visions, and financial values upfront.</li>
    <li><strong>Verified Identity and Trust:</strong> Only engage with verified profiles that undergo identity checks to eliminate catfish and scammers.</li>
    <li><strong>Respecting Personal Boundaries:</strong> Whether communicating online or planning a first meeting, mutual consent and comfort are paramount.</li>
</ul>`;

    if (category === 'women-first') {
        content += `<h3>Safety, Autonomy, and Female-First Protection</h3>
<p>For women, safety is non-negotiable. LifePartner AI protects female users with:</p>
<ol>
    <li><strong>Masked Contact Numbers:</strong> Keep your personal contact information 100% private until you explicitly choose to share it.</li>
    <li><strong>Anti-Creep AI Filters:</strong> Inappropriate language, unsolicited numbers, and off-platform harassment are blocked automatically.</li>
    <li><strong>Screenshot-Proof Snaps:</strong> Disappearing photos protect your personal imagery from being saved or distributed without permission.</li>
    <li><strong>100% Lifetime VIP Free:</strong> All women enjoy unlimited direct chat, HD video calling, and priority matching completely free forever.</li>
</ol>`;
    } else if (category === 'nri') {
        content += `<h3>Bridging the Global Diaspora Gap</h3>
<p>Non-Resident Indians (NRIs) face a unique crossroad between traditional family values and fast-paced international careers. Navigating time zone differences, immigration regulations (H-1B, PR, Skilled Worker visas), and cultural preservation requires:</p>
<ul>
    <li><strong>Direct In-App HD Video Dates:</strong> See and hear your potential partner in high definition before committing to expensive international flights.</li>
    <li><strong>Shared Cultural Footprints:</strong> Connect on shared festivals, music playlists via Spotify, and regional language preferences (Telugu, Tamil, Hindi, Punjabi, Bengali, etc.).</li>
    <li><strong>Cross-Border Transparency:</strong> Clear, open conversations regarding dual-income households and international relocation plans.</li>
</ul>`;
    } else if (category === 'astrology') {
        content += `<h3>Balancing Vedic Wisdom and Modern Science</h3>
<p>While traditional Ashtakoot Guna Milan and birth charts (Patrika) offer profound symbolic guidance, true harmony requires emotional intelligence and shared lifestyle aspirations. LifePartner AI combines Vedic astrological profiling with cutting-edge psychological compatibility scoring so both families and couples have total confidence.</p>`;
    } else {
        content += `<h3>Breaking Free from Subscription Paywalls</h3>
<p>Traditional matrimony agencies charge exorbitant monthly fees just to unlock basic messages or view phone numbers. LifePartner AI restores human connection to where it belongs—100% free, direct, and accessible to everyone worldwide.</p>`;
    }

    content += `<h3>Next Steps on Your Journey</h3>
<p>Ready to meet verified, like-minded singles? Create your 100% free profile today on <a href="https://lifepartnerai.in/register">LifePartner AI</a> and experience the future of secure, meaningful matchmaking.</p>`;

    return { title, excerpt, meta_title, meta_description, content };
}

export async function generateBlogPost(topicInput?: string): Promise<boolean> {
    try {
        let selectedTopicObj = HIGH_VALUE_SEO_TOPICS.find(t => t.topic === topicInput);

        // If no topic passed or not found, find an uncreated topic from the list
        if (!selectedTopicObj) {
            for (const item of HIGH_VALUE_SEO_TOPICS) {
                const slugCandidate = item.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                const existing = await prisma.blog_posts.findUnique({
                    where: { slug: slugCandidate }
                });
                if (!existing) {
                    selectedTopicObj = item;
                    break;
                }
            }
        }

        // If all are created, pick a random one and append date suffix
        const topic = selectedTopicObj ? selectedTopicObj.topic : (topicInput || "Modern Matrimony & Matchmaking Guide");
        const category = selectedTopicObj ? selectedTopicObj.category : "general";
        const keywords = selectedTopicObj ? selectedTopicObj.keywords : [topic, "matrimony", "dating", "LifePartner AI"];

        let slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existing = await prisma.blog_posts.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        }

        console.log(`\n🤖 Generating SEO Blog Post for: "${topic}" (Slug: ${slug})...`);

        const articleData = generateArticleContent(topic, category, keywords);

        await prisma.blog_posts.create({
            data: {
                title: articleData.title,
                slug: slug,
                excerpt: articleData.excerpt,
                meta_title: articleData.meta_title,
                meta_description: articleData.meta_description,
                keywords: keywords,
                content: articleData.content
            }
        });

        console.log(`✅ Successfully generated and saved SEO Blog Post: ${articleData.title}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to generate blog post:`, error);
        return false;
    }
}
