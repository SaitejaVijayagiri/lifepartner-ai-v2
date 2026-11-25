import { AstrologyService } from './astrology';

const astrologyService = new AstrologyService();

export interface DimensionScores {
    personality: number;   // 0 - 100
    values: number;        // 0 - 100
    lifestyle: number;     // 0 - 100
    cosmic: number;        // 0 - 100
    overall: number;       // 0 - 100
}

export interface AIMatchAnalysis {
    score: number;
    dimensions: DimensionScores;
    reasons: string[];
    strengths: string[];
    growthTip: string;
    icebreaker: string;
    details?: {
        sharedHobbies: string[];
        distanceKm: number | null;
        agePreferenceMatch: boolean | null;
        locationPreferenceMatch: boolean | null;
        expectationsMatchCount: number;
        gunaScore: number | null;
        manglikCompatible: boolean;
        gothraCompatible: boolean | null;
    };
}

// Elemental mapping for Western Zodiac synergy
const ZODIAC_ELEMENTS: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
    'aries': 'Fire', 'leo': 'Fire', 'sagittarius': 'Fire',
    'taurus': 'Earth', 'virgo': 'Earth', 'capricorn': 'Earth',
    'gemini': 'Air', 'libra': 'Air', 'aquarius': 'Air',
    'cancer': 'Water', 'scorpio': 'Water', 'pisces': 'Water'
};

const ELEMENT_HARMONY: Record<string, Record<string, number>> = {
    'Fire': { 'Fire': 85, 'Air': 95, 'Earth': 65, 'Water': 60 },
    'Air': { 'Air': 85, 'Fire': 95, 'Earth': 70, 'Water': 65 },
    'Earth': { 'Earth': 90, 'Water': 95, 'Fire': 65, 'Air': 70 },
    'Water': { 'Water': 90, 'Earth': 95, 'Fire': 60, 'Air': 65 }
};

const CITY_ALIASES: Record<string, string> = {
    'bengaluru': 'bangalore',
    'bangalore': 'bangalore',
    'bombay': 'mumbai',
    'mumbai': 'mumbai',
    'calcutta': 'kolkata',
    'kolkata': 'kolkata',
    'madras': 'chennai',
    'chennai': 'chennai',
    'gurgaon': 'gurugram',
    'gurugram': 'gurugram',
    'new delhi': 'delhi',
    'delhi': 'delhi',
    'poona': 'pune',
    'pune': 'pune',
    'secunderabad': 'hyderabad',
    'hyderabad': 'hyderabad'
};

const HOBBY_CANONICAL: Record<string, string> = {
    'travelling': 'travel',
    'traveling': 'travel',
    'trips': 'travel',
    'wanderlust': 'travel',
    'books': 'reading',
    'book': 'reading',
    'novels': 'reading',
    'cook': 'cooking',
    'baking': 'cooking',
    'foodie': 'cooking',
    'singing': 'music',
    'songs': 'music',
    'gym': 'fitness',
    'workout': 'fitness',
    'exercise': 'fitness',
    'hiking': 'hiking',
    'trekking': 'hiking',
    'photos': 'photography',
    'photo': 'photography',
    'dancing': 'dance',
    'movies': 'movies',
    'cinema': 'movies',
    'films': 'movies',
    'pets': 'pets',
    'dogs': 'pets',
    'cats': 'pets',
    'meditation': 'meditation',
    'yoga': 'yoga',
    'coffee': 'coffee',
    'chats': 'coffee',
    'sports': 'sports',
    'cricket': 'sports',
    'badminton': 'sports'
};

export class AIMatchEngine {
    public static normalizeCity(city?: string | null): string {
        if (!city || typeof city !== 'string') return '';
        const cleaned = city.trim().toLowerCase().replace(/\s+/g, ' ');
        return CITY_ALIASES[cleaned] || cleaned;
    }

    public static normalizeDiet(diet?: string | null): string {
        if (!diet || typeof diet !== 'string') return '';
        const d = diet.trim().toLowerCase();
        if (d === 'veg' || d === 'vegetarian' || d === 'pure veg') return 'vegetarian';
        if (d === 'non-veg' || d === 'non veg' || d === 'non-vegetarian' || d === 'non vegetarian') return 'non-vegetarian';
        if (d === 'egg' || d === 'eggetarian') return 'eggetarian';
        if (d === 'vegan') return 'vegan';
        if (d === 'jain') return 'jain';
        return d;
    }

    public static extractHobbies(meta: any = {}): Array<{ key: string; label: string }> {
        const rawList: string[] = [];
        if (Array.isArray(meta?.interests)) rawList.push(...meta.interests);
        if (Array.isArray(meta?.hobbies)) rawList.push(...meta.hobbies);
        if (Array.isArray(meta?.lifestyle?.hobbies)) {
            rawList.push(...meta.lifestyle.hobbies);
        } else if (typeof meta?.lifestyle?.hobbies === 'string') {
            rawList.push(...meta.lifestyle.hobbies.split(','));
        }

        const seen = new Map<string, string>();
        for (const item of rawList) {
            if (!item || typeof item !== 'string') continue;
            const trimmed = item.trim();
            if (!trimmed) continue;
            const lower = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
            const firstWord = lower.split(/\s+/)[0] || lower;
            const canonical = HOBBY_CANONICAL[lower] || HOBBY_CANONICAL[firstWord] || lower;
            if (canonical && !seen.has(canonical)) {
                seen.set(canonical, trimmed);
            }
        }
        return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
    }

    public static parseAgeRange(raw?: string | null): { min: number; max: number } | null {
        if (!raw || typeof raw !== 'string') return null;
        const clean = raw.trim().toLowerCase();
        if (!clean || clean === 'any' || clean === 'open') return null;
        const rangeMatch = clean.match(/(\d{2})\s*(?:-|to|–|—)\s*(\d{2})/);
        if (rangeMatch) {
            const a = parseInt(rangeMatch[1], 10);
            const b = parseInt(rangeMatch[2], 10);
            if (a >= 18 && b >= 18) {
                return { min: Math.min(a, b), max: Math.max(a, b) };
            }
        }
        const plusMatch = clean.match(/(\d{2})\s*\+/);
        if (plusMatch) {
            const min = parseInt(plusMatch[1], 10);
            if (min >= 18) return { min, max: 99 };
        }
        const singleMatch = clean.match(/\b(\d{2})\b/);
        if (singleMatch) {
            const center = parseInt(singleMatch[1], 10);
            if (center >= 18) return { min: Math.max(18, center - 2), max: center + 2 };
        }
        return null;
    }

    public static parseHeightToInches(hStr?: string | null): number {
        if (!hStr || typeof hStr !== 'string') return 0;
        const lower = hStr.toLowerCase().trim();
        const cmMatch = lower.match(/(\d{3})\s*cm/);
        if (cmMatch) return Math.round(parseInt(cmMatch[1], 10) / 2.54);
        const ftInMatch = lower.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?/);
        if (ftInMatch) {
            const ft = parseInt(ftInMatch[1], 10);
            const inches = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
            return ft * 12 + inches;
        }
        const dotMatch = lower.match(/^(\d)\.(\d{1,2})$/);
        if (dotMatch) {
            return parseInt(dotMatch[1], 10) * 12 + parseInt(dotMatch[2], 10);
        }
        return 0;
    }

    public static parseHeightRangeInches(raw?: string | null): { min: number; max: number } | null {
        if (!raw || typeof raw !== 'string') return null;
        const clean = raw.trim();
        if (!clean || /^any$/i.test(clean)) return null;
        const parts = clean.split(/(?:-|to|–|—)/i).map(s => this.parseHeightToInches(s)).filter(n => n > 0);
        if (parts.length >= 2) {
            return { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
        }
        if (parts.length === 1) {
            return { min: parts[0] - 2, max: parts[0] + 4 };
        }
        return null;
    }

    public static parseIncomeNumeric(raw?: string | null): number {
        if (!raw || typeof raw !== 'string') return 0;
        const clean = raw.trim().toLowerCase().replace(/,/g, '');
        const match = clean.match(/(\d+(?:\.\d+)?)/);
        if (!match) return 0;
        let num = parseFloat(match[1]);
        if (clean.includes('cr')) num *= 100;
        else if (clean.includes('k') && !clean.includes('lpa') && !clean.includes('lakh')) num *= 0.85;
        return num;
    }

    public static calculateHaversineKm(lat1: any, lng1: any, lat2: any, lng2: any): number | null {
        const a1 = parseFloat(String(lat1));
        const o1 = parseFloat(String(lng1));
        const a2 = parseFloat(String(lat2));
        const o2 = parseFloat(String(lng2));
        if (![a1, o1, a2, o2].every(n => Number.isFinite(n))) return null;
        if ((a1 === 0 && o1 === 0) || (a2 === 0 && o2 === 0)) return null;
        const R = 6371;
        const dLat = ((a2 - a1) * Math.PI) / 180;
        const dLng = ((o2 - o1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) * 10) / 10;
    }

    /**
     * Extracts Big 5 personality traits (0.0 to 1.0) from unstructured bio and prompt text.
     */
    public static extractPersonalityTraits(bioText: string, metadata: any = {}) {
        const text = `${bioText || ''} ${JSON.stringify(metadata || '')}`.toLowerCase();

        const countMatches = (words: string[]) => words.filter(w => text.includes(w)).length;

        const opennessWords = ['creative', 'curious', 'art', 'travel', 'explore', 'music', 'design', 'learning', 'open-minded', 'books', 'ideas', 'culture'];
        const oCount = countMatches(opennessWords);
        const openness = Math.min(1.0, 0.45 + (oCount * 0.1));

        const conscientiousnessWords = ['organized', 'ambitious', 'career', 'goals', 'focused', 'hardworking', 'discipline', 'planner', 'punctual', 'reliable'];
        const cCount = countMatches(conscientiousnessWords);
        const conscientiousness = Math.min(1.0, 0.45 + (cCount * 0.1));

        const extraversionWords = ['social', 'outgoing', 'party', 'friends', 'chat', 'extrovert', 'energy', 'dancing', 'laughter', 'humor', 'active'];
        const eCount = countMatches(extraversionWords);
        const extraversion = Math.min(1.0, 0.45 + (eCount * 0.1));

        const agreeablenessWords = ['kind', 'caring', 'family', 'supportive', 'empathy', 'helpful', 'patient', 'generous', 'loving', 'warm'];
        const aCount = countMatches(agreeablenessWords);
        const agreeableness = Math.min(1.0, 0.50 + (aCount * 0.1));

        const stabilityWords = ['calm', 'peaceful', 'chill', 'relaxed', 'mindful', 'meditation', 'grounded', 'balanced'];
        const stressWords = ['anxious', 'stress', 'worried', 'overthinking', 'impatient'];
        const sCount = countMatches(stabilityWords);
        const stressCount = countMatches(stressWords);
        const emotionalStability = Math.max(0.2, Math.min(1.0, 0.60 + (sCount * 0.08) - (stressCount * 0.12)));

        return { openness, conscientiousness, extraversion, agreeableness, emotionalStability };
    }

    /**
     * Computes multi-dimensional AI match metrics between two complete profiles,
     * incorporating age & partner age-range preferences, Vedic astrology + Manglik/Gothra,
     * GPS/city/preferred location, expectations, hobbies, diet/lifestyle, education/career, and religion.
     */
    public static computeMatch(userA: any, userB: any): AIMatchAnalysis {
        const metaA = (userA.profiles?.metadata as any) || (userA.metadata as any) || {};
        const metaB = (userB.profiles?.metadata as any) || (userB.metadata as any) || {};

        const reasons: string[] = [];
        const strengths: string[] = [];

        // ─────────────────────────────────────────────────────────────
        // 1. Psychological & Personality Alignment (Weight: 25%)
        // ─────────────────────────────────────────────────────────────
        const traitsA = this.extractPersonalityTraits(userA.profiles?.raw_prompt || userA.bio || '', metaA);
        const traitsB = this.extractPersonalityTraits(userB.profiles?.raw_prompt || userB.bio || '', metaB);

        const cDiff = Math.abs(traitsA.conscientiousness - traitsB.conscientiousness);
        const aDiff = Math.abs(traitsA.agreeableness - traitsB.agreeableness);
        const oDiff = Math.abs(traitsA.openness - traitsB.openness);
        const avgStability = (traitsA.emotionalStability + traitsB.emotionalStability) / 2;

        let personalityScore = Math.round(
            100 - (cDiff * 25) - (aDiff * 25) - (oDiff * 20) + (avgStability * 20)
        );
        personalityScore = Math.max(45, Math.min(99, personalityScore));

        if (personalityScore >= 80) {
            strengths.push("Deep Emotional & Personality Resonance");
            reasons.push("🧠 High Emotional Resonance");
        }

        // ─────────────────────────────────────────────────────────────
        // 2. Core Values, Career & Partner Expectations Alignment (Weight: 25%)
        // ─────────────────────────────────────────────────────────────
        let valuesScore = 60;

        const intentA = (userA.intent || metaA.intent || 'marriage').toLowerCase();
        const intentB = (userB.intent || metaB.intent || 'marriage').toLowerCase();
        if (intentA === intentB || (intentA.includes('marriage') && intentB.includes('marriage'))) {
            valuesScore += 15;
            strengths.push("Aligned Relationship Goals & Marriage Timeline");
            reasons.push("💍 Aligned Marriage Vision");
        }

        const relocA = (userA.relocation_willingness || metaA.relocation || 'open').toLowerCase();
        const relocB = (userB.relocation_willingness || metaB.relocation || 'open').toLowerCase();
        if (relocA === relocB || relocA.includes('open') || relocB.includes('open') || relocA.includes('yes') || relocB.includes('yes')) {
            valuesScore += 10;
        }

        const eduA = (metaA.career?.educationLevel || metaA.career?.education || '').toLowerCase();
        const eduB = (metaB.career?.educationLevel || metaB.career?.education || '').toLowerCase();
        if (eduA && eduB && (eduA === eduB || ((eduA.includes('master') || eduA.includes('bachelor')) && (eduB.includes('master') || eduB.includes('bachelor'))))) {
            valuesScore += 10;
            reasons.push("🎓 Education & Ambition Harmony");
        }

        const prefA = metaA.partnerPreferences || {};
        const heightRangeA = this.parseHeightRangeInches(prefA.heightRange);
        const heightBIn = this.parseHeightToInches(metaB.height);
        if (heightRangeA && heightBIn > 0) {
            if (heightBIn >= heightRangeA.min && heightBIn <= heightRangeA.max) {
                valuesScore += 6;
                reasons.push("📏 Matches Preferred Height");
            } else {
                valuesScore -= 4;
            }
        }
        const prefIncA = this.parseIncomeNumeric(prefA.income);
        const candIncB = this.parseIncomeNumeric(metaB.career?.income);
        if (prefIncA > 0 && candIncB > 0 && candIncB >= prefIncA) {
            valuesScore += 5;
        }

        let expectationsMatchCount = 0;
        const expTextA = String(metaA.expectations || metaA.prompt || '').toLowerCase().trim();
        if (expTextA.length >= 6) {
            const candidateHaystack = [
                userB.profiles?.raw_prompt,
                metaB.aboutMe,
                metaB.bio,
                metaB.career?.profession,
                metaB.career?.education,
                metaB.career?.educationLevel,
                metaB.location?.city,
                metaB.location?.state,
                metaB.location?.country,
                metaB.religion?.religion,
                metaB.religion?.caste,
                metaB.motherTongue,
                metaB.lifestyle?.diet,
                metaB.family?.values,
                ...(Array.isArray(metaB.interests) ? metaB.interests : []),
                metaB.lifestyle?.hobbies
            ].filter(Boolean).join(' ').toLowerCase();

            const stopWords = new Set(['looking', 'partner', 'someone', 'should', 'person', 'would', 'their', 'about', 'with', 'from', 'that', 'this', 'have', 'good', 'nice', 'life', 'marriage']);
            const tokensA = Array.from(new Set(expTextA.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w))));
            const matchedTokens = tokensA.filter(t => candidateHaystack.includes(t));
            expectationsMatchCount = matchedTokens.length;
            if (expectationsMatchCount >= 2) {
                valuesScore += Math.min(10, expectationsMatchCount * 3);
                reasons.push("💫 Aligns With Your Expectations");
                strengths.push("Directly aligns with the qualities you seek in a partner");
            } else if (expectationsMatchCount === 1) {
                valuesScore += 4;
            }
        }

        valuesScore = Math.max(40, Math.min(99, valuesScore));

        // ─────────────────────────────────────────────────────────────
        // 3. Lifestyle, Diet, Habits & Hobbies Chemistry (Weight: 20%)
        // ─────────────────────────────────────────────────────────────
        let lifestyleScore = 55;

        const dietA = this.normalizeDiet(metaA.lifestyle?.diet);
        const dietB = this.normalizeDiet(metaB.lifestyle?.diet);
        if (dietA && dietB) {
            if (dietA === dietB) {
                lifestyleScore += 15;
                reasons.push("🥗 Identical Diet & Dining Vibe");
            } else if ((dietA === 'vegetarian' || dietA === 'vegan' || dietA === 'jain') && (dietB === 'vegetarian' || dietB === 'vegan' || dietB === 'jain')) {
                lifestyleScore += 10;
            } else if (dietA === 'vegetarian' && dietB === 'non-vegetarian') {
                lifestyleScore -= 6;
            }
        }

        const smokeA = (metaA.lifestyle?.smoking || metaA.lifestyle?.smoke || 'no').toLowerCase();
        const smokeB = (metaB.lifestyle?.smoking || metaB.lifestyle?.smoke || 'no').toLowerCase();
        if (smokeA === 'no' && smokeB === 'no') {
            lifestyleScore += 12;
            strengths.push("Clean Healthy Habits (Non-Smokers)");
        } else if ((smokeA === 'yes' && smokeB === 'no') || (smokeA === 'no' && smokeB === 'yes')) {
            lifestyleScore -= 15;
        }

        const drinkA = (metaA.lifestyle?.drinking || metaA.lifestyle?.drink || '').toLowerCase();
        const drinkB = (metaB.lifestyle?.drinking || metaB.lifestyle?.drink || '').toLowerCase();
        if (drinkA && drinkB) {
            if (drinkA === 'no' && drinkB === 'no') {
                lifestyleScore += 5;
            } else if (drinkA === 'no' && drinkB === 'yes') {
                lifestyleScore -= 6;
            }
        }

        const hobbiesA = this.extractHobbies(metaA);
        const hobbiesB = this.extractHobbies(metaB);
        const hobbyMapB = new Map(hobbiesB.map(h => [h.key, h.label]));
        const sharedHobbies = hobbiesA.filter(h => hobbyMapB.has(h.key)).map(h => h.label);

        if (sharedHobbies.length > 0) {
            lifestyleScore += Math.min(20, sharedHobbies.length * 8);
            const topHobbies = sharedHobbies.slice(0, 2).map(h => h.charAt(0).toUpperCase() + h.slice(1));
            reasons.push(`✨ Shared Passions: ${topHobbies.join(' & ')}`);
            strengths.push(`Shared enthusiasm for ${topHobbies.join(' & ')}`);
        }

        lifestyleScore = Math.max(35, Math.min(99, lifestyleScore));

        // ─────────────────────────────────────────────────────────────
        // 4. Cultural, Linguistic & Vedic Astrology Synergy (Weight: 15%)
        // ─────────────────────────────────────────────────────────────
        let cosmicScore = 65;

        const mtA = (metaA.motherTongue || '').toLowerCase().trim();
        const mtB = (metaB.motherTongue || '').toLowerCase().trim();
        if (mtA && mtB && mtA === mtB && mtA !== 'unknown') {
            cosmicScore += 12;
            reasons.push("🗣️ Same Cultural & Mother Tongue Roots");
            strengths.push("Shared linguistic background & cultural understanding");
        }

        let gunaScore: number | null = null;
        let manglikCompatible = true;
        let gothraCompatible: boolean | null = null;

        try {
            const gunaResult = astrologyService.calculateCompatibility(
                { id: userA.id, full_name: userA.full_name, dob: metaA.dob, horoscope: metaA.horoscope, religion: metaA.religion },
                { id: userB.id, full_name: userB.full_name, dob: metaB.dob, horoscope: metaB.horoscope, religion: metaB.religion }
            );
            if (gunaResult && typeof gunaResult.score === 'number') {
                gunaScore = gunaResult.score;
                manglikCompatible = Boolean(gunaResult.manglikCompatible !== false);
                gothraCompatible = gunaResult.gothraCompatible ?? null;

                const normalizedGuna = Math.round((gunaResult.score / 36) * 100);
                cosmicScore = Math.round((cosmicScore * 0.35) + (normalizedGuna * 0.65));
                reasons.push(`⭐ Vedic Kundli: ${gunaResult.score}/36 Gunas`);
                if (gunaResult.score >= 21) {
                    strengths.push(`Auspicious Vedic compatibility (${gunaResult.score}/36 Guna Milan)`);
                }

                const hasExplicitManglik = Boolean(metaA.horoscope?.manglik || metaB.horoscope?.manglik);
                if (hasExplicitManglik) {
                    if (!manglikCompatible) {
                        cosmicScore -= 8;
                    } else if (metaA.horoscope?.manglik && metaB.horoscope?.manglik && metaA.horoscope.manglik !== "Don't Know" && metaB.horoscope.manglik !== "Don't Know") {
                        cosmicScore += 5;
                        reasons.push("🪐 Manglik Compatible");
                    }
                }
                if (gothraCompatible === true) {
                    cosmicScore += 4;
                    reasons.push("🕉️ Distinct Gothra Compatible");
                } else if (gothraCompatible === false) {
                    cosmicScore -= 6;
                }
            }
        } catch {
            // Soft fallback
        }

        const signA = (metaA.horoscope?.zodiacSign || metaA.astrology?.zodiac || '').toLowerCase().trim();
        const signB = (metaB.horoscope?.zodiacSign || metaB.astrology?.zodiac || '').toLowerCase().trim();
        const elemA = ZODIAC_ELEMENTS[signA];
        const elemB = ZODIAC_ELEMENTS[signB];
        if (elemA && elemB) {
            const elemScore = ELEMENT_HARMONY[elemA]?.[elemB] || 75;
            cosmicScore = Math.round((cosmicScore * 0.6) + (elemScore * 0.4));
            if (elemScore >= 85) {
                reasons.push(`✨ Cosmic Elemental Synergy (${elemA} + ${elemB})`);
                strengths.push(`Harmonious elemental astrological connection (${elemA} & ${elemB})`);
            }
        }

        cosmicScore = Math.max(45, Math.min(99, cosmicScore));

        // ─────────────────────────────────────────────────────────────
        // 5. Age Preferences, Location Proximity & Verification Affinity (Weight: 15%)
        // ─────────────────────────────────────────────────────────────
        let affinityScore = 70;
        const ageA = userA.age || 26;
        const ageB = userB.age || 26;
        const ageDiff = Math.abs(ageA - ageB);

        let agePreferenceMatch: boolean | null = null;
        const ageRangeA = this.parseAgeRange(prefA.ageRange);
        const ageRangeB = this.parseAgeRange(metaB.partnerPreferences?.ageRange);

        if (ageRangeA && userB.age) {
            if (ageB >= ageRangeA.min && ageB <= ageRangeA.max) {
                agePreferenceMatch = true;
                affinityScore += 14;
                reasons.push("🎯 Matches Your Age Expectation");
                strengths.push(`Age (${ageB}) fits right inside your preferred range (${ageRangeA.min}-${ageRangeA.max})`);
            } else {
                agePreferenceMatch = false;
                const distFromRange = ageB < ageRangeA.min ? (ageRangeA.min - ageB) : (ageB - ageRangeA.max);
                affinityScore -= Math.min(18, 6 + distFromRange * 2);
            }
        }
        if (ageRangeB && userA.age && ageA >= ageRangeB.min && ageA <= ageRangeB.max) {
            affinityScore += 4;
        }

        if (agePreferenceMatch === null) {
            if (ageDiff <= 3) {
                affinityScore += 15;
                reasons.push("⏳ Ideal Age Compatibility");
            } else if (ageDiff <= 6) {
                affinityScore += 8;
            } else if (ageDiff > 10) {
                affinityScore -= 12;
            }
        }

        const distanceKm = this.calculateHaversineKm(
            metaA.location?.lat, metaA.location?.lng,
            metaB.location?.lat, metaB.location?.lng
        );
        const cityA = this.normalizeCity(userA.city || metaA.location?.city);
        const cityB = this.normalizeCity(userB.city || metaB.location?.city);
        const stateA = String(userA.state || metaA.location?.state || '').trim().toLowerCase();
        const stateB = String(userB.state || metaB.location?.state || '').trim().toLowerCase();
        const countryA = String(metaA.location?.country || '').trim().toLowerCase();
        const countryB = String(metaB.location?.country || '').trim().toLowerCase();

        if (cityA && cityB && cityA === cityB) {
            affinityScore += 15;
            reasons.push(`📍 Local Connection (${String(userB.city || metaB.location?.city).trim()})`);
            strengths.push(`Same city convenience for easy in-person dates`);
        } else if (distanceKm !== null && distanceKm <= 50) {
            affinityScore += 13;
            reasons.push(`📍 Nearby (${Math.round(distanceKm)} km)`);
        } else if (stateA && stateB && stateA === stateB) {
            affinityScore += 7;
        } else if (countryA && countryB && countryA === countryB) {
            affinityScore += 3;
        }

        let locationPreferenceMatch: boolean | null = null;
        const prefLocA = String(prefA.location || '').trim().toLowerCase();
        if (prefLocA && prefLocA !== 'any' && prefLocA !== 'anywhere') {
            const locTokens = prefLocA.split(/[,/]/).map(s => this.normalizeCity(s) || s.trim()).filter(Boolean);
            const candLocHaystack = [cityB, stateB, countryB, String(metaB.location?.district || '').trim().toLowerCase(), String(userB.location_name || '').toLowerCase()].filter(Boolean).join(' ');
            const matchedLoc = locTokens.some(tok => candLocHaystack.includes(tok));
            locationPreferenceMatch = matchedLoc;
            if (matchedLoc) {
                affinityScore += 10;
                reasons.push("📍 Matches Preferred Location");
            }
        }

        affinityScore = Math.max(40, Math.min(99, affinityScore));

        // ─────────────────────────────────────────────────────────────
        // Composite Overall Score (Weighted Scientific Average)
        // ─────────────────────────────────────────────────────────────
        let overall = Math.round(
            (personalityScore * 0.25) +
            (valuesScore * 0.25) +
            (lifestyleScore * 0.20) +
            (cosmicScore * 0.15) +
            (affinityScore * 0.15)
        );

        overall = Math.max(50, Math.min(99, overall));

        if (strengths.length === 0) {
            strengths.push("Promising foundation for shared conversations");
            strengths.push("Complementary life stages and mutual maturity");
        }

        let growthTip = "Take time to share stories about what inspired your current life paths.";
        if (cDiff > 0.4) {
            growthTip = "One of you thrives on structured planning while the other brings spontaneous flair — embrace both perspectives!";
        } else if (sharedHobbies.length === 0) {
            growthTip = "Ask each other about an unexpected hobby or interest you haven't listed on your profile yet.";
        }

        const candFirstName = (userB.full_name || 'there').split(' ')[0];
        let icebreaker = `Hi ${candFirstName}! Loved your profile vibe — how has your week been going?`;
        if (sharedHobbies.length > 0) {
            const h = sharedHobbies[0].charAt(0).toUpperCase() + sharedHobbies[0].slice(1);
            icebreaker = `Hey ${candFirstName}! Saw we're both into ${h} ✨ What got you started with it?`;
        } else if (cityA && cityB && cityA === cityB) {
            icebreaker = `Hey ${candFirstName}! Fellow ${String(userB.city || metaB.location?.city || 'local').trim()} resident here 🌆 What's your favorite weekend spot in town?`;
        }

        return {
            score: overall,
            dimensions: {
                personality: personalityScore,
                values: valuesScore,
                lifestyle: lifestyleScore,
                cosmic: cosmicScore,
                overall
            },
            reasons: Array.from(new Set(reasons)),
            strengths: Array.from(new Set(strengths)),
            growthTip,
            icebreaker,
            details: {
                sharedHobbies,
                distanceKm,
                agePreferenceMatch,
                locationPreferenceMatch,
                expectationsMatchCount,
                gunaScore,
                manglikCompatible,
                gothraCompatible
            }
        };
    }
}
