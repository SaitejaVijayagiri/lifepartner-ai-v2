'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProfileWizard from '@/components/ProfileWizard';
import { useToast } from '@/components/ui/Toast';
import { Sparkles } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [authChecking, setAuthChecking] = useState(true);

    // Check if user is authenticated
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            // Not authenticated, redirect to register
            router.push('/register');
        } else {
            setAuthChecking(false);
        }
    }, [router]);

    const handleWizardComplete = async (data: any) => {
        try {
            setLoading(true);

            // Transform wizard data to API structure
            const payload = {
                name: data.name,
                age: parseInt(data.age),
                gender: data.gender,
                height: data.height,
                location: {
                    city: data.city,
                    district: data.district,
                    state: data.state,
                    country: data.country,
                    lat: data.lat,
                    lng: data.lng
                },

                religion: {
                    religion: data.religion,
                    caste: data.caste,
                    interCasteOpen: data.interCasteOpen,
                    gothra: data.gothra
                },

                horoscope: {
                    zodiacSign: data.zodiacSign,
                    nakshatra: data.nakshatra,
                    manglik: data.manglik,
                    birthTime: data.birthTime,
                    birthPlace: data.birthPlace  // was missing
                },

                career: {
                    profession: data.profession,
                    company: data.company,
                    education: data.education,
                    college: data.college,
                    degree: data.degree,
                    income: data.income
                },

                family: {
                    type: data.familyType,
                    values: data.familyValues,
                    fatherOccupation: data.fatherOccupation,
                    motherOccupation: data.motherOccupation,  // was missing
                    brothers: data.brothers,                   // was missing
                    sisters: data.sisters,                     // was missing
                    nativePlace: data.nativePlace
                },

                lifestyle: {
                    diet: data.diet,
                    smoke: data.smoke,
                    drink: data.drink,
                    hobbies: data.hobbies  // was missing
                },

                prompt: data.prompt,
                aboutMe: data.aboutMe || '', // Bio — separate from partner expectations
                partnerPreferences: {
                    ageRange: data.partnerAgeRange,
                    heightRange: data.partnerHeightRange,
                    income: data.partnerIncome,
                    location: data.partnerLocation
                },

                motherTongue: data.motherTongue,
                maritalStatus: data.maritalStatus || "Single", // Added Marital Status
                photos: data.photos,
                photoUrl: data.photos?.[0] || '' // Set primary
            };

            await api.profile.updateProfile(payload); // Updated to use correct endpoint

            // Clear saved onboarding data from localStorage after successful save
            localStorage.removeItem('lifepartner_onboarding_data');
            localStorage.removeItem('lifepartner_onboarding_step');
            localStorage.removeItem('matches_cache_v2');

            // Minimal delay just to ensure the success animation renders smoothly
            await new Promise(r => setTimeout(r, 400));
            router.push('/dashboard');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to save profile. Please try again.');
            setLoading(false); // Only unset loading if it fails, otherwise keep it spinning until redirect
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gray-950 overflow-hidden font-sans">
                {/* Glowing animated background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px] animate-ping" style={{ animationDuration: '3s' }}></div>

                {/* Foreground content */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-28 h-28 mb-10">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 border-[6px] border-indigo-500/20 rounded-full"></div>
                        {/* Spinning Gradient Ring */}
                        <div className="absolute inset-0 border-[6px] border-indigo-400 border-t-purple-400 border-l-transparent border-b-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center text-indigo-200">
                            <Sparkles className="w-10 h-10 animate-pulse" />
                        </div>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
                        Building Your Profile
                    </h2>

                    <div className="flex flex-col items-center space-y-3 text-indigo-200/80 font-medium text-lg">
                        <p className="animate-pulse">Analyzing compatibility factors...</p>
                        <p className="animate-pulse" style={{ animationDelay: '0.5s' }}>Generating AI match vectors...</p>
                        <p className="animate-pulse" style={{ animationDelay: '1s' }}>Securing your preferences...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 lg:static lg:h-auto lg:min-h-screen overflow-hidden lg:overflow-auto bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-start lg:justify-center p-0 md:p-6 font-sans z-[50]">
            {authChecking ? (
                <div className="text-center w-full h-screen flex flex-col justify-center items-center">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold dark:text-white">Loading...</h2>
                </div>
            ) : (
                <ProfileWizard onComplete={handleWizardComplete} />
            )}
        </div>
    );
}
