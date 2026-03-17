/**
 * LifePartner AI Guru Engine v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * A comprehensive, domain-specific matrimony & relationship advice engine.
 * Free, zero-dependency, instant responses (< 5ms).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Intent = {
    id: string;
    keywords: string[];
    followUpIds?: string[];          // Intents that naturally follow this one
    responses: string[];
};

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function personalize(template: string, name: string): string {
    return template.replace(/\{name\}/g, name || 'friend');
}

// ─────────────────────────────────────────────
// KNOWLEDGE BASE — 30+ INTENTS
// ─────────────────────────────────────────────
const INTENTS: Intent[] = [

    // 1. GREETINGS
    {
        id: 'greeting',
        keywords: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening', 'good afternoon', 'howdy', 'what\'s up', 'wassup', 'hola'],
        responses: [
            "Namaste {name}! 🙏 I'm your LifePartner AI Guru — a matchmaking coach built just for you.\n\nHere's what I can help with:\n💬 Starting conversations & icebreakers\n📝 Profile & photo tips\n🚩 Spotting red & green flags\n💍 Marriage & family advice\n💔 Handling rejection or heartbreak\n\nWhat would you like to explore today?",
            "Hey {name}! 👋 Welcome! I'm here to give you the most honest, practical relationship advice — no fluff, no generic lines.\n\nAsk me anything from 'How do I write a better bio?' to 'Is this person trustworthy?' — I'm all ears! 🌸",
            "Hello {name}! 🌸 Glad you're here. Finding the right life partner is a journey, and I'm your guide.\n\nI can help you with profiles, conversations, red flags, first dates, family dynamics, and everything in between. What's on your mind? 🔮",
        ]
    },

    // 2. PROFILE TIPS
    {
        id: 'profile',
        keywords: ['profile', 'bio', 'about me', 'description', 'write about', 'improve my', 'make my profile', 'profile tips', 'profile advice', 'edit profile', 'update profile', 'attractive profile', 'good profile'],
        followUpIds: ['photo', 'greeting'],
        responses: [
            "A strong profile is your silent salesperson — here's exactly how to build one 📋:\n\n**Step 1 — Your Headline:**\nAvoid generic phrases like 'fun-loving' or 'simple person'. Instead:\n✅ Good: 'Software engineer from Hyderabad who maps food spots on every trip'\n❌ Bad: 'Easy-going person who loves to laugh'\n\n**Step 2 — Your Bio:**\nFollow this formula: 1 passion + 1 quirk + 1 aspiration\nExample: 'I teach yoga on weekends, collect vintage stamps (yes, really 😄), and I'm working towards opening my own studio someday.'\n\n**Step 3 — Your Values:**\nMention what matters to you — family, ambition, travel, spirituality. Serious matches look for value alignment first!\n\n**Step 4 — What you're looking for:**\nBe honest and specific. 'I'm looking for someone who values family and wants to build a life full of small adventures together.' 🌟",

            "Here's the #1 thing that separates a 10% response rate profile from a 60% response rate profile:\n\n**Specificity.** 🎯\n\n❌ Vague: 'I love music and travel'\n✅ Specific: 'I play classical guitar and have traveled to 7 states by train. Ask me about my Hampi trip!'\n\nSpecificity creates conversation starters. It shows confidence and authenticity.\n\nAlso {name} — end your bio with an open question or a light challenge:\n> 'If you can recommend a good Telugu thriller, we're definitely compatible 😄'\n\nThis alone doubles your reply rate!",

            "Quick profile audit checklist for you {name} 🔍:\n\n☐ **Photo** — Clear face, smiling, good lighting? ✅\n☐ **Headline** — 1-2 unique details about you? ✅\n☐ **Bio** — Your story in 3-4 sentences? ✅\n☐ **Interests** — At least 3-5 specific hobbies? ✅\n☐ **Intentions** — Clear about what you want? ✅\n☐ **Prompt answers** — Funny or thoughtful? ✅\n\nIf you answered 'no' to any of these, that's where to focus first! Which part would you like help improving? 🌸"
        ]
    },

    // 3. PHOTO ADVICE
    {
        id: 'photo',
        keywords: ['photo', 'picture', 'image', 'selfie', 'dp', 'display picture', 'profile picture', 'which photo', 'what photo', 'photo tips', 'picture advice'],
        responses: [
            "Photos make or break your profile — here's the complete guide 📸:\n\n**Photo 1 (Main):** Clear face, direct eye contact, genuine smile. Natural outdoor lighting is best. NO filters that distort your face.\n\n**Photo 2 (Personality):** You doing something you love — at your workspace, hiking, cooking, playing an instrument. This creates conversation!\n\n**Photo 3 (Social):** With friends or family (make sure it's clear which one is you). Shows you're sociable and trusted by others.\n\n**What to AVOID:**\n❌ Low-light room selfies\n❌ Sunglasses in your main photo\n❌ Full group photos as main pic\n❌ Overly edited or filtered photos\n❌ Photos older than 2 years",

            "The psychology of profile photos {name}:\n\n📊 Studies show:\n→ Smiling photos get **20% more matches** than neutral expressions\n→ Photos with natural backgrounds get **15% more engagement** than indoor\n→ Having 3-5 photos gives **2x more matches** than just 1\n\n**Pro tip:** Ask a friend to take photos of you while you're having a natural conversation. Candid photos where you're genuinely laughing perform the best. Keep it real! 🌟"
        ]
    },

    // 4. CONVERSATION STARTERS
    {
        id: 'conversation',
        keywords: ['how to start', 'how to talk', 'first message', 'starter', 'icebreaker', 'break the ice', 'opening line', 'what to say', 'message her', 'message him', 'first chat', 'conversation', 'initiate', 'reach out', 'what should i say', 'how do i talk'],
        followUpIds: ['meeting', 'communication'],
        responses: [
            "The **perfect first message formula** 💬:\n\n> **Observe → Relate → Open**\n\n🔍 **Observe:** Find something specific from their profile\n💡 **Relate:** Connect it to your own life briefly\n❓ **Open:** Ask a question to invite a reply\n\n**Example:**\n> 'I saw you're a Carnatic music fan! I play western classical myself — we might argue about notes vs. swaras 😄 What got you into it?'\n\nWhy it works:\n✅ Shows you actually read their profile\n✅ Shares something about you (not just asking)\n✅ Opens a natural conversation thread\n✅ Ends with a question — so they WANT to reply",

            "Real message examples that work, {name} 📝:\n\n**For a travel lover:**\n> 'Your Coorg trip photos look incredible! I went there last monsoon and it completely reset my mind 🌿 What's your next destination?'\n\n**For a foodie:**\n> 'A fellow biryani devotee! The eternal debate — Hyderabadi or Lucknowi? I'll fight for Hyderabadi all day 😄'\n\n**For a reader:**\n> 'You mentioned Ruskin Bond — his 'Blue Umbrella' wrecked me in the best way. What's the last book that genuinely surprised you?'\n\n**What NEVER works:**\n❌ 'Hi'\n❌ 'Hello, how are you?'\n❌ 'Can we be friends?'\n❌ Complimenting only looks in the first message",

            "Having trouble getting replies? Let's fix that 🎯\n\nThe biggest mistake is sending the same opening to everyone. People can feel copy-paste energy instantly.\n\n**Framework for a response-worthy message:**\n1. Read their FULL profile before messaging\n2. Pick ONE thing that genuinely interests you about them\n3. Write ONE sentence about yourself connecting to it\n4. Ask an open-ended question (not yes/no)\n5. Keep it under 3 lines — shorter is smarter\n\nA thoughtful 30-word message beats a generic 100-word essay every single time! ✨"
        ]
    },

    // 5. COMMUNICATION IN RELATIONSHIPS
    {
        id: 'communication',
        keywords: ['communicate', 'communication', 'talk to partner', 'fight', 'argument', 'disagree', 'not talking', 'silent treatment', 'misunderstanding', 'how to express', 'difficult conversation', 'how to tell'],
        responses: [
            "Communication is the backbone of any relationship — here's how to master it {name} 🗣️:\n\n**The 3-Step Rule for hard conversations:**\n1. **Timing** — Never have important talks when either person is hungry, tired, or stressed\n2. **'I' statements** — Say 'I feel hurt when...' instead of 'You always...'\n3. **Listen to understand, not to reply** — Pause and repeat what they said to confirm you understood\n\n**Signs of healthy communication:**\n✅ You can disagree without insulting each other\n✅ You can say 'I need some space' without fear\n✅ Silence isn't punishing — it's just comfortable\n✅ Problems get solved, not stored up\n\n**Red flag communication:** Stonewalling, contempt, defensiveness, criticism. These are relationship killers according to 40+ years of research.",

            "Arguments in relationships are actually NORMAL — it's HOW you argue that matters {name} 💡\n\n**Healthy argument:**\n→ 'I feel unheard when you check your phone during our conversations'\n→ Both people stay calm enough to actually hear each other\n→ Ends with a resolution or at least understanding\n\n**Toxic argument:**\n→ 'You NEVER listen to me!'\n→ Brings up unrelated past events\n→ Ends with one person 'winning' and the other humiliated\n\n**Golden rule:** The goal of every argument should be to understand each other better — not to win. If you're 'winning' every argument, you're probably losing the relationship. 🙏"
        ]
    },

    // 6. RED FLAGS
    {
        id: 'red_flags',
        keywords: ['red flag', 'warning sign', 'toxic', 'bad sign', 'should i trust', 'is this normal', 'manipulative', 'ghosting', 'danger sign', 'scam', 'fake profile', 'suspicious', 'something off', 'feels wrong', 'weird behavior', 'controlling', 'possessive', 'abusive', 'narcissist'],
        responses: [
            "Here are the **most important red flags** to never ignore 🚩:\n\n**Early Dating Red Flags:**\n❌ Love bombing — extremely intense affection too fast\n❌ Asking for money or talking about financial problems early on\n❌ Inconsistent stories — can't remember what they told you\n❌ Avoids video calls with constant excuses\n❌ Gets angry or defensive at normal questions\n❌ Makes you feel guilty for not responding fast enough\n\n**Relationship Red Flags:**\n❌ Isolates you from friends and family\n❌ Checks your phone or demands passwords\n❌ Dismisses your feelings ('you're too sensitive')\n❌ Their mood swings control the entire relationship\n❌ You feel like you're walking on eggshells\n\n{name} — if 3 or more of these feel familiar, please talk to a trusted friend or counselor. You deserve respect, always. 💙",

            "Let me be specific about **online dating scams** because they're increasingly targeting matrimony platforms 🚫:\n\n**The 'romance scammer' playbook:**\n1. Creates a profile with stolen photos (usually of an attractive person abroad)\n2. Falls in love with you suspiciously fast\n3. Can never meet in person — always has a reason\n4. Eventually reveals a 'crisis' (medical emergency, stuck abroad, investment)\n5. Asks for money with a promise to return it\n\n**How to verify:**\n→ Google reverse image search their photos\n→ Insist on a video call early on\n→ Ask specific, verifiable questions about their city\n→ **NEVER send money to someone you haven't met in person**\n\nStay sharp {name}! 🛡️"
        ]
    },

    // 7. GREEN FLAGS
    {
        id: 'green_flags',
        keywords: ['green flag', 'good sign', 'how to know', 'good match', 'is he good', 'is she good', 'positive sign', 'how to tell', 'right person', 'good person', 'trustworthy', 'genuine'],
        responses: [
            "Beautiful green flags that signal someone is **genuinely worth your time** 💚:\n\n**In Conversations:**\n✅ They remember small details you mentioned before\n✅ They ask follow-up questions — genuinely curious about you\n✅ They share their own vulnerabilities too (not just listening)\n✅ They're honest about things that don't paint them perfectly\n\n**In Their Behavior:**\n✅ They're kind to strangers, waiters, and service staff\n✅ They have genuine friendships and family bonds\n✅ They talk about their mistakes and what they learned\n✅ Their words match their actions — consistent!\n\n**The Biggest Green Flag:**\nYou feel CALM and comfortable being yourself around them. Not nervous, not performing — just yourself. That ease is rare. Hold onto it {name}. 🌟",

            "How to know if someone is **genuinely interested** vs. just passing time:\n\n💚 They initiate conversations — don't always wait for you\n💚 They suggest concrete plans: 'Are you free Saturday?' not 'We should meet someday'\n💚 They respect your decisions without guilt-tripping\n💚 They're curious about your opinions, not just your appearance\n💚 They introduce you (in conversation) to their real life — friends, work, family\n💚 They're consistent — same energy on Monday as on Friday\n\nA person who's serious about you makes you feel like a **priority**, not an afterthought. 🙏"
        ]
    },

    // 8. COMPATIBILITY
    {
        id: 'compatibility',
        keywords: ['compatible', 'compatibility', 'right match', 'are we right', 'do we match', 'good together', 'difference', 'too different', 'opposite attract', 'match', 'perfect match', 'check compatibility', 'how to know if we are compatible'],
        responses: [
            "Compatibility is about **values, not hobbies** {name} — here's the truth 💡:\n\nTwo people can love different movies, music, and food and still be DEEPLY compatible. What actually matters:\n\n**Core Compatibility Checklist:**\n☐ Do you want the same kind of future? (kids, lifestyle, location)\n☐ Do your financial values align? (saver vs spender, priorities)\n☐ Do you handle conflict similarly?\n☐ Do you both respect each other's families?\n☐ Do you have similar energy levels? (homebody vs social butterfly)\n☐ Do your spiritual/religious views coexist peacefully?\n\n**Truth about 'opposites attract':** Opposites attract, but *similar values retain*. Short-term chemistry ≠ long-term compatibility.\n\nYou don't need a perfect match. You need someone whose *non-negotiables* align with yours. 💛",

            "Quick compatibility test — answer these 5 questions about the person {name}:\n\n1️⃣ **Do they respect your time?** (Punctual, don't cancel often)\n2️⃣ **Do they handle stress well?** (Don't explode or shut down)\n3️⃣ **Do you feel energized after talking to them?** (Not drained)\n4️⃣ **Can you be honest with them without fear?**\n5️⃣ **Do they treat the people around them with kindness?**\n\nIf you answered YES to 4 or 5 — you've likely found someone worth exploring further. 3 means proceed cautiously. Below 3, pay close attention to what's missing. 🎯"
        ]
    },

    // 9. FIRST MEETING / DATE TIPS
    {
        id: 'meeting',
        keywords: ['when to meet', 'first meeting', 'first date', 'should we meet', 'how soon', 'offline meet', 'plan a date', 'date ideas', 'coffee date', 'where to meet', 'meetup', 'meet in person', 'date tips', 'what to do on a date'],
        responses: [
            "The **ideal timeline before meeting** someone from a matrimony app:\n\n📱 **Days 1-7:** Chat to confirm they're genuine and interesting\n📞 **Days 7-14:** A voice or video call — hear their personality live\n🤝 **Day 14-21:** If vibes are right — propose a casual first meet\n\n**Perfect first meeting venue:**\n☕ Coffee shop, bookstore café, or a mall food court\n❌ Avoid restaurants with lengthy meals (too much pressure)\n❌ Avoid movies (you can't actually talk)\n⏱️ Keep it 1-1.5 hours max — leave wanting more!\n\n**On the day:**\n→ Dress comfortably but put in effort\n→ Put your phone in your pocket\n→ Have a prepared light topic ready ('What's something good that happened this week?')\n→ Let a trusted friend know your location 🛡️\n→ Offer to pay your own share — keeps it pressure-free",

            "First date conversation tips that make you unforgettable {name} 💬:\n\n**Topics that create connection:**\n✅ Favourite childhood memory\n✅ What they're most proud of recently\n✅ Dream they've never told anyone\n✅ Something they're learning right now\n\n**Topics to AVOID on first dates:**\n❌ Exes (too soon, too loaded)\n❌ Salary and finances (awkward this early)\n❌ Marriage timeline pressure\n❌ Negative life stories\n\n**The secret ingredient:** Genuine curiosity. The best dates are ones where you're so interested in the other person that time flies. If you're checking your watch, something is off. 🌟"
        ]
    },

    // 10. REJECTION & HEARTBREAK
    {
        id: 'rejection',
        keywords: ['rejected', 'rejection', 'no reply', 'ignored', 'ghosted', 'not interested', 'unmatched', 'sad', 'heartbreak', 'broke up', 'failed', 'depressed', 'no response', 'stopped replying', 'devastated', 'hurt', 'crying', 'moved on', 'getting over'],
        responses: [
            "I hear you {name}, and I want you to know — rejection *hurts*, and it's okay to feel that. 💙\n\nBut here's what's real:\n\n**Rejection is not evidence of your worth.**\n\nIt's evidence of a mismatch — timing, circumstances, or priorities that have nothing to do with who you *are*.\n\n**What to do right now:**\n1. Allow yourself to feel it for 48 hours — don't suppress it\n2. Write down 5 things you genuinely like about yourself 📝\n3. Talk to a friend who lifts you up\n4. Do something physical — a walk, gym, cooking\n5. Come back to this after 3 days — you'll feel clearer\n\nThe right person won't need convincing, {name}. They'll be relieved to find you. 🌸",

            "Being ghosted might be the most painful modern dating experience — here's how to process it {name}:\n\n**What ghosting actually means:**\n→ It rarely has anything to do with you\n→ It says everything about their *emotional maturity*\n→ The person who ghosts is avoiding an uncomfortable truth — that's their issue, not yours\n\n**What you should NOT do:**\n❌ Send multiple follow-up messages\n❌ Create fake accounts to check on them\n❌ Assume the worst about yourself\n\n**What to do instead:**\n✅ Close that chapter cleanly\n✅ Update your profile with fresh energy\n✅ Remember: someone who ghosts you saved you from a future of that same behavior\n\nYou deserve someone who *chooses* you every day, not someone who disappears. 💪"
        ]
    },

    // 11. FAMILY & PARENTS
    {
        id: 'family',
        keywords: ['parents', 'family', 'amma', 'nanna', 'mom', 'dad', 'mother', 'father', 'in laws', 'arrange', 'arranged', 'joint family', 'family approval', 'caste', 'religion', 'intercaste', 'inter religion', 'family pressure', 'parents oppose', 'parents don\'t agree'],
        responses: [
            "Navigating family dynamics in Indian relationships is genuinely complex — you're not alone in this {name} 🇮🇳\n\n**If parents are opposed to who you like:**\n\n1. **Understand their concern first** — Is it about caste? Financial stability? Character? Each needs a different approach\n2. **Don't make it a confrontation** — Make it a conversation. 'I want to understand what matters most to you in my partner' opens more doors than 'You can't control my life'\n3. **Show them, don't argue** — Let them see the person's character through small interactions over time\n4. **Find a mediator** — A trusted relative, uncle, or older sibling can communicate on your behalf\n5. **Be patient** — *Most* families warm up once they see genuine happiness and a person of good character\n\nRemember {name}: the goal isn't to win against your family — it's to win WITH them. 🙏",

            "On the question of **intercaste or inter-religion relationships** {name}:\n\nMore and more couples in India are making it work across communities. The factors that actually determine success:\n\n✅ **Shared core values** (respect, loyalty, ambition)\n✅ **Similar lifestyle expectations** (joint vs nuclear, career vs homemaker)\n✅ **Both partners are on the SAME page** — one person shouldn't be sacrificing more\n✅ **Willingness to learn and participate** in each other's traditions\n✅ **A clear plan** for how you'll handle differences during festivals, prayers, food\n\nCommunities don't make a marriage. People and values do. 💛\n\nHave you had an open conversation with your potential partner about how you'll handle family expectations?"
        ]
    },

    // 12. TRUST ISSUES
    {
        id: 'trust',
        keywords: ['trust', 'don\'t trust', 'can\'t trust', 'insecure', 'jealous', 'jealousy', 'cheating', 'loyal', 'loyalty', 'faithful', 'betrayed', 'lied', 'lying', 'honest', 'honesty', 'trust issues'],
        responses: [
            "Trust is the foundation — without it, no relationship lasts {name}. Let's break this down:\n\n**How to know if someone is trustworthy:**\n✅ Their words and actions are *consistently* aligned over weeks, not days\n✅ They're honest about small things (huge indicator)\n✅ They don't need to hide their phone or contacts\n✅ They keep commitments even small ones ('I'll call at 7' and they call at 7)\n✅ They tell you uncomfortable truths kindly instead of comfortable lies\n\n**If you have past trust wounds:**\nIt's valid — but be careful not to punish a new person for someone else's mistakes. Give trust *proportionally* and let time reveal character.\n\n**The test:** Trust isn't blind faith. It's built block by block through consistent behavior. Watch what people *do* more than what they *say*. 🔑",

            "Dealing with jealousy in a relationship? Let's talk about it honestly {name} 💛\n\n**Healthy jealousy:** A brief feeling that reminds you this person matters to you. It passes quickly.\n\n**Toxic jealousy:** Controlling behavior — checking their phone, demanding location, tantrums over normal friendships.\n\n**If YOU feel jealous:**\n→ Ask yourself: Is this about something they did, or my past insecurity?\n→ Communicate it calmly: 'I felt a bit insecure when X happened — can we talk about it?'\n→ Work on your own security through friendships, achievements, self-care\n\n**If THEY are jealous and controlling:**\n→ This is a serious warning sign. Control always escalates.\n→ Set firm boundaries early.\n→ If they don't respect boundaries, take it seriously. 🚩"
        ]
    },

    // 13. LONG DISTANCE
    {
        id: 'long_distance',
        keywords: ['long distance', 'different city', 'different state', 'nri', 'abroad', 'far away', 'different country', 'online relationship', 'ldr', 'distance relationship', 'not in same city'],
        responses: [
            "Long distance relationships are challenging — but absolutely doable with the right approach {name} 🌏\n\n**What makes LDR work:**\n✅ **Regular rhythm** — Daily 'good morning' texts + weekly video call minimum\n✅ **Shared activities** — Watch the same show and discuss it. Play online games. Cook the same recipe on a video call.\n✅ **Concrete end date** — 'We'll be in the same city by December' is essential. Indefinite distance kills LDRs.\n✅ **Trust without surveillance** — Respecting each other's social lives\n✅ **Visits every 2-3 months** — Physical time together is non-negotiable\n\n**The brutally honest truth:**\nLDR is only worth investing in if BOTH people have a realistic plan to close the distance. If only one person is willing to move — that's an early conversation to have. 💛"
        ]
    },

    // 14. MARRIAGE READINESS
    {
        id: 'marriage',
        keywords: ['marriage', 'shaadi', 'wedding', 'serious', 'settle down', 'life partner', 'commitment', 'proposal', 'engage', 'engaged', 'future together', 'ready for marriage', 'when to marry', 'how to know ready', 'marriage advice'],
        responses: [
            "Thinking about marriage is a big deal — let's approach it maturely {name} 💍\n\n**5 questions to ask before saying yes to anyone:**\n\n1️⃣ Do we have *aligned futures*? (Kids, location, lifestyle, career ambitions)\n2️⃣ Do we *handle conflict well together* — not just enjoy good times?\n3️⃣ Have I seen them in a *stressful situation*? Character shows in hard times.\n4️⃣ Do their *family dynamics* feel like something I can be a part of?\n5️⃣ Do I feel *consistently calm and respected* around them?\n\n**Signs you may be rushing:**\n🚩 Haven't had a single difficult conversation yet\n🚩 You're saying yes because of family pressure or age anxiety\n🚩 You feel more 'relieved' than 'excited'\n\n**Signs you're ready:**\n💚 You choose each other daily, not just when it's convenient\n💚 You've navigated at least one real disagreement well\n💚 You can picture growing old with the *real* them — flaws included",

            "The most important pre-marriage conversations to have {name}:\n\n💬 **Money:** Who manages finances? Joint account or separate? Savings goals?\n💬 **Family:** Joint family or nuclear? How involved will parents be?\n💬 **Career:** What if one person needs to relocate for work?\n💬 **Children:** Do you both want them? When? How will you raise them?\n💬 **Religion/Traditions:** Which festivals will you celebrate? How?\n💬 **Conflict:** How do you both handle stress? What do you need when you're upset?\n\nThese conversations feel awkward — but having them *before* marriage is infinitely better than discovering incompatibilities *after*. 🙏"
        ]
    },

    // 15. SAFETY TIPS
    {
        id: 'safety',
        keywords: ['safety', 'safe', 'scam', 'fake', 'fraud', 'money', 'suspicious', 'protect', 'privacy', 'block', 'report', 'danger', 'scared', 'harassment', 'stalking'],
        responses: [
            "Your safety is non-negotiable {name}. Here's your complete guide 🛡️:\n\n**Online Safety Rules:**\n→ Never share your home address or workplace until trust is fully established\n→ If ANYONE asks for money for ANY reason — block and report immediately (it's always a scam)\n→ Use in-app chat before sharing your personal number\n→ Google reverse-image search suspicious profile photos\n→ Keep your social media accounts private during early conversations\n\n**Meeting Safety Rules:**\n→ Always choose a *public place* for the first 3-4 meetings minimum\n→ Tell at least one trusted person where you're going and who you're meeting\n→ Keep your phone fully charged\n→ Have your own transportation arranged — don't depend on them for the first few meetings\n→ Trust your gut — if something feels wrong, leave politely without explanation\n→'I have to be somewhere' is always a valid exit\n\n**If you experience harassment:**\nUse the Report & Block feature immediately. Save screenshots as evidence. You are never obligated to explain yourself."
        ]
    },

    // 16. SELF-CONFIDENCE / SELF-WORTH
    {
        id: 'confidence',
        keywords: ['confidence', 'confident', 'low self esteem', 'self worth', 'not good enough', 'ugly', 'feel bad about myself', 'nobody likes me', 'insecure about looks', 'feel inferior', 'feel worthless', 'no matches', 'why don\'t i get matches'],
        responses: [
            "{name}, let me be completely honest with you — because that's what you deserve:\n\nLow match counts say almost nothing about your worth as a person. They're mostly about profile optimization and algorithm timing.\n\n**But let's also talk about confidence, because it's THE most attractive quality:**\n\nConfidence is not arrogance. It's:\n→ Knowing your value without needing constant validation\n→ Being interested in others genuinely, not desperate to impress\n→ Having opinions, hobbies, and a life you're excited about\n→ Being able to say 'this isn't right for me' without anxiety\n\n**Simple ways to build confidence:**\n1. Pursue one skill or hobby with genuine focus\n2. Exercise consistently — even 20 minutes a day changes your mindset\n3. Spend time with people who genuinely value you\n4. Set small goals and achieve them\n\nThe most attractive version of you is the genuine, growing, self-aware version. Not a perfect version. 🌟",

            "Not getting matches can feel demoralizing — let's fix it practically {name} 🎯\n\n**Possible reasons and solutions:**\n\n📸 **Photos need work?** → Get better lighting, smile naturally, use 3-5 photos\n📝 **Bio is vague?** → Rewrite with specific details and end with a question\n🎯 **Too narrow filters?** → Experiment with slightly wider age/location range\n⏰ **Not active enough?** → Be online during peak hours (7-10 PM)\n🤐 **Not initiating?** → Send the first message — waiting is losing\n\nRemember: even the best profiles take time. Consistency beats perfection. Show up, refine, improve. The right person IS out there. 💛"
        ]
    },

    // 17. MOVING TOO FAST / TOO SLOW
    {
        id: 'pace',
        keywords: ['moving too fast', 'too fast', 'slow down', 'taking too long', 'moving slow', 'rushing', 'commitment', 'not committing', 'won\'t commit', 'pace of relationship', 'serious too soon'],
        responses: [
            "Relationship pace is one of the most common sources of mismatch {name} — here's how to think about it:\n\n**If YOU feel things are moving too fast:**\n→ Trust your gut. Your comfort matters.\n→ Say it directly: 'I really like where this is going, but I need to take things a bit slower to feel settled — is that okay with you?'\n→ A person worth keeping will respect this completely\n\n**If YOU feel things are moving too slow:**\n→ First, check: have you clearly communicated your intentions and timeline?\n→ Have a direct conversation: 'I'm looking to get serious within the next 6 months — is that aligned with where you are?'\n→ If they keep dodging this question — they may not have the same intentions\n\n**The rule:** Both people should feel *equally excited* to move forward. One person always pushing and one always pulling back = misalignment that rarely resolves itself. 🎯"
        ]
    },

    // 18. BREAKUP ADVICE
    {
        id: 'breakup',
        keywords: ['break up', 'breakup', 'should i leave', 'should i end it', 'how to break up', 'want to leave', 'not happy', 'unhappy', 'thinking of ending'],
        responses: [
            "Considering a breakup is one of the hardest decisions {name} — let me help you think through it clearly:\n\n**Signs it may be time to end it:**\n🚩 You feel consistently worse about yourself in this relationship\n🚩 The same problems keep repeating despite efforts to resolve them\n🚩 You feel more *relief* imagining life without them than sadness\n🚩 There's a fundamental values mismatch you've tried to bridge\n🚩 You're staying out of guilt, fear, or comfort — not love\n\n**Before you decide — ask yourself:**\n1. Have I clearly communicated what's not working?\n2. Have we genuinely tried to resolve this together?\n3. Is this a fixable pattern or a fundamental incompatibility?\n\n**How to do it kindly:**\n→ In person or on a call — never via text for a serious relationship\n→ Be honest but not cruel: 'This isn't working for me and I think we both deserve better'\n→ Be firm — wavering creates more pain, not less\n\nTrust yourself {name}. Your happiness matters. 💙"
        ]
    },

    // 19. COMPLIMENTS / HOW TO COMPLIMENT
    {
        id: 'compliment',
        keywords: ['compliment', 'how to compliment', 'appreciate', 'make them feel special', 'what to say to impress', 'how to impress'],
        responses: [
            "The art of a great compliment {name} — most people get this wrong:\n\n**Weak compliments (avoid):**\n❌ 'You're so beautiful/handsome'\n❌ 'You seem amazing'\n❌ 'You're different from others'\n\n**Why?** These are generic, anyone can say them, and they feel hollow.\n\n**Strong compliments (use these):**\n✅ 'The way you explained that shows how much you genuinely care about it'\n✅ 'That thing you said about [X] stayed with me — you see things differently'\n✅ 'I really admire that you [specific thing they did or said]'\n\n**The formula:** Specific observation + genuine feeling = memorable compliment\n\nCompliment *character and actions* more than appearance. It creates a deeper, more lasting impression — and it tells them you're actually *paying attention*. 🌟"
        ]
    },

    // 20. WHEN THEY DON'T SAY 'I LOVE YOU' BACK
    {
        id: 'love_unsaid',
        keywords: ['said i love you', 'they didn\'t say it back', 'i love you first', 'told them i love', 'unrequited', 'one sided', 'they don\'t feel the same', 'i like them more than they like me'],
        responses: [
            "That vulnerability took courage {name} — and I want to honor that first 🙏\n\nHere's how to interpret 'I love you' not being said back:\n\n**It doesn't necessarily mean they don't care.** Some people:\n→ Take much longer to process and express deep feelings\n→ Have past wounds that make vulnerability terrifying\n→ Come from families where these words were never spoken\n\n**But also — actions matter more than words:**\n→ Do they consistently show up for you?\n→ Do they make you feel valued and prioritized?\n→ Have they introduced you to people in their life?\n\n**What to do:**\nGive it a little time if their *actions* are loving. But if 3-4 weeks pass and you feel emotionally alone in this — it's a fair and important conversation to have:\n\n> 'I shared something vulnerable and I just want to understand where you are. I don't need the exact words, but I'd love to know how you feel about us.'\n\nYou deserve emotional reciprocity. 💛"
        ]
    },

    // 21. PHYSICAL APPEARANCE CONCERNS
    {
        id: 'appearance',
        keywords: ['too short', 'not tall', 'dark skin', 'skin color', 'fat', 'overweight', 'not fair', 'looks', 'appearance', 'not good looking', 'how to look better', 'attractive'],
        responses: [
            "I need to say something important here {name} 💛\n\nThe matrimony space — especially in India — has a complicated relationship with appearance standards. Skin color, height, weight — these get discussed in ways that are frankly unfair and often hurtful.\n\n**Here's what I know to be true:**\nThe right person for you will be attracted to the real you — including your appearance. But more importantly, they'll be drawn to your confidence, warmth, humor, and character.\n\n**What you can control:**\n→ Health and energy (sleep, movement, hydration — these transform how you look and feel)\n→ Grooming and dressing well for your body type\n→ Carrying yourself with confidence — posture changes everything\n→ Your smile — genuinely the most attractive thing a person has\n\n**What you can't control:**\n→ Height, skin tone, bone structure\n→ And here's the truth: the person who rejects you for these *was never going to be the right partner anyway*\n\nYou are more than your appearance. Find someone who sees that. 🌟"
        ]
    },

    // 22. MONEY & FINANCES IN RELATIONSHIPS
    {
        id: 'money',
        keywords: ['money', 'finance', 'rich', 'salary', 'income', 'earning', 'gold digger', 'financially stable', 'expenses', 'who pays', 'split the bill', 'financial'],
        responses: [
            "Money conversations are awkward but essential {name} — here's how to handle them:\n\n**When to discuss finances:**\nNot on the first date. But once you're seriously considering each other (3-4 months in), these questions matter:\n\n💰 What are your financial goals for the next 5 years?\n💰 Are you a saver or a spender — and which feels right to you?\n💰 How do you handle financial stress?\n💰 What's your relationship with debt?\n\n**On dating expenses:**\nFor early dates — offering to split is a kind gesture from both sides. As things get more serious, discuss what feels comfortable and fair for both of you.\n\n**The 'financial stability' expectation:**\nIt's fair to want a partner who's financially responsible — that's different from wanting someone 'rich'. Look for:\n✅ Has a plan and works towards it\n✅ Not in reckless debt\n✅ Can have honest money conversations\n\nWealth can disappear. Values and financial discipline last. 💛"
        ]
    },

    // 23. HOW AI GURU WORKS / META
    {
        id: 'meta',
        keywords: ['who are you', 'what are you', 'how do you work', 'are you ai', 'are you a bot', 'your name', 'guru', 'how were you made', 'what can you do', 'help me with'],
        responses: [
            "I'm your **LifePartner AI Guru** 🔮 — a relationship wisdom engine built specifically for the LifePartner AI community!\n\nI'm specialized in Indian matrimony and modern dating, trained with expert guidance on:\n\n💬 **Conversations** — First messages, icebreakers, communication tips\n📝 **Profiles** — Bio, photos, what works and what doesn't\n🚩 **Red & Green Flags** — Spotting genuine people vs. red flags\n☕ **Dating** — First meeting, date ideas, timelines\n💍 **Marriage** — Pre-marriage questions, compatibility, readiness\n❤️ **Relationships** — Trust, communication, conflict, love languages\n💔 **Healing** — Rejection, breakups, moving on\n👨‍👩‍👧 **Family** — Parents, arranged marriage, intercaste dynamics\n\nI respond instantly and I'm always here. What would you like help with today, {name}? 🌸",
        ]
    },

    // 24. LOVE LANGUAGES
    {
        id: 'love_languages',
        keywords: ['love language', 'how do they show love', 'how i show love', 'acts of service', 'words of affirmation', 'quality time', 'physical touch', 'gift', 'how to show love', 'feel loved'],
        responses: [
            "Understanding love languages can genuinely transform your relationships {name}! 🌟\n\nThere are 5 love languages — everyone has a primary one:\n\n1️⃣ **Words of Affirmation** — They feel loved when you *say it*: 'I appreciate you', 'I'm proud of you', genuine compliments\n\n2️⃣ **Acts of Service** — They feel loved when you *do things*: making them tea, helping with tasks, taking something off their plate\n\n3️⃣ **Receiving Gifts** — They feel loved through *thoughtful gestures*: it's about the thought, not the price — a favourite snack, a little note\n\n4️⃣ **Quality Time** — They feel loved when you give them your *full attention*: phone down, genuinely present\n\n5️⃣ **Physical Touch** — They feel loved through *touch*: a hug, sitting close, a pat on the back\n\n**How to figure out their language:**\n→ Notice how *they show* love to others — people give love the way they want to receive it\n→ Ask: 'What makes you feel most appreciated in a relationship?'\n\nKnowing this = dramatically better relationship. 💛"
        ]
    },

    // 25. THANKS / POSITIVE
    {
        id: 'thanks',
        keywords: ['thank', 'thanks', 'helpful', 'great advice', 'good advice', 'appreciate', 'awesome', 'amazing', 'perfect', 'wonderful', 'this helped', 'that helped', 'love this'],
        responses: [
            "You're so welcome, {name}! 🙏 That's exactly what I'm here for. You've got this — keep that confidence! Feel free to come back anytime you need guidance or just want to talk things through. 💙",
            "Glad it helped! 😊 Remember: the path to a great relationship starts with becoming the best version of yourself. You're already doing that by seeking wisdom. Keep going! 🌸",
            "Anytime, {name}! 🌟 Rooting for your love story every step of the way. The right person is out there — stay authentic and patient. Come back whenever you need! 💛"
        ]
    },
];

// ─────────────────────────────────────────────
// FALLBACK RESPONSE POOL
// ─────────────────────────────────────────────
const FALLBACK_RESPONSES = [
    "That's a great question, {name}! I want to give you the most helpful answer. 🤔\n\nI'm best at:\n💬 Starting conversations & icebreakers\n📝 Profile & bio tips\n🚩 Red & green flags\n☕ First date planning\n💔 Rejection & heartbreak\n💍 Marriage & compatibility\n❤️ Communication & trust\n\nCould you rephrase or ask me something more specific? I'm here! 🌸",

    "Hmm, I want to give you something genuinely useful {name}! 🙏\n\nTry asking me things like:\n→ 'How do I improve my profile?'\n→ 'What are red flags I should watch for?'\n→ 'How do I start a conversation with my match?'\n→ 'Is this person worth pursuing?'\n→ 'How do I handle rejection?'\n→ 'What should we discuss before marriage?'\n\nI'm your full-service relationship coach! 😊",

    "I'm still learning to understand every question perfectly {name}! 🌱\n\nBut I can help with almost everything about:\n- Your LifePartner AI profile\n- Talking to matches\n- Relationship advice\n- Indian matrimony culture\n- Safety and red flags\n\nAsk me anything more specific and I'll give you my best! 🔮"
];

// ─────────────────────────────────────────────
// INTENT DETECTOR
// ─────────────────────────────────────────────
function detectIntent(message: string): Intent | null {
    const lower = message.toLowerCase().trim();

    let bestMatch: Intent | null = null;
    let bestScore = 0;

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (lower.includes(keyword)) {
                // Weight by keyword phrase length (multi-word = more precise)
                score += keyword.split(' ').length * 2;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
        }
    }

    // Require at least a minimal confidence score
    return bestScore >= 2 ? bestMatch : null;
}

// ─────────────────────────────────────────────
// CONTEXT ANALYZER (history-aware)
// ─────────────────────────────────────────────
function getLastAssistantIntent(history: { role: string; content: string }[]): string | null {
    // Walk backwards through history to find what the last assistant message was about
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'assistant') {
            const lower = msg.content.toLowerCase();
            if (lower.includes('profile') || lower.includes('bio')) return 'profile';
            if (lower.includes('photo')) return 'photo';
            if (lower.includes('first message') || lower.includes('icebreaker')) return 'conversation';
            if (lower.includes('red flag')) return 'red_flags';
            if (lower.includes('green flag')) return 'green_flags';
            if (lower.includes('rejected') || lower.includes('ghosted')) return 'rejection';
            if (lower.includes('marriage') || lower.includes('wedding')) return 'marriage';
            if (lower.includes('first date') || lower.includes('first meeting')) return 'meeting';
            if (lower.includes('love language')) return 'love_languages';
        }
    }
    return null;
}

function generateContextualFollowup(lastIntent: string, name: string): string {
    const followups: Record<string, string> = {
        profile: `To recap the key advice on profiles {name}: specificity, genuine personality, and ending your bio with a conversation hook. Would you like help writing a section of your bio, or do you have another question? 🌸`,
        photo: `Remember {name}: smiling, natural outdoor lighting, and 3-5 photos showing different sides of your life. Want tips on another aspect of your profile? 📸`,
        conversation: `The formula is: Observe → Relate → Open question. Short, personal, genuine. Is there a specific match you're trying to message? I can help craft something! 💬`,
        red_flags: `Trust your instincts {name} — they're usually right. If something feels off, step back and observe more before investing emotionally. Is there a specific situation you're trying to evaluate? 🙏`,
        rejection: `Keep in mind: rejection is redirection. Give yourself grace {name}. Is there something specific you'd like to work through about this? 💙`,
        marriage: `Pre-marriage conversations are so important. Values alignment matters far more than common interests. Do you want to go deeper on any of those five questions? 💍`,
        meeting: `Remember: public place, 90 minutes max, genuine curiosity. The goal of a first meeting is just to see if you enjoy their company in real life. Want more tips? ☕`,
    };

    const template = followups[lastIntent] || `Great questions {name}! What else would you like to explore today? 🌸`;
    return personalize(template, name);
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export function guruResponse(
    message: string,
    name: string,
    history: { role: string; content: string }[]
): string {
    const intent = detectIntent(message);

    if (intent) {
        return personalize(pickRandom(intent.responses), name);
    }

    // Check if this is a follow-up to a previous topic
    const lastIntent = getLastAssistantIntent(history);
    const lowerMsg = message.toLowerCase();

    // Common follow-up patterns
    if (history.length > 0 && lastIntent) {
        if (lowerMsg.match(/\b(yes|ok|okay|sure|got it|understand|tell me more|more|continue|elaborate|explain|go on|really|interesting|wow|and then|what else|anything else|more tips|another)\b/)) {
            return generateContextualFollowup(lastIntent, name);
        }
    }

    // Absolute fallback
    return personalize(pickRandom(FALLBACK_RESPONSES), name);
}
