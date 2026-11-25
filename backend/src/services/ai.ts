import fs from 'fs';
import path from 'path';
import { callGeminiGenerate, isGeminiConfigured } from '../utils/geminiClient';
import { AIMatchEngine } from './aiMatchEngine';
import { analyzeTextRuleBased } from './localAnalysis';

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
        zodiacSign?: string;
        nakshatra?: string;
        manglik?: string;
        maritalStatus?: string;
        diet?: string;
        smoking?: string;
        drinking?: string;
        motherTongue?: string;
        targetGender?: string;
        exactProfileId?: string;
        exactName?: string;
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

        // --- Location & Demonym Detection ---
        // 1. Country & Demonym / Nationality mapping (Indian & International)
        const countryMap: Record<string, string[]> = {
            'India': ['india', 'indian', 'indians', 'desi', 'bharat', 'hindustan'],
            'United States': ['united states', 'usa', 'america', 'american', 'americans', 'u.s.a', 'u.s.'],
            'United Kingdom': ['united kingdom', 'uk', 'britain', 'british', 'england', 'scotland', 'london'],
            'Canada': ['canada', 'canadian', 'canadians', 'toronto', 'vancouver'],
            'Australia': ['australia', 'australian', 'australians', 'aussie', 'sydney', 'melbourne'],
            'United Arab Emirates': ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'emirati'],
            'Singapore': ['singapore', 'singaporean'],
            'Germany': ['germany', 'german', 'germans', 'deutschland', 'berlin', 'munich', 'frankfurt'],
            'France': ['france', 'french', 'paris'],
            'Russia': ['russia', 'russian', 'russians', 'moscow', 'saint petersburg'],
            'Japan': ['japan', 'japanese', 'tokyo', 'osaka'],
            'Korea': ['korea', 'korean', 'koreans', 'south korea', 'seoul'],
            'Philippines': ['philippines', 'filipino', 'filipina', 'filipinas', 'pinoy', 'manila'],
            'Malaysia': ['malaysia', 'malaysian', 'kuala lumpur'],
            'Thailand': ['thailand', 'thai', 'bangkok'],
            'Indonesia': ['indonesia', 'indonesian', 'jakarta', 'bali'],
            'Vietnam': ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh'],
            'Brazil': ['brazil', 'brazilian', 'sao paulo', 'rio'],
            'Ireland': ['ireland', 'irish', 'dublin', 'cavan'],
            'New Zealand': ['new zealand', 'kiwi', 'auckland'],
            'Qatar': ['qatar', 'doha'],
            'Saudi Arabia': ['saudi arabia', 'saudi', 'riyadh'],
            'Italy': ['italy', 'italian', 'rome', 'milan'],
            'Spain': ['spain', 'spanish', 'madrid', 'barcelona'],
            'Netherlands': ['netherlands', 'dutch', 'amsterdam']
        };

        for (const [canonicalCountry, keywords] of Object.entries(countryMap)) {
            if (keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(lower) || lower.includes(k))) {
                filters.location = canonicalCountry;
                break;
            }
        }

        // 2. City & State mapping
        if (!filters.location) {
            const cityMap: Record<string, string> = {
                'hyderabad': 'Hyderabad', 'bangalore': 'Bangalore', 'bengaluru': 'Bangalore',
                'mumbai': 'Mumbai', 'delhi': 'Delhi', 'chennai': 'Chennai', 'pune': 'Pune',
                'kolkata': 'Kolkata', 'jaipur': 'Jaipur', 'ahmedabad': 'Ahmedabad', 'surat': 'Surat',
                'lucknow': 'Lucknow', 'vizag': 'Visakhapatnam', 'visakhapatnam': 'Visakhapatnam',
                'chandigarh': 'Chandigarh', 'kochi': 'Kochi', 'coimbatore': 'Coimbatore',
                'indore': 'Indore', 'bhopal': 'Bhopal', 'patna': 'Patna', 'vadodara': 'Vadodara',
                'nagpur': 'Nagpur', 'telangana': 'Telangana', 'andhra': 'Andhra Pradesh',
                'kerala': 'Kerala', 'karnataka': 'Karnataka', 'tamil nadu': 'Tamil Nadu',
                'maharashtra': 'Maharashtra', 'gujarat': 'Gujarat', 'punjab': 'Punjab',
                'rajasthan': 'Rajasthan', 'uttar pradesh': 'Uttar Pradesh', 'west bengal': 'West Bengal'
            };
            for (const [cityKey, canonicalCity] of Object.entries(cityMap)) {
                if (lower.includes(cityKey)) {
                    filters.location = canonicalCity;
                    break;
                }
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

        // --- Income Detection (INR LPA or International $ / € / £ / k) ---
        const incomeMatch = lower.match(/(\d+)\s*(?:lpa|lakh|l\.?p\.?a)/);
        if (incomeMatch) {
            filters.minIncome = parseInt(incomeMatch[1]);
        }
        const foreignIncomeMatch = lower.match(/(?:\$|€|£|usd|eur|gbp)?\s*(\d+)\s*(?:k|thousand)/);
        if (foreignIncomeMatch && !filters.minIncome) {
            filters.minIncome = parseInt(foreignIncomeMatch[1]);
        }

        // --- Language / Mother Tongue Detection ---
        const languageMap: Record<string, string[]> = {
            'English': ['english', 'angrezi'],
            'Spanish': ['spanish', 'español'],
            'French': ['french', 'français'],
            'German': ['german', 'deutsch'],
            'Arabic': ['arabic', 'arabi'],
            'Russian': ['russian'],
            'Japanese': ['japanese'],
            'Mandarin Chinese': ['chinese', 'mandarin'],
            'Irish': ['irish', 'gaeilge'],
            'Italian': ['italian'],
            'Portuguese': ['portuguese'],
            'Polish': ['polish'],
            'Dutch': ['dutch'],
            'Korean': ['korean'],
            'Turkish': ['turkish'],
            'Hindi': ['hindi'],
            'Telugu': ['telugu'],
            'Tamil': ['tamil'],
            'Marathi': ['marathi'],
            'Bengali': ['bengali', 'bangla'],
            'Kannada': ['kannada'],
            'Gujarati': ['gujarati'],
            'Punjabi': ['punjabi'],
            'Malayalam': ['malayalam'],
            'Urdu': ['urdu']
        };

        for (const [canonicalLang, keywords] of Object.entries(languageMap)) {
            if (keywords.some(k => lower.includes(k))) {
                filters.motherTongue = canonicalLang;
                break;
            }
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

        // --- Astrology / Zodiac / Nakshatra / Manglik Detection ---
        const zodiacMap: Record<string, string> = {
            aries: 'Aries', mesha: 'Aries',
            taurus: 'Taurus', vrishabha: 'Taurus',
            gemini: 'Gemini', mithuna: 'Gemini',
            cancer: 'Cancer', karka: 'Cancer',
            leo: 'Leo', simha: 'Leo',
            virgo: 'Virgo', kanya: 'Virgo',
            libra: 'Libra', tula: 'Libra',
            scorpio: 'Scorpio', vrishchika: 'Scorpio',
            sagittarius: 'Sagittarius', dhanu: 'Sagittarius',
            capricorn: 'Capricorn', makara: 'Capricorn',
            aquarius: 'Aquarius', kumbha: 'Aquarius',
            pisces: 'Pisces', meena: 'Pisces'
        };
        for (const [alias, canonicalSign] of Object.entries(zodiacMap)) {
            if (new RegExp(`\\b${alias}\\b`, 'i').test(lower)) {
                filters.zodiacSign = canonicalSign;
                break;
            }
        }
        const nakshatraList = [
            'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
            'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
            'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
            'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
            'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ];
        for (const nak of nakshatraList) {
            if (lower.includes(nak.toLowerCase())) {
                filters.nakshatra = nak;
                break;
            }
        }
        if (/non[-\s]?manglik|not\s+manglik|no\s+manglik/i.test(lower)) {
            filters.manglik = 'No';
        } else if (/\bmanglik\b/i.test(lower)) {
            filters.manglik = 'Yes';
        }

        // --- Marital Status ---
        if (/\bdivorced\b/i.test(lower)) filters.maritalStatus = 'Divorced';
        else if (/\bwidowed\b/i.test(lower)) filters.maritalStatus = 'Widowed';
        else if (/\bnever married\b|\bunmarried\b/i.test(lower)) filters.maritalStatus = 'Single';

        // --- Smoking & Drinking preference ---
        if (lower.includes('non-smoker') || lower.includes('non smoker') || lower.includes('no smoking')) {
            filters.smoking = 'No';
        }
        if (lower.includes('non-drinker') || lower.includes('non drinker') || lower.includes('no drinking') || lower.includes('teetotaler')) {
            filters.drinking = 'No';
        }

        // --- Keyword / Hobby Extraction ---
        const hobbyKeywords = [
            'hiking', 'trekking', 'travel', 'travelling', 'traveling', 'cooking', 'baking', 'foodie',
            'reading', 'books', 'music', 'singing', 'dance', 'dancing', 'yoga', 'meditation',
            'cricket', 'sports', 'badminton', 'tennis', 'running', 'gym', 'fitness',
            'photography', 'art', 'painting', 'writing', 'poetry', 'pets', 'dogs', 'cats',
            'movies', 'coffee', 'gaming', 'cycling', 'swimming', 'gardening', 'volunteering',
            'startup', 'entrepreneurship', 'serious', 'family-oriented', 'ambitious', 'caring'
        ];
        filters.keywords = hobbyKeywords.filter(k => lower.includes(k));

        // --- Gender Intent Recognition ---
        if (/\b(?:girl|girls|bride|brides|female|females|woman|women|daughter|she|her)\b/i.test(query)) {
            filters.targetGender = 'Female';
        } else if (/\b(?:boy|boys|groom|grooms|male|males|man|men|son|he|him)\b/i.test(query)) {
            filters.targetGender = 'Male';
        }

        // --- Exact Profile ID or Handle Detection ---
        const profileIdMatch = query.match(/(?:^|\s)(?:id[:\s]+)?(lp-?[a-z0-9]{3,10}|@[a-z0-9_.-]{3,30})(?:$|\s)/i);
        if (profileIdMatch) {
            filters.exactProfileId = profileIdMatch[1].trim();
        } else {
            const cleanRaw = query.trim();
            if (/^(?:@|lp-?)?[a-z0-9]{4,10}$/i.test(cleanRaw)) {
                filters.exactProfileId = cleanRaw;
            }
        }

        // --- Exact Name Detection (e.g. "Priya Sharma", "Rahul Verma") ---
        // Exclude stopwords, category words, nationalities, intent words so descriptive queries are NEVER misidentified as person names
        const nonNameTokens = new Set([
            'search', 'find', 'looking', 'for', 'a', 'an', 'the', 'who', 'is', 'in', 'near', 'from', 'at',
            'boy', 'boys', 'girl', 'girls', 'bride', 'brides', 'groom', 'grooms',
            'female', 'females', 'male', 'males', 'woman', 'women', 'man', 'men',
            'lady', 'ladies', 'guy', 'guys', 'gentleman', 'gentlemen', 'bachelor', 'bachelors',
            'single', 'singles', 'match', 'matches', 'partner', 'profile', 'profiles',
            'matrimony', 'dating', 'wedding', 'marriage', 'verified', 'vip', 'free', 'safe',
            'india', 'indian', 'indians', 'desi', 'bharat', 'hindustan',
            'usa', 'america', 'american', 'americans', 'uk', 'britain', 'british',
            'canada', 'canadian', 'australia', 'australian', 'germany', 'german',
            'korea', 'korean', 'japan', 'japanese', 'russia', 'russian',
            'philippines', 'filipino', 'filipina', 'france', 'french', 'uae', 'dubai'
        ]);

        const rawWords = lower.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
        const candidateWords = rawWords.filter(w => !nonNameTokens.has(w));

        if (
            candidateWords.length >= 1 &&
            !filters.profession &&
            !filters.location &&
            !filters.exactProfileId &&
            !filters.motherTongue &&
            !filters.religion &&
            !filters.zodiacSign &&
            !filters.nakshatra &&
            !filters.manglik &&
            !filters.maritalStatus &&
            !filters.diet &&
            !filters.smoking &&
            !filters.drinking &&
            !(filters.keywords && filters.keywords.length > 0)
        ) {
            const candidate = candidateWords.join(' ').trim();
            if (candidate.length >= 2 && !/^(any|all|anyone|everyone|someone|please|show|get|near|nearby)$/i.test(candidate)) {
                filters.exactName = candidate.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }

        console.log(`[AIService.parseSearchQuery] Query: "${query}" → Filters:`, filters);
        return filters;
    }

    async analyzeImage(imageBuffer: Buffer, promptText: string) {
        if (isGeminiConfigured()) {
            try {
                const base64Data = imageBuffer.toString('base64');
                const result = await callGeminiGenerate({
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                        ]
                    }],
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            vibe: { type: 'STRING' },
                            tags: { type: 'ARRAY', items: { type: 'STRING' } },
                            summary: { type: 'STRING' }
                        },
                        required: ['vibe', 'tags', 'summary']
                    },
                    timeoutMs: 12000
                });

                if (result.text) {
                    return JSON.parse(result.text);
                }
            } catch (err: any) {
                console.warn(`[analyzeImage] Gemini Vision call failed: ${err.message}`);
            }
        }

        // fallback to "Friendly Vibe" when API is unconfigured or unavailable
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

    /**
     * Generates a deterministic 384-dimensional L2-normalized semantic feature vector
     * using word unigrams, bigrams, and stemmed domain tokens so pgvector ordering
     * remains meaningful even without external embedding API latency/failures.
     */
    public buildLocalSemanticVector(text: string): number[] {
        const vec = new Array(384).fill(0);
        const cleaned = String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        if (!cleaned) return vec;

        const rawTokens = cleaned.split(/\s+/).filter(t => t.length >= 2);
        const normalizedTokens = rawTokens.map(tok => {
            if (tok === 'veg' || tok.startsWith('vegetarian')) return 'vegetarian';
            if (tok.startsWith('travel')) return 'travel';
            if (tok.startsWith('read') || tok === 'books') return 'reading';
            if (tok.startsWith('cook') || tok === 'foodie') return 'cooking';
            if (tok === 'bengaluru' || tok === 'bangalore') return 'bangalore';
            if (tok === 'singing' || tok === 'music') return 'music';
            if (tok === 'gym' || tok === 'fitness' || tok === 'workout') return 'fitness';
            if (tok.startsWith('hike') || tok.startsWith('trek')) return 'hiking';
            return tok;
        });

        const hashToIndex = (token: string, salt: number): number => {
            let h = 2166136261 ^ salt;
            for (let i = 0; i < token.length; i++) {
                h ^= token.charCodeAt(i);
                h = Math.imul(h, 16777619);
            }
            return Math.abs(h) % 384;
        };

        for (let i = 0; i < normalizedTokens.length; i++) {
            const tok = normalizedTokens[i];
            vec[hashToIndex(tok, 17)] += 1.0;
            vec[hashToIndex(tok, 53)] += 0.65;
            if (i + 1 < normalizedTokens.length) {
                const bigram = `${tok}_${normalizedTokens[i + 1]}`;
                vec[hashToIndex(bigram, 97)] += 0.85;
            }
        }

        const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return mag > 0 ? vec.map(v => v / mag) : vec;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            return new Array(384).fill(0);
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && !apiKey.includes('your_') && apiKey.length > 10) {
            for (const modelName of ['gemini-embedding-001', 'text-embedding-004']) {
                try {
                    const bodyPayload: any = {
                        model: `models/${modelName}`,
                        content: { parts: [{ text: text.substring(0, 2048) }] },
                        taskType: 'SEMANTIC_SIMILARITY'
                    };
                    if (modelName === 'gemini-embedding-001') {
                        bodyPayload.outputDimensionality = 384;
                    }
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(bodyPayload),
                            signal: AbortSignal.timeout(5000)
                        }
                    );

                    if (response.ok) {
                        const data: any = await response.json();
                        const fullVector: number[] = data?.embedding?.values || [];
                        if (fullVector.length > 0) {
                            const truncated = fullVector.slice(0, 384);
                            const magnitude = Math.sqrt(truncated.reduce((sum, v) => sum + v * v, 0));
                            const normalized = magnitude > 0 ? truncated.map(v => v / magnitude) : truncated;
                            return normalized;
                        }
                    }
                } catch {
                    // Try next model or deterministic local semantic vector below
                }
            }
        }

        return this.buildLocalSemanticVector(text);
    }

    // --- AI Compatibility, Couple Scenarios & Multimodal Analysis ---

    async generateRelationshipScenario(profileA: any, profileB: any): Promise<string> {
        const fallbackScenarios = [
            "One of you receives a dream job offer in a new city right after your engagement. How do you decide together?",
            "Both families have conflicting traditions for an upcoming festival. How do you honor both without stress?",
            "You have a free Sunday after a tiring week—one wants quiet time at home while the other craves a spontaneous road trip. What's your compromise?",
            "You decide to plan your first shared monthly budget, balancing family support, travel, and savings. How do you split priorities?"
        ];

        const bioA = String(profileA?.bio || profileA?.aboutMe || '').slice(0, 300);
        const bioB = String(profileB?.bio || profileB?.aboutMe || '').slice(0, 300);

        if (isGeminiConfigured()) {
            const res = await callGeminiGenerate({
                systemInstruction: 'You are a warm, culturally aware relationship coach creating a realistic compatibility scenario question for two people considering marriage.',
                prompt: `Person A bio/traits: ${bioA || 'Serious partner'}\nPerson B bio/traits: ${bioB || 'Serious partner'}\n\nWrite ONE thoughtful, practical 1-2 sentence scenario question that helps them discover how they handle values, family, lifestyle, or teamwork together. Output plain text only.`,
                temperature: 0.85,
                maxOutputTokens: 180,
                timeoutMs: 8000
            });
            if (res.text && res.text.length > 15) {
                return res.text.replace(/^["']|["']$/g, '').trim();
            }
        }

        const idx = Math.abs((bioA.length + bioB.length) % fallbackScenarios.length);
        return fallbackScenarios[idx];
    }

    async generateDeepAnalysis(profileA: any, profileB: any): Promise<string> {
        const engine = AIMatchEngine.computeMatch(profileA || {}, profileB || {});
        const nameA = profileA?.full_name || 'Partner A';
        const nameB = profileB?.full_name || 'Partner B';

        if (isGeminiConfigured()) {
            const summaryInput = {
                partnerA: {
                    name: nameA,
                    age: profileA?.age,
                    profession: profileA?.career?.profession,
                    city: profileA?.location?.city || profileA?.city,
                    interests: profileA?.interests,
                    bio: String(profileA?.aboutMe || profileA?.bio || '').slice(0, 400)
                },
                partnerB: {
                    name: nameB,
                    age: profileB?.age,
                    profession: profileB?.career?.profession,
                    city: profileB?.location?.city || profileB?.city,
                    interests: profileB?.interests,
                    bio: String(profileB?.aboutMe || profileB?.bio || '').slice(0, 400)
                },
                computedScores: engine.dimensions,
                strengths: engine.strengths
            };

            const res = await callGeminiGenerate({
                systemInstruction: 'You are an insightful relationship & matrimony compatibility analyst. Write a respectful, grounded compatibility audit in clean Markdown.',
                prompt: `Generate a structured Compatibility Audit for these two profiles:\n${JSON.stringify(summaryInput)}\n\nUse clean Markdown with '# Compatibility Report' and '##' headings covering: Overview, Personality & Values Alignment, Lifestyle & Daily Rhythm, Communication & Growth Tip, and Suggested First Meaningful Conversation. Keep it constructive, warm, and concise (300-450 words).`,
                temperature: 0.7,
                maxOutputTokens: 1200,
                timeoutMs: 12000
            });

            if (res.text && res.text.length > 120) {
                return res.text;
            }
        }

        const strengthBullets = engine.strengths.length > 0
            ? engine.strengths.map(s => `- ${s}`).join('\n')
            : '- Complementary backgrounds with room for mutual discovery';

        return `# Compatibility Report\n\n## Overview\n${nameA} and ${nameB} show an overall compatibility score of ${engine.score}% across personality (${engine.dimensions.personality}%), values (${engine.dimensions.values}%), lifestyle (${engine.dimensions.lifestyle}%), and cosmic harmony (${engine.dimensions.cosmic}%).\n\n## Key Strengths\n${strengthBullets}\n\n## Growth & Communication Tip\n${engine.growthTip}\n\n## Suggested Conversation Starter\n${engine.icebreaker}`;
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        if (audioPath && fs.existsSync(audioPath) && isGeminiConfigured()) {
            try {
                const stats = fs.statSync(audioPath);
                if (stats.size > 0 && stats.size <= 8 * 1024 * 1024) {
                    const ext = path.extname(audioPath).toLowerCase();
                    const mimeMap: Record<string, string> = {
                        '.mp3': 'audio/mp3',
                        '.wav': 'audio/wav',
                        '.webm': 'audio/webm',
                        '.m4a': 'audio/mp4',
                        '.ogg': 'audio/ogg'
                    };
                    const mimeType = mimeMap[ext] || 'audio/mp4';
                    const audioBase64 = fs.readFileSync(audioPath).toString('base64');

                    const res = await callGeminiGenerate({
                        contents: [{
                            role: 'user',
                            parts: [
                                { text: 'Transcribe this spoken voice introduction accurately in plain text. If silent or unclear, summarize what was heard.' },
                                { inlineData: { mimeType, data: audioBase64 } }
                            ]
                        }],
                        temperature: 0.2,
                        maxOutputTokens: 500,
                        timeoutMs: 15000
                    });

                    if (res.text) {
                        return res.text;
                    }
                }
            } catch (err: any) {
                console.warn(`[transcribeAudio] Audio transcription failed: ${err?.message || err}`);
            }
        }

        return "Voice introduction shared by member.";
    }

    async analyzePersonalityFromText(text: string): Promise<any> {
        const cleanText = (text || '').trim();
        if (cleanText.length >= 10 && isGeminiConfigured()) {
            try {
                const res = await callGeminiGenerate({
                    prompt: `Analyze the personality & communication vibe of this profile introduction:\n"${cleanText.slice(0, 1500)}"\n\nReturn strict JSON with vibe (2-3 words), tags (3-4 personality tags), confidence (0.5-0.98), and a warm 1-sentence summary.`,
                    temperature: 0.5,
                    maxOutputTokens: 300,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            vibe: { type: 'STRING' },
                            tags: { type: 'ARRAY', items: { type: 'STRING' } },
                            confidence: { type: 'NUMBER' },
                            summary: { type: 'STRING' }
                        },
                        required: ['vibe', 'tags', 'confidence', 'summary']
                    },
                    timeoutMs: 10000
                });

                if (res.text) {
                    return JSON.parse(res.text);
                }
            } catch (err: any) {
                console.warn(`[analyzePersonalityFromText] Gemini fallback to rule-based: ${err?.message || err}`);
            }
        }

        return analyzeTextRuleBased(cleanText);
    }
}

export const aiService = new AIService();
