'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Heart, Star, CheckCircle, Shield, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatLocationString } from '@/lib/utils';

const StoryModal = dynamic(() => import('./StoryModal'), { ssr: false });

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

    const [matchStatus, setMatchStatus] = useState<string | null>(profile?.match_status || null);
    const [isLiked, setIsLiked] = useState<boolean>(profile?.is_liked || false);
    const [likeCount, setLikeCount] = useState<number>(profile?.total_likes || 0);
    const [loadingInterest, setLoadingInterest] = useState<boolean>(false);
    const [loadingLike, setLoadingLike] = useState<boolean>(false);
    const [activeHighlightSet, setActiveHighlightSet] = useState<any>(null);

    useEffect(() => {
        if (profile) {
            setMatchStatus(profile.match_status || null);
            setIsLiked(profile.is_liked || false);
            setLikeCount(profile.total_likes || 0);
        }
    }, [profile]);

    const handleSendInterest = async () => {
        if (!profile || loadingInterest || matchStatus === 'pending') return;
        setLoadingInterest(true);
        const prevStatus = matchStatus;
        setMatchStatus('pending');
        try {
            await api.interactions.sendInterest(profile.id);
            toast.success(`Interest request sent to ${profile.name}!`);
        } catch (err: any) {
            setMatchStatus(prevStatus);
            toast.error(err.message || "Failed to send interest request");
        } finally {
            setLoadingInterest(false);
        }
    };

    const handleToggleLike = async () => {
        if (!profile || loadingLike) return;
        setLoadingLike(true);
        const nextIsLiked = !isLiked;
        setIsLiked(nextIsLiked);
        setLikeCount(prev => nextIsLiked ? prev + 1 : Math.max(0, prev - 1));
        try {
            if (nextIsLiked) {
                await api.interactions.sendLike(profile.id);
                toast.success(`Added ${profile.name} to shortlist!`);
            } else {
                await api.interactions.revokeLike(profile.id);
                toast.success(`Removed ${profile.name} from shortlist.`);
            }
        } catch (err: any) {
            setIsLiked(!nextIsLiked);
            setLikeCount(prev => !nextIsLiked ? prev + 1 : Math.max(0, prev - 1));
            toast.error(err.message || "Failed to update shortlist");
        } finally {
            setLoadingLike(false);
        }
    };

    // Share Handler
    const handleShare = async () => {
        const shareData = {
            title: `Profile: ${profile.name}`,
            text: `Check out ${profile.name} on LifePartner AI!`,
            url: `https://www.lifepartnerai.in/profile/${profileId}?utm_source=share&utm_medium=social&utm_campaign=profile_share`
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
                                            {formatLocationString(profile.location)}
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
                                            <p className="font-semibold">{profile.career?.profession || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><GraduationCap size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Education</p>
                                            <p className="font-semibold">{profile.career?.education || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600"><Star size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Marital Status</p>
                                            <p className="font-semibold">{(!profile.maritalStatus || profile.maritalStatus === "Never Married") ? "Single" : (profile.maritalStatus || "Single")}</p>
                                        </div>
                                    </div>
                                    {profile.height && (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600"><CheckCircle size={20} /></div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Height</p>
                                                <p className="font-semibold">{profile.height}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                 <div className="pt-8 flex gap-4 w-full">
                                    {user ? (
                                        <>
                                            {matchStatus === 'accepted' || matchStatus === 'connected' ? (
                                                <Button
                                                    onClick={() => router.push('/dashboard?tab=connections')}
                                                    className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-bold text-base"
                                                >
                                                    💬 Message
                                                </Button>
                                            ) : (
                                                <Button
                                                    disabled={loadingInterest || matchStatus === 'pending'}
                                                    onClick={handleSendInterest}
                                                    className={`flex-1 h-12 font-bold text-base rounded-xl shadow-lg transition-all ${
                                                        matchStatus === 'pending'
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                                    }`}
                                                >
                                                    {loadingInterest ? 'Sending...' : (matchStatus === 'pending' ? '✓ Request Sent' : '✨ Send Interest')}
                                                </Button>
                                            )}
                                            <Button
                                                onClick={handleToggleLike}
                                                disabled={loadingLike}
                                                variant="outline"
                                                className={`h-12 w-12 rounded-xl border-gray-200 flex items-center justify-center transition-all ${
                                                    isLiked ? 'bg-pink-50 border-pink-200 text-pink-600' : 'text-gray-400 hover:text-pink-600'
                                                }`}
                                                title={isLiked ? "Remove Shortlist" : "Shortlist"}
                                            >
                                                <Heart className={isLiked ? "fill-current" : ""} size={20} />
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

                {/* Profile Highlights Reel */}
                {(() => {
                    const highlightedStories = (profile?.stories || []).filter((s: any) => Boolean(s.isHighlight || s.is_highlight));
                    if (highlightedStories.length === 0) return null;

                    return (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-white/60 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                                <Star size={16} fill="currentColor" />
                                <span>Profile Highlights</span>
                            </div>
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
                                {highlightedStories.map((hStory: any, idx: number) => (
                                    <div
                                        key={hStory.id || idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveHighlightSet({
                                                stories: highlightedStories,
                                                initialIndex: idx,
                                                user: {
                                                    id: profile.id,
                                                    name: profile.name || profile.full_name || 'User',
                                                    photoUrl: profile.photos?.[0] || profile.avatar_url
                                                }
                                            });
                                        }}
                                        className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
                                    >
                                        <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform">
                                            <div className="w-full h-full rounded-full p-[1px] bg-white dark:bg-gray-900 overflow-hidden">
                                                {hStory.type === 'video' ? (
                                                    <video src={hStory.url} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <img src={hStory.url} className="w-full h-full object-cover" alt="Highlight" />
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[64px]">
                                            Highlight {idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* 2. Tabbed Content Area */}
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8 h-14 p-1 bg-gray-100/80 backdrop-blur-md rounded-2xl">
                        <TabsTrigger value="about" className="rounded-xl text-xs sm:text-sm md:text-base font-medium data-[state=active]:bg-white dark:bg-gray-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">About</TabsTrigger>
                        <TabsTrigger value="highlights" className="rounded-xl text-xs sm:text-sm md:text-base font-medium data-[state=active]:bg-white dark:bg-gray-800 data-[state=active]:text-amber-500 data-[state=active]:shadow-sm">⭐ Highlights</TabsTrigger>
                        <TabsTrigger value="details" className="rounded-xl text-xs sm:text-sm md:text-base font-medium data-[state=active]:bg-white dark:bg-gray-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Details</TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-xl text-xs sm:text-sm md:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                            ✨ AI
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab: Highlights */}
                    <TabsContent value="highlights" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="p-2 bg-amber-50 rounded-xl text-amber-500 text-lg">⭐</span> Story Highlights
                            </h3>
                            {(() => {
                                const highlightedStories = (profile?.stories || []).filter((s: any) => Boolean(s.isHighlight || s.is_highlight));
                                if (highlightedStories.length === 0) {
                                    const isOwner = user && (String(user.id || (user as any)?.userId) === String(profile.id || profile.user_id));
                                    return (
                                        <div className="text-center py-10 px-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800/40 space-y-3">
                                            <div className="text-4xl">⭐</div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                {isOwner ? "No Saved Highlights Yet" : "No Highlights Available"}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                {isOwner 
                                                    ? "Pin your favorite active stories to your profile! Open your story in the viewer and tap the ⭐ Star button to save it here permanently."
                                                    : "This profile has not saved any active stories to their highlights reel yet."
                                                }
                                            </p>
                                        </div>
                                    );
                                }

                                const isOwner = user && (String(user.id || (user as any)?.userId) === String(profile.id || profile.user_id));
                                return (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2">
                                        {highlightedStories.map((hStory: any, idx: number) => (
                                            <div
                                                key={hStory.id || idx}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveHighlightSet({
                                                        stories: highlightedStories,
                                                        initialIndex: idx,
                                                        user: {
                                                            id: profile.id,
                                                            name: profile.name || profile.full_name || 'User',
                                                            photoUrl: profile.photos?.[0] || profile.avatar_url
                                                        }
                                                    });
                                                }}
                                                className="relative flex flex-col items-center gap-2 cursor-pointer group"
                                            >
                                                <div className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg group-hover:scale-105 transition-all">
                                                    <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900 overflow-hidden">
                                                        {hStory.type === 'video' ? (
                                                            <video src={hStory.url} className="w-full h-full object-cover" muted />
                                                        ) : (
                                                            <img src={hStory.url} className="w-full h-full object-cover" alt="Highlight" />
                                                        )}
                                                    </div>

                                                    {isOwner && (
                                                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const res = await api.profile.toggleStoryHighlight(hStory.id);
                                                                        if (res?.success) {
                                                                            setProfile((prev: any) => {
                                                                                if (!prev?.stories) return prev;
                                                                                const updated = prev.stories.map((s: any) =>
                                                                                    String(s.id) === String(hStory.id) ? { ...s, isHighlight: false, is_highlight: false } : s
                                                                                );
                                                                                return { ...prev, stories: updated };
                                                                            });
                                                                            toast.success("Removed from highlights");
                                                                        }
                                                                    } catch (err: any) {
                                                                        toast.error("Failed to unhighlight story");
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-full bg-amber-500/90 text-white hover:bg-amber-600 shadow-md transition-transform hover:scale-110"
                                                                title="Remove from Highlights"
                                                            >
                                                                <Star size={12} fill="currentColor" />
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm("Delete this story permanently?")) {
                                                                        try {
                                                                            await api.profile.deleteStory(hStory.id);
                                                                            setProfile((prev: any) => {
                                                                                if (!prev?.stories) return prev;
                                                                                const remaining = prev.stories.filter((s: any) => String(s.id) !== String(hStory.id));
                                                                                return { ...prev, stories: remaining };
                                                                            });
                                                                            toast.success("Story deleted!");
                                                                        } catch (err: any) {
                                                                            toast.error("Failed to delete story");
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                                                                title="Delete Story Permanently"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                                                    Highlight {idx + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </TabsContent>

                    {/* Tab: About */}
                    <TabsContent value="about" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Bio */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 text-lg">📝</span> About Me
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{profile.bio || profile.aboutMe || "No bio added yet."}</p>
                        </div>

                        {/* Hobbies */}
                        {profile.lifestyle?.hobbies && (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <span className="p-2 bg-green-50 rounded-xl text-green-600 text-lg">🎯</span> Hobbies & Interests
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.lifestyle.hobbies.split(',').map((h: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">{h.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Family Background */}
                        {profile.family && (profile.family.type || profile.family.fatherOccupation || profile.family.nativePlace) && (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <span className="p-2 bg-purple-50 rounded-xl text-purple-600 text-lg">🏡</span> Family Background
                                </h3>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                                    {profile.family.type && <div><span className="text-gray-400 text-sm">Family Type</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.type}</p></div>}
                                    {profile.family.values && <div><span className="text-gray-400 text-sm">Family Values</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.values}</p></div>}
                                    {profile.family.fatherOccupation && <div><span className="text-gray-400 text-sm">Father's Occupation</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.fatherOccupation}</p></div>}
                                    {profile.family.motherOccupation && <div><span className="text-gray-400 text-sm">Mother's Occupation</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.motherOccupation}</p></div>}
                                    {(profile.family.brothers !== undefined && profile.family.brothers !== '') && <div><span className="text-gray-400 text-sm">Brothers</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.brothers}</p></div>}
                                    {(profile.family.sisters !== undefined && profile.family.sisters !== '') && <div><span className="text-gray-400 text-sm">Sisters</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.sisters}</p></div>}
                                    {profile.family.nativePlace && <div><span className="text-gray-400 text-sm">Native Place</span><p className="font-semibold text-gray-800 dark:text-gray-200">{profile.family.nativePlace}</p></div>}
                                </div>
                            </div>
                        )}

                        {/* Partner Expectations */}
                        {profile.expectations && (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <span className="p-2 bg-pink-50 rounded-xl text-pink-600 text-lg">💞</span> Partner Expectations
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{profile.expectations}</p>
                                {profile.partnerPreferences && (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {profile.partnerPreferences.ageRange && <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl"><p className="text-xs text-gray-400">Age Range</p><p className="font-semibold text-sm">{profile.partnerPreferences.ageRange}</p></div>}
                                        {profile.partnerPreferences.heightRange && <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl"><p className="text-xs text-gray-400">Height Range</p><p className="font-semibold text-sm">{profile.partnerPreferences.heightRange}</p></div>}
                                        {profile.partnerPreferences.income && <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl"><p className="text-xs text-gray-400">Min Income</p><p className="font-semibold text-sm">{profile.partnerPreferences.income}</p></div>}
                                        {profile.partnerPreferences.location && <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl"><p className="text-xs text-gray-400">Pref Location</p><p className="font-semibold text-sm">{profile.partnerPreferences.location}</p></div>}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Details */}
                    <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Personal */}
                        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-5">👤 Personal Details</h3>
                            <div className="grid md:grid-cols-2 gap-y-1 gap-x-12">
                                {[  
                                    { label: 'Height', value: profile.height },
                                    { label: 'Mother Tongue', value: profile.motherTongue },
                                    { label: 'Marital Status', value: profile.maritalStatus || 'Single' },
                                    { label: 'Gender', value: profile.gender },
                                    { label: 'Religion', value: profile.religion?.religion },
                                    { label: 'Caste', value: profile.religion?.caste },
                                    { label: 'Gothra', value: profile.religion?.gothra },
                                    { label: 'Inter-Caste Open', value: profile.religion?.interCasteOpen ? 'Yes' : (profile.religion?.interCasteOpen === false ? 'No' : undefined) },
                                ].filter(r => r.value).map(row => (
                                    <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">{row.label}</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[55%]">{String(row.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Career */}
                        {profile.career && (profile.career.profession || profile.career.education || profile.career.income) && (
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-5">💼 Career & Education</h3>
                                <div className="grid md:grid-cols-2 gap-y-1 gap-x-12">
                                    {[
                                        { label: 'Profession', value: profile.career.profession },
                                        { label: 'Company', value: profile.career.company },
                                        { label: 'Education', value: profile.career.education },
                                        { label: 'College', value: profile.career.college },
                                        { label: 'Degree', value: profile.career.degree },
                                        { label: 'Annual Income', value: profile.career.income },
                                    ].filter(r => r.value).map(row => (
                                        <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">{row.label}</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[55%]">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lifestyle */}
                        {profile.lifestyle && (profile.lifestyle.diet || profile.lifestyle.smoke || profile.lifestyle.drink) && (
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-5">🌿 Lifestyle</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {profile.lifestyle.diet && <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl text-center"><p className="text-xs text-gray-400 mb-1">Diet</p><p className="font-bold text-gray-800 dark:text-gray-200">{profile.lifestyle.diet}</p></div>}
                                    {profile.lifestyle.smoke && <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl text-center"><p className="text-xs text-gray-400 mb-1">Smoking</p><p className="font-bold text-gray-800 dark:text-gray-200">{profile.lifestyle.smoke}</p></div>}
                                    {profile.lifestyle.drink && <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl text-center"><p className="text-xs text-gray-400 mb-1">Drinking</p><p className="font-bold text-gray-800 dark:text-gray-200">{profile.lifestyle.drink}</p></div>}
                                </div>
                            </div>
                        )}

                        {/* Horoscope */}
                        {profile.horoscope && (profile.horoscope.zodiacSign || profile.horoscope.nakshatra || profile.horoscope.manglik) && (
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-5">🔮 Horoscope</h3>
                                <div className="grid md:grid-cols-2 gap-y-1 gap-x-12">
                                    {[
                                        { label: 'Zodiac Sign', value: profile.horoscope.zodiacSign },
                                        { label: 'Nakshatra', value: profile.horoscope.nakshatra },
                                        { label: 'Manglik', value: profile.horoscope.manglik },
                                        { label: 'Birth Time', value: profile.horoscope.birthTime },
                                        { label: 'Birth Place', value: profile.horoscope.birthPlace },
                                    ].filter(r => r.value).map(row => (
                                        <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">{row.label}</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

            {activeHighlightSet && (
                <StoryModal
                    stories={activeHighlightSet.stories}
                    initialIndex={activeHighlightSet.initialIndex || 0}
                    user={activeHighlightSet.user}
                    currentUser={user}
                    onClose={() => setActiveHighlightSet(null)}
                    onDelete={async (storyId) => {
                        await api.profile.deleteStory(storyId);
                        setProfile((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const remaining = prev.stories.filter((s: any) => String(s.id) !== String(storyId));
                            return { ...prev, stories: remaining };
                        });
                        setActiveHighlightSet((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const remaining = prev.stories.filter((s: any) => String(s.id) !== String(storyId));
                            return remaining.length > 0 ? { ...prev, stories: remaining } : null;
                        });
                        toast.success("Story deleted!");
                    }}
                    onHighlightToggle={(storyId, isHighlight) => {
                        setProfile((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const updatedStories = prev.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updatedStories };
                        });
                        setActiveHighlightSet((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const updatedStories = prev.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updatedStories };
                        });
                    }}
                />
            )}
        </div>
    );
}
