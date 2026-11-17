
export interface UserAstrologyProfile {
    nakshatra: string;
    nakshatraIndex: number;
    zodiacSign: string;
    rashi: string;
    rashiIndex: number;
    rashiLord: string;
    yoni: string;
    nadi: 'Adi' | 'Madhya' | 'Antya';
    gana: 'Deva' | 'Manushya' | 'Rakshasa';
    manglik: string;
}

export class AstrologyService {

    // 27 Nakshatras in order
    private nakshatras = [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", // 1-6
        "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", // 7-12
        "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", // 13-18
        "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", // 19-24
        "Purva Bhadrapada", "Uttara Bhadrapada", "Revati" // 25-27
    ];

    public static readonly RASHIS = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];

    public static readonly VEDIC_RASHIS = [
        "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
        "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"
    ];

    // Nakshatra to Primary Rashi mapping (0 to 11):
    private nakshatraToRashi = [
        0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11
    ];

    // Rashi to Lord Planet
    private rashiLords = [
        "Mars",    // Aries (Mesha)
        "Venus",   // Taurus (Vrishabha)
        "Mercury", // Gemini (Mithuna)
        "Moon",    // Cancer (Karka)
        "Sun",     // Leo (Simha)
        "Mercury", // Virgo (Kanya)
        "Venus",   // Libra (Tula)
        "Mars",    // Scorpio (Vrishchika)
        "Jupiter", // Sagittarius (Dhanu)
        "Saturn",  // Capricorn (Makara)
        "Saturn",  // Aquarius (Kumbha)
        "Jupiter"  // Pisces (Meena)
    ];

    // Yoni Animal for each of the 27 Nakshatras
    private yoniAnimals = [
        "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog",
        "Cat", "Sheep", "Cat", "Rat", "Rat", "Cow",
        "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
        "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse",
        "Lion", "Cow", "Elephant"
    ];

    // Nakshatras assigned to each Zodiac Sign
    private static readonly ZODIAC_TO_NAKSHATRAS: Record<string, string[]> = {
        aries: ["Ashwini", "Bharani", "Krittika"],
        taurus: ["Krittika", "Rohini", "Mrigashirsha"],
        gemini: ["Mrigashirsha", "Ardra", "Punarvasu"],
        cancer: ["Punarvasu", "Pushya", "Ashlesha"],
        leo: ["Magha", "Purva Phalguni", "Uttara Phalguni"],
        virgo: ["Uttara Phalguni", "Hasta", "Chitra"],
        libra: ["Chitra", "Swati", "Vishakha"],
        scorpio: ["Vishakha", "Anuradha", "Jyeshtha"],
        sagittarius: ["Mula", "Purva Ashadha", "Uttara Ashadha"],
        capricorn: ["Uttara Ashadha", "Shravana", "Dhanishta"],
        aquarius: ["Dhanishta", "Shatabhisha", "Purva Bhadrapada"],
        pisces: ["Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]
    };

    // Authentic Vedic Nama-Nakshatra (Swara Shastra) mapping for Indian names
    private static readonly NAME_PREFIX_TO_NAKSHATRA: Array<{ prefixes: string[]; nakshatra: string }> = [
        { prefixes: ["as", "ch", "la", "che", "cho", "chu"], nakshatra: "Ashwini" },
        { prefixes: ["li", "lu", "le", "lo", "lee"], nakshatra: "Bharani" },
        { prefixes: ["a", "i", "u", "ea", "an", "ak", "am", "al", "ab", "ad"], nakshatra: "Krittika" },
        { prefixes: ["o", "va", "vi", "vu", "vee", "vo", "vik", "vin", "var"], nakshatra: "Rohini" },
        { prefixes: ["ve", "ka", "ki", "kee", "kam", "kir", "kar", "ven"], nakshatra: "Mrigashirsha" },
        { prefixes: ["ku", "gh", "chha", "kul", "kun"], nakshatra: "Ardra" },
        { prefixes: ["ke", "ko", "ha", "hi", "hee", "har", "hem"], nakshatra: "Punarvasu" },
        { prefixes: ["hu", "he", "ho", "da", "dee", "deep", "din", "dam"], nakshatra: "Pushya" },
        { prefixes: ["de", "do", "du", "div", "dev"], nakshatra: "Ashlesha" },
        { prefixes: ["ma", "mi", "mu", "me", "man", "mee", "muk", "mar"], nakshatra: "Magha" },
        { prefixes: ["mo", "ta", "ti", "tu", "moh", "tar"], nakshatra: "Purva Phalguni" },
        { prefixes: ["te", "to", "pa", "pi", "pee", "poo", "pan"], nakshatra: "Uttara Phalguni" },
        { prefixes: ["pu", "sha", "na", "tha", "pra", "shan"], nakshatra: "Hasta" },
        { prefixes: ["pe", "po", "ra", "ri", "ree", "rah", "roh", "rit"], nakshatra: "Chitra" },
        { prefixes: ["ru", "re", "ro", "ram", "ros"], nakshatra: "Swati" },
        { prefixes: ["ti", "tu", "te", "to", "tar", "tej"], nakshatra: "Vishakha" },
        { prefixes: ["na", "ni", "nu", "ne", "nav", "neh", "nit"], nakshatra: "Anuradha" },
        { prefixes: ["no", "ya", "yi", "yu", "yas", "yog"], nakshatra: "Jyeshtha" },
        { prefixes: ["ye", "yo", "bha", "bhi", "bhav"], nakshatra: "Mula" },
        { prefixes: ["bhu", "dha", "pha", "dhar"], nakshatra: "Purva Ashadha" },
        { prefixes: ["bhe", "bho", "ja", "ji", "jay", "jit"], nakshatra: "Uttara Ashadha" },
        { prefixes: ["khi", "khu", "khe", "kho", "khush"], nakshatra: "Shravana" },
        { prefixes: ["ga", "gi", "gu", "ge", "gan", "gee", "gau"], nakshatra: "Dhanishta" },
        { prefixes: ["go", "sa", "si", "su", "sai", "sur", "sun", "san"], nakshatra: "Shatabhisha" },
        { prefixes: ["se", "so", "som", "sow"], nakshatra: "Purva Bhadrapada" },
        { prefixes: ["du", "tha", "jha", "nya"], nakshatra: "Uttara Bhadrapada" },
        { prefixes: ["de", "do", "cha", "chi", "chan", "che"], nakshatra: "Revati" }
    ];

    // Compute Sun/Zodiac Sign from Date of Birth
    public static getZodiacFromDOB(dobStr: string | null | undefined): string | null {
        if (!dobStr) return null;
        try {
            const date = new Date(dobStr);
            if (isNaN(date.getTime())) return null;
            const month = date.getUTCMonth() + 1; // 1-12
            const day = date.getUTCDate(); // 1-31

            if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
            if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
            if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
            if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
            if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
            if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
            if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
            if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
            if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
            if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
            if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
            if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";
        } catch (e) {}
        return null;
    }

    // Nadi Mapping (1=Adi, 2=Madhya, 3=Antya)
    public getNadi(nIndex: number): 'Adi' | 'Madhya' | 'Antya' {
        const i = nIndex + 1; // 1-based
        if ([1, 6, 7, 12, 13, 18, 19, 24, 25].includes(i)) return 'Adi';
        if ([2, 5, 8, 11, 14, 17, 20, 23, 26].includes(i)) return 'Madhya';
        return 'Antya';
    }

    // Gana Mapping
    public getGana(nIndex: number): 'Deva' | 'Manushya' | 'Rakshasa' {
        const i = nIndex + 1;
        if ([1, 5, 7, 8, 13, 15, 17, 22, 27].includes(i)) return 'Deva';
        if ([2, 4, 6, 11, 12, 20, 21, 25, 26].includes(i)) return 'Manushya';
        return 'Rakshasa';
    }

    // Helpers
    public getNakshatraIndex(name: string): number {
        if (!name || typeof name !== 'string') return -1;
        const normInput = name.toLowerCase().replace(/[^a-z]/g, '');
        if (!normInput) return -1;

        // 1. Try Exact/Fuzzy Match
        const exactIdx = this.nakshatras.findIndex(n => n.toLowerCase().replace(/[^a-z]/g, '') === normInput);
        if (exactIdx !== -1) return exactIdx;

        // 2. Try Substring Match
        return this.nakshatras.findIndex(n => normInput.includes(n.toLowerCase().replace(/[^a-z]/g, '')) || n.toLowerCase().replace(/[^a-z]/g, '').includes(normInput));
    }

    /**
     * Intelligently resolves a user's full Vedic astrology profile from:
     * 1. Explicit Nakshatra
     * 2. Selected Zodiac Sign / Rashi
     * 3. Date of Birth (DOB)
     * 4. Vedic Nama-Nakshatra (Name-sound syllable matching)
     * 5. Stable hash fallback
     */
    public resolveUserAstrology(userOrMeta: any): UserAstrologyProfile {
        if (!userOrMeta) {
            userOrMeta = {};
        }

        const rawNakshatra = userOrMeta.nakshatra || userOrMeta.horoscope?.nakshatra || userOrMeta.astrology?.nakshatra || '';
        const explicitIdx = this.getNakshatraIndex(rawNakshatra);

        let finalIdx = -1;

        // 1. Use explicit Nakshatra if valid
        if (explicitIdx !== -1) {
            finalIdx = explicitIdx;
        }

        // 2. Use explicit Zodiac Sign if present
        if (finalIdx === -1) {
            const rawZodiac = (userOrMeta.zodiacSign || userOrMeta.horoscope?.zodiacSign || userOrMeta.astrology?.zodiac || '').toLowerCase().trim();
            if (rawZodiac && AstrologyService.ZODIAC_TO_NAKSHATRAS[rawZodiac]) {
                const candidates = AstrologyService.ZODIAC_TO_NAKSHATRAS[rawZodiac];
                const hashSeed = String(userOrMeta.full_name || userOrMeta.name || userOrMeta.id || 'seed');
                const seedNum = hashSeed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const chosenNakshatra = candidates[seedNum % candidates.length];
                finalIdx = this.getNakshatraIndex(chosenNakshatra);
            }
        }

        // 3. Use Date of Birth (DOB)
        if (finalIdx === -1) {
            const dob = userOrMeta.dob || userOrMeta.date_of_birth || userOrMeta.horoscope?.dob;
            const zodiacFromDob = AstrologyService.getZodiacFromDOB(dob);
            if (zodiacFromDob) {
                const candidates = AstrologyService.ZODIAC_TO_NAKSHATRAS[zodiacFromDob.toLowerCase()];
                if (candidates) {
                    const day = new Date(dob).getUTCDate() || 1;
                    const chosenNakshatra = candidates[day % candidates.length];
                    finalIdx = this.getNakshatraIndex(chosenNakshatra);
                }
            }
        }

        // 4. Use Vedic Nama-Nakshatra (Swara Shastra) from Name
        if (finalIdx === -1) {
            const name = (userOrMeta.full_name || userOrMeta.name || '').toLowerCase().replace(/[^a-z]/g, '');
            if (name.length >= 2) {
                for (const rule of AstrologyService.NAME_PREFIX_TO_NAKSHATRA) {
                    if (rule.prefixes.some(p => name.startsWith(p))) {
                        finalIdx = this.getNakshatraIndex(rule.nakshatra);
                        break;
                    }
                }
            }
        }

        // 5. Stable, deterministic fallback from user ID or name
        if (finalIdx === -1) {
            const seedStr = String(userOrMeta.id || userOrMeta.full_name || userOrMeta.name || 'lifepartner');
            const totalSum = seedStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            finalIdx = Math.abs(totalSum) % 27;
        }

        const nakshatra = this.nakshatras[finalIdx];
        const rashiIndex = this.nakshatraToRashi[finalIdx];
        const zodiacSign = AstrologyService.RASHIS[rashiIndex];
        const rashi = AstrologyService.VEDIC_RASHIS[rashiIndex];
        const rashiLord = this.rashiLords[rashiIndex];
        const yoni = this.yoniAnimals[finalIdx];
        const nadi = this.getNadi(finalIdx);
        const gana = this.getGana(finalIdx);
        const manglik = userOrMeta.manglik || userOrMeta.horoscope?.manglik || "No";

        return {
            nakshatra,
            nakshatraIndex: finalIdx,
            zodiacSign,
            rashi,
            rashiIndex,
            rashiLord,
            yoni,
            nadi,
            gana,
            manglik
        };
    }

    public calculateCompatibility(inputA: any, inputB: any): { score: number, total: number, verdict?: string, astroA?: any, astroB?: any, details: any[] } {
        let i1: number;
        let i2: number;
        let astroA: UserAstrologyProfile | null = null;
        let astroB: UserAstrologyProfile | null = null;

        if (typeof inputA === 'string' && this.getNakshatraIndex(inputA) !== -1) {
            i1 = this.getNakshatraIndex(inputA);
        } else {
            astroA = this.resolveUserAstrology(inputA);
            i1 = astroA.nakshatraIndex;
        }

        if (typeof inputB === 'string' && this.getNakshatraIndex(inputB) !== -1) {
            i2 = this.getNakshatraIndex(inputB);
        } else {
            astroB = this.resolveUserAstrology(inputB);
            i2 = astroB.nakshatraIndex;
        }

        if (i1 === -1) i1 = 3;  // Rohini
        if (i2 === -1) i2 = 14; // Swati

        if (!astroA) {
            astroA = {
                nakshatra: this.nakshatras[i1],
                nakshatraIndex: i1,
                zodiacSign: AstrologyService.RASHIS[this.nakshatraToRashi[i1]],
                rashi: AstrologyService.VEDIC_RASHIS[this.nakshatraToRashi[i1]],
                rashiIndex: this.nakshatraToRashi[i1],
                rashiLord: this.rashiLords[this.nakshatraToRashi[i1]],
                yoni: this.yoniAnimals[i1],
                nadi: this.getNadi(i1),
                gana: this.getGana(i1),
                manglik: "No"
            };
        }

        if (!astroB) {
            astroB = {
                nakshatra: this.nakshatras[i2],
                nakshatraIndex: i2,
                zodiacSign: AstrologyService.RASHIS[this.nakshatraToRashi[i2]],
                rashi: AstrologyService.VEDIC_RASHIS[this.nakshatraToRashi[i2]],
                rashiIndex: this.nakshatraToRashi[i2],
                rashiLord: this.rashiLords[this.nakshatraToRashi[i2]],
                yoni: this.yoniAnimals[i2],
                nadi: this.getNadi(i2),
                gana: this.getGana(i2),
                manglik: "No"
            };
        }

        let totalScore = 0;
        const debug = [];

        const rashi1 = this.nakshatraToRashi[i1];
        const rashi2 = this.nakshatraToRashi[i2];

        // 1. Varna (1 Point) - Spiritual Compatibility
        const getVarnaValue = (rashiIdx: number): number => {
            if ([3, 7, 11].includes(rashiIdx)) return 4; // Brahmin
            if ([0, 4, 8].includes(rashiIdx)) return 3;  // Kshatriya
            if ([1, 5, 9].includes(rashiIdx)) return 2;  // Vaishya
            return 1;                                    // Shudra
        };
        const getVarnaName = (val: number): string => {
            if (val === 4) return "Brahmin";
            if (val === 3) return "Kshatriya";
            if (val === 2) return "Vaishya";
            return "Shudra";
        };

        const varnaVal1 = getVarnaValue(rashi1);
        const varnaVal2 = getVarnaValue(rashi2);
        let varnaScore = 0;
        let varnaDesc = "";

        if (varnaVal1 >= varnaVal2) {
            varnaScore = 1;
            varnaDesc = `Auspicious compatibility between ${getVarnaName(varnaVal1)} and ${getVarnaName(varnaVal2)}.`;
        } else {
            varnaScore = 0;
            varnaDesc = `Challenging varna alignment (${getVarnaName(varnaVal1)} matching with ${getVarnaName(varnaVal2)}).`;
        }
        totalScore += varnaScore;
        debug.push({ name: 'Varna', s: varnaScore, t: 1, v1: getVarnaName(varnaVal1), v2: getVarnaName(varnaVal2), desc: varnaDesc });

        // 2. Vashya (2 Points) - Mutual Attraction & Domination
        const getVashyaGroup = (rashiIdx: number): string => {
            if ([0, 1, 8].includes(rashiIdx)) return "Chatushpada";
            if (rashiIdx === 4) return "Vanachar";
            if ([2, 5, 6, 10].includes(rashiIdx)) return "Manav";
            if (rashiIdx === 7) return "Keeta";
            return "Jalachar";
        };

        const vashya1 = getVashyaGroup(rashi1);
        const vashya2 = getVashyaGroup(rashi2);

        const getVashyaScore = (g1: string, g2: string): number => {
            if (g1 === g2) return 2;
            if (g1 === "Chatushpada") {
                if (g2 === "Vanachar") return 0.5;
                return 1;
            }
            if (g1 === "Manav") {
                if (g2 === "Jalachar") return 0.5;
                if (g2 === "Vanachar") return 0;
                return 1;
            }
            if (g1 === "Jalachar") {
                if (g2 === "Vanachar") return 0;
                return 1;
            }
            if (g1 === "Keeta") {
                if (g2 === "Vanachar") return 0;
                return 1;
            }
            if (g1 === "Vanachar") {
                if (g2 === "Chatushpada") return 0.5;
                return 0;
            }
            return 1;
        };

        const vashyaScore = getVashyaScore(vashya1, vashya2);
        let vashyaDesc = "";
        if (vashyaScore === 2) {
            vashyaDesc = "Highly compatible attraction profiles.";
        } else if (vashyaScore === 1) {
            vashyaDesc = "Moderate natural attraction and domestic harmony.";
        } else if (vashyaScore === 0.5) {
            vashyaDesc = "Mild friction in mutual control and understanding.";
        } else {
            vashyaDesc = "Significant friction in mutual control (Vashya conflict).";
        }
        totalScore += vashyaScore;
        debug.push({ name: 'Vashya', s: vashyaScore, t: 2, v1: vashya1, v2: vashya2, desc: vashyaDesc });

        // 3. Tara (3 Points) - Destiny & Health Compatibility
        let rem1 = (i2 - i1 + 27) % 9;
        if (rem1 === 0) rem1 = 9;
        let rem2 = (i1 - i2 + 27) % 9;
        if (rem2 === 0) rem2 = 9;

        const isTaraAuspicious = (rem: number) => [2, 4, 6, 8, 9].includes(rem);
        const getTaraName = (rem: number): string => {
            const names = ["", "Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Param Mitra"];
            return names[rem] || "Neutral";
        };

        const ausp1 = isTaraAuspicious(rem1);
        const ausp2 = isTaraAuspicious(rem2);
        let taraScore = 0;
        let taraDesc = "";

        if (ausp1 && ausp2) {
            taraScore = 3;
            taraDesc = `Excellent destiny compatibility (${getTaraName(rem1)} and ${getTaraName(rem2)} alignment).`;
        } else if (ausp1 || ausp2) {
            taraScore = 1.5;
            taraDesc = `Moderate destiny alignment. Groom's star is ${getTaraName(rem1)}, Bride's is ${getTaraName(rem2)}.`;
        } else {
            taraScore = 0;
            taraDesc = `Challenging destiny alignment (Inauspicious Tara combinations: ${getTaraName(rem1)} / ${getTaraName(rem2)}).`;
        }
        totalScore += taraScore;
        debug.push({ name: 'Tara', s: taraScore, t: 3, v1: getTaraName(rem1), v2: getTaraName(rem2), desc: taraDesc });

        // 4. Yoni (4 Points) - Sexual & Biological Affinity
        const animal1 = this.yoniAnimals[i1];
        const animal2 = this.yoniAnimals[i2];

        const getYoniScore = (a1: string, a2: string): number => {
            if (a1 === a2) return 4;
            
            // Hostile Pairs
            const hostiles = [
                ["Serpent", "Mongoose"],
                ["Cat", "Rat"],
                ["Cow", "Tiger"],
                ["Dog", "Deer"],
                ["Horse", "Buffalo"],
                ["Lion", "Elephant"],
                ["Monkey", "Sheep"]
            ];
            for (const pair of hostiles) {
                if ((a1 === pair[0] && a2 === pair[1]) || (a1 === pair[1] && a2 === pair[0])) {
                    return 0;
                }
            }

            // Friendly Pairs
            const friendlies = [
                ["Horse", "Deer"], ["Elephant", "Sheep"], ["Cat", "Monkey"], 
                ["Cow", "Buffalo"], ["Tiger", "Lion"], ["Rat", "Mongoose"]
            ];
            for (const pair of friendlies) {
                if ((a1 === pair[0] && a2 === pair[1]) || (a1 === pair[1] && a2 === pair[0])) {
                    return 3;
                }
            }

            // Enemy Pairs
            const enemies = [
                ["Horse", "Lion"], ["Elephant", "Tiger"], ["Serpent", "Cat"],
                ["Dog", "Rat"], ["Cow", "Deer"], ["Buffalo", "Lion"], ["Monkey", "Dog"]
            ];
            for (const pair of enemies) {
                if ((a1 === pair[0] && a2 === pair[1]) || (a1 === pair[1] && a2 === pair[0])) {
                    return 1;
                }
            }

            // Default Neutral
            return 2;
        };

        const yoniScore = getYoniScore(animal1, animal2);
        let yoniDesc = "";
        if (yoniScore === 4) {
            yoniDesc = `Perfect physical affinity (Same animal: ${animal1}).`;
        } else if (yoniScore === 3) {
            yoniDesc = `Friendly biological affinity (${animal1} & ${animal2} are natural allies).`;
        } else if (yoniScore === 2) {
            yoniDesc = `Neutral biological affinity (${animal1} & ${animal2}).`;
        } else if (yoniScore === 1) {
            yoniDesc = `Low biological compatibility between ${animal1} & ${animal2}.`;
        } else {
            yoniDesc = `Incompatible biological profiles (Hostile Yonis: ${animal1} & ${animal2}).`;
        }
        totalScore += yoniScore;
        debug.push({ name: 'Yoni', s: yoniScore, t: 4, v1: animal1, v2: animal2, desc: yoniDesc });

        // 5. Graha Maitri (5 Points) - Lord Planets Compatibility (Mutual Friendship)
        const lord1 = this.rashiLords[rashi1];
        const lord2 = this.rashiLords[rashi2];

        const getGrahaRelation = (p1: string, p2: string): 'friend' | 'neutral' | 'enemy' => {
            if (p1 === p2) return 'friend';
            const relations: Record<string, Record<string, 'friend' | 'neutral' | 'enemy'>> = {
                Sun: { Moon: 'friend', Mars: 'friend', Jupiter: 'friend', Mercury: 'neutral', Venus: 'enemy', Saturn: 'enemy' },
                Moon: { Sun: 'friend', Mercury: 'friend', Mars: 'neutral', Jupiter: 'neutral', Venus: 'neutral', Saturn: 'neutral' },
                Mars: { Sun: 'friend', Moon: 'friend', Jupiter: 'friend', Venus: 'neutral', Saturn: 'neutral', Mercury: 'enemy' },
                Mercury: { Sun: 'friend', Venus: 'friend', Mars: 'neutral', Jupiter: 'neutral', Saturn: 'neutral', Moon: 'enemy' },
                Jupiter: { Sun: 'friend', Moon: 'friend', Mars: 'friend', Saturn: 'neutral', Mercury: 'enemy', Venus: 'enemy' },
                Venus: { Mercury: 'friend', Saturn: 'friend', Mars: 'neutral', Jupiter: 'neutral', Sun: 'enemy', Moon: 'enemy' },
                Saturn: { Mercury: 'friend', Venus: 'friend', Jupiter: 'neutral', Sun: 'enemy', Moon: 'enemy', Mars: 'enemy' }
            };
            return relations[p1]?.[p2] || 'neutral';
        };

        const rel12 = getGrahaRelation(lord1, lord2);
        const rel21 = getGrahaRelation(lord2, lord1);
        let grahaScore = 0;
        let grahaDesc = "";

        if (rel12 === 'friend' && rel21 === 'friend') {
            grahaScore = 5;
            grahaDesc = `Deep mental harmony (Planetary Lords ${lord1} & ${lord2} are mutual friends).`;
        } else if ((rel12 === 'friend' && rel21 === 'neutral') || (rel12 === 'neutral' && rel21 === 'friend')) {
            grahaScore = 4;
            grahaDesc = `Strong mental alignment (Planetary Lords ${lord1} & ${lord2} are friendly/neutral).`;
        } else if (rel12 === 'neutral' && rel21 === 'neutral') {
            grahaScore = 3;
            grahaDesc = `Healthy relationship (Planetary Lords ${lord1} & ${lord2} are neutral).`;
        } else if ((rel12 === 'friend' && rel21 === 'enemy') || (rel12 === 'enemy' && rel21 === 'friend')) {
            grahaScore = 2;
            grahaDesc = `Moderate planetary agreement between ${lord1} & ${lord2}.`;
        } else if ((rel12 === 'neutral' && rel21 === 'enemy') || (rel12 === 'enemy' && rel21 === 'neutral')) {
            grahaScore = 1;
            grahaDesc = `Friction in mental outlook (Planetary Lords ${lord1} & ${lord2} are neutral/enemies).`;
        } else {
            grahaScore = 0;
            grahaDesc = `Opposing life perspectives (Planetary Lords ${lord1} & ${lord2} are mutual enemies).`;
        }
        totalScore += grahaScore;
        debug.push({ name: 'Graha Maitri', s: grahaScore, t: 5, v1: lord1, v2: lord2, desc: grahaDesc });

        // 6. Gana (6 Points) - Temperamental Compatibility
        const gana1 = this.getGana(i1);
        const gana2 = this.getGana(i2);
        let ganaScore = 0;
        let ganaDesc = "";
        if (gana1 === gana2) {
            ganaScore = 6;
            ganaDesc = "Same temperament (Gana) leads to high harmony.";
        }
        else if ((gana1 === 'Deva' && gana2 === 'Manushya') || (gana2 === 'Deva' && gana1 === 'Manushya')) {
            ganaScore = 5;
            ganaDesc = "Deva and Manushya get along reasonably well.";
        }
        else if ((gana1 === 'Manushya' && gana2 === 'Rakshasa') || (gana2 === 'Manushya' && gana1 === 'Rakshasa')) {
            ganaScore = 1;
            ganaDesc = "Significant temperamental differences between Manushya and Rakshasa.";
        }
        else {
            ganaScore = 0;
            ganaDesc = "Opposite natures (Deva & Rakshasa) creates conflict.";
        }
        totalScore += ganaScore;
        debug.push({ name: 'Gana', s: ganaScore, t: 6, v1: gana1, v2: gana2, desc: ganaDesc });

        // 7. Bhakoot (7 Points) - Emotional Connection & Prosperity
        const rashiDiff = Math.abs(rashi1 - rashi2);
        let bhakootScore = 7;
        let bhakootDesc = "Auspicious emotional and family alignment.";
        if ([1, 4, 5].includes(rashiDiff)) {
            bhakootScore = 0;
            if (rashiDiff === 1) bhakootDesc = "Challenging relationship dynamic (Dwirdwadashe - 2/12 alignment).";
            else if (rashiDiff === 4) bhakootDesc = "Challenging spiritual alignment (Navapanchama - 5/9 alignment).";
            else if (rashiDiff === 5) bhakootDesc = "Challenging temperament alignment (Shadashtaka - 6/8 alignment).";
        } else if (rashiDiff === 0) {
            bhakootDesc = "Same moon sign indicates deep mutual understanding.";
        }
        totalScore += bhakootScore;
        debug.push({ name: 'Bhakoot', s: bhakootScore, t: 7, desc: bhakootDesc });

        // 8. Nadi (8 Points) - Genetic Compatibility & Child Health
        const nadi1 = this.getNadi(i1);
        const nadi2 = this.getNadi(i2);
        let nadiScore = 0;
        let nadiDesc = "";
        if (nadi1 !== nadi2) {
            nadiScore = 8;
            nadiDesc = "Different Nadis imply good genetic compatibility.";
        } else {
            nadiScore = 0;
            nadiDesc = "Same Nadi (Nadi Dosha) may indicate health concerns.";
        }
        totalScore += nadiScore;
        debug.push({ name: 'Nadi', s: nadiScore, t: 8, v1: nadi1, v2: nadi2, desc: nadiDesc });

        // Cap at 36 (Just in case logic flows)
        totalScore = Math.min(36, totalScore);

        let verdict = "Excellent Match (Utkrishta Guna Milan)";
        if (totalScore < 18) {
            verdict = "Needs Astrological Consideration";
        } else if (totalScore < 24) {
            verdict = "Good & Harmonious Match";
        } else if (totalScore < 30) {
            verdict = "Auspicious Match (Uttama Guna Milan)";
        }

        return {
            score: totalScore,
            total: 36,
            verdict,
            astroA,
            astroB,
            details: debug
        };
    }
}
