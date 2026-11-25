'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MapPin, LogOut, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { RELIGION_OPTIONS, ZODIAC_OPTIONS } from '@/lib/religionUtils';
import { detectVisitorGeo } from '@/lib/geoDetect';
import { compressProfilePhotos, MAX_PROFILE_PHOTOS } from '@/lib/imageUpload';
import RequestVerificationButton from '@/components/RequestVerificationButton';

const STORAGE_KEY = 'lifepartner_onboarding_data';
const STEP_STORAGE_KEY = 'lifepartner_onboarding_step';
const UID_STORAGE_KEY = 'lifepartner_onboarding_uid';

const STEPS = [
    { id: 'basics', title: 'Personal & Location' },
    { id: 'astrology_hobbies', title: 'Astrology & Hobbies' },
    { id: 'expectations', title: 'Partner Expectations' },
    { id: 'photos', title: 'Photos & Trust' },
];

const QUOTES = {
    basics: "Tell us who you are and where you are based. Real details power accurate local & global matching.",
    astrology_hobbies: "Share your Vedic horoscope, lifestyle rhythm, and hobbies so we match your mind, heart, and stars.",
    expectations: "Tell us what matters most in your ideal partner — age range, city, lifestyle, and life values.",
    photos: "Real photos build genuine trust and unlock 10x more responses. Verify optionally for a blue trust badge."
};

const GRADIENTS = {
    basics: "from-blue-600 to-cyan-600",
    astrology_hobbies: "from-purple-600 to-indigo-600",
    expectations: "from-rose-600 to-pink-600",
    photos: "from-indigo-500 to-blue-600",
};

const NAKSHATRA_OPTIONS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const HOBBY_CHIPS = [
    "Travel", "Reading", "Cooking", "Music", "Fitness", "Yoga",
    "Hiking", "Photography", "Movies", "Art & Design", "Coffee", "Sports",
    "Dancing", "Pets", "Meditation", "Gaming", "Startups", "Volunteering"
];

const EXPECTATION_CHIPS = [
    "Kind, supportive, and family-oriented partner",
    "Well-educated, career-focused, and respects mutual growth",
    "Vegetarian, non-smoker with a healthy lifestyle",
    "Loves travel, deep conversations, and emotional maturity"
];

function computeAgeAndZodiacFromDob(dobStr: string): { age?: number; zodiac?: string } {
    if (!dobStr) return {};
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return {};
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const month = birthDate.getUTCMonth() + 1;
    const day = birthDate.getUTCDate();
    let zodiac = '';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiac = 'Aries';
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiac = 'Taurus';
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiac = 'Gemini';
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiac = 'Cancer';
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiac = 'Leo';
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiac = 'Virgo';
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiac = 'Libra';
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiac = 'Scorpio';
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiac = 'Sagittarius';
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiac = 'Capricorn';
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiac = 'Aquarius';
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) zodiac = 'Pisces';

    return {
        age: age >= 18 && age <= 99 ? age : undefined,
        zodiac
    };
}

function parseHobbiesList(interests: any, hobbiesStr: any): string[] {
    if (Array.isArray(interests) && interests.length > 0) {
        return interests.map((s: any) => String(s).trim()).filter(Boolean);
    }
    if (typeof hobbiesStr === 'string' && hobbiesStr.trim()) {
        return hobbiesStr.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(hobbiesStr)) {
        return hobbiesStr.map((s: any) => String(s).trim()).filter(Boolean);
    }
    return [];
}

export default function ProfileWizard({ onComplete }: { onComplete: (data: any) => void }) {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenderLocked, setIsGenderLocked] = useState(false);
    const [partnerMinAge, setPartnerMinAge] = useState<string>('');
    const [partnerMaxAge, setPartnerMaxAge] = useState<string>('');
    const [data, setData] = useState<any>({
        // Basics
        name: '', age: '', dob: '', gender: '', height: '', city: '', district: '', state: '', country: 'India', lat: '', lng: '', aboutMe: '',
        // Horoscope
        zodiacSign: '', nakshatra: '', manglik: 'No', birthTime: '', birthPlace: '', gothra: '',
        // Religion
        religion: 'Not Specified', caste: '', interCasteOpen: false,
        // Career
        education: "Bachelor's", profession: '', income: '', company: '',
        // Family
        familyType: 'Nuclear', familyValues: 'Moderate', fatherOccupation: '', motherTongue: 'English', maritalStatus: 'Single', managed_by: 'Self',
        // Lifestyle & Hobbies
        diet: 'Vegetarian', smoke: 'No', drink: 'No', hobbies: '', interests: [] as string[],
        // Partner Expectations
        partnerAgeRange: '', partnerHeightRange: '', partnerIncome: '', partnerLocation: '', prompt: '', expectations: '',
        // Photos & Privacy
        photos: [],
        photo_privacy: 'public',
        voiceBioUrl: ''
    });

    // Load saved data (scoped to current user) and hydrate from backend getMe()
    useEffect(() => {
        try {
            const currentUid = localStorage.getItem('userId') || '';
            const draftUid = localStorage.getItem(UID_STORAGE_KEY) || '';
            const isSameUserDraft = Boolean(currentUid && draftUid === currentUid);

            if (!isSameUserDraft && currentUid) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STEP_STORAGE_KEY);
                localStorage.setItem(UID_STORAGE_KEY, currentUid);
            }

            let savedGender = '';
            if (isSameUserDraft) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    savedGender = parsed.gender || '';
                    setData((prev: any) => ({ ...prev, ...parsed }));
                    if (parsed.partnerAgeRange && parsed.partnerAgeRange.includes('-')) {
                        const [mn, mx] = parsed.partnerAgeRange.split('-').map((s: string) => s.trim());
                        if (mn) setPartnerMinAge(mn);
                        if (mx) setPartnerMaxAge(mx);
                    }
                }
                const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
                if (savedStep) {
                    const stepIndex = parseInt(savedStep, 10);
                    if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEPS.length) {
                        setCurrentStep(stepIndex);
                    }
                }
            }

            const pendingGender = localStorage.getItem('pendingUserGender');
            const pendingAge = localStorage.getItem('pendingUserAge');
            const pendingName = localStorage.getItem('pendingUserName');
            const pendingCountry = localStorage.getItem('pendingUserCountry');
            const detectedGeo = detectVisitorGeo();
            const resolvedCountry = pendingCountry || (detectedGeo.country !== 'Worldwide' ? detectedGeo.country : 'India');

            let u: any = {};
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try { u = JSON.parse(storedUser) || {}; } catch (_) {}
            }

            const validPendingGender = (pendingGender === 'Female' || pendingGender === 'Male') ? pendingGender : '';
            if (u.gender === 'Female' || u.gender === 'Male') {
                setIsGenderLocked(true);
            }

            setData((prev: any) => ({
                ...prev,
                name: prev.name || u.name || u.full_name || pendingName || '',
                gender: u.gender || validPendingGender || savedGender || prev.gender || '',
                age: prev.age || (u.age && u.age >= 18 ? String(u.age) : '') || pendingAge || '',
                country: prev.country && prev.country !== 'India' ? prev.country : resolvedCountry
            }));

            api.profile.getMe().then((me: any) => {
                if (!me) return;
                if (me.gender === 'Female' || me.gender === 'Male') {
                    setIsGenderLocked(true);
                }
                const meHobbies = parseHobbiesList(me.interests, me.lifestyle?.hobbies);
                const meAgeRange = me.partnerPreferences?.ageRange || '';
                if (meAgeRange.includes('-')) {
                    const [mn, mx] = meAgeRange.split('-').map((s: string) => s.trim());
                    setPartnerMinAge(prev => prev || mn || '');
                    setPartnerMaxAge(prev => prev || mx || '');
                }

                setData((prev: any) => ({
                    ...prev,
                    name: prev.name || me.name || me.full_name || pendingName || '',
                    gender: me.gender || u.gender || validPendingGender || prev.gender || '',
                    age: prev.age || (me.age && me.age >= 18 ? String(me.age) : '') || pendingAge || '',
                    dob: prev.dob || (me.dob ? String(me.dob).slice(0, 10) : ''),
                    height: prev.height || me.height || '',
                    maritalStatus: prev.maritalStatus || me.maritalStatus || 'Single',
                    managed_by: prev.managed_by || me.managed_by || 'Self',
                    city: prev.city || me.location?.city || me.city || '',
                    district: prev.district || me.location?.district || me.district || '',
                    state: prev.state || me.location?.state || me.state || '',
                    country: (prev.country && prev.country !== 'India') ? prev.country : (me.location?.country || me.country || resolvedCountry),
                    lat: prev.lat || (me.location?.lat !== undefined ? String(me.location.lat) : ''),
                    lng: prev.lng || (me.location?.lng !== undefined ? String(me.location.lng) : ''),
                    profession: prev.profession || me.career?.profession || me.profession || '',
                    education: prev.education || me.career?.education || me.education || "Bachelor's",
                    income: prev.income || me.career?.income || '',
                    company: prev.company || me.career?.company || '',
                    religion: (prev.religion && prev.religion !== 'Not Specified') ? prev.religion : (me.religion?.religion || 'Not Specified'),
                    caste: prev.caste || me.religion?.caste || '',
                    gothra: prev.gothra || me.religion?.gothra || me.horoscope?.gothra || '',
                    motherTongue: (prev.motherTongue && prev.motherTongue !== 'English') ? prev.motherTongue : (me.motherTongue || 'English'),
                    zodiacSign: prev.zodiacSign || me.horoscope?.zodiacSign || '',
                    nakshatra: prev.nakshatra || me.horoscope?.nakshatra || '',
                    manglik: prev.manglik || me.horoscope?.manglik || 'No',
                    birthTime: prev.birthTime || me.horoscope?.birthTime || '',
                    birthPlace: prev.birthPlace || me.horoscope?.birthPlace || '',
                    diet: prev.diet || me.lifestyle?.diet || 'Vegetarian',
                    smoke: prev.smoke || me.lifestyle?.smoke || me.lifestyle?.smoking || 'No',
                    drink: prev.drink || me.lifestyle?.drink || me.lifestyle?.drinking || 'No',
                    interests: (Array.isArray(prev.interests) && prev.interests.length > 0) ? prev.interests : meHobbies,
                    hobbies: prev.hobbies || meHobbies.join(', '),
                    familyType: prev.familyType || me.family?.type || 'Nuclear',
                    familyValues: prev.familyValues || me.family?.values || 'Moderate',
                    aboutMe: prev.aboutMe || me.aboutMe || me.bio || '',
                    expectations: prev.expectations || me.expectations || '',
                    prompt: prev.prompt || me.expectations || me.prompt || '',
                    partnerAgeRange: prev.partnerAgeRange || meAgeRange,
                    partnerHeightRange: prev.partnerHeightRange || me.partnerPreferences?.heightRange || '',
                    partnerIncome: prev.partnerIncome || me.partnerPreferences?.income || '',
                    partnerLocation: prev.partnerLocation || me.partnerPreferences?.location || '',
                    photo_privacy: prev.photo_privacy || me.photo_privacy || 'public',
                    photos: (prev.photos && prev.photos.length > 0)
                        ? prev.photos
                        : (me.photos && me.photos.length > 0 ? me.photos : (me.avatar_url && !String(me.avatar_url).includes('dicebear') ? [me.avatar_url] : []))
                }));
            }).catch(() => {});
        } catch (e) {
            console.error('Failed to load saved onboarding data', e);
        }
    }, []);

    // Keep partnerAgeRange synced when min/max age selects change
    useEffect(() => {
        if (partnerMinAge && partnerMaxAge) {
            const mn = parseInt(partnerMinAge, 10);
            const mx = parseInt(partnerMaxAge, 10);
            if (!isNaN(mn) && !isNaN(mx)) {
                const formatted = `${Math.min(mn, mx)}-${Math.max(mn, mx)}`;
                setData((prev: any) => prev.partnerAgeRange === formatted ? prev : { ...prev, partnerAgeRange: formatted });
            }
        }
    }, [partnerMinAge, partnerMaxAge]);

    // Auto-save data & step scoped to UID
    useEffect(() => {
        try {
            const currentUid = localStorage.getItem('userId');
            if (currentUid) localStorage.setItem(UID_STORAGE_KEY, currentUid);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save onboarding data', e);
        }
    }, [data]);

    useEffect(() => {
        try {
            localStorage.setItem(STEP_STORAGE_KEY, currentStep.toString());
        } catch (e) {
            console.error('Failed to save step', e);
        }
    }, [currentStep]);

    const update = (field: string, val: any) => setData((prev: any) => ({ ...prev, [field]: val }));

    const [gpsLoading, setGpsLoading] = useState(false);

    const handleGPS = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const apiData = await res.json();

                    setData((prev: any) => ({
                        ...prev,
                        city: apiData.city || apiData.locality || "",
                        district: apiData.localityInfo?.administrative?.find((x: any) => x.adminLevel === 5 || (x.name && x.name.toLowerCase().includes('district')))?.name || apiData.principalSubdivision || "",
                        state: apiData.principalSubdivision || "",
                        country: apiData.countryName || prev.country || "India",
                        lat: latitude.toString(),
                        lng: longitude.toString()
                    }));
                    toast.success("Location & GPS coordinates updated!");
                } catch (error) {
                    console.error("GPS Error:", error);
                    toast.error("Failed to fetch location details.");
                } finally {
                    setGpsLoading(false);
                }
            },
            () => {
                toast.error("Unable to retrieve your location.");
                setGpsLoading(false);
            }
        );
    };

    const toggleHobbyChip = (hobby: string) => {
        const currentList = parseHobbiesList(data.interests, data.hobbies);
        const exists = currentList.some(h => h.toLowerCase() === hobby.toLowerCase());
        const nextList = exists
            ? currentList.filter(h => h.toLowerCase() !== hobby.toLowerCase())
            : [...currentList, hobby];
        setData((prev: any) => ({
            ...prev,
            interests: nextList,
            hobbies: nextList.join(', ')
        }));
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        const step = STEPS[currentStep].id;
        const normalizedHobbies = parseHobbiesList(data.interests, data.hobbies);
        const parsedLat = data.lat !== undefined && data.lat !== '' ? parseFloat(String(data.lat)) : undefined;
        const parsedLng = data.lng !== undefined && data.lng !== '' ? parseFloat(String(data.lng)) : undefined;

        // Progressive draft auto-save on steps 1–3 so details survive drop-offs without prematurely completing onboarding
        if (step !== 'photos') {
            try {
                api.profile.updateProfile({
                    isDraft: true,
                    name: data.name,
                    age: parseInt(data.age, 10),
                    dob: data.dob || undefined,
                    gender: data.gender,
                    height: data.height,
                    location: {
                        city: data.city,
                        district: data.district,
                        state: data.state,
                        country: data.country,
                        ...(Number.isFinite(parsedLat) && Number.isFinite(parsedLng) ? { lat: parsedLat, lng: parsedLng } : {})
                    },
                    career: {
                        profession: data.profession,
                        education: data.education,
                        income: data.income,
                        company: data.company
                    },
                    religion: {
                        religion: data.religion,
                        caste: data.caste,
                        gothra: data.gothra
                    },
                    horoscope: {
                        zodiacSign: data.zodiacSign,
                        nakshatra: data.nakshatra,
                        manglik: data.manglik || 'No',
                        birthTime: data.birthTime,
                        birthPlace: data.birthPlace,
                        ...(data.dob ? { dob: data.dob } : {})
                    },
                    lifestyle: {
                        diet: data.diet,
                        smoke: data.smoke || 'No',
                        smoking: data.smoke || 'No',
                        drink: data.drink || 'No',
                        drinking: data.drink || 'No',
                        hobbies: normalizedHobbies.join(', ')
                    },
                    interests: normalizedHobbies,
                    family: {
                        type: data.familyType,
                        values: data.familyValues
                    },
                    expectations: (data.expectations || data.prompt || '').trim(),
                    prompt: (data.expectations || data.prompt || '').trim(),
                    partnerPreferences: {
                        ageRange: data.partnerAgeRange,
                        heightRange: data.partnerHeightRange,
                        income: data.partnerIncome,
                        location: data.partnerLocation
                    },
                    motherTongue: data.motherTongue,
                    aboutMe: data.aboutMe || '',
                    maritalStatus: data.maritalStatus || 'Single',
                    managed_by: data.managed_by || 'Self',
                    photo_privacy: data.photo_privacy || 'public'
                }).catch((e: any) => console.warn('Intermediate profile draft auto-save:', e?.message));
            } catch (_) {}
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onComplete({
                ...data,
                interests: normalizedHobbies,
                hobbies: normalizedHobbies.join(', ')
            });
        }
    };

    const handleBack = () => {
        setCurrentStep(s => Math.max(0, s - 1));
    };

    const validateStep = () => {
        const step = STEPS[currentStep].id;
        if (step === 'basics') {
            if (!data.name || !String(data.name).trim()) {
                toast.error("Please enter your Full Name (*)");
                return false;
            }
            if (!data.gender) {
                toast.error("Please select your Gender (Female or Male) (*)");
                return false;
            }
            const parsedAge = parseInt(String(data.age), 10);
            if (!data.age || isNaN(parsedAge) || parsedAge < 18 || parsedAge > 99) {
                toast.error("Please enter a valid Age between 18 and 99 (*)");
                return false;
            }
            if (!data.city || !String(data.city).trim()) {
                toast.error("Please enter your City / Location (*)");
                return false;
            }
        }
        return true;
    };

    const stepId = STEPS[currentStep].id;
    const selectedHobbiesList = parseHobbiesList(data.interests, data.hobbies);
    const nextButtonLabel = currentStep === STEPS.length - 1
        ? "Finish Profile"
        : `Next: ${STEPS[currentStep + 1].title.split(' ')[0]}`;

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-[100dvh] lg:min-h-0 lg:h-[85dvh] bg-white dark:bg-gray-900 lg:rounded-2xl shadow-none lg:shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* LEFT PANEL: Visual & Quote */}
            <div className={`w-full lg:w-1/3 shrink-0 h-auto lg:h-auto text-white p-5 lg:p-10 flex flex-col justify-between relative transition-all duration-700 bg-gradient-to-br ${GRADIENTS[stepId as keyof typeof GRADIENTS] || "from-gray-700 to-gray-900"}`}>
                <div className="z-10 flex justify-between lg:block items-center mb-4 lg:mb-0">
                    <div>
                        <h1 className="text-xl lg:text-3xl font-bold lg:mb-2">LifePartner AI</h1>
                        <div className="hidden lg:block h-1 w-12 bg-white/50 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-3 mt-0 lg:mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('userId');
                                window.location.href = '/login';
                            }}
                            className="hidden lg:flex items-center gap-2 text-white/75 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20"
                        >
                            <LogOut size={14} />
                            Log Out
                        </button>
                        <div className="lg:hidden text-xs font-medium opacity-90 bg-white/20 px-2.5 py-1 rounded-full">
                            Step {currentStep + 1}/{STEPS.length}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('userId');
                                window.location.href = '/login';
                            }}
                            className="lg:hidden text-white/80 hover:text-white p-1"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                <div className="z-10 mb-4 lg:mb-0">
                    <div className="hidden lg:inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold bg-white/15 px-3 py-1 rounded-full mb-3">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>
                    <h2 className="text-2xl lg:text-4xl font-bold mb-2 lg:mb-4 capitalize">{STEPS[currentStep].title}</h2>
                    <p className="text-sm lg:text-base text-white/90 leading-relaxed font-light italic">&ldquo;{QUOTES[stepId as keyof typeof QUOTES]}&rdquo;</p>
                </div>

                <div className="z-10 hidden lg:flex gap-2">
                    {STEPS.map((s, idx) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                                if (idx < currentStep) setCurrentStep(idx);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-10 bg-white' : idx < currentStep ? 'w-4 bg-white/75 cursor-pointer' : 'w-2 bg-white/30'}`}
                            title={s.title}
                        />
                    ))}
                </div>

                <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* RIGHT PANEL: Form */}
            <div className="w-full lg:w-2/3 p-5 sm:p-6 lg:p-10 flex flex-col relative overflow-y-auto flex-1 lg:h-auto bg-white dark:bg-gray-900 border-t lg:border-t-0 dark:border-gray-800">
                <div className="flex-1 max-w-2xl mx-auto w-full">
                    {/* STEP 1: BASICS */}
                    {stepId === 'basics' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-bold dark:text-gray-200">This profile is managed by</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { label: 'Self', icon: '👤', desc: 'Candidate' },
                                            { label: 'Parent', icon: '👨‍👩‍👧', desc: 'Father / Mother' },
                                            { label: 'Sibling', icon: '👫', desc: 'Brother / Sister' },
                                            { label: 'Relative', icon: '🤝', desc: 'Relative / Friend' }
                                        ].map(m => (
                                            <button
                                                key={m.label}
                                                type="button"
                                                onClick={() => update('managed_by', m.label)}
                                                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-center cursor-pointer ${
                                                    (data.managed_by || 'Self') === m.label
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300 shadow-sm'
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                                                    <span>{m.icon}</span>
                                                    <span>{m.label}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{m.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {isGenderLocked && (data.gender === 'Female' || data.gender === 'Male') ? (
                                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-bold dark:text-gray-200">Registered Gender</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xl">{data.gender === 'Female' ? '👰' : '🤵'}</span>
                                                <div>
                                                    <div className="text-sm font-extrabold text-gray-900 dark:text-white">{data.gender}</div>
                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">Verified identity registered during account setup</div>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                                🔒 Identity Locked
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold dark:text-gray-200">Select Your Gender *</label>
                                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                                ⚠️ Permanent identity lock after setup
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    update('gender', 'Female');
                                                    localStorage.setItem('pendingUserGender', 'Female');
                                                }}
                                                className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                                    data.gender === 'Female'
                                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                                                        : 'bg-pink-50/70 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 hover:border-rose-400'
                                                }`}
                                            >
                                                <span>👰</span>
                                                <span>Female</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    update('gender', 'Male');
                                                    localStorage.setItem('pendingUserGender', 'Male');
                                                }}
                                                className={`h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                                    data.gender === 'Male'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                                }`}
                                            >
                                                <span>🤵</span>
                                                <span>Male</span>
                                            </button>
                                        </div>
                                        {data.gender === 'Female' && (
                                            <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/40 text-xs text-pink-800 dark:text-pink-200 flex items-center gap-2">
                                                <span>👑</span>
                                                <span><strong>Queen VIP Safety Active:</strong> Free Unlimited Direct Chat (with photo &amp; selfie check) + Blurred-Photo Lock + Masked Phone Number.</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Input label="Full Name *" value={data.name} onChange={e => update('name', e.target.value)} />

                                <Input label="Age (18+) *" type="number" min={18} max={95} placeholder="e.g. 24" value={data.age} onChange={e => update('age', e.target.value)} />

                                <Input
                                    label="Date of Birth (Auto-computes Zodiac)"
                                    type="date"
                                    value={data.dob || ''}
                                    onChange={e => {
                                        const dobVal = e.target.value;
                                        const computed = computeAgeAndZodiacFromDob(dobVal);
                                        setData((prev: any) => ({
                                            ...prev,
                                            dob: dobVal,
                                            ...(computed.age ? { age: String(computed.age) } : {}),
                                            ...(computed.zodiac ? { zodiacSign: computed.zodiac } : {})
                                        }));
                                    }}
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Marital Status</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.maritalStatus || ''} onChange={e => update('maritalStatus', e.target.value)}>
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Awaiting Divorce">Awaiting Divorce</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Height</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        value={data.height}
                                        onChange={e => update('height', e.target.value)}
                                    >
                                        <option value="">Select Height</option>
                                        {["4'6\"","4'7\"","4'8\"","4'9\"","4'10\"","4'11\"",
                                          "5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"",
                                          "6'0\"","6'1\"","6'2\"","6'3\"","6'4\"","6'5\"","6'6\""].map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200 flex items-center gap-1">
                                        <span>City / Location</span>
                                        <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <div className="flex gap-2 w-full">
                                        <div className="flex-1">
                                            <Input placeholder="Enter your city (e.g. Mumbai, Bangalore, Dallas)" value={data.city} onChange={e => update('city', e.target.value)} />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGPS}
                                            disabled={gpsLoading}
                                            className="whitespace-nowrap"
                                        >
                                            {gpsLoading ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                            ) : (
                                                <MapPin className="h-4 w-4 mr-1" />
                                            )}
                                            {gpsLoading ? 'Locating...' : 'Use GPS'}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <Input
                                            placeholder={data.country && data.country !== 'India' ? "County / Area (Optional)" : "District"}
                                            value={data.district}
                                            onChange={e => update('district', e.target.value)}
                                        />
                                        <Input
                                            placeholder={data.country && data.country !== 'India' ? "State / Province / Region" : "State"}
                                            value={data.state}
                                            onChange={e => update('state', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Country</label>
                                    <select
                                        className="w-full h-10 px-3 border dark:border-gray-700 rounded-md bg-transparent dark:bg-gray-900 dark:text-white"
                                        value={data.country || 'India'}
                                        onChange={e => update('country', e.target.value)}
                                    >
                                        <option value="India">India</option>
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="United Arab Emirates">United Arab Emirates</option>
                                        <option value="Saudi Arabia">Saudi Arabia</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="New Zealand">New Zealand</option>
                                        <option value="Germany">Germany</option>
                                        <option value="France">France</option>
                                        <option value="Netherlands">Netherlands</option>
                                        <option value="Ireland">Ireland</option>
                                        <option value="South Africa">South Africa</option>
                                        <option value="Oman">Oman</option>
                                        <option value="Qatar">Qatar</option>
                                        <option value="Kuwait">Kuwait</option>
                                        <option value="Bahrain">Bahrain</option>
                                        <option value="Nepal">Nepal</option>
                                        <option value="Sri Lanka">Sri Lanka</option>
                                        <option value="Bangladesh">Bangladesh</option>
                                        <option value="Pakistan">Pakistan</option>
                                        <option value="China">China</option>
                                        <option value="Japan">Japan</option>
                                        <option value="South Korea">South Korea</option>
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="Philippines">Philippines</option>
                                        <option value="Vietnam">Vietnam</option>
                                        <option value="Thailand">Thailand</option>
                                        <option value="Egypt">Egypt</option>
                                        <option value="Nigeria">Nigeria</option>
                                        <option value="Kenya">Kenya</option>
                                        <option value="Brazil">Brazil</option>
                                        <option value="Mexico">Mexico</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <Input
                                    label="Profession"
                                    placeholder="e.g. Software Engineer, Doctor, Business"
                                    value={data.profession || ''}
                                    onChange={e => update('profession', e.target.value)}
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Education</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        value={data.education || "Bachelor's"}
                                        onChange={e => update('education', e.target.value)}
                                    >
                                        <option value="High School">High School</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="Bachelor&apos;s">Bachelor&apos;s</option>
                                        <option value="Master&apos;s">Master&apos;s</option>
                                        <option value="Doctorate / PhD">Doctorate / PhD</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <Input
                                    label="Annual Income (Optional)"
                                    placeholder="e.g. 12 LPA or $85K"
                                    value={data.income || ''}
                                    onChange={e => update('income', e.target.value)}
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Religion</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        value={data.religion || "Not Specified"}
                                        onChange={e => update('religion', e.target.value)}
                                    >
                                        {RELIGION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label={data.country && data.country !== 'India' ? "Community / Ethnicity" : "Caste / Community"}
                                    placeholder={data.country && data.country !== 'India' ? "e.g. Irish, Caucasian, Asian" : "e.g. Brahmin, Reddy, Patel, Khan"}
                                    value={data.caste || ''}
                                    onChange={e => update('caste', e.target.value)}
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Mother Tongue / Language</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        value={data.motherTongue || "English"}
                                        onChange={e => update('motherTongue', e.target.value)}
                                    >
                                        <optgroup label="Global & International">
                                            {["English", "Spanish", "French", "German", "Arabic", "Portuguese", "Italian", "Russian", "Japanese", "Mandarin Chinese", "Irish", "Dutch", "Korean", "Turkish", "Polish", "Tagalog", "Vietnamese", "Indonesian", "Persian"].map(lang => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Indian & South Asian">
                                            {["Hindi", "Telugu", "Tamil", "Marathi", "Bengali", "Kannada", "Gujarati", "Punjabi", "Malayalam", "Odia", "Urdu", "Assamese", "Nepali", "Sindhi", "Konkani", "Kashmiri", "Other"].map(lang => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">About Me (Bio)</label>
                                    <textarea
                                        className="flex min-h-[90px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        placeholder="Introduce yourself, your values, career goals, and lifestyle..."
                                        value={data.aboutMe || ''}
                                        onChange={e => update('aboutMe', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ASTROLOGY, LIFESTYLE & HOBBIES */}
                    {stepId === 'astrology_hobbies' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            {/* Vedic Astrology Section */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🪐</span>
                                        <span>Astrology &amp; Vedic Kundli</span>
                                    </h3>
                                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Powers 36-Guna Match Score</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Zodiac Sign (Rashi)</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            value={data.zodiacSign || ''}
                                            onChange={e => update('zodiacSign', e.target.value)}
                                        >
                                            <option value="">Select Zodiac Sign</option>
                                            {ZODIAC_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Birth Star (Nakshatra)</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            value={data.nakshatra || ''}
                                            onChange={e => update('nakshatra', e.target.value)}
                                        >
                                            <option value="">Select Nakshatra (Optional)</option>
                                            {NAKSHATRA_OPTIONS.map(nak => (
                                                <option key={nak} value={nak}>{nak}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Manglik Status</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            value={data.manglik || 'No'}
                                            onChange={e => update('manglik', e.target.value)}
                                        >
                                            <option value="No">No (Non-Manglik)</option>
                                            <option value="Yes">Yes (Manglik)</option>
                                            <option value="Don't Know">Don&apos;t Know / Doesn&apos;t Matter</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Gothra (Optional)"
                                        placeholder="e.g. Bharadwaja, Kashyap"
                                        value={data.gothra || ''}
                                        onChange={e => update('gothra', e.target.value)}
                                    />

                                    <Input
                                        label="Time of Birth (Optional)"
                                        type="time"
                                        value={data.birthTime || ''}
                                        onChange={e => update('birthTime', e.target.value)}
                                    />

                                    <Input
                                        label="Birth Place (Optional)"
                                        placeholder="e.g. Vijayawada, Pune"
                                        value={data.birthPlace || ''}
                                        onChange={e => update('birthPlace', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Lifestyle & Family Section */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-4">
                                <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🥗</span>
                                    <span>Lifestyle &amp; Family Values</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Diet</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            value={data.diet || 'Vegetarian'}
                                            onChange={e => update('diet', e.target.value)}
                                        >
                                            <option value="Vegetarian">Vegetarian</option>
                                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                                            <option value="Eggetarian">Eggetarian</option>
                                            <option value="Vegan">Vegan</option>
                                            <option value="Jain">Jain</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Smoking</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            value={data.smoke || 'No'}
                                            onChange={e => update('smoke', e.target.value)}
                                        >
                                            <option value="No">No</option>
                                            <option value="Occasionally">Occasionally</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Drinking</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            value={data.drink || 'No'}
                                            onChange={e => update('drink', e.target.value)}
                                        >
                                            <option value="No">No</option>
                                            <option value="Occasionally">Occasionally</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Family Type</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            value={data.familyType || 'Nuclear'}
                                            onChange={e => update('familyType', e.target.value)}
                                        >
                                            <option value="Nuclear">Nuclear Family</option>
                                            <option value="Joint">Joint Family</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Family Values</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                            value={data.familyValues || 'Moderate'}
                                            onChange={e => update('familyValues', e.target.value)}
                                        >
                                            <option value="Moderate">Moderate</option>
                                            <option value="Traditional">Traditional</option>
                                            <option value="Liberal">Liberal</option>
                                            <option value="Orthodox">Orthodox</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Hobbies & Interests */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold dark:text-gray-200 flex items-center gap-1.5">
                                        <span>✨</span>
                                        <span>Hobbies &amp; Passions</span>
                                    </label>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedHobbiesList.length} selected</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {HOBBY_CHIPS.map(hobby => {
                                        const isSelected = selectedHobbiesList.some(h => h.toLowerCase() === hobby.toLowerCase());
                                        return (
                                            <button
                                                key={hobby}
                                                type="button"
                                                onClick={() => toggleHobbyChip(hobby)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                                }`}
                                            >
                                                {isSelected && <Check size={12} />}
                                                <span>{hobby}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <Input
                                    label="Other Hobbies (comma-separated)"
                                    placeholder="e.g. Badminton, Classical Music, Cycling"
                                    value={data.hobbies || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setData((prev: any) => ({
                                            ...prev,
                                            hobbies: val,
                                            interests: val.split(',').map((s: string) => s.trim()).filter(Boolean)
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PARTNER EXPECTATIONS */}
                    {stepId === 'expectations' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-4">
                                <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>💫</span>
                                    <span>Partner Preferences</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium dark:text-gray-200">Preferred Age Range</label>
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                value={partnerMinAge}
                                                onChange={e => setPartnerMinAge(e.target.value)}
                                            >
                                                <option value="">Min Age</option>
                                                {Array.from({ length: 45 }, (_, i) => 18 + i).map(a => (
                                                    <option key={a} value={String(a)}>{a}</option>
                                                ))}
                                            </select>
                                            <span className="text-gray-400 font-bold">-</span>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                value={partnerMaxAge}
                                                onChange={e => setPartnerMaxAge(e.target.value)}
                                            >
                                                <option value="">Max Age</option>
                                                {Array.from({ length: 48 }, (_, i) => 18 + i).map(a => (
                                                    <option key={a} value={String(a)}>{a}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {data.partnerAgeRange && (
                                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Saved range: {data.partnerAgeRange} yrs</p>
                                        )}
                                    </div>

                                    <Input
                                        label="Preferred Height Range (Optional)"
                                        placeholder="e.g. 5'2&quot; - 5'8&quot;"
                                        value={data.partnerHeightRange || ''}
                                        onChange={e => update('partnerHeightRange', e.target.value)}
                                    />

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Input
                                            label="Preferred Location / City / Country"
                                            placeholder="e.g. Hyderabad, Bangalore, Anywhere in India, Global"
                                            value={data.partnerLocation || ''}
                                            onChange={e => update('partnerLocation', e.target.value)}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                data.city || 'Same City',
                                                data.country || 'India',
                                                'Anywhere / Open to Relocate'
                                            ].filter(Boolean).map(locPreset => (
                                                <button
                                                    key={locPreset}
                                                    type="button"
                                                    onClick={() => update('partnerLocation', locPreset)}
                                                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-rose-400 cursor-pointer"
                                                >
                                                    + {locPreset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Input
                                        label="Preferred Income / Career (Optional)"
                                        placeholder="e.g. Any, 10 LPA+, Working Professional"
                                        value={data.partnerIncome || ''}
                                        onChange={e => update('partnerIncome', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold dark:text-gray-200 flex items-center gap-1.5">
                                    <Sparkles size={15} className="text-rose-500" />
                                    <span>Describe Your Ideal Partner &amp; Expectations</span>
                                </label>
                                <textarea
                                    className="flex min-h-[110px] w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Share the qualities, values, career/lifestyle compatibility, or hobbies you hope to find in your partner..."
                                    value={data.expectations || data.prompt || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setData((prev: any) => ({ ...prev, expectations: val, prompt: val }));
                                    }}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {EXPECTATION_CHIPS.map(chip => (
                                        <button
                                            key={chip}
                                            type="button"
                                            onClick={() => {
                                                const current = (data.expectations || data.prompt || '').trim();
                                                const nextVal = current ? (current.includes(chip) ? current : `${current}. ${chip}`) : chip;
                                                setData((prev: any) => ({ ...prev, expectations: nextVal, prompt: nextVal }));
                                            }}
                                            className="px-3 py-1 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                                        >
                                            + {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PHOTOS & VERIFICATION */}
                    {stepId === 'photos' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500 text-center">
                            <label
                                htmlFor="wizard-photos-input"
                                className="border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 p-8 flex flex-col items-center justify-center relative hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group cursor-pointer block"
                            >
                                <input
                                    id="wizard-photos-input"
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={async (e) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0) return;

                                        const currentPhotos = data.photos || [];
                                        const isImportedGoogle = (p: string) => typeof p === 'string' && p.includes('googleusercontent.com');
                                        const isDicebear = (p: string) => typeof p === 'string' && p.includes('dicebear.com');

                                        const basePhotos = (currentPhotos.length === 1 && (isImportedGoogle(currentPhotos[0]) || isDicebear(currentPhotos[0])))
                                            ? []
                                            : currentPhotos.filter((p: string) => !isDicebear(p));

                                        if (basePhotos.length >= MAX_PROFILE_PHOTOS) {
                                            toast.error(`Maximum ${MAX_PROFILE_PHOTOS} photos allowed. Remove one to add more.`);
                                            e.target.value = '';
                                            return;
                                        }

                                        const slotsLeft = MAX_PROFILE_PHOTOS - basePhotos.length;
                                        const rawArr = Array.from(files);
                                        if (rawArr.length > slotsLeft) {
                                            toast.info(`Selecting first ${slotsLeft} photo${slotsLeft > 1 ? 's' : ''} (max ${MAX_PROFILE_PHOTOS} photos).`);
                                        }
                                        const fileArr = rawArr.slice(0, slotsLeft);

                                        const newPhotos = await compressProfilePhotos(fileArr, {
                                            maxDim: 1080,
                                            quality: 0.78,
                                            concurrency: 2,
                                            onError: (_name, msg) => toast.error(msg),
                                        });

                                        if (newPhotos.length > 0) {
                                            const cleanExisting = basePhotos.filter((p: string) => !isImportedGoogle(p));
                                            update('photos', [...newPhotos, ...cleanExisting].slice(0, MAX_PROFILE_PHOTOS));
                                            toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added!`);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 shadow-md rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Your Best Photos</h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Profiles with 2+ real photos rank higher and get 10x more responses.</p>
                                <div className="mt-3 flex flex-col items-center gap-1.5 pointer-events-none">
                                    <span className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md">
                                        📁 Choose from Camera or Gallery
                                    </span>
                                    <p className="text-[11px] text-gray-400">Up to 10 photos • JPG, PNG, WebP</p>
                                </div>
                            </label>

                            {data.photos && data.photos.length > 0 && (
                                <div className="space-y-2 text-left">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                            Your Photos ({data.photos.length}/10)
                                        </p>
                                        {data.photos.every((p: string) => typeof p === 'string' && p.includes('googleusercontent.com')) && (
                                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                Google thumbnail imported — upload a clear photo for top ranking
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {data.photos.map((p: string, i: number) => {
                                            const isGoogle = typeof p === 'string' && p.includes('googleusercontent.com');
                                            return (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 group">
                                                    <img src={p} className="w-full h-full object-cover" alt="Profile" />
                                                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold z-10">
                                                        {i === 0 ? (isGoogle ? 'Google Avatar' : 'Main Photo') : `Photo ${i + 1}`}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newP = data.photos.filter((_: any, idx: number) => idx !== i);
                                                            update('photos', newP);
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-80 group-hover:opacity-100"
                                                        title="Remove photo"
                                                    >✕</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Photo Privacy Shield */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-800/60 text-left">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🛡️</span>
                                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Photo Privacy Shield</span>
                                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">Safety First</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                            Keep your photos blurred until you accept a connection request from a member.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={data.photo_privacy === 'blurred_until_accept'}
                                            onChange={(e) => update('photo_privacy', e.target.checked ? 'blurred_until_accept' : 'public')}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Trust & Identity Verification (Optional Instant Action) */}
                            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200">
                                        <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                                        <span>Optional: Get Blue Selfie Verified Badge</span>
                                    </div>
                                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                                        Submit a quick live selfie (reviewed privately by our safety team, never shown publicly) or verify anytime from your Dashboard.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <RequestVerificationButton />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 pt-4 border-t dark:border-gray-800 flex justify-between items-center">
                    {currentStep > 0 ? (
                        <Button type="button" variant="outline" onClick={handleBack} className="w-28 sm:w-32 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Back</Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-3">
                        {stepId !== 'basics' && currentStep < STEPS.length - 1 && (
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
                                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-semibold text-xs sm:text-sm"
                            >
                                Skip step →
                            </Button>
                        )}
                        {stepId === 'photos' && (
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => onComplete({ ...data, interests: selectedHobbiesList, hobbies: selectedHobbiesList.join(', ') })}
                                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-semibold text-xs sm:text-sm"
                            >
                                Skip photo &amp; Finish →
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleNext}
                            className="w-32 sm:w-40 bg-indigo-600 hover:bg-indigo-700 font-bold"
                        >
                            {nextButtonLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
