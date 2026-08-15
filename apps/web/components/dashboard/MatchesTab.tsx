'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Eye, Crown, Lock, Heart, Search, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { FilterState } from '@/components/FilterModal';

// Dynamically import heavy components
const MatchCard = dynamic(() => import('@/components/MatchCard'));
const StoryModal = dynamic(() => import('@/components/StoryModal'));
const StoryCreator = dynamic(() => import('@/components/StoryCreator'), { ssr: false });
const LiveEventBanner = dynamic(() => import('@/components/LiveEventBanner'), { ssr: false });
const HostSpeedDateModal = dynamic(() => import('@/components/HostSpeedDateModal'), { ssr: false });

interface MatchesTabProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    matches: any[];
    setMatches: React.Dispatch<React.SetStateAction<any[]>>;
    fetchMatches: (pageNum?: number) => Promise<void>;
    hasMore: boolean;
    loadingMore: boolean;
    page: number;
    activeFilters: FilterState | null;
    setActiveFilters: React.Dispatch<React.SetStateAction<FilterState | null>>;
    setSelectedProfile: (profile: any) => void;
    setSelectedKundli: (kundli: any) => void;
    setGiftData: (gift: any) => void;
    connections: any[];
    openChat: (conn: any) => void;
    setActiveTab: (tab: string) => void;
    setShowCoinStore: (show: boolean) => void;
    setShowSpeedDatingLobby: (show: boolean) => void;
}

export default function MatchesTab({
    currentUser,
    setCurrentUser,
    matches,
    setMatches,
    fetchMatches,
    hasMore,
    loadingMore,
    page,
    activeFilters,
    setActiveFilters,
    setSelectedProfile,
    setSelectedKundli,
    setGiftData,
    connections,
    openChat,
    setActiveTab,
    setShowCoinStore,
    setShowSpeedDatingLobby
}: MatchesTabProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [aiFilters, setAiFilters] = useState<any>(null);
    const [showHostModal, setShowHostModal] = useState(false);
    const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);

    /* Story State */
    const [storyFeed, setStoryFeed] = useState<any[]>([]);
    const [activeStorySet, setActiveStorySet] = useState<any>(null);
    const [storyFiles, setStoryFiles] = useState<File[] | null>(null);
    const [storyPreviewUrls, setStoryPreviewUrls] = useState<string[] | null>(null);

    /* Visitors & Likes State */
    const [visitorsData, setVisitorsData] = useState<any>(null);
    const [whoLikedMe, setWhoLikedMe] = useState<any>(null);
    const [activeInsightModal, setActiveInsightModal] = useState<'visitors' | 'likes' | null>(null);

    // Fetch story feed and visitors on mount
    useEffect(() => {
        api.profile.getStoryFeed().then(data => setStoryFeed(data?.feed || [])).catch(() => {});
        
        // Lazy-load secondary data (who liked me, visitors) after 800ms
        const timer = setTimeout(() => {
            api.interactions.whoLikedMe().then(setWhoLikedMe).catch(() => {});
            api.interactions.getVisitors().then(setVisitorsData).catch(() => {});
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const hasVideo = files.some(f => f.type.startsWith('video'));
        if (hasVideo && files.length > 1) {
            toast.error("Please select only 1 video or multiple images.");
            return;
        }

        if (files.length > 10) {
            toast.error("You can select up to 10 images maximum.");
            return;
        }

        const validFiles: File[] = [];
        const previewUrls: string[] = [];
        
        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (Max 50MB)`);
                continue;
            }
            validFiles.push(file);
            previewUrls.push(URL.createObjectURL(file));
        }

        if (validFiles.length > 0) {
            setStoryFiles(validFiles);
            setStoryPreviewUrls(previewUrls);
        }
    };

    const handleViewStory = (user: any) => {
        if (!user.stories || user.stories.length === 0) return;
        setActiveStorySet({
            stories: user.stories,
            user: user
        });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setIsSearching(true);
        setAiFilters(null);
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
            const [results] = await Promise.all([
                api.matches.search(searchQuery),
                minDelay
            ]);
            setMatches(results.matches || []);
            setAiFilters(results.filters || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    // Client-side filter function
    const filterMatches = (matchList: any[]) => {
        if (!activeFilters) return matchList;

        return matchList.filter((match) => {
            const meta = match.metadata || {};

            const age = match.age ?? meta.basics?.age ?? meta.age ?? 0;
            const heightStr = match.height || meta.basics?.height || meta.height || '';
            const religionStr = (match.religion?.religion || meta.religion?.religion || meta.background?.religion || match.religion || '').toLowerCase();
            const casteStr = (match.religion?.caste || meta.religion?.caste || '').toLowerCase();
            const dietStr = (match.lifestyle?.diet || meta.lifestyle?.diet || match.diet || '').toLowerCase();
            const maritalStr = (match.maritalStatus || meta.maritalStatus || 'Single').toLowerCase();
            const incomeStr = (match.career?.income || meta.career?.income || '').toLowerCase();

            const locStr = [match.city, match.state, match.location_name, meta.location?.city, meta.location?.state].filter(Boolean).join(' ').toLowerCase();

            // 1. Age Filter
            if (activeFilters.ageRange) {
                if (age > 0 && (age < activeFilters.ageRange[0] || age > activeFilters.ageRange[1])) return false;
            }

            // 2. Height Filter
            if (heightStr) {
                const parseHeight = (h: string): number => {
                    const clean = h.replace(/[^0-9.]/g, ' ').trim().split(/\s+/).map(Number);
                    if (h.includes("'") || clean.length >= 2) return (clean[0] * 12) + (clean[1] || 0);
                    if (clean[0] > 8 && clean[0] < 250) return Math.round(clean[0] / 2.54);
                    if (clean[0] < 8) return clean[0] * 12;
                    return 0;
                };
                const inches = parseHeight(heightStr);
                if (inches > 0 && (inches < activeFilters.heightRange[0] || inches > activeFilters.heightRange[1])) return false;
            }

            // 3. Marital Status
            if (activeFilters.maritalStatus && activeFilters.maritalStatus.length > 0) {
                const normalizedFilters = activeFilters.maritalStatus.map(s => {
                    const lower = s.toLowerCase();
                    if (lower.includes('never married') || lower.includes('single')) return 'single';
                    return lower;
                });
                const normalizedStatus = maritalStr === 'never married' ? 'single' : maritalStr;

                const isMatch = normalizedFilters.some(f =>
                    normalizedStatus.includes(f) || (f === 'single' && normalizedStatus === 'single')
                );
                if (!isMatch) return false;
            }

            // 4. Religion
            if (activeFilters.religions.length > 0) {
                if (!activeFilters.religions.some(r => religionStr.includes(r.toLowerCase()))) return false;
            }

            // 5. Caste
            if (activeFilters.caste && !casteStr.includes(activeFilters.caste.toLowerCase())) return false;

            // 6. Lifestyle
            if (activeFilters.diet && !dietStr.includes(activeFilters.diet.toLowerCase())) return false;

            if (activeFilters.smoking) {
                const smoking = (match.lifestyle?.smoking || meta.lifestyle?.smoking || 'No').toLowerCase();
                if (smoking !== activeFilters.smoking.toLowerCase()) return false;
            }
            if (activeFilters.drinking) {
                const drinking = (match.lifestyle?.drinking || meta.lifestyle?.drinking || 'No').toLowerCase();
                if (drinking !== activeFilters.drinking.toLowerCase()) return false;
            }

            // 7. Income
            if (activeFilters.minIncome) {
                let val = 0;
                if (incomeStr.toLowerCase().includes('lpa')) {
                    const match = incomeStr.match(/([\d.]+)/);
                    val = match ? parseFloat(match[0]) : 0;
                } else {
                    const nums = incomeStr.replace(/,/g, '').match(/(\d+)/);
                    val = nums ? parseInt(nums[0]) : 0;
                    if (val > 100) val = val / 100000;
                }
                if (val < activeFilters.minIncome) return false;
            }

            // 8. Location
            if (activeFilters.location && !locStr.includes(activeFilters.location.toLowerCase())) return false;

            // 9. Mother Tongue
            if (activeFilters.motherTongue && activeFilters.motherTongue.length > 0) {
                const mt = (meta.motherTongue || match.motherTongue || '').toLowerCase();
                if (!activeFilters.motherTongue.some(lang => mt.includes(lang.toLowerCase()))) return false;
            }

            return true;
        });
    };

    const baseMatches = activeFilters ? filterMatches(matches) : matches;
    const displayMatches = showHighlightsOnly
        ? baseMatches.filter(m => (m.stories || []).some((s: any) => s.isHighlight))
        : baseMatches;

    const renderStoriesView = () => (
        <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

            <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-2 sm:pb-4 no-scrollbar px-2 sm:px-6 pt-1">
                {/* My Story Upload */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                    <label className="relative cursor-pointer">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-105 relative">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-indigo-500/30">
                                    +
                                </div>
                            </div>
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleStoryFileSelect} />
                    </label>
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Your Story</span>
                </div>

                {/* My Active Story */}
                {currentUser?.stories?.filter((s: any) => new Date(s.expiresAt) > new Date()).map((story: any, i: number) => (
                    <div key={'me' + i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group" onClick={() => {
                        setActiveStorySet({
                            stories: currentUser.stories.filter((s: any) => new Date(s.expiresAt) > new Date()),
                            user: { ...currentUser, id: currentUser.id || currentUser.userId, name: currentUser.full_name || currentUser.name }
                        });
                    }}>
                        <div className="relative">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                                <div className="w-full h-full rounded-full p-[2px] bg-background">
                                    <img 
                                        src={currentUser.photos?.[0] || currentUser.photoUrl || '/avatar-fallback.svg'} 
                                        className="w-full h-full rounded-full object-cover" 
                                        alt="You" 
                                        onError={(e) => { 
                                            const t = e.target as HTMLImageElement; 
                                            t.onerror = null; 
                                            t.src = '/avatar-fallback.svg'; 
                                        }} 
                                    />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                You
                            </div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-foreground mt-0.5">Your Story</span>
                    </div>
                ))}

                {/* Other Users' Stories */}
                {storyFeed.map((feedUser, idx) => {
                    const currentUserId = currentUser?.id || currentUser?.userId;
                    const isAllViewed = currentUserId && feedUser.stories && feedUser.stories.length > 0 && feedUser.stories.every((s: any) => s.views?.some((v: any) => v.userId === currentUserId));
                    return (
                        <div
                            key={feedUser.id}
                            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group animate-in fade-in slide-in-from-right-4"
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => handleViewStory(feedUser)}
                        >
                            <div className="relative">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] transition-all duration-300 group-hover:scale-105 ${
                                    isAllViewed 
                                        ? 'bg-slate-200 dark:bg-slate-800 shadow-sm border border-slate-300/30 dark:border-slate-700/30' 
                                        : 'bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-rose-500/40'
                                }`}>
                                    <div className="w-full h-full rounded-full p-[2px] bg-background">
                                        <img 
                                            src={feedUser.photoUrl || '/avatar-fallback.svg'} 
                                            className="w-full h-full rounded-full object-cover" 
                                            alt={feedUser.name} 
                                            onError={(e) => { 
                                                const t = e.target as HTMLImageElement; 
                                                t.onerror = null; 
                                                t.src = '/avatar-fallback.svg'; 
                                            }} 
                                        />
                                    </div>
                                </div>
                                {!isAllViewed && (
                                    <div className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-background shadow-lg"></div>
                                )}
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-foreground max-w-[64px] sm:max-w-[70px] truncate text-center">{feedUser.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (loading && matches.length === 0) {
        return (
            <div className="w-full space-y-8 pb-32">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-indigo-100/50 dark:border-indigo-900/50 space-y-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
                            <Sparkles className="text-white animate-spin-slow" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                Analyzing your preferences...
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">Connecting dots between query, personality, and database...</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_0ms]"></span>
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_200ms]"></span>
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_400ms]"></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* AI Matchmaker Search & Filters Bar */}
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 dark:border-gray-800/50 space-y-4 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-1">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Sparkles className="text-white" size={18} />
                            </div>
                            <span className="text-gradient">AI Matchmaker Search</span>
                        </h2>
                        <p className="text-xs text-gray-500 ml-9">Describe your ideal partner in plain English</p>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="e.g., 'Software Engineer who loves travel'..."
                                className="flex-1 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl px-4 py-3 text-xs md:text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder-gray-500"
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-5 py-3 rounded-2xl font-bold text-xs md:text-sm hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all flex items-center gap-1.5 shrink-0"
                            >
                                <Search size={16} />
                                <span>Search</span>
                            </button>
                        </div>
                        {/* Quick Prompts & Highlights Filter */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <button
                                onClick={() => setShowHighlightsOnly(!showHighlightsOnly)}
                                className={`px-3 py-1 rounded-full transition-all font-bold flex items-center gap-1 border ${
                                    showHighlightsOnly
                                        ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                                        : 'bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                                }`}
                            >
                                <span>⭐</span>
                                <span>{showHighlightsOnly ? 'Showing ⭐ Highlights' : '⭐ Story Highlights'}</span>
                            </button>

                            {['Loves Travel', 'Fitness & Yoga', 'Doctor / Healthcare', 'Music Lover'].map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => { setSearchQuery(prompt); handleSearch(); }}
                                    className="bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full transition-colors font-medium"
                                >
                                    + {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            {/* Compact Insights Row: Visitors & Likes Pills */}
            {((visitorsData && visitorsData.visitors?.length > 0) || (whoLikedMe && whoLikedMe.totalLikes > 0)) && (
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    {visitorsData && visitorsData.visitors?.length > 0 && (
                        <button
                            onClick={() => setActiveInsightModal('visitors')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 hover:scale-105 transition-all text-xs font-extrabold shadow-sm group"
                        >
                            <Eye size={15} className="text-blue-500 group-hover:animate-pulse" />
                            <span>Recent Visitors ({visitorsData.visitors.length})</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold ml-1">Full View →</span>
                        </button>
                    )}

                    {whoLikedMe && whoLikedMe.totalLikes > 0 && (
                        <button
                            onClick={() => setActiveInsightModal('likes')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200/60 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 hover:scale-105 transition-all text-xs font-extrabold shadow-sm group"
                        >
                            <Heart size={15} className="text-pink-500 fill-pink-500 group-hover:animate-bounce" />
                            <span>Who Liked You ({whoLikedMe.totalLikes})</span>
                            <span className="text-[10px] bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold ml-1">Full View →</span>
                        </button>
                    )}
                </div>
            )}

            {/* Full View Modal for Visitors / Likes */}
            {activeInsightModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                {activeInsightModal === 'visitors' ? (
                                    <>
                                        <Eye className="text-blue-500" size={20} />
                                        <span>Recent Profile Visitors ({visitorsData?.visitors?.length || 0})</span>
                                    </>
                                ) : (
                                    <>
                                        <Heart className="text-pink-500 fill-pink-500" size={20} />
                                        <span>Who Liked You ({whoLikedMe?.totalLikes || 0})</span>
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => setActiveInsightModal(null)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto no-scrollbar space-y-3 flex-1 pr-1">
                            {activeInsightModal === 'visitors' && (
                                visitorsData?.visitors?.map((visitor: any, idx: number) => (
                                    <div
                                        key={visitor.id || idx}
                                        onClick={() => {
                                            if (!visitor.isBlurred) {
                                                setActiveInsightModal(null);
                                                setSelectedProfile(visitor);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                            visitor.isBlurred
                                                ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-400 cursor-pointer shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 ${visitor.isBlurred ? 'blur-md' : ''}`}>
                                                <img
                                                    src={visitor.photoUrl || '/avatar-fallback.svg'}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{visitor.name}</h4>
                                                <p className="text-xs text-gray-500">{visitor.location || 'Member'}</p>
                                            </div>
                                        </div>
                                        {visitor.isBlurred ? (
                                            <button
                                                onClick={() => { setActiveInsightModal(null); setShowCoinStore(true); }}
                                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                                            >
                                                <Crown size={12} /> Unlock
                                            </button>
                                        ) : (
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">View Profile →</span>
                                        )}
                                    </div>
                                ))
                            )}

                            {activeInsightModal === 'likes' && (
                                whoLikedMe?.likes?.map((like: any, idx: number) => (
                                    <div
                                        key={like.id || idx}
                                        onClick={() => {
                                            if (!like.isBlurred) {
                                                setActiveInsightModal(null);
                                                setSelectedProfile(like);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                            like.isBlurred
                                                ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-rose-400 cursor-pointer shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 ${like.isBlurred ? 'blur-md' : ''}`}>
                                                <img
                                                    src={like.photoUrl || '/avatar-fallback.svg'}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{like.name}</h4>
                                                <p className="text-xs text-gray-500">Liked your profile</p>
                                            </div>
                                        </div>
                                        {like.isBlurred ? (
                                            <button
                                                onClick={() => { setActiveInsightModal(null); setShowCoinStore(true); }}
                                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                                            >
                                                <Crown size={12} /> Unlock
                                            </button>
                                        ) : (
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">View Profile →</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Feedback */}
            {aiFilters && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Here's what I understood:</h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                                Looking for
                                {aiFilters.profession && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded mx-1 shadow-sm">💼 {aiFilters.profession}</span>}
                                {aiFilters.location && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded mx-1 shadow-sm">📍 {aiFilters.location}</span>}
                                {aiFilters.values?.length > 0 && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded mx-1 shadow-sm">💛 {aiFilters.values[0]}</span>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground">
                        {searchQuery ? (aiFilters ? 'AI Recommended Matches' : 'Search Results') : 'Daily Recommendations'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Handpicked matches just for you ✨</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                        {displayMatches.length} matches
                    </span>
                </div>
            </div>

            {/* Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                {displayMatches.map((match, idx) => (
                    <div
                        key={match.id}
                        className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full card-premium"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <MatchCard
                            match={match}
                            onConnect={() => {
                                setMatches(prev => prev.map(m =>
                                    m.id === match.id ? { ...m, match_status: 'pending' } : m
                                ));
                                try { localStorage.removeItem('matches_cache_v2'); } catch (e) {}
                            }}
                            onViewProfile={() => setSelectedProfile(match)}
                            onShowKundli={(data: any) => setSelectedKundli({
                                data,
                                names: { me: "You", partner: match.name }
                            })}
                            onGift={() => setGiftData({ userId: match.id, userName: match.name })}
                            isConnectedProp={connections.some((c: any) => c.partner?.id === match.id)}
                            onChat={() => {
                                const conn = connections.find((c: any) => c.partner?.id === match.id);
                                if (conn) {
                                    openChat(conn);
                                } else {
                                    setActiveTab('connections');
                                }
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Load More Matches */}
            {hasMore && displayMatches.length > 0 && (
                <div className="flex justify-center mt-10 pb-20">
                    <button
                        onClick={() => fetchMatches(page + 1)}
                        disabled={loadingMore}
                        className="bg-white border-2 border-indigo-100 text-indigo-600 px-8 py-3 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                                Loading...
                            </>
                        ) : (
                            'Load More Matches'
                        )}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {displayMatches.length === 0 && (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Search className="text-gray-300" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {activeFilters ? 'No matches with these filters' : 'No Matches Found'}
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        {activeFilters
                            ? 'Try adjusting your filter criteria to see more profiles.'
                            : 'Try adjusting your search criteria or check back later for new recommendations.'}
                    </p>
                    {activeFilters && (
                        <button
                            onClick={() => setActiveFilters(null)}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Story Viewer and Creator Modal Integration */}
            {activeStorySet && (
                <StoryModal
                    initialIndex={0}
                    stories={activeStorySet.stories}
                    user={{
                        id: activeStorySet.user?.id || activeStorySet.user?.userId || 'me',
                        name: activeStorySet.user?.name || activeStorySet.user?.full_name || 'User',
                        photoUrl: activeStorySet.user?.photoUrl || activeStorySet.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeStorySet.user?.name || 'User')}`
                    }}
                    currentUser={currentUser}
                    onClose={() => {
                        setActiveStorySet(null);
                        api.profile.getMe().then(setCurrentUser).catch(() => {});
                        api.profile.getStoryFeed().then(data => setStoryFeed(data?.feed || [])).catch(() => {});
                    }}
                    onHighlightToggle={(storyId, isHighlight) => {
                        setCurrentUser((prev: any) => {
                            if (!prev) return prev;
                            const updated = (prev.stories || []).map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updated };
                        });
                        api.profile.getMe().then(setCurrentUser).catch(() => {});
                        fetchMatches(page).catch(() => {});
                    }}
                    onDelete={async (deletedId) => {
                        try {
                            await api.profile.deleteStory(deletedId);
                            if (currentUser && currentUser.stories) {
                                const remainingStories = currentUser.stories.filter((s: any) => String(s.id) !== String(deletedId));
                                setCurrentUser({ ...currentUser, stories: remainingStories });
                            }
                            setActiveStorySet((prev: any) => {
                                if (!prev) return null;
                                const remaining = prev.stories.filter((s: any) => String(s.id) !== String(deletedId));
                                if (remaining.length === 0) return null;
                                return { ...prev, stories: remaining };
                            });
                            api.profile.getMe().then(setCurrentUser);
                            api.profile.getStoryFeed().then(data => setStoryFeed(data?.feed || []));
                        } catch (e: any) {
                            console.error('Delete Story Error:', e);
                        }
                    }}
                    onStoryViewed={(storyId) => {
                        setActiveStorySet((prev: any) => {
                            if (!prev) return null;
                            const uid = currentUser?.id || currentUser?.userId;
                            const updatedStories = prev.stories.map((s: any) => {
                                if (s.id === storyId) {
                                    const views = s.views || [];
                                    if (uid && !views.some((v: any) => (v.userId || v.user_id) === uid)) {
                                        return { ...s, views: [...views, { userId: uid, name: currentUser?.full_name || currentUser?.name || 'You', photoUrl: currentUser?.photoUrl || '', viewedAt: new Date().toISOString() }] };
                                    }
                                }
                                return s;
                            });
                            return { ...prev, stories: updatedStories };
                        });
                    }}
                    onViewProfile={async (userId: string, userName?: string, userPhotoUrl?: string) => {
                        setActiveStorySet(null);
                        const existingMatch = matches.find((m: any) => m.id === userId);
                        if (existingMatch) {
                            setSelectedProfile(existingMatch);
                        } else {
                            setSelectedProfile({
                                id: userId,
                                name: userName || 'User',
                                photoUrl: userPhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'User')}`,
                                bio: 'Loading full details...'
                            });
                            try {
                                const data = await api.profile.getById(userId);
                                if (data) setSelectedProfile(data);
                            } catch (e) {
                                console.error('Failed to load viewer profile', e);
                            }
                        }
                    }}
                />
            )}

            {storyPreviewUrls && storyFiles && (
                <StoryCreator 
                    storyFiles={storyFiles}
                    storyPreviewUrls={storyPreviewUrls}
                    onClose={() => { setStoryPreviewUrls(null); setStoryFiles(null); }}
                    onSuccess={async () => {
                        setStoryFiles(null);
                        setStoryPreviewUrls(null);
                        const me = await api.profile.getMe();
                        setCurrentUser(me);
                    }}
                />
            )}
            {showHostModal && (
                <HostSpeedDateModal
                    onClose={() => setShowHostModal(false)}
                    onEventCreated={(evt) => {
                        if (evt?.status === 'upcoming' || evt?.scheduled_at) {
                            toast.success('📅 Live Speed Dating event scheduled successfully!');
                        } else {
                            toast.success('🎉 Your Live Speed Dating event is now LIVE!');
                        }
                    }}
                />
            )}
        </div>
    );
}
