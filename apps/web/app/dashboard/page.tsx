'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import VideoCallModal from '@/components/VideoCallModal';
import CallHistoryModal from '@/components/CallHistoryModal';
import { useSocket } from '@/context/SocketContext';
import { Bell, Search, Sparkles, Filter, Briefcase, MapPin, Ruler, Heart, Video, Users, MessageCircle, User, Check, X, Coins, LogOut, Clock, Zap, Rocket } from 'lucide-react';

/* Components */
import MatchCard from '@/components/MatchCard';
import { BottomNav } from '@/components/BottomNav';
import StoryModal from '@/components/StoryModal';
import { NotificationBell } from '@/components/NotificationBell';
import ProfileEditor from '@/components/ProfileEditor';
import ProfileModal from '@/components/ProfileModal';
import ReelFeed from '@/components/ReelFeed';
import ProfileView from '@/components/ProfileView';
import ChatWindow from '@/components/ChatWindow';
import CoinStoreModal from '@/components/CoinStoreModal';

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
    const [matches, setMatches] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('matches');
    const [requestsCount, setRequestsCount] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [showCallHistory, setShowCallHistory] = useState(false); // Added

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
                        alert("Payment Successful! Balance Updated.");
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

    // Incoming Call Listener
    useEffect(() => {
        if (!socket) return;
        socket.on("callUser", (data) => {
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
            alert("Failed to accept");
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        try {
            await api.interactions.declineRequest(requestId);
            fetchRequests();
            refreshCounts();
        } catch (e) {
            alert("Failed to decline");
        }
    };

    const renderHeader = () => (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* ... (Logo and Nav same as before) ... */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-indigo-500/20">
                            <Sparkles size={16} fill="white" />
                        </div>
                        <span className="text-xl font-heading font-bold text-foreground tracking-tight hidden sm:block">LifePartner AI</span>
                    </div>

                    <nav className="hidden">
                        {[
                            { id: 'matches', label: 'Matches', icon: Heart },
                            { id: 'reels', label: 'Vibe', icon: Video },
                            { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount },
                            { id: 'connections', label: 'Chat', icon: MessageCircle },
                            { id: 'profile', label: 'Profile', icon: User },
                        ].map(item => (
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

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-secondary/10 border-0 rounded-full pl-4 pr-10 py-1.5 text-sm w-40 focus:w-60 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    </div>

                    {/* Coin Balance */}
                    {currentUser && (
                        <button
                            onClick={() => setShowCoinStore(true)}
                            className="hidden sm:flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-yellow-200"
                        >
                            <Coins size={14} className="fill-yellow-500 text-yellow-600" />
                            <span>{currentUser.coins || 0}</span>
                        </button>
                    )}

                    {/* Premium Badge */}
                    {currentUser?.is_premium && (
                        <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-yellow-300">
                            <span>👑</span>
                            <span>PREMIUM</span>
                        </div>
                    )}


                    {/* Boost Button */}
                    <button
                        onClick={async () => {
                            if (!currentUser || currentUser.coins < 100) {
                                setShowCoinStore(true);
                                alert("Insufficient coins to boost! (Cost: 100)");
                                return;
                            }
                            if (confirm("Boost your profile for 100 coins? You will be seen by 10x more people! 🚀")) {
                                try {
                                    await api.wallet.boostProfile();
                                    alert("Profile Boosted! ⚡ You are now top visibility.");
                                    // Refresh user to update coins
                                    api.profile.getMe().then(setCurrentUser);
                                } catch (e) {
                                    alert("Boost failed.");
                                }
                            }
                        }}
                        className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform"
                    >
                        <Zap size={14} className="fill-yellow-300 text-yellow-300" />
                        <span>Boost</span>
                    </button>

                    <button className="relative w-10 h-10 rounded-full hover:bg-secondary/20 flex items-center justify-center transition-colors">
                        <Filter size={20} className="text-foreground" />
                    </button>

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
                        className="w-10 h-10 rounded-full hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors text-muted-foreground"
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
            alert("File too large (Max 50MB)");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('media', file);
            await api.profile.uploadStory(formData);
            alert("Story uploaded successfully!");
            // Refresh Me
            const me = await api.profile.getMe();
            setCurrentUser(me);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("Premium")) {
                alert("Stories are a Premium feature! Please upgrade.");
                setShowCoinStore(true);
            } else {
                alert("Failed to upload story");
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
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-4 pt-2">
            {/* My Story Upload */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                <label className="relative cursor-pointer">
                    <div className="w-16 h-16 rounded-full p-[2px] border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors relative">
                        <div className="w-full h-full rounded-full bg-secondary/10 flex items-center justify-center text-primary">
                            +
                        </div>
                    </div>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />
                </label>
                <span className="text-xs font-medium text-gray-500">Your Story</span>
            </div>

            {/* My Active Story (if any) */}
            {currentUser?.stories?.map((story: any, i: number) => (
                <div key={'me' + i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setCurrentStoryIndex(i)}>
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500">
                        <div className="w-full h-full rounded-full p-[2px] bg-background">
                            <img src={currentUser.photos?.[0] || currentUser.photoUrl} className="w-full h-full rounded-full object-cover" alt="You" />
                        </div>
                    </div>
                    <span className="text-xs font-medium text-foreground">You</span>
                </div>
            ))}

            {/* Matches Stories */}
            {matches.filter(m => m.stories?.length > 0).map((match, i) => (
                <div key={match.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => handleViewStory(match)}>
                    <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 transition-transform hover:scale-105`}>
                        <div className="w-full h-full rounded-full p-[2px] bg-background">
                            <img src={match.photoUrl} className="w-full h-full rounded-full object-cover" alt={match.name} />
                        </div>
                    </div>
                    <span className="text-xs font-medium text-foreground">{match.name}</span>
                </div>
            ))}
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
            setMatches(results);
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
                    {matches.map((match, idx) => (
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

                {matches.length === 0 && (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Search className="text-gray-300" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Matches Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search criteria or check back later for new recommendations.</p>
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
                <div className="flex-1 min-w-0">
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
                                    alert("Profile Saved!");
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

            <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                requestsCount={requestsCount}
            />

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
                        alert(`Interest sent to ${selectedProfile.name}!`);
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
        </div>
    );
}
