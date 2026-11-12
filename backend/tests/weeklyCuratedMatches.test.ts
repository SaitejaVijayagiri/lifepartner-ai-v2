import {
    scoreMaleProfileQuality,
    generateWeeklyCuratedEmail,
    getCuratedMatchesForFemale
} from '../src/services/weeklyCuratedMatches';

describe('Weekly Curated Matches Engine for Females', () => {
    describe('Male Profile Quality & Aesthetic Scoring', () => {
        it('scores high-quality profiles with real photos, career, and education significantly higher than incomplete profiles', () => {
            const highQualityMale = {
                id: 'm1',
                full_name: 'Dr. Siddharth Rao',
                avatar_url: 'https://images.unsplash.com/photo-siddharth.jpg',
                profiles: {
                    photos: [
                        'https://images.unsplash.com/photo-siddharth.jpg',
                        'https://images.unsplash.com/photo-siddharth-2.jpg',
                        'https://images.unsplash.com/photo-siddharth-3.jpg'
                    ],
                    raw_prompt: 'Cardiologist who loves weekend cycling, classical music, and discovering quiet coffee shops around the city.',
                    metadata: {
                        career: {
                            profession: 'Cardiologist',
                            educationLevel: 'Doctorate'
                        },
                        lifestyle: {
                            smoking: 'No',
                            diet: 'Vegetarian'
                        }
                    }
                }
            };

            const lowQualityMale = {
                id: 'm2',
                full_name: 'User 123',
                avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=U',
                profiles: {
                    photos: [],
                    raw_prompt: '',
                    metadata: {}
                }
            };

            const highQualityScore = scoreMaleProfileQuality(highQualityMale);
            const lowQualityScore = scoreMaleProfileQuality(lowQualityMale);

            expect(highQualityScore).toBeGreaterThanOrEqual(80);
            expect(lowQualityScore).toBeLessThan(30);
            expect(highQualityScore).toBeGreaterThan(lowQualityScore);
        });
    });

    describe('Personalized Matching for Female Users', () => {
        it('selects the top 3 compatible verified male candidates and filters out excluded candidates', async () => {
            const femaleUser = {
                id: 'f1',
                full_name: 'Ananya Sharma',
                age: 26,
                gender: 'Female',
                city: 'Bengaluru',
                profiles: {
                    metadata: {
                        career: { profession: 'Software Architect', educationLevel: 'Masters' },
                        lifestyle: { diet: 'Vegetarian', smoking: 'No' },
                        religion: { religion: 'Hindu' }
                    }
                }
            };

            const candidates = [
                {
                    id: 'm-good',
                    full_name: 'Vikram Joshi',
                    age: 28,
                    gender: 'Male',
                    city: 'Bengaluru',
                    avatar_url: 'https://images.unsplash.com/photo-vikram.jpg',
                    profiles: {
                        photos: ['https://images.unsplash.com/photo-vikram.jpg', 'https://images.unsplash.com/photo-vikram2.jpg'],
                        raw_prompt: 'Tech lead passionate about AI, hiking in the Western Ghats, and good books.',
                        metadata: {
                            career: { profession: 'Software Engineer', educationLevel: 'Masters' },
                            lifestyle: { diet: 'Vegetarian', smoking: 'No' },
                            religion: { religion: 'Hindu' }
                        }
                    }
                },
                {
                    id: 'm-already-connected',
                    full_name: 'Rahul Sen',
                    age: 27,
                    gender: 'Male',
                    city: 'Bengaluru',
                    avatar_url: 'https://images.unsplash.com/photo-rahul.jpg',
                    profiles: {
                        photos: ['https://images.unsplash.com/photo-rahul.jpg'],
                        metadata: { career: { profession: 'Product Designer' } }
                    }
                },
                {
                    id: 'm-high-quality-2',
                    full_name: 'Aditya Patel',
                    age: 29,
                    gender: 'Male',
                    city: 'Bengaluru',
                    avatar_url: 'https://images.unsplash.com/photo-aditya.jpg',
                    profiles: {
                        photos: ['https://images.unsplash.com/photo-aditya.jpg', 'https://images.unsplash.com/photo-aditya-2.jpg'],
                        raw_prompt: 'Founder in fintech. Love playing tennis and exploring culinary cultures.',
                        metadata: {
                            career: { profession: 'Fintech Founder', educationLevel: 'Bachelors' },
                            lifestyle: { smoking: 'No' }
                        }
                    }
                },
                {
                    id: 'm-high-quality-3',
                    full_name: 'Dr. Nikhil Rao',
                    age: 30,
                    gender: 'Male',
                    city: 'Bengaluru',
                    avatar_url: 'https://images.unsplash.com/photo-nikhil.jpg',
                    profiles: {
                        photos: ['https://images.unsplash.com/photo-nikhil.jpg'],
                        raw_prompt: 'Medical consultant who values family and mindful living.',
                        metadata: {
                            career: { profession: 'Consultant Doctor', educationLevel: 'Doctorate' },
                            lifestyle: { smoking: 'No' }
                        }
                    }
                }
            ];

            const excludeSet = new Set(['m-already-connected']);
            const topMatches = await getCuratedMatchesForFemale(femaleUser, candidates, excludeSet);

            expect(topMatches).toHaveLength(3);
            expect(topMatches.map(m => m.id)).not.toContain('m-already-connected');
            expect(topMatches[0].name).toBe('Vikram');
            expect(topMatches[0].compatibilityScore).toBeGreaterThanOrEqual(75);
            expect(topMatches[0].profession).toBe('Software Engineer');
        });
    });

    describe('Respectful Copy (Zero Superficial "Handsome" Wording)', () => {
        it('generates email copy with dignified compatibility branding and never uses superficial words', () => {
            const matches = [
                {
                    id: 'm1',
                    name: 'Vikram',
                    age: 28,
                    city: 'Bengaluru, India',
                    profession: 'Senior Software Engineer',
                    education: 'Masters',
                    photoUrl: 'https://images.unsplash.com/photo-vikram.jpg',
                    photosCount: 3,
                    compatibilityScore: 97,
                    matchReasons: ['🎓 Education & Ambition Harmony'],
                    strengths: ['Aligned Relationship Goals & Marriage Timeline']
                }
            ];

            const email = generateWeeklyCuratedEmail('Ananya', matches);

            expect(email.subject).toContain('Ananya');
            expect(email.subject).toContain('97% Match');
            expect(email.html).toContain('Vikram, 28');
            expect(email.html).toContain('Senior Software Engineer');
            expect(email.html).toContain('97% COMPATIBILITY');

            // STRICT REQUIREMENT: User requested not to use superficial "handsome" copy in communications
            expect(email.subject.toLowerCase()).not.toContain('handsome');
            expect(email.html.toLowerCase()).not.toContain('handsome');
        });
    });
});
