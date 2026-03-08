'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Heart, Star, CheckCircle, Shield, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Link from 'next/link';

interface ProfileClientProps {
    initialProfile: any;
    profileId: string;
}

export default function ProfileClient({ initialProfile, profileId }: ProfileClientProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(initialProfile);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { user } = useAuth();
    const { onlineUsers } = useSocket();
    const isUserOnline = profile ? (profile.isOnline || onlineUsers.includes(profile.id)) : false;

    // Effect: Refetch profile if user is logged in (to get full details + match info)
    // or if initial load failed but user might have access
    useEffect(() => {
        if (user) {
            // If we have a profile from server, it's likely the "Public" version.
            // We want the "Authenticated" version (with match scores, connection status, etc.)
            // So we silently refetch or loading-refetch if null.
            if (!profile) setLoading(true); // Only show spinner if we have NOTHING

            api.profile.getById(profileId)
                .then((data) => {
                    setProfile(data);
                })
                .catch((err) => {
                    console.error("Client fetch failed", err);
                    // If server also failed, we are stuck.
                })
                .finally(() => setLoading(false));
        }
    }, [user, profileId]);

    // Share Handler
    const handleShare = async () => {
        const shareData = {
            title: `Profile: ${profile.name}`,
            text: `Check out ${profile.name} on LifePartner AI!`,
            url: `https://www.lifepartnerai.in/profile/${profileId}`
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                toast.success("Profile link copied!");
            }
        } catch (err) {
            console.error("Share failed:", err);
            toast.error("Sharing unsupported or cancelled");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">This profile might be private, deleted, or the link is incorrect.</p>
                <div className="flex gap-4 justify-center pt-4">
                    <Link href="/">
                        <Button variant="outline">Go Home</Button>
                    </Link>
                    {!user && (
                        <Link href="/register">
                            <Button>Register</Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-20 font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                    <span className="font-heading font-bold text-lg text-gray-900 dark:text-gray-100">Profile Details</span>
                </div>
                {!user && (
                    <Link href="/login">
                        <Button size="sm" variant="outline" className="text-primary hover:text-primary-dark">Login</Button>
                    </Link>
                )}
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">

                {/* 1. Hero Card (Biodata Style) */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl overflow-hidden border border-white">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Photo Carousel (Simplified) */}
                        <div className="h-[500px] bg-gray-100 relative">
                            {/* Safer Image Access */}
                            {profile.photos?.[0] ? (
                                <img src={profile.photos[0]} className="w-full h-full object-cover" alt={profile.name} />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Photo</div>
                            )}

                            {!user && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/30 backdrop-blur-[2px] px-4 py-2 rounded-full text-white/50 text-xs font-bold uppercase tracking-widest border border-white/10">
                                        LifePartner AI • Public Preview
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                <div className="text-white">
                                    <h1 className="text-4xl font-heading font-bold mb-2">{profile.name}, {profile.age}</h1>
                                    <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={16} />
                                            {typeof profile.location === 'string' ? profile.location : ([profile.location?.city, profile.location?.district, profile.location?.state].filter((x) => x && x !== "Unknown City" && x !== "Unknown State").join(", ") || "Unknown City")}
                                        </div>
                                        {/* Online Badge */}
                                        {isUserOnline && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-md">
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                                <span className="text-green-200 text-xs font-bold uppercase tracking-wider">Active Now</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-gray-800 relative">
                            {/* Ornamental Corner */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <img src="https://www.svgrepo.com/show/486228/ornamental-design.svg" className="w-32 h-32" />
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider border border-green-100">
                                    <Shield size={14} /> ID Verified
                                </div>

                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Briefcase size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Profession</p>
                                            <p className="font-semibold">{profile.role || profile.jobTitle || profile.profession || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><GraduationCap size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Education</p>
                                            <p className="font-semibold">{profile.education || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600"><Star size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Marital Status</p>
                                            <p className="font-semibold">{(!profile.maritalStatus || profile.maritalStatus === "Never Married") ? "Single" : profile.maritalStatus}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    {user ? (
                                        <>
                                            <Button className="flex-1 h-12 bg-primary hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl font-bold text-base">
                                                <Heart className="mr-2" size={20} /> Send Interest
                                            </Button>
                                            <Button variant="outline" className="h-12 w-12 rounded-xl border-gray-200">
                                                <Star size={20} />
                                            </Button>
                                        </>
                                    ) : (
                                        <Link href="/register" className="flex-1">
                                            <Button className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200 rounded-xl font-bold text-base text-white border-0 animate-pulse">
                                                Register to Connect
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="outline" onClick={handleShare} className="h-12 w-12 rounded-xl border-gray-200 text-gray-600 dark:text-gray-300 hover:text-blue-600" title="Share Profile">
                                        <Share2 size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Tabbed Content Area */}
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 h-14 p-1 bg-gray-100/80 backdrop-blur-md rounded-2xl">
                        <TabsTrigger value="about" className="rounded-xl text-base font-medium data-[state=active]:bg-white dark:bg-gray-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">About</TabsTrigger>
                        <TabsTrigger value="details" className="rounded-xl text-base font-medium data-[state=active]:bg-white dark:bg-gray-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Details</TabsTrigger>
                        {profile.summary && (
                            <TabsTrigger value="ai" className="rounded-xl text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                ✨ AI Insight
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Tab: About */}
                    <TabsContent value="about" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 text-lg">📝</span> About Me
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{profile.bio || profile.aboutMe || "No bio available."}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-purple-50 rounded-xl text-purple-600 text-lg">🏡</span> Family Background
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{profile.family?.about || profile.family?.description || "No family details added."}</p>
                        </div>
                    </TabsContent>

                    {/* Tab: Details */}
                    <TabsContent value="details" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100 mb-6">Personal Information</h3>
                            <div className="grid md:grid-cols-2 gap-y-4 gap-x-12">
                                {profile.religion && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Religion</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{profile.religion.religion}</span>
                                    </div>
                                )}
                                {profile.caste && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Caste</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{profile.caste || profile.religion?.caste}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Height</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{profile.height}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Mother Tongue</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{profile.motherTongue}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: AI Insight */}
                    {profile.summary && (
                        <TabsContent value="ai" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-white/50 relative overflow-hidden">
                                {/* Decorative BG */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center text-2xl border border-indigo-100">
                                            ✨
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-2xl text-indigo-900">AI Compatibility Analysis</h3>
                                            <p className="text-indigo-600/80 text-sm font-medium">Why you matched with {profile.name}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-sm">
                                        <p className="text-indigo-900/90 text-xl leading-relaxed font-medium">
                                            "{profile.summary}"
                                        </p>
                                    </div>

                                    <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {/* AI Tags derived from content logic would go here, currently just placeholders or reuse match reasons if available in profile */}
                                        <div className="px-4 py-2 bg-white/50 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider border border-white/20">
                                            🧠 Smart Match
                                        </div>
                                        <div className="px-4 py-2 bg-white/50 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider border border-white/20">
                                            ⚡ High Compatibility
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>

                {/* Sticky Mobile CTA for Guests */}
                {!user && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 md:hidden animate-in slide-in-from-bottom-full duration-500">
                        <Link href="/register">
                            <Button className="w-full h-12 bg-black text-white rounded-xl font-bold text-lg shadow-xl">
                                Join to View Full Profile
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
