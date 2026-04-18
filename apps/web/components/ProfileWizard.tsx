'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MapPin, LogOut } from 'lucide-react';
import { RELIGION_OPTIONS, ZODIAC_OPTIONS } from '@/lib/religionUtils';

const STORAGE_KEY = 'lifepartner_onboarding_data';
const STEP_STORAGE_KEY = 'lifepartner_onboarding_step';

const STEPS = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'basics', title: 'Personal Details' },
    { id: 'horoscope', title: 'Horoscope' },
    { id: 'career', title: 'Career & Education' },
    { id: 'family', title: 'Family Background' },
    { id: 'lifestyle', title: 'Lifestyle & Habits' },
    { id: 'partner', title: 'Partner Preferences' },
    { id: 'photos', title: 'Upload Photos' },
];

const QUOTES = {
    welcome: "Your journey to finding the perfect life partner begins here.",
    basics: "Tell us about yourself. Honesty is the foundation of a great relationship.",
    horoscope: "Stars align for those who believe. Share your astrological details.",
    career: "Ambition meets compatibility. Share your professional journey.",
    family: "Family is where life begins and love never ends.",
    lifestyle: " Habits shape our lives. Let's find someone who matches your rhythm.",
    partner: "Describe your soulmate. We'll use AI to find them.",
    photos: "A picture is worth a thousand words. Add your best moments."
};

// Gradient BGs for Left Panel
const GRADIENTS = {
    welcome: "from-indigo-600 to-purple-700",
    basics: "from-blue-600 to-cyan-600",
    horoscope: "from-violet-600 to-fuchsia-700",
    career: "from-emerald-600 to-teal-700",
    family: "from-orange-500 to-red-600",
    lifestyle: "from-lime-600 to-green-700",
    partner: "from-pink-600 to-rose-600",
    photos: "from-indigo-500 to-blue-600",
};

export default function ProfileWizard({ onComplete }: { onComplete: (data: any) => void }) {
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [vibeResult, setVibeResult] = useState<any>(null); // For AI Feedback
    const [direction, setDirection] = useState('forward');
    const [data, setData] = useState<any>({
        // Basics
        name: '', age: '', gender: 'Male', height: '', city: '', country: 'India', aboutMe: '',
        // Horoscope
        zodiacSign: '', nakshatra: '', manglik: 'No', birthTime: '',
        // Religion
        religion: 'Hindu', caste: '', interCasteOpen: false,
        // Career
        education: "Bachelor's", profession: '', income: '', company: '',
        // Family
        familyType: 'Nuclear', familyValues: 'Moderate', fatherOccupation: '', motherTongue: 'Hindi', maritalStatus: 'Single',
        // Lifestyle
        diet: 'Vegetarian', smoke: 'No', drink: 'No',
        // Partner
        partnerAgeRange: '', partnerHeightRange: '', partnerIncome: '', partnerLocation: '', prompt: '',
        // Photos
        photos: [],
        voiceBioUrl: ''
    });

    // Load saved data and step from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setData((prev: any) => ({ ...prev, ...parsed }));
                // console.log('Restored onboarding progress from localStorage');
            }
            // Restore step position
            const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
            if (savedStep) {
                const stepIndex = parseInt(savedStep, 10);
                if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEPS.length) {
                    setCurrentStep(stepIndex);
                    // console.log(`Restored to step ${stepIndex}: ${STEPS[stepIndex].title}`);
                }
            }
        } catch (e) {
            console.error('Failed to load saved onboarding data', e);
        }
    }, []);

    // Auto-save data to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save onboarding data', e);
        }
    }, [data]);

    // Auto-save current step to localStorage
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
                    // Use BigDataCloud API for better Indian City/District data
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const apiData = await res.json();

                    setData((prev: any) => ({
                        ...prev,
                        city: apiData.city || apiData.locality || "",
                        // In BigDataCloud, Indian Districts are usually adminLevel 5 or contain the word 'district'
                        district: apiData.localityInfo?.administrative?.find((x: any) => x.adminLevel === 5 || (x.name && x.name.toLowerCase().includes('district')))?.name || apiData.principalSubdivision || "",
                        state: apiData.principalSubdivision || "",
                        country: apiData.countryName || "",
                        lat: latitude.toString(),
                        lng: longitude.toString()
                    }));
                    toast.success("Location updated successfully!");
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

    const handleNext = () => {
        if (!validateStep()) return;
        setDirection('forward');
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onComplete(data);
        }
    };

    const handleBack = () => {
        setDirection('backward');
        setCurrentStep(s => s - 1);
    };

    // Silent check for button disabled state (no toasts)
    const isStepValid = () => {
        const stepId = STEPS[currentStep].id;
        if (stepId === 'basics') {
            return !!(data.name && data.age && data.height && data.city && data.aboutMe && data.aboutMe.length >= 20);
        }
        if (stepId === 'career') {
            return !!(data.profession && data.education);
        }
        if (stepId === 'photos') {
            return !!(data.photos && data.photos.length > 0);
        }
        return true;
    };

    // Validation with toasts (only called on button click)
    const validateStep = () => {
        const stepId = STEPS[currentStep].id;
        if (stepId === 'basics') {
            if (!(data.name && data.age && data.height && data.city)) {
                toast.error("Please fill in required fields (*)");
                return false;
            }
            if (!data.aboutMe || data.aboutMe.length < 20) {
                toast.error("Please write a bit more about yourself (min 20 characters)");
                return false;
            }
        }
        if (stepId === 'career') {
            if (!(data.profession && data.education)) {
                toast.error("Please fill in required fields (*)");
                return false;
            }
        }
        if (stepId === 'photos') {
            if (!(data.photos && data.photos.length > 0)) {
                toast.error("Please upload at least one photo");
                return false;
            }
        }
        return true;
    };

    const stepId = STEPS[currentStep].id;

    return (
        <div className="flex flex-col lg:flex-row w-full h-full lg:h-[85vh] bg-white dark:bg-gray-900 lg:rounded-2xl shadow-none lg:shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* LEFT PANEL: Visual & Quote */}
            <div className={`w-full lg:w-1/3 shrink-0 h-auto lg:h-auto text-white p-5 lg:p-12 flex flex-col justify-between relative transition-all duration-700 bg-gradient-to-br ${GRADIENTS[stepId as keyof typeof GRADIENTS] || "from-gray-700 to-gray-900"}`}>
                <div className="z-10 flex justify-between lg:block items-center mb-4 lg:mb-0">
                    <h1 className="text-xl lg:text-3xl font-bold lg:mb-2">LifePartner AI</h1>
                    <div className="hidden lg:block h-1 w-12 bg-white/50 rounded-full"></div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('userId');
                                window.location.href = '/login';
                            }}
                            className="hidden lg:flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20"
                        >
                            <LogOut size={14} />
                            Log Out
                        </button>
                        {/* Mobile Progress Indicator (Simple) */}
                        <div className="lg:hidden text-xs font-medium opacity-80 bg-white/20 px-2 py-1 rounded-full">
                            Step {currentStep + 1}/{STEPS.length}
                        </div>
                        <button
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
                    <h2 className="text-2xl lg:text-4xl font-bold mb-2 lg:mb-4 capitalize animate-in slide-in-from-left duration-700 key={stepId}">{STEPS[currentStep].title}</h2>
                    <p className="text-sm lg:text-lg text-white/90 leading-relaxed font-light italic">"{QUOTES[stepId as keyof typeof QUOTES]}"</p>
                </div>

                <div className="z-10 hidden lg:flex gap-2">
                    {STEPS.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                    ))}
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* RIGHT PANEL: Form */}
            <div className="w-full lg:w-2/3 p-5 sm:p-6 lg:p-12 flex flex-col relative overflow-y-auto flex-1 lg:h-auto bg-white dark:bg-gray-900 border-t lg:border-t-0 dark:border-gray-800">
                <div className="flex-1 max-w-2xl mx-auto w-full">
                    {/* STEP 0: WELCOME */}
                    {stepId === 'welcome' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-4xl mb-4">💍</div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Let's Create Your Profile</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">We need a few details to find your perfect match. The process takes about 2 minutes.</p>
                            <Button onClick={handleNext} className="w-48 h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">Get Started</Button>
                        </div>
                    )}

                    {/* STEP 1: BASICS */}
                    {stepId === 'basics' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Full Name *" value={data.name} onChange={e => update('name', e.target.value)} />
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">About Me (Bio)</label>
                                    <textarea
                                        className="w-full h-20 p-3 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm focus:ring-1 focus:outline-none focus:ring-indigo-600 dark:focus:ring-indigo-500 dark:text-white"
                                        placeholder="Briefly describe your personality..."
                                        value={data.aboutMe || ''}
                                        onChange={e => update('aboutMe', e.target.value)}
                                    />
                                </div>
                                <Input label="Age *" type="number" value={data.age} onChange={e => update('age', e.target.value)} />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Gender</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.gender} onChange={e => update('gender', e.target.value)}>
                                        <option>Male</option><option>Female</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Marital Status</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.maritalStatus || ''} onChange={e => update('maritalStatus', e.target.value)}>
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Awaiting Divorce">Awaiting Divorce</option>
                                    </select>
                                </div>
                                <Input label="Height (e.g. 5'9) *" value={data.height} onChange={e => update('height', e.target.value)} />
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Location *</label>
                                    <div className="flex gap-2 w-full">
                                        <div className="flex-1">
                                            <Input placeholder="City" value={data.city} onChange={e => update('city', e.target.value)} />
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
                                        <Input placeholder="District" value={data.district} onChange={e => update('district', e.target.value)} />
                                        <Input placeholder="State" value={data.state} onChange={e => update('state', e.target.value)} />
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
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">About Me (Bio) *</label>
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        placeholder="Tell us about yourself, your personality, and what you're looking for in life..."
                                        value={data.aboutMe || ''}
                                        onChange={e => update('aboutMe', e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400">Describe yourself in at least 50 characters for better visibility.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: HOROSCOPE (Detailed) */}
                    {stepId === 'horoscope' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Religion</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.religion} onChange={e => update('religion', e.target.value)}>
                                        <option value="">Select Religion</option>
                                        {RELIGION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="Caste / Community" placeholder="e.g. Brahmin - Iyer, BC-B" value={data.caste} onChange={e => update('caste', e.target.value)} />
                                <Input label="Gothra (Optional)" placeholder="e.g. Bharadwaj" value={data.gothra} onChange={e => update('gothra', e.target.value)} />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Manglik</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.manglik} onChange={e => update('manglik', e.target.value)}>
                                        <option>No</option><option>Yes</option><option>Don't Know</option>
                                    </select>
                                </div>
                                <Input label="Birth Place" placeholder="e.g. Chennai, TN" value={data.birthPlace} onChange={e => update('birthPlace', e.target.value)} />
                                <Input label="Time of Birth" placeholder="e.g. 10:30 AM" value={data.birthTime} onChange={e => update('birthTime', e.target.value)} />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Zodiac Sign</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.zodiacSign} onChange={e => update('zodiacSign', e.target.value)}>
                                        <option value="">Select Zodiac Sign</option>
                                        {ZODIAC_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="Nakshatra" placeholder="e.g. Rohini" value={data.nakshatra} onChange={e => update('nakshatra', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: CAREER & EDU */}
                    {stepId === 'career' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 gap-6">
                                <Input label="Profession / Job Title *" value={data.profession} onChange={e => update('profession', e.target.value)} />
                                <Input label="Company Name" value={data.company} onChange={e => update('company', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Highest Education</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.education} onChange={e => update('education', e.target.value)}>
                                        <option>High School</option><option>Bachelor's</option><option>Master's</option><option>PhD</option><option>Professional Degree</option>
                                    </select>
                                </div>
                                <Input label="College / University" placeholder="e.g. IIT Bombay" value={data.college} onChange={e => update('college', e.target.value)} />
                                <Input label="Degree Details" placeholder="e.g. B.Tech CS" value={data.degree} onChange={e => update('degree', e.target.value)} />
                                <Input label="Annual Income" placeholder="e.g. 15 LPA" value={data.income} onChange={e => update('income', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* STEP: FAMILY */}
                    {stepId === 'family' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Family Type</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.familyType} onChange={e => update('familyType', e.target.value)}>
                                        <option>Nuclear</option><option>Joint</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Family Values</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.familyValues} onChange={e => update('familyValues', e.target.value)}>
                                        <option>Moderate</option><option>Traditional</option><option>Orthodox</option><option>Liberal</option>
                                    </select>
                                </div>
                                <Input label="Father's Occupation" value={data.fatherOccupation} onChange={e => update('fatherOccupation', e.target.value)} />
                                <Input label="Mother's Occupation" value={data.motherOccupation} onChange={e => update('motherOccupation', e.target.value)} />
                                <Input label="Brothers (Count)" placeholder="e.g. 1" type="number" value={data.brothers} onChange={e => update('brothers', e.target.value)} />
                                <Input label="Sisters (Count)" placeholder="e.g. 0" type="number" value={data.sisters} onChange={e => update('sisters', e.target.value)} />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Mother Tongue</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.motherTongue} onChange={e => update('motherTongue', e.target.value)}>
                                        <option>Hindi</option><option>English</option><option>Telugu</option><option>Tamil</option><option>Marathi</option><option>Bengali</option><option>Kannada</option><option>Gujarati</option><option>Malayalam</option><option>Punjabi</option><option>Other</option>
                                    </select>
                                </div>
                                <Input label="Native Place / Ancestral Origin" placeholder="e.g. Kanchipuram" value={data.nativePlace} onChange={e => update('nativePlace', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* STEP: LIFESTYLE & INTERESTS */}
                    {stepId === 'lifestyle' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Diet</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.diet} onChange={e => update('diet', e.target.value)}>
                                        <option>Vegetarian</option><option>Non-Vegetarian</option><option>Eggetarian</option><option>Vegan</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Smoking</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.smoke} onChange={e => update('smoke', e.target.value)}>
                                        <option>No</option><option>Yes</option><option>Occasionally</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-200">Drinking</label>
                                    <select className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={data.drink} onChange={e => update('drink', e.target.value)}>
                                        <option>No</option><option>Yes</option><option>Occasionally</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-gray-200">Hobbies & Interests</label>
                                <textarea
                                    className="w-full h-24 p-3 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="e.g. Classical Dance, Cricket, Reading Novels, Traveling..."
                                    value={data.hobbies}
                                    onChange={e => update('hobbies', e.target.value)}
                                />
                                <p className="text-xs text-gray-400">Separate with commas</p>
                            </div>
                        </div>
                    )}

                    {/* STEP: PARTNER PREF */}
                    {stepId === 'partner' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Partner Expectations</h3>
                                <textarea
                                    className="w-full h-32 p-4 border dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-600 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    placeholder="Describe your ideal partner... (e.g. Someone who is ambitious, loves travel, and respects family values. Should be willing to settle in Bangalore.)"
                                    value={data.prompt}
                                    onChange={e => update('prompt', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Pref Age Range" placeholder="24-29" value={data.partnerAgeRange} onChange={e => update('partnerAgeRange', e.target.value)} />
                                <Input label="Pref Height" placeholder="5'2 - 5'8" value={data.partnerHeightRange} onChange={e => update('partnerHeightRange', e.target.value)} />
                                <Input label="Min Income" placeholder="e.g. 10 LPA" value={data.partnerIncome} onChange={e => update('partnerIncome', e.target.value)} />
                                <Input label="Pref Location" placeholder="e.g. Mumbai" value={data.partnerLocation} onChange={e => update('partnerLocation', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* STEP: PHOTOS */}
                    {stepId === 'photos' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500 text-center">
                            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 p-10 flex flex-col items-center justify-center relative hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={async (e) => {
                                        const files = e.target.files;
                                        if (!files) return;
                                        const newPhotos: string[] = [];
                                        for (let i = 0; i < files.length; i++) {
                                            const file = files[i];
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error(`Image is too large (>5MB). Please upload a smaller photo.`);
                                                continue;
                                            }
                                            const base64 = await new Promise<string>((resolve, reject) => {
                                                const url = URL.createObjectURL(file);
                                                const img = new Image();
                                                img.onload = () => {
                                                    URL.revokeObjectURL(url);
                                                    const canvas = document.createElement('canvas');
                                                    let { width, height } = img;
                                                    const maxDim = 1200;

                                                    if (width > maxDim || height > maxDim) {
                                                        const ratio = Math.min(maxDim / width, maxDim / height);
                                                        width = width * ratio;
                                                        height = height * ratio;
                                                    }

                                                    canvas.width = width;
                                                    canvas.height = height;
                                                    const ctx = canvas.getContext('2d');
                                                    if (!ctx) return reject('Failed to get canvas context');
                                                    ctx.drawImage(img, 0, 0, width, height);
                                                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                                                };
                                                img.onerror = () => reject('Failed to load image');
                                                img.src = url;
                                            }).catch(() => null);

                                            if (base64) newPhotos.push(base64 as string);
                                        }
                                        update('photos', [...(data.photos || []), ...newPhotos]);
                                    }}
                                />
                                <div className="w-20 h-20 bg-white dark:bg-gray-800 shadow-md rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Your Best Photos</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">Profiles with photos get 10x more matches.</p>
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/40 max-w-sm">
                                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                                        ⚠️ Note: Please upload clear photos of your face. Our AI will automatically analyze and reject scenery, cartoons, and fake pictures.
                                    </p>
                                </div>
                            </div>

                            {/* Preview */}
                            {data.photos && data.photos.length > 0 && (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                                    {data.photos.map((p: string, i: number) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden shadow-sm border group">
                                            <img src={p} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => {
                                                    const newP = data.photos.filter((_: any, idx: number) => idx !== i);
                                                    update('photos', newP);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                </div>

                {/* Footer Buttons */}
                {stepId !== 'welcome' && (
                    <div className="mt-8 pt-4 border-t dark:border-gray-800 flex justify-between">
                        <Button variant="outline" onClick={handleBack} className="w-32 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Back</Button>
                        <Button
                            onClick={handleNext}
                            className="w-32 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            disabled={!isStepValid()}
                        >
                            {currentStep === STEPS.length - 1 ? "Finish" : "Next"}
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
}

