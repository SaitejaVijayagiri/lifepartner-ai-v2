'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import VideoCallModal from '@/components/VideoCallModal';
import CallHistoryModal from '@/components/CallHistoryModal';
import { useSocket } from '@/context/SocketContext';
import { Bell, Search, Sparkles, Filter, Briefcase, MapPin, Ruler, Heart, Video, Users, MessageCircle, User, Check, X, Coins, LogOut, Clock, Zap, Rocket, Crown, Lock, Eye } from 'lucide-react';

/* Components */
import MatchCard from '@/components/MatchCard';

import StoryModal from '@/components/StoryModal';
import { NotificationBell } from '@/components/NotificationBell';
import ProfileEditor from '@/components/ProfileEditor';
import ProfileModal from '@/components/ProfileModal';
import ReelFeed from '@/components/ReelFeed';
import ProfileView from '@/components/ProfileView';
import ChatWindow from '@/components/ChatWindow';
import CoinStoreModal from '@/components/CoinStoreModal';
import { useToast } from '@/components/ui/Toast';
import FilterModal, { FilterState } from '@/components/FilterModal';

/* Mock Data for Stories */
const STORIES = [
    { id: '1', user: 'Ananya', img: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', user: 'Rahul', img: 'https://i.pravatar.cc/150?u=2' },
    { id: '3', user: 'Vikram', img: 'https://i.pravatar.cc/150?u=3' },
    { id: '4', user: 'Sneha', img: 'https://i.pravatar.cc/150?u=4', hasStory: true },
    { id: '5', user: 'Priya', img: 'https://i.pravatar.cc/150?u=5', hasStory: true },
];

/* Mock Data for Events */


export default function Dashboard() {
    const router = useRouter();
    const toast = useToast();
    const [matches, setMatches] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('matches');
    const [requestsCount, setRequestsCount] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [showCallHistory, setShowCallHistory] = useState(false);
    const [whoLikedMe, setWhoLikedMe] = useState<any>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    /* Story State */
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);

    /* Chat State */
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const { socket } = useSocket() as any;

    useEffect(() => {
        const checkAuth = async () => {
            // Basic Auth Check
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // Check if profile is complete (has photos or key data)
            try {
                const profile = await api.profile.getMe();
                // If profile is incomplete, redirect to onboarding
                if (!profile || !profile.photos || profile.photos.length === 0 || !profile.name) {
                    console.log("Profile incomplete, redirecting to onboarding...");
                    router.push('/onboarding');
                    return;
                }
                setCurrentUser(profile);
            } catch (err: any) {
                // If profile fetch fails (404 or error), redirect to onboarding
                console.error('Profile check failed', err);
                if (err?.message?.includes('401') || err?.message?.includes('session')) {
                    localStorage.removeItem('token');
                    router.push('/login');
                } else {
                    router.push('/onboarding');
                }
                return;
            }

            fetchMatches();
            refreshCounts();
        };
        checkAuth();
    }, [router]);

    // Check for Payment Return
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order_id');
        if (orderId) {
            // Verify Payment
            api.payments.verifyPayment({ orderId })
                .then((res: any) => {
                    if (res.success) {
                        toast.success("Payment Successful! Balance Updated.");
                        // Clear URL
                        window.history.replaceState({}, '', '/dashboard');
                        // Refresh User
                        api.profile.getMe().then(setCurrentUser);
                    }
                })
                .catch((err: any) => {
                    console.error(err);
                    // Don't alert error on every load, maybe it was already verified
                });
        }
    }, []);

    const navItems = [
        { id: 'matches', label: 'Matches', icon: Heart },
        { id: 'reels', label: 'Vibe', icon: Video },
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount },
        { id: 'connections', label: 'Chat', icon: MessageCircle },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    // Fetch data based on active tab
    useEffect(() => {
        if (activeTab === 'requests') fetchRequests();
        if (activeTab === 'connections') fetchConnections();
    }, [activeTab]);

    const refreshCounts = async () => {
        try {
            const reqs = await api.interactions.getRequests();
            setRequestsCount(reqs.length);
        } catch (e) { console.error(e); }
        // Fetch who liked me
        try {
            const likesData = await api.interactions.whoLikedMe();
            setWhoLikedMe(likesData);
        } catch (e) { console.error('Who liked me error:', e); }
    };

    const fetchMatches = async () => {
        try {
            const data = await api.matches.getAll();
            setMatches(data.matches || []);
        } catch (err) {
            console.error('Failed to load matches', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await api.interactions.getRequests();
            setRequests(data);
            setRequestsCount(data.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchConnections = async () => {
        try {
            setLoading(true);
            const data = await api.interactions.getConnections();
            setConnections(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filter function
    const filterMatches = (matchList: any[]) => {
        if (!activeFilters) return matchList;

        return matchList.filter((match) => {
            const meta = match.metadata || {};
            const age = match.age || meta.basics?.age || 0;
            const heightStr = match.height || meta.basics?.height || '';

            // Parse height from string like "5'8\"" to inches
            const parseHeight = (h: string): number => {
                if (!h) return 0;
                const match = h.match(/(\d+)'(\d+)/);
                if (match) return parseInt(match[1]) * 12 + parseInt(match[2]);
                return 0;
            };
            const heightInches = parseHeight(heightStr);

            // Age filter
            if (age && (age < activeFilters.ageRange[0] || age > activeFilters.ageRange[1])) {
                return false;
            }

            // Height filter
            if (heightInches && (heightInches < activeFilters.heightRange[0] || heightInches > activeFilters.heightRange[1])) {
                return false;
            }

            // Religion filter
            if (activeFilters.religions.length > 0) {
                const religion = meta.background?.religion || match.religion || '';
                if (!activeFilters.religions.some(r => religion.toLowerCase().includes(r.toLowerCase()))) {
                    return false;
                }
            }

            // Diet filter
            if (activeFilters.diet) {
                const diet = meta.lifestyle?.diet || match.diet || '';
                if (!diet.toLowerCase().includes(activeFilters.diet.toLowerCase())) {
                    return false;
                }
            }

            // Smoking filter
            if (activeFilters.smoking) {
                const smoking = meta.lifestyle?.smoking || '';
                if (activeFilters.smoking === 'No' && smoking.toLowerCase() !== 'no') {
                    return false;
                }
            }

            // Drinking filter
            if (activeFilters.drinking) {
                const drinking = meta.lifestyle?.drinking || '';
                if (activeFilters.drinking === 'No' && drinking.toLowerCase() !== 'no') {
                    return false;
                }
            }

            return true;
        });
    };

    // Get filtered matches
    const displayMatches = activeFilters ? filterMatches(matches) : matches;

    // Incoming Call Listener
    useEffect(() => {
        if (!socket) return;
        socket.on("callUser", (data: any) => {
            console.log("Incoming call:", data);
            api.interactions.getConnections().then(conns => {
                const caller = conns.find((c: any) => c.partner.id === data.from);
                if (caller) {
                    setActiveCall({
                        partner: caller.partner,
                        connectionId: caller.interactionId,
                        incomingCall: { signal: data.signalData, from: data.from, type: data.type },
                        mode: data.type
                    });
                }
            });
        });

        return () => {
            socket.off("callUser");
        };
    }, [socket]);

    const handleLogout = () => {
        if (confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            router.push('/login');
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await api.interactions.acceptRequest(requestId);
            // Refresh
            fetchRequests();
            refreshCounts();
        } catch (e) {
            toast.error("Failed to accept");
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        try {
            await api.interactions.declineRequest(requestId);
            fetchRequests();
            refreshCounts();
        } catch (e) {
            toast.error("Failed to decline");
        }
    };

    const renderHeader = () => (
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-18 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Premium Logo */}
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('matches')}>
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                                <Sparkles size={20} fill="white" />
                            </div>
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity"></div>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-heading font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                LifePartner
                            </span>
                            <span className="text-xl font-heading font-bold text-gray-800"> AI</span>
                        </div>
                    </div>

                    <nav className="hidden sm:flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all
                                    ${activeTab === item.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}
                                `}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {item.badge ? (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{item.badge}</span>
                                ) : null}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">

                    {/* Coin Balance */}
                    {currentUser && (
                        <button
                            onClick={() => setShowCoinStore(true)}
                            className="flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-yellow-200"
                        >
                            <Coins size={14} className="fill-yellow-500 text-yellow-600" />
                            <span>{currentUser.coins || 0}</span>
                        </button>
                    )}

                    {/* Premium Badge */}
                    {currentUser?.is_premium && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-yellow-300">
                            <span>👑</span>
                            <span className="hidden sm:inline">PREMIUM</span>
                        </div>
                    )}


                    {/* Boost Button */}
                    <button
                        onClick={async () => {
                            if (!currentUser || currentUser.coins < 100) {
                                setShowCoinStore(true);
                                toast.error("Insufficient coins to boost! (Cost: 100)");
                                return;
                            }
                            if (confirm("Boost your profile for 100 coins? You will be seen by 10x more people! 🚀")) {
                                try {
                                    await api.wallet.boostProfile();
                                    toast.success("Profile Boosted! ⚡ You are now top visibility.");
                                    // Refresh user to update coins
                                    api.profile.getMe().then(setCurrentUser);
                                } catch (e) {
                                    toast.error("Boost failed.");
                                }
                            }
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform"
                    >
                        <Zap size={14} className="fill-yellow-300 text-yellow-300" />
                        <span className="hidden sm:inline">Boost</span>
                    </button>

                    {(activeTab === 'matches' || activeTab === 'reels') && (
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`relative w-10 h-10 rounded-full hover:bg-secondary/20 flex items-center justify-center transition-colors ${activeFilters ? 'text-indigo-600 bg-indigo-50' : ''}`}
                        >
                            <Filter size={20} className={activeFilters ? 'text-indigo-600' : 'text-foreground'} />
                            {activeFilters && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    )}

                    {activeTab === 'connections' && (
                        <button
                            onClick={() => setShowCallHistory(true)}
                            className="w-10 h-10 rounded-full hover:bg-secondary/20 flex items-center justify-center transition-colors text-muted-foreground"
                            title="Call History"
                        >
                            <Clock size={20} />
                        </button>
                    )}
                    <NotificationBell />

                    <button
                        onClick={handleLogout}
                        className="hidden sm:flex w-10 h-10 rounded-full hover:bg-red-50 hover:text-red-500 items-center justify-center transition-colors text-muted-foreground"
                        title="Log Out"
                    >
                        <LogOut size={20} />
                    </button>

                    {currentUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[2px] cursor-pointer" onClick={() => setActiveTab('profile')}>
                            <img src={currentUser.photos?.[0] || currentUser.photoUrl || "https://i.pravatar.cc/150"} className="rounded-full w-full h-full border-2 border-background object-cover" alt="Profile" />
                        </div>
                    )}
                </div>

            </div >
        </header >
    );

    const [activeStorySet, setActiveStorySet] = useState<any>(null);

    const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File too large (Max 50MB)");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('media', file);
            await api.profile.uploadStory(formData);
            toast.success("Story uploaded successfully!");
            // Refresh Me
            const me = await api.profile.getMe();
            setCurrentUser(me);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("Premium")) {
                toast.error("Stories are a Premium feature! Please upgrade.");
                setShowCoinStore(true);
            } else {
                toast.error("Failed to upload story");
            }
        }
    };

    const handleViewStory = (user: any) => {
        if (!user.stories || user.stories.length === 0) return;
        setActiveStorySet({
            stories: user.stories,
            user: user
        });
    };


    const renderStories = () => (
        <div className="relative">
            {/* Stories Container with gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

            <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar px-6 pt-2">
                {/* My Story Upload - Premium Design */}
                <div className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group">
                    <label className="relative cursor-pointer">
                        <div className="w-20 h-20 rounded-full p-[3px] border-2 border-dashed border-gray-300 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-105 relative">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">
                                    +
                                </div>
                            </div>
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />
                    </label>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">Your Story</span>
                </div>

                {/* My Active Story (if any) */}
                {currentUser?.stories?.map((story: any, i: number) => (
                    <div key={'me' + i} className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group" onClick={() => setCurrentStoryIndex(i)}>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                                <div className="w-full h-full rounded-full p-[2px] bg-background">
                                    <img src={currentUser.photos?.[0] || currentUser.photoUrl} className="w-full h-full rounded-full object-cover" alt="You" />
                                </div>
                            </div>
                            {/* Live indicator */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                                You
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-foreground mt-1">Your Story</span>
                    </div>
                ))}

                {/* Matches Stories */}
                {matches.filter(m => m.stories?.length > 0).map((match, idx) => (
                    <div
                        key={match.id}
                        className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => handleViewStory(match)}
                    >
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-rose-500/40 transition-all duration-300 group-hover:scale-105">
                                <div className="w-full h-full rounded-full p-[2px] bg-background">
                                    <img src={match.photoUrl} className="w-full h-full rounded-full object-cover" alt={match.name} />
                                </div>
                            </div>
                            {/* Unread indicator */}
                            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-background shadow-lg"></div>
                        </div>
                        <span className="text-xs font-semibold text-foreground max-w-[70px] truncate text-center">{match.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );



    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const results = await api.matches.search(searchQuery);
            setMatches(results.matches || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderDiscoveryFeed = () => {
        if (loading) {
            return (
                <div className="w-full space-y-8 pb-32">
                    {/* Skeleton for AI Search */}
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-indigo-100/50 space-y-4">
                        <div className="h-6 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                        <div className="flex gap-3">
                            <div className="flex-1 h-12 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl animate-pulse"></div>
                            <div className="w-24 h-12 bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-200 rounded-xl animate-pulse"></div>
                        </div>
                    </div>

                    {/* Skeleton Header */}
                    <div className="flex items-center justify-between px-2">
                        <div className="h-8 w-56 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                    </div>

                    {/* Skeleton Cards Grid - 3 columns on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 animate-pulse">
                                {/* Image Skeleton with gradient shimmer */}
                                <div className="h-72 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer"></div>
                                </div>
                                {/* Content Skeleton */}
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
                                        <div className="h-8 w-16 bg-indigo-100 rounded-full"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                                        <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                                        <div className="h-6 w-14 bg-gray-100 rounded-full"></div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <div className="flex-1 h-12 bg-gray-100 rounded-xl"></div>
                                        <div className="w-12 h-12 bg-rose-100 rounded-xl"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full space-y-8 pb-32">
                {/* AI Search Bar - Premium Glass Design */}
                <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 space-y-4 overflow-hidden">
                    {/* Decorative gradient orbs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <span className="text-gradient">AI Matchmaker</span>
                        </h2>
                        <p className="text-sm text-gray-500 ml-12">Describe your ideal partner and let AI find the perfect match</p>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="e.g., 'Architect in Mumbai who loves hiking and reading'..."
                            className="flex-1 bg-gray-50/80 border border-gray-200/50 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all flex items-center gap-2"
                        >
                            <Search size={18} />
                            <span className="hidden sm:inline">Search</span>
                        </button>
                    </div>
                </div>

                {/* Who Liked You Section */}
                {whoLikedMe && whoLikedMe.totalLikes > 0 && (
                    <div className="relative bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 p-5 rounded-3xl border border-pink-100 overflow-hidden">
                        {/* Decorative */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-200/40 to-rose-300/40 rounded-full blur-2xl"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg shadow-pink-500/30">
                                    <Heart className="text-white" size={20} fill="white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        Who Liked You
                                        {!whoLikedMe.isPremium && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <Crown size={10} /> PREMIUM
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {whoLikedMe.isPremium
                                            ? `${whoLikedMe.totalLikes} people liked your profile`
                                            : whoLikedMe.message}
                                    </p>
                                </div>
                            </div>
                            {!whoLikedMe.isPremium && (
                                <button
                                    onClick={() => setShowCoinStore(true)}
                                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Eye size={16} /> See All
                                </button>
                            )}
                        </div>

                        {/* Likes Grid */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar relative z-10">
                            {whoLikedMe.likes?.map((like: any, idx: number) => (
                                <div
                                    key={like.id || idx}
                                    className={`flex-shrink-0 w-20 text-center group cursor-pointer ${like.isBlurred ? 'pointer-events-none' : ''}`}
                                    onClick={() => !like.isBlurred && setSelectedProfile(like)}
                                >
                                    <div className={`relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden ring-2 ring-pink-200 ring-offset-2 ${like.isBlurred ? 'blur-md' : 'group-hover:ring-pink-400 transition-all'}`}>
                                        <img
                                            src={like.photoUrl}
                                            alt={like.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {like.isBlurred && (
                                            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                                <Lock size={20} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-xs font-semibold truncate ${like.isBlurred ? 'text-gray-400' : 'text-gray-700 group-hover:text-pink-600'}`}>
                                        {like.name}
                                    </p>
                                    {!like.isBlurred && (
                                        <p className="text-[10px] text-gray-400">{like.age}, {like.location?.split(',')[0]}</p>
                                    )}
                                </div>
                            ))}

                            {!whoLikedMe.isPremium && whoLikedMe.totalLikes > 3 && (
                                <div
                                    className="flex-shrink-0 w-20 text-center cursor-pointer"
                                    onClick={() => setShowCoinStore(true)}
                                >
                                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-dashed border-amber-300 flex items-center justify-center">
                                        <span className="text-amber-600 font-bold text-sm">+{whoLikedMe.totalLikes - 3}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-amber-600">See More</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Header for Feed - Enhanced */}
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-foreground">
                            {searchQuery ? 'Search Results' : 'Daily Recommendations'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Handpicked matches just for you ✨</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                            {matches.length} matches
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayMatches.map((match, idx) => (
                        <div
                            key={match.id}
                            className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full card-premium"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <MatchCard
                                match={match}
                                onConnect={() => {
                                    // Optimistically remove
                                    setMatches(prev => prev.filter(m => m.id !== match.id));
                                }}
                                onViewProfile={() => setSelectedProfile(match)}
                            />
                        </div>
                    ))}
                </div>

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
            </div>
        );
    };

    const renderRequests = () => (
        <div className="max-w-2xl mx-auto py-6 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Pending Requests ({requests.length})</h2>
            {requests.length === 0 && (
                <div className="text-center py-20 text-gray-500">No pending requests</div>
            )}
            {requests.map((req: any) => (
                <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={req.fromUser.photoUrl || "https://i.pravatar.cc/150"} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h4 className="font-bold">{req.fromUser.name}</h4>
                            <p className="text-xs text-gray-500">{req.fromUser.location?.city || "Unknown"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleDeclineRequest(req.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><X size={20} /></button>
                        <button onClick={() => handleAcceptRequest(req.id)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700">Accept</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderConnections = () => (
        <div className="max-w-2xl mx-auto py-6 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Your Connections</h2>
            {connections.length === 0 && (
                <div className="text-center py-20 text-gray-500">No connections yet</div>
            )}
            {connections.map((conn: any) => (
                <div
                    key={conn.interactionId}
                    onClick={() => setSelectedConnection(conn)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <img src={conn.partner.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-green-400" />
                    <div className="flex-1">
                        <h4 className="font-bold text-lg">{conn.partner.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1">Click to chat</p>
                    </div>
                    <MessageCircle className="text-indigo-600" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background font-sans text-foreground pb-safe">
            {renderHeader()}

            <main className="max-w-7xl mx-auto pt-6 px-4 lg:px-8 flex gap-8">
                {/* Main Feed Column */}
                <div className="flex-1 min-w-0 pb-24 sm:pb-0">
                    {(activeTab === 'matches' || activeTab === 'reels') && (
                        <div className="mb-8">{renderStories()}</div>
                    )}

                    {activeTab === 'matches' && renderDiscoveryFeed()}
                    {activeTab === 'reels' && <ReelFeed />}
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'connections' && renderConnections()}

                    {activeTab === 'profile' && currentUser && (
                        isEditingProfile ? (
                            <ProfileEditor
                                initialData={currentUser}
                                onSave={(newData) => {
                                    setCurrentUser(newData);
                                    setIsEditingProfile(false);
                                    toast.success("Profile Saved!");
                                }}
                                onCancel={() => setIsEditingProfile(false)}
                            />
                        ) : (
                            <ProfileView
                                profile={currentUser}
                                onEdit={() => setIsEditingProfile(true)}
                            />
                        )
                    )}
                </div>


            </main>



            {/* Modals */}
            <CoinStoreModal
                isOpen={showCoinStore}
                onClose={() => setShowCoinStore(false)}
                onSuccess={() => {
                    setShowCoinStore(false);
                    // refresh user to update coins
                    api.profile.getMe().then(setCurrentUser);
                }}
            />

            {activeStorySet && (
                <StoryModal
                    initialIndex={0}
                    stories={activeStorySet.stories}
                    user={{
                        id: activeStorySet.user?.id || activeStorySet.user?.userId || 'me',
                        name: activeStorySet.user?.name || activeStorySet.user?.full_name || 'User',
                        photoUrl: activeStorySet.user?.photoUrl || activeStorySet.user?.avatar_url || "https://i.pravatar.cc/150"
                    }}
                    currentUser={currentUser}
                    onClose={() => setActiveStorySet(null)}
                    onDelete={async (deletedId) => {
                        await api.interactions.deleteStory(deletedId);
                        // Optimistically remove from view or refresh
                        setActiveStorySet(null);
                        // Refresh full feed
                        api.profile.getMe().then(setCurrentUser);
                    }}
                />
            )}

            {selectedConnection && (
                <ChatWindow
                    connectionId={selectedConnection.interactionId}
                    partner={selectedConnection.partner}
                    onClose={() => setSelectedConnection(null)}
                    onVideoCall={() => setActiveCall({ partner: selectedConnection.partner, connectionId: selectedConnection.interactionId, mode: 'video' })}
                    onAudioCall={() => setActiveCall({ partner: selectedConnection.partner, connectionId: selectedConnection.interactionId, mode: 'audio' })}
                />
            )}

            {/* Profile Detail Modal for Matches */}
            {selectedProfile && (
                <ProfileModal
                    profile={selectedProfile}
                    currentUser={currentUser}
                    onClose={() => setSelectedProfile(null)}
                    onConnect={() => {
                        api.interactions.sendInterest(selectedProfile.id);
                        setSelectedProfile(null);
                        setMatches(prev => prev.filter(m => m.id !== selectedProfile.id));
                        toast.success(`Interest sent to ${selectedProfile.name}!`);
                    }}
                    onUpgrade={() => {
                        setSelectedProfile(null);
                        setShowCoinStore(true);
                    }}
                />
            )}

            {/* Video Call Modal */}
            {activeCall && (
                <VideoCallModal
                    connectionId={activeCall.connectionId}
                    partner={activeCall.partner}
                    incomingCall={activeCall.incomingCall}
                    mode={activeCall.mode}
                    onEndCall={() => setActiveCall(null)}
                />
            )}
            {/* Call History Modal */}
            {showCallHistory && (
                <CallHistoryModal
                    onClose={() => setShowCallHistory(false)}
                />
            )}

            {/* Filter Modal */}
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={(filters) => {
                    setActiveFilters(filters);
                    // Apply filters to matches
                    // Note: For now, filters are stored and can be used client-side
                    // Ideally send to backend for optimized filtering
                }}
                initialFilters={activeFilters || undefined}
            />

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-lg pb-safe z-50">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <div className="relative">
                                <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
