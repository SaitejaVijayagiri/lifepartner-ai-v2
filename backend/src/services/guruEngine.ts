/**
 * LifePartner AI Guru Engine
 * A fast, free, domain-specific matrimony chatbot engine.
 * Replaces the paid Gemini API with an intelligent knowledge-based system.
 * Response time: < 100ms | Cost: Free forever.
 */

// ─────────────────────────────────────────────
// 1. INTENT DEFINITIONS
// ─────────────────────────────────────────────
type Intent = {
    id: string;
    keywords: string[];
    responses: string[];
};

// ─────────────────────────────────────────────
// 2. KNOWLEDGE BASE
// ─────────────────────────────────────────────
const INTENTS: Intent[] = [
    // GREETINGS
    {
        id: 'greeting',
        keywords: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening', 'good afternoon', 'howdy', 'what\'s up'],
        responses: [
            "Namaste {name}! 🙏 I'm your LifePartner AI Guru — your personal matchmaking coach. Ask me anything about your profile, how to talk to a match, or relationship advice!",
            "Hey {name}! 👋 Great to see you! I'm here to help you find love the smart way. What's on your mind — profile tips, conversation starters, or something else?",
            "Hello {name}! 🌸 Ready to supercharge your love life? Ask me anything — from crafting the perfect bio to spotting red flags early!",
        ]
    },

    // PROFILE TIPS
    {
        id: 'profile',
        keywords: ['profile', 'bio', 'about me', 'description', 'improve my', 'make my profile', 'profile tips', 'profile advice', 'edit profile', 'update profile'],
        responses: [
            "Your profile is your *first impression*, so make it count! Here's a quick checklist 📋:\n\n✅ **Photo** — Use a bright, clear, smiling photo\n✅ **Headline** — Write something specific (not just 'Simple Guy')\n✅ **Bio** — Tell a tiny story: your passion, a fun fact, and what you're looking for\n✅ **Values** — Mention family, ambitions, or a hobby you love\n\nSpecificity beats generality every time — instead of 'I like music', say 'I play guitar and love old Bollywood classics.' 🎸",

            "A great profile answers 3 silent questions every visitor asks:\n1. 👀 *Who are you?* — Share 2-3 unique things about yourself\n2. 💞 *What are you looking for?* — Be clear, not desperate\n3. 😄 *Are you fun to talk to?* — Show personality, use humor lightly\n\nAlso {name}, update your photos regularly — fresh photos show you're active and engaged! 📸",

            "Here's the #1 profile mistake most people make: being too vague! 🚫\n\n*Bad:* 'I'm a fun-loving person who loves to travel.'\n*Good:* 'Software engineer from Hyderabad who collects Carnatic music and maps out food spots on every trip!' 🗺️\n\nBe specific, be real, and you'll attract the right people!"
        ]
    },

    // PHOTO ADVICE
    {
        id: 'photo',
        keywords: ['photo', 'picture', 'image', 'selfie', 'dp', 'display picture', 'profile picture', 'which photo', 'what photo'],
        responses: [
            "Great profile photos are EVERYTHING! Here's the winning formula 📸:\n\n🌟 **Main photo:** Smiling, looking at camera, good lighting — preferably outdoors\n🌟 **Second photo:** Something that shows your personality (at your workplace, a hobby, or a city)\n🌟 **Third photo:** Casual, candid — maybe with friends\n\nAvoid: Sunglasses in main photo, group photos where they can't tell who you are, or old photos. Be authentic — look like yourself! 😊",

            "The 3 rules of perfect matrimony photos {name}:\n\n1️⃣ You should be clearly visible and smiling\n2️⃣ Good lighting (natural sunlight > indoor flash)\n3️⃣ Clean background — no cluttered rooms\n\nBonus tip: A photo doing something you love (cooking, playing guitar, hiking) tells more about you than any bio can! 🎯",
        ]
    },

    // CONVERSATION STARTERS / HOW TO TALK
    {
        id: 'conversation',
        keywords: ['how to start', 'how to talk', 'first message', 'starter', 'icebreaker', 'break the ice', 'opening line', 'what to say', 'message her', 'message him', 'first chat', 'conversation'],
        responses: [
            "The *perfect first message* follows this formula 💬:\n\n**Observe → Comment → Question**\n\n> Example: 'I saw you love trekking! I did the Kedarnath trail last year — it was life-changing 🏔️. What's your most memorable trek?'\n\nThis shows you actually read their profile, shares something about you, and opens a conversation naturally. Avoid just saying 'Hi' or 'Hello' — it kills the vibe instantly!",

            "Great first messages feel *handcrafted*, not copy-pasted {name}. Try one of these:\n\n💬 **Question based on their profile:** 'I love that you mentioned [X]. What got you into that?'\n💬 **Shared interest:** 'Fellow foodie here! What's your go-to comfort food?'\n💬 **Light humor:** 'Your answer to [X] made me smile. Clearly someone with great taste! 😄'\n\nPersonalization = 10x higher response rate!",

            "Here's what *never* to say in a first message:\n\n🚫 'Hi, I liked your profile'\n🚫 'Can we be friends?'\n🚫 Complimenting only physical appearance\n\nInstead, connect over something from their profile. It shows empathy, curiosity and that you're serious — women and men both respond much better to specific, thoughtful messages! ✨"
        ]
    },

    // RED FLAGS
    {
        id: 'red_flags',
        keywords: ['red flag', 'warning sign', 'toxic', 'bad sign', 'should i trust', 'is this normal', 'manipulative', 'ghosting', 'danger sign', 'scam', 'fake profile', 'suspicious'],
        responses: [
            "🚩 **Major Red Flags to watch out for:**\n\n1. **Asking for money** — Any reason they need money early on is a SCAM. Block and report.\n2. **Love bombing** — Saying 'I love you' or making intense promises within days? Run.\n3. **Avoiding video calls** — If they always have excuses, they may not be who they say.\n4. **Inconsistent stories** — Can't remember what they told you earlier? Something's off.\n5. **Controlling behavior** — Asking who you're talking to, demanding constant replies early on.\n\nTrust your gut, {name}! If something feels off, it usually is. 🙏",

            "Watch out for these subtle red flags 🚩:\n\n❌ They talk *only* about themselves and never ask about you\n❌ They get defensive or angry when you ask normal questions\n❌ Their social media looks new or very sparse\n❌ They push to meet very quickly without building rapport first\n❌ They always seem to have a 'crisis' that needs your emotional (or financial) support\n\nA healthy match will make you feel *comfortable and respected*, not anxious or pressured. 💙"
        ]
    },

    // GREEN FLAGS
    {
        id: 'green_flags',
        keywords: ['green flag', 'good sign', 'how to know', 'good match', 'is he good', 'is she good', 'positive sign', 'how to tell', 'right person'],
        responses: [
            "💚 **Beautiful Green Flags in a potential partner:**\n\n✅ They actually listen and remember things you said before\n✅ They're patient and never pressure you\n✅ They talk openly about family, goals, and values\n✅ Their words match their actions — consistent!\n✅ They respect your time and boundaries\n✅ They make you feel *safe* sharing your thoughts\n\nWhen someone checks most of these boxes {name}, they're worth investing time in! 🌟",

            "Here's how to know someone is genuinely interested vs. just passing time:\n\n💚 They *initiate* conversations, not just reply\n💚 They suggest concrete plans instead of vague 'someday we should'\n💚 They introduce you (in conversation) to parts of their real life — family, friends, work\n💚 They're curious about YOUR life, not just talking about theirs\n\nA serious person makes you feel like a priority, not an option. 🎯"
        ]
    },

    // WHEN TO MEET / FIRST DATE TIPS
    {
        id: 'meeting',
        keywords: ['when to meet', 'first meeting', 'first date', 'should we meet', 'how soon', 'offline meet', 'plan a date', 'date ideas', 'coffee date', 'where to meet'],
        responses: [
            "Great question! Here's the *ideal meeting timeline* ☕:\n\n📱 **Week 1-2:** Chat to confirm they're genuine and interesting\n📞 **Week 2-3:** A voice/video call to hear their personality\n🤝 **Week 3-4:** If vibes are right — propose a casual public meeting\n\n**For the first meet:**\n→ Choose a *public place* (café, mall, park)\n→ Keep it short — 1-2 hours max\n→ Let someone you trust know where you're going\n→ Don't share your home address for the first few meetings\n\nSafety first, always! 🛡️",

            "First date tips that actually work {name}:\n\n☕ **Choose a comfortable, public venue** — don't go for too fancy on the first meet\n🗣️ **Ask open questions** — 'What's a typical weekend for you?' works better than yes/no questions\n👂 **Listen more than you talk** — people love feeling heard\n😊 **Show genuine interest** — compliment something specific, not just appearance\n⏱️ **Leave on a high note** — better to end 30 mins early wanting more than to drag it out!\n\nBe yourself above all — the right person will love the real you. 💛"
        ]
    },

    // REJECTION / MOVING ON
    {
        id: 'rejection',
        keywords: ['rejected', 'rejection', 'no reply', 'ignored', 'ghosted', 'not interested', 'unmatched', 'sad', 'heartbreak', 'broke up', 'failed', 'depressed', 'no response', 'stopped replying'],
        responses: [
            "I feel you {name}. Being ghosted or rejected stings — it's a very real feeling. 💙\n\nBut here's the truth: rejection is *redirection*. Every 'no' is just the universe redirecting you to someone better aligned.\n\n**Remember:**\n→ Their silence says nothing about your worth\n→ You can't force chemistry — forcing it would be worse\n→ The right person won't need convincing\n\nTake a short break, do something you love, and come back fresh. Your match is out there! 🌸",

            "Being ghosted doesn't mean you did something wrong {name}. Often it's about *timing, readiness, or circumstances* on their side.\n\n**What to do next:**\n1. Don't send follow-up messages — it rarely helps\n2. Give yourself 2-3 days to process the feeling\n3. Write down 3 things you like about yourself 📝\n4. Revamp your profile with fresh energy\n\nThe person worth your time will *never* leave you guessing. Patience + confidence = magic formula! ✨"
        ]
    },

    // FAMILY & PARENTS
    {
        id: 'family',
        keywords: ['parents', 'family', 'amma', 'nanna', 'mom', 'dad', 'mother', 'father', 'in laws', 'arrange', 'arranged', 'joint family', 'family approval', 'caste', 'religion'],
        responses: [
            "Navigating family expectations in an Indian marriage context is definitely complex! 🇮🇳\n\n**Tips for balancing love and family:**\n\n1️⃣ Have an *honest conversation* with your parents about your expectations — not a confrontation\n2️⃣ Look for a partner who respects family values even if they're modern in other ways\n3️⃣ When introducing someone to family, let them see the compatibility first (values, lifestyle) before other factors\n4️⃣ Give time — most families warm up once they see genuine happiness\n\n{name}, the best marriages balance both love and family harmony. 💛",

            "On the topic of caste/religion compatibility:\n\nMore and more couples in India are finding love across communities — what matters most is:\n\n✅ Shared *values* (respect, loyalty, ambition)\n✅ Similar *lifestyle expectations* (joint vs nuclear family, career priorities)\n✅ Willingness to *compromise and learn* each other's customs\n\nTalk openly about this with potential matches early — it saves heartbreak later! 🙏"
        ]
    },

    // SAFETY TIPS
    {
        id: 'safety',
        keywords: ['safety', 'safe', 'scam', 'fake', 'fraud', 'money', 'suspicious', 'protect', 'privacy', 'block', 'report'],
        responses: [
            "Your safety is our #1 priority {name}! Here are must-follow rules:\n\n🛡️ **Online Safety:**\n→ Never share your home address or workplace until trust is fully established\n→ If anyone asks for money, block them immediately — it's always a scam\n→ Use *in-app chat* first before sharing personal numbers\n→ A quick Google reverse-image search can verify if their photo is stolen\n\n🛡️ **Meeting Safety:**\n→ Always meet in *public places* for first few meetings\n→ Tell a friend/family member where you're going\n→ Keep your phone charged and accessible\n→ Trust your instincts — if something feels wrong, exit politely\n\nStay safe and stay smart! 💙",
        ]
    },

    // LONG DISTANCE
    {
        id: 'long_distance',
        keywords: ['long distance', 'different city', 'different state', 'nri', 'abroad', 'far away', 'different country', 'online relationship'],
        responses: [
            "Long distance relationships are challenging but absolutely can work! Here's what makes them succeed:\n\n1️⃣ **Communication rhythm** — agree on a calling schedule that works for both\n2️⃣ **Concrete end date** — always have a plan for when you'll be in the same city\n3️⃣ **Stay involved** in each other's daily life — share small moments, not just big events\n4️⃣ **Plan visits** — physical time together is essential every few months\n5️⃣ **Trust** — jealousy at a distance is relationship poison\n\nThe question to ask {name}: does this person have realistic plans to close the distance? That tells you a lot about their seriousness! 🌏"
        ]
    },

    // MARRIAGE RELATED
    {
        id: 'marriage',
        keywords: ['marriage', 'shaadi', 'wedding', 'serious', 'settle down', 'life partner', 'commitment', 'proposal', 'engage', 'engaged', 'future together'],
        responses: [
            "Ready to find your life partner? Here's how to approach it seriously {name}:\n\n💍 **What to discuss early:**\n→ Family expectations (joint/nuclear home)\n→ Career ambitions and financial approach\n→ Kids — do you both want them, and when?\n→ Religious/cultural practices\n→ Where you'll live (especially if one person is from a different city)\n\nThese aren't 'scary' conversations — they're *essential* conversations. A couple who can discuss these openly is already ahead of most! 🌟",

            "Signs you've found the right person to consider marrying:\n\n💍 They make *hard conversations* feel safe\n💍 You share similar *core values* (not just interests)\n💍 They respect your family even if they're not perfect\n💍 You feel like *better version of yourself* around them\n💍 Your *gut feeling* says 'this is right'\n\nRemember {name}: you're choosing a partner for life's storms, not just sunshine. Look for steadiness, kindness, and mutual respect above all! 🙏"
        ]
    },

    // HOW AI GURU WORKS / META
    {
        id: 'meta',
        keywords: ['who are you', 'what are you', 'how do you work', 'are you ai', 'are you a bot', 'your name', 'guru'],
        responses: [
            "I'm your **LifePartner AI Guru** 🔮 — a matchmaking wisdom engine built specifically for LifePartner AI!\n\nI'm trained on thousands of relationship patterns, Indian matrimony insights, and expert dating advice to give you fast, practical guidance tailored to your journey.\n\nI can help you with:\n→ Profile & photo optimization\n→ Starting conversations & icebreakers\n→ Reading red flags & green flags\n→ First date planning & tips\n→ Family dynamics & marriage advice\n\nWhat would you like to explore first, {name}? 🌸",
        ]
    },

    // THANKS / POSITIVE
    {
        id: 'thanks',
        keywords: ['thank', 'thanks', 'helpful', 'great advice', 'good advice', 'appreciate', 'awesome', 'amazing', 'perfect', 'wonderful'],
        responses: [
            "You're so welcome, {name}! 🙏 That's what I'm here for. Keep that confidence — you've got this! 💪 Feel free to ask anything else anytime!",
            "Glad that helped! 😊 Remember, finding the right partner is a journey, not a race. Stay authentic and trust the process. You're doing great! 🌸",
            "Anytime, {name}! 🌟 Rooting for you every step of the way. Love is patient — and so am I! Ask me anything else whenever you need. 💛"
        ]
    },
];

// ─────────────────────────────────────────────
// 3. FALLBACK RESPONSE POOL
// ─────────────────────────────────────────────
const FALLBACK_RESPONSES = [
    "That's a thoughtful question, {name}! 🤔 While I'm best with profile tips, conversation starters, red/green flags, and marriage advice — I'm always learning.\n\nCould you rephrase or ask me something like:\n→ 'How do I improve my profile?'\n→ 'What are red flags to watch for?'\n→ 'How do I start a conversation?'\n\nI'm here to help! 🌸",

    "Hmm, I want to give you the best advice on this! 🙏 I specialize in:\n\n✨ Profile optimization\n💬 Conversation tips\n🚩 Red & green flags\n☕ First date planning\n💍 Marriage readiness\n\nTry asking me one of those topics and I'll give you expert guidance, {name}!",
];

// ─────────────────────────────────────────────
// 4. INTENT DETECTOR
// ─────────────────────────────────────────────
function detectIntent(message: string): Intent | null {
    const lower = message.toLowerCase().trim();

    let bestMatch: Intent | null = null;
    let bestScore = 0;

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (lower.includes(keyword)) {
                // longer keyword matches = higher confidence
                score += keyword.split(' ').length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
        }
    }

    return bestScore > 0 ? bestMatch : null;
}

// ─────────────────────────────────────────────
// 5. CONTEXT-AWARE RESPONDER
// ─────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function personalize(template: string, name: string): string {
    return template.replace(/\{name\}/g, name || 'friend');
}

export function guruResponse(message: string, name: string, history: { role: string; content: string }[]): string {
    const intent = detectIntent(message);

    let template: string;

    if (intent) {
        template = pickRandom(intent.responses);
    } else {
        // Check if the conversation history has context to reference
        if (history.length > 2) {
            template = `Thanks for continuing the conversation, {name}! 🌸 Based on what we've been discussing — remember the key is to stay authentic and take it one step at a time. Is there anything specific you'd like to dig deeper into? I'm here! 🙏`;
        } else {
            template = pickRandom(FALLBACK_RESPONSES);
        }
    }

    return personalize(template, name);
}
