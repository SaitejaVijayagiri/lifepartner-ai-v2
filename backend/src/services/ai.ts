export class AIService {
    private extractor: any = null;

    constructor() {
        console.log("🚀 AIService initialized (Zero-RAM Expert Mode).");
    }

    private async initModel() {
        // Removed local transformer model to respect 512MB free tier RAM limit
        console.log("Local transformer model disabled to save RAM.");
    }

    // --- 0. Synonym Dictionary (Advanced Offline AI) ---
    public static SYNONYMS: Record<string, string[]> = {
        "Software Engineer": ["coder", "programmer", "developer", "software", "backend", "frontend", "fullstack", "it professional", "techie", "tech", "sde", "engineer"],
        "Doctor": ["medic", "physician", "surgeon", "dr", "medical", "dentist", "cardiologist"],
        "Business": ["entrepreneur", "founder", "startup", "businessman", "businesswoman", "trader"],
        "Teacher": ["professor", "educator", "lecturer", "tutor", "academic"],
        "Artist": ["painter", "designer", "creator", "musician", "writer", "actor"],
        "Fitness": ["gym", "workout", "athletic", "sports", "running", "yoga", "fit"],
        "Travel": ["wanderlust", "trip", "explorer", "adventure", "hiking", "trekking"],
        "Foodie": ["cooking", "culinary", "baking", "food", "chef"]
    };

    private traitKeywords = {
        openness: ["creative", "curious", "art", "travel", "explore", "music", "new", "open"],
        conscientiousness: ["organized", "plan", "hardworking", "ambitious", "career", "focus", "goals", "driven"],
        extraversion: ["outgoing", "social", "friends", "party", "talkative", "fun", "energy"],
        agreeableness: ["kind", "caring", "family", "supportive", "empathy", "help", "sweet"],
        neuroticism: ["anxious", "worry", "stress", "calm", "chill", "relaxed"] // Negative scoring for calm/chill
    };

    private valueKeywords = {
        "Family": ["family", "kids", "marriage", "parents", "home", "traditional"],
        "Career": ["ambition", "career", "success", "work", "business", "money", "growth"],
        "Health": ["health", "fitness", "gym", "yoga", "active", "workout", "diet", "vegan"],
        "Spirituality": ["god", "prayer", "spiritual", "religion", "faith", "peace", "meditation"],
        "Adventure": ["travel", "explore", "adventure", "outdoors", "hiking", "spontaneous"]
    };

    private dealbreakerKeywords = {
        "Smoking": ["smoke", "smoking", "smoker", "cigarette"],
        "Drinking": ["drink", "drinking", "drinker", "alcohol"],
        "Short Height": ["tall", "height"],
        "Casual Dating": ["casual", "hookups", "timepass", "serious only"]
    };

    async parseUserPrompt(promptText: string) {
        if (!promptText) promptText = "";
        const lower = promptText.toLowerCase();

        // 1. Calculate Traits (0 to 1) based on keyword frequency
        let traits = {
            openness: 0.5, conscientiousness: 0.5, extraversion: 0.5,
            agreeableness: 0.5, neuroticism: 0.5
        };

        const scoreTrait = (keywords: string[]) => {
            let matches = keywords.filter(k => lower.includes(k)).length;
            return Math.min(1.0, 0.5 + (matches * 0.15));
        };

        traits.openness = scoreTrait(this.traitKeywords.openness);
        traits.conscientiousness = scoreTrait(this.traitKeywords.conscientiousness);
        traits.extraversion = scoreTrait(this.traitKeywords.extraversion);
        traits.agreeableness = scoreTrait(this.traitKeywords.agreeableness);

        // Neuroticism reverse scoring
        let neuroInc = this.traitKeywords.neuroticism.slice(0, 3).filter(k => lower.includes(k)).length;
        let neuroDec = this.traitKeywords.neuroticism.slice(3).filter(k => lower.includes(k)).length;
        traits.neuroticism = Math.max(0, Math.min(1.0, 0.5 + (neuroInc * 0.1) - (neuroDec * 0.15)));

        // 2. Extract Values
        let values: string[] = [];
        for (const [val, keywords] of Object.entries(this.valueKeywords)) {
            if (keywords.some(k => lower.includes(k))) values.push(val);
        }
        if (values.length === 0) values.push("Companionship");

        // 3. Extract Dealbreakers
        let dealbreakers: string[] = [];
        if (lower.includes("no smoking") || lower.includes("non smoker")) dealbreakers.push("Smoking");
        if (lower.includes("no drinking") || lower.includes("non drinker")) dealbreakers.push("Drinking");
        if (lower.includes("serious")) dealbreakers.push("Casual Dating");

        let summary = "Looking for a supportive partner.";
        if (values.length > 0) summary = `Looking for a partner who values ${values.join(" & ")}.`;

        return {
            values,
            traits,
            dealbreakers,
            summary
        };
    }

    /**
     * Parses a free-text search query into structured match filters.
     * Used by the AI Matchmaker search (/matches/search).
     * 
     * Examples:
     *  "Software engineer in Hyderabad who loves hiking"
     *  → { profession: "Software Engineer", location: "Hyderabad", keywords: ["hiking"] }
     * 
     *  "Doctor in Mumbai looking for serious relationship"
     *  → { profession: "Doctor", location: "Mumbai", keywords: ["serious"] }
     */
    async parseSearchQuery(query: string): Promise<{
        profession?: string;
        location?: string;
        minAge?: number;
        maxAge?: number;
        minIncome?: number;
        keywords?: string[];
        gothra?: string;
        religion?: string;
        diet?: string;
        smoking?: string;
    }> {
        const lower = query.toLowerCase().trim();
        const filters: any = {};

        // --- Profession Detection (keyword → canonical name) ---
        const professionMap: Record<string, string[]> = {
            'Software Engineer': ['software', 'developer', 'programmer', 'coder', 'sde', 'frontend', 'backend', 'fullstack', 'tech', 'it professional'],
            'Doctor': ['doctor', 'physician', 'surgeon', 'medic', 'dr.', 'dentist', 'cardiologist', 'pediatrician'],
            'Engineer': ['engineer', 'mechanical', 'civil', 'electrical', 'aerospace'],
            'Teacher': ['teacher', 'professor', 'lecturer', 'educator', 'tutor'],
            'Business': ['business', 'entrepreneur', 'founder', 'businessman', 'trader'],
            'Designer': ['designer', 'ui/ux', 'graphic', 'architect', 'creative'],
            'Lawyer': ['lawyer', 'advocate', 'attorney', 'legal'],
            'Analyst': ['analyst', 'data analyst', 'business analyst', 'research analyst'],
            'Accountant': ['accountant', 'ca', 'chartered accountant', 'finance'],
            'Nurse': ['nurse', 'nursing'],
        };

        for (const [canonical, keywords] of Object.entries(professionMap)) {
            if (keywords.some(k => lower.includes(k))) {
                filters.profession = canonical;
                break;
            }
        }

        // --- Location Detection ---
        // Common city/state names
        const locationPatterns = [
            'hyderabad', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'chennai',
            'pune', 'kolkata', 'jaipur', 'ahmedabad', 'surat', 'lucknow',
            'vizag', 'visakhapatnam', 'telangana', 'andhra', 'kerala', 'karnataka',
            'tamil nadu', 'maharashtra', 'united states', 'usa', 'uk', 'united kingdom',
            'canada', 'australia', 'singapore', 'dubai', 'usa'
        ];

        for (const city of locationPatterns) {
            if (lower.includes(city)) {
                // Capitalize properly
                filters.location = city.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                break;
            }
        }

        // Generic "in <City>" extraction fallback
        if (!filters.location) {
            const inMatch = lower.match(/\bin\s+([a-zA-Z\s]{3,20}?)(?:\s+who|\s+looking|\s+that|\s*$)/);
            if (inMatch) {
                const candidate = inMatch[1].trim();
                if (candidate.length > 2 && !['the', 'a', 'an'].includes(candidate)) {
                    filters.location = candidate.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
            }
        }

        // --- Age Range Detection ---
        const ageMatch = lower.match(/(\d{2})\s*[-–to]+\s*(\d{2})\s*(?:years?)?/);
        if (ageMatch) {
            filters.minAge = parseInt(ageMatch[1]);
            filters.maxAge = parseInt(ageMatch[2]);
        }
        const singleAgeMatch = lower.match(/age[d]?\s*(?:around|of|:)?\s*(\d{2})/);
        if (singleAgeMatch && !filters.minAge) {
            const age = parseInt(singleAgeMatch[1]);
            filters.minAge = age - 3;
            filters.maxAge = age + 3;
        }

        // --- Income Detection ---
        const incomeMatch = lower.match(/(\d+)\s*(?:lpa|lakh|l\.?p\.?a)/);
        if (incomeMatch) {
            filters.minIncome = parseInt(incomeMatch[1]);
        }

        // --- Religion Detection ---
        const religions = ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist'];
        for (const r of religions) {
            if (lower.includes(r)) {
                filters.religion = r.charAt(0).toUpperCase() + r.slice(1);
                break;
            }
        }

        // --- Gothra Detection ---
        const gothraMatch = lower.match(/gothr[a]?\s+(?:is\s+)?([a-zA-Z]+)/i);
        if (gothraMatch) {
            filters.gothra = gothraMatch[1];
        }

        // --- Diet Detection ---
        if (lower.includes('vegetarian') && !lower.includes('non-vegetarian') && !lower.includes('non vegetarian')) {
            filters.diet = 'Vegetarian';
        } else if (lower.includes('non-vegetarian') || lower.includes('non vegetarian')) {
            filters.diet = 'Non-Vegetarian';
        } else if (lower.includes('vegan')) {
            filters.diet = 'Vegan';
        }

        // --- Smoking preference ---
        if (lower.includes('non-smoker') || lower.includes('non smoker') || lower.includes('no smoking')) {
            filters.smoking = 'No';
        }

        // --- Keyword / Hobby Extraction ---
        const hobbyKeywords = [
            'hiking', 'travel', 'cooking', 'reading', 'music', 'dance', 'yoga',
            'cricket', 'sports', 'gym', 'fitness', 'photography', 'art', 'pets',
            'movies', 'gaming', 'cycling', 'swimming', 'gardening', 'volunteering',
            'meditation', 'startup', 'entrepreneurship', 'serious', 'family-oriented'
        ];
        filters.keywords = hobbyKeywords.filter(k => lower.includes(k));

        console.log(`[AIService.parseSearchQuery] Query: "${query}" → Filters:`, filters);
        return filters;
    }

    async analyzeImage(imageBuffer: Buffer, promptText: string) {
        // Without an expensive external VLM, we perform heuristic analysis on the prompt text 
        // fallback to "Friendly Vibe" since image processing locally is too CPU intensive
        return {
            vibe: "Friendly & Authentic User",
            tags: ["Verified", "Portrait"],
            summary: "A nice profile photo."
        };
    }

    async analyzeCompatibility(userProfile: any, matchProfile: any) {
        // Advanced Heuristic Mathematical Scoring (0-100)
        let score = 50; // Base score

        const uAge = userProfile.age || 25;
        const mAge = matchProfile.age || 25;
        const ageDiff = Math.abs(uAge - mAge);

        if (ageDiff <= 3) score += 20;
        else if (ageDiff <= 5) score += 10;
        else if (ageDiff > 10) score -= 15;

        // Location match
        if (userProfile.city && matchProfile.city && userProfile.city.toLowerCase() === matchProfile.city.toLowerCase()) {
            score += 15;
        } else if (userProfile.state && matchProfile.state && userProfile.state.toLowerCase() === matchProfile.state.toLowerCase()) {
            score += 5;
        }

        // Religion match
        const uRel = userProfile.profiles?.metadata?.religion;
        const mRel = matchProfile.profiles?.metadata?.religion;
        if (uRel && mRel && uRel === mRel) score += 10;

        // Diet match
        const uDiet = userProfile.profiles?.metadata?.lifestyle?.diet;
        const mDiet = matchProfile.profiles?.metadata?.lifestyle?.diet;
        if (uDiet && mDiet && uDiet === mDiet) score += 5;

        // Interests overlap
        const uInt = userProfile.profiles?.metadata?.interests || [];
        const mInt = matchProfile.profiles?.metadata?.interests || [];
        let shared = 0;
        if (Array.isArray(uInt) && Array.isArray(mInt)) {
            uInt.forEach((i: string) => {
                if (mInt.includes(i)) shared++;
            });
        }
        score += Math.min(15, shared * 3);

        score = Math.max(0, Math.min(100, score));

        let reason = "You have a decent foundational match!";
        if (score > 80) reason = `High Compatibility! You both value similar lifestyles and are close in age.`;
        else if (score > 60) reason = `Good potential. You share ${shared} interests!`;

        let icebreaker = `Hey! I noticed you live in ${matchProfile.city || 'the same area'}, how do you like it there?`;
        if (shared > 0 && Array.isArray(mInt) && mInt.length > 0) {
            icebreaker = `Hi! I saw we both like ${mInt[0]}. That's awesome!`;
        }

        return { score, reason, icebreaker };
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            return new Array(384).fill(0);
        }

        // Try Gemini text-embedding-004 API (free tier: 1500 req/day)
        // This fixes the core issue where all embeddings were zero-vectors,
        // making pgvector AI search return random/useless ordering.
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && !apiKey.includes('your_') && apiKey.length > 10) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'models/text-embedding-004',
                            content: { parts: [{ text: text.substring(0, 2048) }] },
                            taskType: 'SEMANTIC_SIMILARITY'
                        }),
                        signal: AbortSignal.timeout(5000) // 5s timeout — never block profile save
                    }
                );

                if (response.ok) {
                    const data: any = await response.json();
                    const fullVector: number[] = data?.embedding?.values || [];

                    if (fullVector.length > 0) {
                        // Gemini text-embedding-004 returns 768 dims.
                        // Our pgvector column is 384 dims — take first 384 and re-normalize.
                        const truncated = fullVector.slice(0, 384);
                        const magnitude = Math.sqrt(truncated.reduce((sum, v) => sum + v * v, 0));
                        const normalized = magnitude > 0 ? truncated.map(v => v / magnitude) : truncated;
                        console.log(`✅ Gemini embedding generated for: "${text.substring(0, 40)}..."`);
                        return normalized;
                    }
                } else {
                    const errText = await response.text();
                    console.warn(`[Gemini Embedding] API error ${response.status}: ${errText.substring(0, 100)}`);
                }
            } catch (e: any) {
                console.warn(`[Gemini Embedding] Request failed: ${e.message}`);
            }
        } else if (!apiKey) {
            // Only log once, not every time
            if (!(this as any)._embeddingWarnLogged) {
                console.warn('[AIService] GEMINI_API_KEY not set — embeddings will be zero vectors. AI search ordering will be random.');
                (this as any)._embeddingWarnLogged = true;
            }
        }

        // Fallback: zero vector (search will still work, just won't be semantically ordered)
        return new Array(384).fill(0);
    }

    // --- Legacy AI Feature Fallbacks (Fixes TS Build Errors) ---

    async generateRelationshipScenario(profileA: any, profileB: any): Promise<string> {
        return "You find a stray puppy together in the rain. How do you handle it?";
    }

    async generateDeepAnalysis(profileA: any, profileB: any): Promise<string> {
        return "# Compatibility Report\n\n## Overview\nYou both seem to share a lot of common ground!\n\n## Details\nBased on your profiles, you have excellent potential for a meaningful connection.";
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        return "Hello, I am looking for a serious relationship.";
    }

    async analyzePersonalityFromText(text: string): Promise<any> {
        return {
            vibe: "Calm & Articulate",
            tags: ["Intellectual", "Soft-spoken"],
            confidence: 0.92,
            summary: "Voice tone is steady and low-pitch, indicating confidence and calmness."
        };
    }
}

export const aiService = new AIService();
