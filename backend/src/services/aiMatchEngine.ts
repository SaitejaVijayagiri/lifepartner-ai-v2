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

export class AIMatchEngine {
    /**
     * Extracts Big 5 personality traits (0.0 to 1.0) from unstructured bio and prompt text.
     */
    public static extractPersonalityTraits(bioText: string, metadata: any = {}) {
        const text = `${bioText || ''} ${JSON.stringify(metadata || '')}`.toLowerCase();

        const countMatches = (words: string[]) => words.filter(w => text.includes(w)).length;

        // Openness: curiosity, imagination, art, travel, philosophy
        const opennessWords = ['creative', 'curious', 'art', 'travel', 'explore', 'music', 'design', 'learning', 'open-minded', 'books', 'ideas', 'culture'];
        const oCount = countMatches(opennessWords);
        const openness = Math.min(1.0, 0.45 + (oCount * 0.1));

        // Conscientiousness: organized, disciplined, goal-driven, ambitious, reliability
        const conscientiousnessWords = ['organized', 'ambitious', 'career', 'goals', 'focused', 'hardworking', 'discipline', 'planner', 'punctual', 'reliable'];
        const cCount = countMatches(conscientiousnessWords);
        const conscientiousness = Math.min(1.0, 0.45 + (cCount * 0.1));

        // Extraversion: social, outgoing, talkative, energy, outdoors, events
        const extraversionWords = ['social', 'outgoing', 'party', 'friends', 'chat', 'extrovert', 'energy', 'dancing', 'laughter', 'humor', 'active'];
        const eCount = countMatches(extraversionWords);
        const extraversion = Math.min(1.0, 0.45 + (eCount * 0.1));

        // Agreeableness: empathetic, kind, family-oriented, caring, supportive, helpful
        const agreeablenessWords = ['kind', 'caring', 'family', 'supportive', 'empathy', 'helpful', 'patient', 'generous', 'loving', 'warm'];
        const aCount = countMatches(agreeablenessWords);
        const agreeableness = Math.min(1.0, 0.50 + (aCount * 0.1));

        // Emotional Stability (inverse of Neuroticism): calm, relaxed, balanced, peaceful
        const stabilityWords = ['calm', 'peaceful', 'chill', 'relaxed', 'mindful', 'meditation', 'grounded', 'balanced'];
        const stressWords = ['anxious', 'stress', 'worried', 'overthinking', 'impatient'];
        const sCount = countMatches(stabilityWords);
        const stressCount = countMatches(stressWords);
        const emotionalStability = Math.max(0.2, Math.min(1.0, 0.60 + (sCount * 0.08) - (stressCount * 0.12)));

        return { openness, conscientiousness, extraversion, agreeableness, emotionalStability };
    }

    /**
     * Computes multi-dimensional AI match metrics between two complete profiles.
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

        // Similarity on Conscientiousness & Agreeableness correlates with lasting relationship stability
        const cDiff = Math.abs(traitsA.conscientiousness - traitsB.conscientiousness);
        const aDiff = Math.abs(traitsA.agreeableness - traitsB.agreeableness);
        const oDiff = Math.abs(traitsA.openness - traitsB.openness);

        // Extraversion works well both when similar (active together) or complementary
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
        // 2. Core Values & Vision Alignment (Weight: 25%)
        // ─────────────────────────────────────────────────────────────
        let valuesScore = 60; // Baseline

        // Intent match (Marriage / Serious / Matrimony)
        const intentA = (userA.intent || metaA.intent || 'marriage').toLowerCase();
        const intentB = (userB.intent || metaB.intent || 'marriage').toLowerCase();
        if (intentA === intentB || intentA.includes('marriage') && intentB.includes('marriage')) {
            valuesScore += 15;
            strengths.push("Aligned Relationship Goals & Marriage Timeline");
            reasons.push("💍 Aligned Marriage Vision");
        }

        // Relocation willingness
        const relocA = (userA.relocation_willingness || metaA.relocation || 'open').toLowerCase();
        const relocB = (userB.relocation_willingness || metaB.relocation || 'open').toLowerCase();
        if (relocA === relocB || relocA.includes('open') || relocB.includes('open') || relocA.includes('yes') || relocB.includes('yes')) {
            valuesScore += 10;
        }

        // Career & Education ambition harmony
        const eduA = (metaA.career?.educationLevel || metaA.career?.education || '').toLowerCase();
        const eduB = (metaB.career?.educationLevel || metaB.career?.education || '').toLowerCase();
        if (eduA && eduB && (eduA === eduB || (eduA.includes('master') || eduA.includes('bachelor')) && (eduB.includes('master') || eduB.includes('bachelor')))) {
            valuesScore += 10;
            reasons.push("🎓 Education & Ambition Harmony");
        }

        valuesScore = Math.max(40, Math.min(99, valuesScore));

        // ─────────────────────────────────────────────────────────────
        // 3. Lifestyle & Daily Rhythm Chemistry (Weight: 20%)
        // ─────────────────────────────────────────────────────────────
        let lifestyleScore = 55;

        // Diet alignment
        const dietA = (metaA.lifestyle?.diet || '').toLowerCase();
        const dietB = (metaB.lifestyle?.diet || '').toLowerCase();
        if (dietA && dietB) {
            if (dietA === dietB) {
                lifestyleScore += 15;
                reasons.push("🥗 Identical Diet & Dining Vibe");
            } else if ((dietA.includes('veg') && dietB.includes('veg')) || (!dietA.includes('non') && !dietB.includes('non'))) {
                lifestyleScore += 10;
            }
        }

        // Smoking & Drinking habits
        const smokeA = (metaA.lifestyle?.smoking || metaA.lifestyle?.smoke || 'no').toLowerCase();
        const smokeB = (metaB.lifestyle?.smoking || metaB.lifestyle?.smoke || 'no').toLowerCase();
        if (smokeA === 'no' && smokeB === 'no') {
            lifestyleScore += 12;
            strengths.push("Clean Healthy Habits (Non-Smokers)");
        } else if (smokeA === 'yes' && smokeB === 'no' || smokeA === 'no' && smokeB === 'yes') {
            lifestyleScore -= 15; // Dealbreaker penalty
        }

        // Interests & Hobbies Jaccard similarity
        const hobbiesA: string[] = Array.isArray(metaA.interests) ? metaA.interests : (metaA.lifestyle?.hobbies ? String(metaA.lifestyle.hobbies).split(',') : []);
        const hobbiesB: string[] = Array.isArray(metaB.interests) ? metaB.interests : (metaB.lifestyle?.hobbies ? String(metaB.lifestyle.hobbies).split(',') : []);

        const cleanSetA = new Set(hobbiesA.map(h => h.trim().toLowerCase()).filter(Boolean));
        const cleanSetB = new Set(hobbiesB.map(h => h.trim().toLowerCase()).filter(Boolean));

        const intersection = [...cleanSetA].filter(x => cleanSetB.has(x));
        if (intersection.length > 0) {
            lifestyleScore += Math.min(20, intersection.length * 8);
            const topHobbies = intersection.slice(0, 2).map(h => h.charAt(0).toUpperCase() + h.slice(1));
            reasons.push(`✨ Shared Passions: ${topHobbies.join(' & ')}`);
            strengths.push(`Shared enthusiasm for ${topHobbies.join(' & ')}`);
        }

        lifestyleScore = Math.max(35, Math.min(99, lifestyleScore));

        // ─────────────────────────────────────────────────────────────
        // 4. Cultural, Linguistic & Cosmic Synergy (Weight: 15%)
        // ─────────────────────────────────────────────────────────────
        let cosmicScore = 65;

        // Mother tongue
        const mtA = (metaA.motherTongue || '').toLowerCase().trim();
        const mtB = (metaB.motherTongue || '').toLowerCase().trim();
        if (mtA && mtB && mtA === mtB && mtA !== 'unknown') {
            cosmicScore += 12;
            reasons.push("🗣️ Same Cultural & Mother Tongue Roots");
            strengths.push("Shared linguistic background & cultural understanding");
        }

        // Vedic Astrology Guna Milan
        const nakshatraA = metaA.horoscope?.nakshatra || metaA.astrology?.nakshatra;
        const nakshatraB = metaB.horoscope?.nakshatra || metaB.astrology?.nakshatra;
        if (nakshatraA && nakshatraB) {
            try {
                const gunaResult = astrologyService.calculateCompatibility(nakshatraA, nakshatraB);
                if (gunaResult && gunaResult.score) {
                    const normalizedGuna = Math.round((gunaResult.score / 36) * 100);
                    cosmicScore = Math.round((cosmicScore * 0.4) + (normalizedGuna * 0.6));
                    reasons.push(`⭐ Vedic Kundli: ${gunaResult.score}/36 Gunas`);
                    if (gunaResult.score >= 21) {
                        strengths.push(`Auspicious Vedic compatibility (${gunaResult.score}/36 Guna Milan)`);
                    }
                }
            } catch (e) {
                // Soft fallback
            }
        } else {
            // Western Zodiac Elemental Synergy
            const signA = (metaA.horoscope?.zodiacSign || metaA.astrology?.zodiac || '').toLowerCase().trim();
            const signB = (metaB.horoscope?.zodiacSign || metaB.astrology?.zodiac || '').toLowerCase().trim();
            const elemA = ZODIAC_ELEMENTS[signA];
            const elemB = ZODIAC_ELEMENTS[signB];
            if (elemA && elemB) {
                const elemScore = ELEMENT_HARMONY[elemA]?.[elemB] || 75;
                cosmicScore = Math.round((cosmicScore * 0.4) + (elemScore * 0.6));
                if (elemScore >= 85) {
                    reasons.push(`✨ Cosmic Elemental Synergy (${elemA} + ${elemB})`);
                    strengths.push(`Harmonious elemental astrological connection (${elemA} & ${elemB})`);
                }
            }
        }

        cosmicScore = Math.max(45, Math.min(99, cosmicScore));

        // ─────────────────────────────────────────────────────────────
        // 5. Verification & Age Proximity Affinity (Weight: 15%)
        // ─────────────────────────────────────────────────────────────
        let affinityScore = 70;
        const ageA = userA.age || 26;
        const ageB = userB.age || 26;
        const ageDiff = Math.abs(ageA - ageB);
        if (ageDiff <= 3) {
            affinityScore += 15;
            reasons.push("⏳ Ideal Age Compatibility");
        } else if (ageDiff <= 6) {
            affinityScore += 8;
        } else if (ageDiff > 10) {
            affinityScore -= 12;
        }

        // Location proximity
        const cityA = (userA.city || metaA.location?.city || '').toLowerCase();
        const cityB = (userB.city || metaB.location?.city || '').toLowerCase();
        if (cityA && cityB && cityA === cityB) {
            affinityScore += 15;
            reasons.push(`📍 Local Connection (${userB.city || metaB.location?.city})`);
            strengths.push(`Same city convenience for easy in-person dates`);
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

        // Fallback default strengths & tips if profile data is brief
        if (strengths.length === 0) {
            strengths.push("Promising foundation for shared conversations");
            strengths.push("Complementary life stages and mutual maturity");
        }

        let growthTip = "Take time to share stories about what inspired your current life paths.";
        if (cDiff > 0.4) {
            growthTip = "One of you thrives on structured planning while the other brings spontaneous flair — embrace both perspectives!";
        } else if (intersection.length === 0) {
            growthTip = "Ask each other about an unexpected hobby or interest you haven't listed on your profile yet.";
        }

        // Tailor the best conversation starter
        let icebreaker = `Hi ${(userB.full_name || 'there').split(' ')[0]}! Loved your profile vibe — how has your week been going?`;
        if (intersection.length > 0) {
            const h = intersection[0].charAt(0).toUpperCase() + intersection[0].slice(1);
            icebreaker = `Hey ${(userB.full_name || 'there').split(' ')[0]}! Saw we're both into ${h} ✨ What got you started with it?`;
        } else if (cityA && cityB && cityA === cityB) {
            icebreaker = `Hey ${(userB.full_name || 'there').split(' ')[0]}! Fellow ${userB.city || 'local'} resident here 🌆 What's your favorite weekend cafe spot in town?`;
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
            icebreaker
        };
    }
}
