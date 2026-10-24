'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sparkles, Zap, Eye, Crown, Lock, Heart, Search, EyeOff, X, SlidersHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { FilterState } from '@/components/FilterModal';
import { useSocket } from '@/context/SocketContext';

function formatLocationString(loc: any): string {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
        const parts = [loc.city, loc.district, loc.state].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
        if (loc.country) return loc.country;
    }
    return '';
}

import MatchCard from '@/components/MatchCard';
// Dynamically import heavy modals only when requested
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
    onOpenFilters?: () => void;
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
    setShowSpeedDatingLobby,
    onOpenFilters
}: MatchesTabProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [aiFilters, setAiFilters] = useState<any>(null);
    const [showHostModal, setShowHostModal] = useState(false);
    const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);

    /* Story State */
    const [activeStorySet, setActiveStorySet] = useState<any>(null);
    const [storyFiles, setStoryFiles] = useState<File[] | null>(null);
    const [storyPreviewUrls, setStoryPreviewUrls] = useState<string[] | null>(null);

    /* Visitors & Likes State */
    const { socket, onlineUsers = [] } = useSocket() as any;
    const [visitorsData, setVisitorsData] = useState<any>(null);
    const [whoLikedMe, setWhoLikedMe] = useState<any>(null);
    const [activeInsightModal, setActiveInsightModal] = useState<'visitors' | 'likes' | null>(null);

    const fetchVisitorsAndLikes = useCallback(() => {
        api.interactions.whoLikedMe().then(setWhoLikedMe).catch(() => {});
        api.interactions.getVisitors().then(setVisitorsData).catch(() => {});
    }, []);

    // Fetch visitors and likes on mount
    useEffect(() => {
        fetchVisitorsAndLikes();
    }, [fetchVisitorsAndLikes]);

    // Live Socket Updates for new Visitors & Likes (scoped strictly to prevent re-render flicker on chat events)
    useEffect(() => {
        if (!socket) return;

        const handleVisitorUpdate = () => {
            api.interactions.getVisitors().then(setVisitorsData).catch(() => {});
        };

        const handleLikeUpdate = () => {
            api.interactions.whoLikedMe().then(setWhoLikedMe).catch(() => {});
        };

        socket.on('visitor:new', handleVisitorUpdate);
        socket.on('like:new', handleLikeUpdate);

        return () => {
            socket.off('visitor:new', handleVisitorUpdate);
            socket.off('like:new', handleLikeUpdate);
        };
    }, [socket]);

    /* Live Online Members State */
    const [liveOnlineMembers, setLiveOnlineMembers] = useState<any[]>([]);

    const fetchOnlineMembers = useCallback(() => {
        api.matches.getOnlineNow()
            .then((data: any) => {
                if (Array.isArray(data?.onlineMembers)) {
                    setLiveOnlineMembers(data.onlineMembers);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchOnlineMembers();
    }, [fetchOnlineMembers]);

    // Live Socket Updates for online/offline events
    useEffect(() => {
        if (!socket) return;
        const handlePresenceUpdate = () => {
            fetchOnlineMembers();
        };
        socket.on('userOnline', handlePresenceUpdate);
        socket.on('userOffline', handlePresenceUpdate);
        socket.on('onlineUsers', handlePresenceUpdate);
        return () => {
            socket.off('userOnline', handlePresenceUpdate);
            socket.off('userOffline', handlePresenceUpdate);
            socket.off('onlineUsers', handlePresenceUpdate);
        };
    }, [socket, fetchOnlineMembers]);

    // Instagram-style Pre-fetch on scroll: triggers fetchMatches 600px before reaching bottom
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!hasMore || loadingMore || isSearching || searchQuery) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !loadingMore) {
                    fetchMatches(page + 1);
                }
            },
            { rootMargin: '600px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, page, fetchMatches, isSearching, searchQuery]);

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

    const handleSearch = async (overrideQuery?: string) => {
        const query = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
        if (!query) return;
        if (overrideQuery !== undefined) {
            setSearchQuery(overrideQuery);
        }
        setLoading(true);
        setIsSearching(true);
        setAiFilters(null);
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 800));
            const [results] = await Promise.all([
                api.matches.search(query),
                minDelay
            ]);
            setMatches(results.matches || []);
            setAiFilters(results.filters || null);
            if ((results.matches || []).length === 0) {
                toast.info("No matches found for this query. Try adjusting your search!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to search. Please try again.");
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const handleClearSearch = async () => {
        setSearchQuery('');
        setAiFilters(null);
        setLoading(true);
        try {
            await fetchMatches(1);
            toast.success("Reset to daily recommendations");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filter function
    const filterMatches = (matchList: any[]) => {
        if (!activeFilters || !Array.isArray(matchList)) return matchList || [];

        const safeStr = (val: any): string => {
            if (typeof val === 'string') return val;
            if (val && typeof val === 'object') return typeof val.name === 'string' ? val.name : (typeof val.value === 'string' ? val.value : '');
            return '';
        };

        return matchList.filter((match) => {
            if (!match) return false;
            const meta = match.metadata || {};

            const age = match.age ?? meta.basics?.age ?? meta.age ?? 0;
            const heightStr = safeStr(match.height || meta.basics?.height || meta.height);
            const religionStr = (safeStr(match.religion?.religion) || safeStr(meta.religion?.religion) || safeStr(meta.background?.religion) || safeStr(match.religion)).toLowerCase();
            const casteStr = (safeStr(match.religion?.caste) || safeStr(meta.religion?.caste)).toLowerCase();
            const dietStr = (safeStr(match.lifestyle?.diet) || safeStr(meta.lifestyle?.diet) || safeStr(match.diet)).toLowerCase();
            const maritalStr = (safeStr(match.maritalStatus) || safeStr(meta.maritalStatus) || 'single').toLowerCase();
            const incomeStr = String(match.career?.income || meta.career?.income || '').toLowerCase();

            const locStr = [match.city, match.state, match.location_name, meta.location?.city, meta.location?.state].filter(Boolean).join(' ').toLowerCase();

            // 1. Age Filter
            if (activeFilters.ageRange && Array.isArray(activeFilters.ageRange) && activeFilters.ageRange.length >= 2) {
                if (age > 0 && (age < activeFilters.ageRange[0] || age > activeFilters.ageRange[1])) return false;
            }

            // 2. Height Filter
            if (heightStr && activeFilters.heightRange && Array.isArray(activeFilters.heightRange) && activeFilters.heightRange.length >= 2) {
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
            if (activeFilters.maritalStatus && Array.isArray(activeFilters.maritalStatus) && activeFilters.maritalStatus.length > 0) {
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
            if (activeFilters.religions && Array.isArray(activeFilters.religions) && activeFilters.religions.length > 0) {
                if (!activeFilters.religions.some(r => religionStr.includes(r.toLowerCase()))) return false;
            }

            // 5. Caste
            if (activeFilters.caste && typeof activeFilters.caste === 'string' && !casteStr.includes(activeFilters.caste.toLowerCase())) return false;

            // 6. Lifestyle
            if (activeFilters.diet && typeof activeFilters.diet === 'string' && !dietStr.includes(activeFilters.diet.toLowerCase())) return false;

            if (activeFilters.smoking && typeof activeFilters.smoking === 'string') {
                const smoking = (match.lifestyle?.smoking || meta.lifestyle?.smoking || 'No').toLowerCase();
                if (smoking !== activeFilters.smoking.toLowerCase()) return false;
            }
            if (activeFilters.drinking && typeof activeFilters.drinking === 'string') {
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
            if (activeFilters.location && typeof activeFilters.location === 'string' && !locStr.includes(activeFilters.location.toLowerCase())) return false;

            // 9. Mother Tongue
            if (activeFilters.motherTongue && Array.isArray(activeFilters.motherTongue) && activeFilters.motherTongue.length > 0) {
                const mt = (meta.motherTongue || match.motherTongue || '').toLowerCase();
                if (!activeFilters.motherTongue.some(lang => mt.includes(lang.toLowerCase()))) return false;
            }

            return true;
        });
    };

    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [showWorldwideOnly, setShowWorldwideOnly] = useState(false);

    const onlineUsersKey = Array.isArray(onlineUsers) ? onlineUsers.join(',') : '';
    const onlineMatchesList = useMemo(() => {
        const memberMap = new Map<string, any>();
        const onlineSet = new Set(Array.isArray(onlineUsers) ? onlineUsers : []);

        // 1. Add from dedicated live online members endpoint
        (Array.isArray(liveOnlineMembers) ? liveOnlineMembers : []).forEach(m => {
            if (m && m.id && (onlineSet.size === 0 || onlineSet.has(m.id))) {
                memberMap.set(m.id, { ...m, isOnline: true });
            }
        });
        // 2. Add from matches feed
        (Array.isArray(matches) ? matches : []).forEach(m => {
            if (m && m.id && (onlineSet.size > 0 ? onlineSet.has(m.id) : m.isOnline)) {
                memberMap.set(m.id, { ...m, isOnline: true });
            }
        });
        return Array.from(memberMap.values());
    }, [matches, liveOnlineMembers, onlineUsersKey]);

    const connectedPartnerIds = useMemo(() => {
        return new Set((Array.isArray(connections) ? connections : []).map(c => c?.partner?.id || c?.id).filter(Boolean));
    }, [connections]);

    const connectionsMap = useMemo(() => {
        const map = new Map<string, any>();
        (Array.isArray(connections) ? connections : []).forEach(c => {
            const pId = c?.partner?.id || c?.id;
            if (pId) map.set(pId, c);
        });
        return map;
    }, [connections]);

    const displayMatches = useMemo(() => {
        const baseMatches = activeFilters ? filterMatches(matches) : (Array.isArray(matches) ? matches : []);
        let filtered = showHighlightsOnly
            ? baseMatches.filter(m => m && (m.stories || []).some((s: any) => s.isHighlight))
            : baseMatches;

        if (showOnlineOnly) {
            const onlineSet = new Set(Array.isArray(onlineUsers) ? onlineUsers : []);
            filtered = filtered.filter(m => m && (onlineSet.size > 0 ? onlineSet.has(m.id) : Boolean(m.isOnline)));
        }

        if (showWorldwideOnly) {
            filtered = filtered.filter(m => Boolean(
                m && (
                    m.isWorldwide || 
                    (m.location && typeof m.location === 'string' && !m.location.toLowerCase().includes('india')) ||
                    (m.location_data?.country && typeof m.location_data.country === 'string' && !m.location_data.country.toLowerCase().includes('india'))
                )
            ));
        }

        // Stable Photo-First Prioritization: surface profiles with real photos first, deprioritize profiles without photos
        return filtered.slice().sort((a, b) => {
            const hasPhotoA = Boolean(
                a?.hasValidPhoto ?? (
                    (a?.photoUrl && !a.photoUrl.includes('dicebear') && !a.photoUrl.startsWith('data:')) ||
                    (a?.avatar_url && !a.avatar_url.includes('dicebear') && !a.avatar_url.startsWith('data:'))
                )
            );
            const hasPhotoB = Boolean(
                b?.hasValidPhoto ?? (
                    (b?.photoUrl && !b.photoUrl.includes('dicebear') && !b.photoUrl.startsWith('data:')) ||
                    (b?.avatar_url && !b.avatar_url.includes('dicebear') && !b.avatar_url.startsWith('data:'))
                )
            );
            if (hasPhotoA && !hasPhotoB) return -1;
            if (!hasPhotoA && hasPhotoB) return 1;
            return 0; // Maintain relative backend order (online status, AI score)
        });
    }, [matches, activeFilters, showHighlightsOnly, showOnlineOnly, showWorldwideOnly, onlineUsers]);

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
            {/* Dedicated Online Now Horizontal Bar (directly below Instants bar) */}
            {onlineMatchesList.length > 0 && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md shadow-xl">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center space-x-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <h3 className="font-black text-xs sm:text-sm tracking-wide uppercase text-emerald-800 dark:text-emerald-400">
                                Active Members Online Now ({onlineMatchesList.length})
                            </h3>
                        </div>
                        <button
                            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline"
                        >
                            {showOnlineOnly ? 'Show All Matches' : 'Filter Feed to Online Only →'}
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar py-1 px-1">
                        {onlineMatchesList.map((member: any, mIdx: number) => {
                            if (!member) return null;
                            const photo = member.photoUrl || member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id || mIdx}`;

                            return (
                                <div
                                    key={member.id ? `online-${member.id}-${mIdx}` : `online-${mIdx}`}
                                    className="flex flex-col items-center space-y-1.5 flex-shrink-0 group cursor-pointer"
                                    onClick={() => setSelectedProfile(member)}
                                >
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-500 to-green-400 shadow-lg group-hover:scale-105 transition-transform">
                                        <img
                                            src={photo}
                                            alt={member.name || 'Member'}
                                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 bg-white dark:bg-slate-800"
                                        />
                                        {/* Glowing Green Online Badge */}
                                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        </span>
                                    </div>

                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[70px] truncate text-center">
                                        {(member.name || 'Member').split(' ')[0]}
                                    </span>

                                    {/* Instant Message Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const conn = (Array.isArray(connections) ? connections : []).find((c: any) => c?.partner?.id === member.id);
                                            if (conn) {
                                                openChat(conn);
                                            } else {
                                                openChat({
                                                    interactionId: member.id,
                                                    partner: {
                                                        id: member.id,
                                                        name: member.name || 'Member',
                                                        photoUrl: photo,
                                                        role: 'Online'
                                                    }
                                                });
                                            }
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-[10px] shadow-md transition-all active:scale-95 flex items-center space-x-1"
                                    >
                                        <span>💬 Instant Msg</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* AI Matchmaker Search & Filters Bar */}
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-xl border border-white/50 dark:border-gray-800/50 space-y-3.5 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Sparkles className="text-white" size={16} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                <span className="text-gradient">AI Matchmaker & Smart Filters</span>
                            </h2>
                        </div>
                        <p className="text-xs text-gray-500 ml-9 mt-0.5">Search by Name, Profile ID (e.g. LP-8291A), or describe your ideal partner</p>
                    </div>

                    {/* Integrated Visitors & Likes Insights Pills */}
                    <div className="flex flex-wrap items-center gap-2 ml-9 sm:ml-0">
                        {visitorsData && visitorsData.visitors?.length > 0 && (
                            <button
                                onClick={() => setActiveInsightModal('visitors')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 hover:scale-105 transition-all text-[11px] font-extrabold shadow-sm group"
                            >
                                <Eye size={13} className="text-blue-500 group-hover:animate-pulse" />
                                <span>Visitors ({visitorsData.visitors.length})</span>
                            </button>
                        )}

                        {whoLikedMe && whoLikedMe.totalLikes > 0 && (
                            <button
                                onClick={() => setActiveInsightModal('likes')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200/60 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 hover:scale-105 transition-all text-[11px] font-extrabold shadow-sm group"
                            >
                                <Heart size={13} className="text-pink-500 fill-pink-500 group-hover:animate-bounce" />
                                <span>Liked You ({whoLikedMe.totalLikes})</span>
                            </button>
                        )}

                        {(searchQuery || aiFilters) && (
                            <button
                                onClick={handleClearSearch}
                                className="text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1"
                            >
                                <X size={13} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="flex gap-2 relative">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by Name, Profile ID (e.g. LP-8291A), or AI ('Doctor in Mumbai')..."
                                className="w-full bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-4 pr-10 py-3 text-xs md:text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full transition-colors"
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleSearch()}
                            disabled={loading}
                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs md:text-sm hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-70 cursor-pointer"
                        >
                            <Search size={16} />
                            <span className="hidden xs:inline">{loading ? 'Searching...' : 'Search'}</span>
                        </button>
                        {onOpenFilters && (
                            <button
                                onClick={onOpenFilters}
                                className={`px-3.5 sm:px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer relative ${
                                    activeFilters
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-sm'
                                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700'
                                }`}
                                title="Open Advanced Partner Filters"
                            >
                                <SlidersHorizontal size={16} className={activeFilters ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilters && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Active Filters Summary Bar */}
                    {activeFilters && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-indigo-800 dark:text-indigo-300 mr-1">Active Filters:</span>
                                {Array.isArray(activeFilters.ageRange) && activeFilters.ageRange.length >= 2 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-indigo-100 dark:border-indigo-800">
                                        Age {activeFilters.ageRange[0]}–{activeFilters.ageRange[1]}
                                    </span>
                                )}
                                {activeFilters.location && (
                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-indigo-100 dark:border-indigo-800">
                                        📍 {activeFilters.location}
                                    </span>
                                )}
                                {Array.isArray(activeFilters.religions) && activeFilters.religions.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-indigo-100 dark:border-indigo-800">
                                        🕉️ {activeFilters.religions.join(', ')}
                                    </span>
                                )}
                                {Array.isArray(activeFilters.maritalStatus) && activeFilters.maritalStatus.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-indigo-100 dark:border-indigo-800">
                                        💍 {activeFilters.maritalStatus.join(', ')}
                                    </span>
                                )}
                                {activeFilters.diet && (
                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-indigo-100 dark:border-indigo-800">
                                        🥗 {activeFilters.diet}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {onOpenFilters && (
                                    <button
                                        onClick={onOpenFilters}
                                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveFilters(null)}
                                    className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                                >
                                    <X size={12} /> Clear All
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Prompts & Gender Chips & Online Filter */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <button
                            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                            className={`px-3 py-1 rounded-full transition-all font-bold flex items-center gap-1 border ${
                                showOnlineOnly
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                                    : 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>{showOnlineOnly ? 'Showing 🟢 Online Only' : '🟢 Online Members'}</span>
                        </button>

                        <button
                            onClick={() => setShowHighlightsOnly(!showHighlightsOnly)}
                            className={`px-3 py-1 rounded-full transition-all font-bold flex items-center gap-1 border cursor-pointer ${
                                showHighlightsOnly
                                    ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                                    : 'bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                            }`}
                        >
                            <span>⭐</span>
                            <span>{showHighlightsOnly ? 'Showing ⭐ Highlights' : '⭐ Story Highlights'}</span>
                        </button>

                        <button
                            onClick={() => setShowWorldwideOnly(!showWorldwideOnly)}
                            className={`px-3 py-1 rounded-full transition-all font-bold flex items-center gap-1 border cursor-pointer ${
                                showWorldwideOnly
                                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20 scale-105'
                                    : 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100'
                            }`}
                        >
                            <span>🌍</span>
                            <span>{showWorldwideOnly ? 'Showing 🌍 Worldwide Only' : '🌍 Worldwide / NRI'}</span>
                        </button>

                        {/* Quick Action Chips */}
                        <button
                            onClick={() => setSearchQuery("LP-")}
                            className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full transition-all font-semibold active:scale-95"
                        >
                            🆔 Search by ID
                        </button>

                        {['Doctor / Healthcare', 'Software Engineer', 'Loves Travel', 'Fitness & Yoga'].map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => handleSearch(prompt)}
                                className="bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full transition-colors font-medium active:scale-95"
                            >
                                + {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

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
                                            setActiveInsightModal(null);
                                            const photos = Array.isArray(visitor.photos) && visitor.photos.length > 0
                                                ? visitor.photos
                                                : (visitor.photoUrl ? [visitor.photoUrl] : []);
                                            setSelectedProfile({
                                                ...visitor,
                                                photos,
                                                isVerified: true
                                            });
                                            if (visitor.id) {
                                                api.profile.getById(visitor.id).then((full: any) => {
                                                    if (full) {
                                                        setSelectedProfile((prev: any) => ({
                                                            ...prev,
                                                            ...full,
                                                            photos: Array.isArray(full.photos) && full.photos.length > 0 ? full.photos : photos
                                                        }));
                                                    }
                                                }).catch(() => {});
                                            }
                                        }}
                                        className="flex items-center justify-between p-3 rounded-2xl border transition-all bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-400 cursor-pointer shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                                                <img
                                                    src={visitor.photoUrl || '/avatar-fallback.svg'}
                                                    className="w-full h-full object-cover"
                                                    alt={visitor.name || ''}
                                                    onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{visitor.name}</h4>
                                                <p className="text-xs text-gray-500">{formatLocationString(visitor.location) || 'Member'}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">View Profile →</span>
                                    </div>
                                ))
                            )}

                            {activeInsightModal === 'likes' && (
                                whoLikedMe?.likes?.map((like: any, idx: number) => (
                                    <div
                                        key={like.id || idx}
                                        onClick={() => {
                                            setActiveInsightModal(null);
                                            const photos = Array.isArray(like.photos) && like.photos.length > 0
                                                ? like.photos
                                                : (like.photoUrl ? [like.photoUrl] : []);
                                            setSelectedProfile({
                                                ...like,
                                                photos,
                                                isVerified: true
                                            });
                                            if (like.id) {
                                                api.profile.getById(like.id).then((full: any) => {
                                                    if (full) {
                                                        setSelectedProfile((prev: any) => ({
                                                            ...prev,
                                                            ...full,
                                                            photos: Array.isArray(full.photos) && full.photos.length > 0 ? full.photos : photos
                                                        }));
                                                    }
                                                }).catch(() => {});
                                            }
                                        }}
                                        className="flex items-center justify-between p-3 rounded-2xl border transition-all bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-rose-400 cursor-pointer shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                                                <img
                                                    src={like.photoUrl || '/avatar-fallback.svg'}
                                                    className="w-full h-full object-cover"
                                                    alt={like.name || ''}
                                                    onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{like.name}</h4>
                                                <p className="text-xs text-gray-500">Liked your profile</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">View Profile →</span>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">AI Search Active:</h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                                    {aiFilters.target_gender && (
                                        <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-indigo-100 dark:border-indigo-800">
                                            {aiFilters.target_gender === 'Female' ? '👰 Brides / Women' : '🤵 Grooms / Men'}
                                        </span>
                                    )}
                                    {aiFilters.exact_profile_id && (
                                        <span className="font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded shadow-sm border border-purple-200 dark:border-purple-700">
                                            🆔 ID: {aiFilters.exact_profile_id}
                                        </span>
                                    )}
                                    {aiFilters.candidate_name && (
                                        <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-indigo-100 dark:border-indigo-800">
                                            👤 Name: {aiFilters.candidate_name}
                                        </span>
                                    )}
                                    {aiFilters.profession && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">💼 {typeof aiFilters.profession === 'string' ? aiFilters.profession : String(aiFilters.profession)}</span>}
                                    {aiFilters.location && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">📍 {formatLocationString(aiFilters.location)}</span>}
                                    {aiFilters.values?.length > 0 && <span className="font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">💛 {aiFilters.values[0]}</span>}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleClearSearch}
                            className="self-start sm:self-center shrink-0 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <X size={13} />
                            <span>Reset Search</span>
                        </button>
                    </div>
                </div>
            )}


            {/* Feed Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground">
                        {searchQuery ? (aiFilters ? 'AI Recommended Matches' : 'Search Results') : 'Daily Recommendations'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {searchQuery ? `Showing matches for "${searchQuery}"` : 'Handpicked matches just for you ✨'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(searchQuery || aiFilters) && (
                        <button
                            onClick={handleClearSearch}
                            className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/40 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <X size={12} />
                            <span>Clear Filter</span>
                        </button>
                    )}
                    <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                        {displayMatches.length} matches
                    </span>
                </div>
            </div>

            {/* Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                {displayMatches.map((match, idx) => {
                    if (!match) return null;
                    return (
                        <div
                            key={match.id ? `${match.id}-${idx}` : `match-${idx}`}
                            id={match.id ? `match-card-${match.id}` : `match-card-${idx}`}
                            data-match-id={match.id}
                            className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full card-premium transition-all duration-300"
                            style={{ animationDelay: `${Math.min(idx, 15) * 50}ms` }}
                        >
                            <MatchCard
                                match={match}
                                onConnect={() => {
                                    setMatches(prev => (Array.isArray(prev) ? prev.map(m =>
                                        m.id === match.id ? { ...m, match_status: 'pending' } : m
                                    ) : []));
                                    try { localStorage.removeItem('matches_cache_v2'); } catch (e) {}
                                }}
                                onViewProfile={() => setSelectedProfile(match)}
                                onShowKundli={(data: any) => setSelectedKundli({
                                    data,
                                    names: { me: "You", partner: match.name || "Partner" }
                                })}
                                onGift={() => setGiftData({ userId: match.id, userName: match.name || "Member" })}
                                isConnectedProp={connectedPartnerIds.has(match.id)}
                                onChat={() => {
                                    const conn = connectionsMap.get(match.id);
                                    if (conn) {
                                        openChat(conn);
                                    } else {
                                        setActiveTab('connections');
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Instagram-style Load Balancing & Infinite Stream Sentinel */}
            {hasMore && displayMatches.length > 0 && (
                <div ref={sentinelRef} className="flex flex-col items-center justify-center mt-8 pb-20">
                    {loadingMore ? (
                        <div className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md animate-in fade-in">
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Discovering more matches...</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => fetchMatches(page + 1)}
                            className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 px-6 py-2.5 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <span>Load More Matches</span>
                        </button>
                    )}
                </div>
            )}

            {/* Enhanced Empty State & Smart Fallbacks */}
            {displayMatches.length === 0 && (
                <div className="text-center py-16 px-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-full flex items-center justify-center mx-auto shadow-inner border border-indigo-100/50">
                        <Search className="text-indigo-500" size={36} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {activeFilters ? 'No matches match all your active filters' : 'No Recommendations Found'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                            {activeFilters
                                ? 'Your criteria might be slightly too strict. Try expanding your age, religion, or location preferences.'
                                : 'Try broadening your preferences or check back soon for new profiles!'}
                        </p>
                    </div>

                    {activeFilters && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                            <button
                                onClick={() => setActiveFilters(null)}
                                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                                ✨ Clear All Filters & Show All Matches
                            </button>
                        </div>
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
                        } catch (e: any) {
                            console.error('Delete Story Error:', e);
                        }
                    }}
                    onStoryViewed={(storyId) => {
                        setActiveStorySet((prev: any) => {
                            if (!prev || !Array.isArray(prev.stories)) return null;
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
