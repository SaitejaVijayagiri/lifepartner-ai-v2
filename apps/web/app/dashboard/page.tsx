'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import VideoCallModal from '@/components/VideoCallModal';
import CallHistoryModal from '@/components/CallHistoryModal';
import { useSocket } from '@/context/SocketContext';
import { useCall } from '@/context/CallContext';
import { useTheme } from 'next-themes';
import { Bell, Search, Sparkles, Filter, Briefcase, MapPin, Ruler, Heart, Video, Users, MessageCircle, User, Check, X, Coins, LogOut, Clock, Zap, Rocket, Crown, Lock, Eye, Trash2, Coffee, Moon, Sun } from 'lucide-react';

import { Notifications } from '@/lib/notifications';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/NotificationBell';
import ProfileView from '@/components/ProfileView';
import { useToast } from '@/components/ui/Toast';
import { FilterState } from '@/components/FilterModal';
import { BottomNav } from '@/components/BottomNav';
import InteractiveMap from '@/components/InteractiveMap';

// Performance: Lazy-load heavy components that aren't needed on first paint
const MatchCard = dynamic(() => import('@/components/MatchCard'));
const KundliModal = dynamic(() => import('@/components/KundliModal'));
const StoryModal = dynamic(() => import('@/components/StoryModal'));
const ProfileEditor = dynamic(() => import('@/components/ProfileEditor'));
const ProfileModal = dynamic(() => import('@/components/ProfileModal'));
const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });
const CoinStoreModal = dynamic(() => import('@/components/CoinStoreModal'));
const FilterModal = dynamic(() => import('@/components/FilterModal'), { ssr: false });
const GiftModal = dynamic(() => import('@/components/GiftModal'));
const CommunityChat = dynamic(() => import('@/components/CommunityChat'), { ssr: false });

// Duplicate InteractiveMap removed
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
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const { socket, onlineUsers } = useSocket() as any;
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const [mapProfiles, setMapProfiles] = useState<any[]>([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('matches');
    const [requestsCount, setRequestsCount] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [initialStoreTab, setInitialStoreTab] = useState<'coins' | 'premium'>('coins');
    const [showCallHistory, setShowCallHistory] = useState(false);
    const [whoLikedMe, setWhoLikedMe] = useState<any>(null);
    const [visitorsData, setVisitorsData] = useState<any>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    /* Story State */
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
    const [selectedKundli, setSelectedKundli] = useState<{ data: any, names: { me: string, partner: string } } | null>(null);

    /* Gift State */
    const [giftData, setGiftData] = useState<{ userId: string, userName: string } | null>(null);

    /* Push Notification Toggle State */
    const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('push_notifications_enabled') !== 'false';
        }
        return true;
    });

    const togglePushNotifications = async () => {
        const newState = !pushEnabled;
        setPushEnabled(newState);
        localStorage.setItem('push_notifications_enabled', String(newState));
        if (newState) {
            // Re-enable: re-initialize and register push notifications
            try {
                await Notifications.init();
                await Notifications.setupListeners();
                toast.success('Push notifications enabled!');
            } catch (e) {
                toast.error('Could not enable notifications.');
                setPushEnabled(false);
                localStorage.setItem('push_notifications_enabled', 'false');
            }
        } else {
            // Disable: remove (clear) the device token from the backend
            try {
                await Notifications.unregister();
                toast.success('Push notifications disabled.');
            } catch (e) {
                console.error('Failed to unregister token', e);
            }
        }
    };

    /* Chat State */
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const { startCall } = useCall();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                router.push('/login');
                return;
            }

            // PERF: Instant paint from localStorage cache before network waterfall
            try {
                const cachedMatchesStr = localStorage.getItem('matches_cache_v2');
                if (cachedMatchesStr) {
                    const { data, ts } = JSON.parse(cachedMatchesStr);
                    // 2 minute TTL for client cache, then fallback to loading state
                    if (Date.now() - ts < 120000) {
                        setMatches(data);
                        setLoading(false);
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }

            // PERF: Fire profile check + matches + counts all in parallel
            try {
                const [profileResult, matchesResult, countsResult] = await Promise.allSettled([
                    api.profile.getMe(),
                    api.matches.getAll(),
                    api.interactions.getCounts()
                ]);

                // Handle profile
                if (profileResult.status === 'rejected') {
                    const err = profileResult.reason;
                    const msg = err?.message || '';
                    if (msg.includes('401') || msg.includes('session') || msg.includes('404') || msg.includes('not found')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('user');
                        router.push('/login');
                    } else {
                        router.push('/onboarding');
                    }
                    return;
                }

                const profile = profileResult.value;
                if (!profile || (!profile.photos?.length && !profile.photoUrl) || !profile.name || !profile.age || !profile.gender) {
                    router.push('/onboarding');
                    return;
                }
                setCurrentUser(profile);

                // Initialize Native Push Notifications if on Capacitor Device
                Notifications.init().then(() => Notifications.setupListeners()).catch(console.error);

                // Matches - with stale-while-revalidate cache save
                if (matchesResult.status === 'fulfilled') {
                    const freshMatches = matchesResult.value?.matches || [];
                    setMatches(freshMatches);
                    try {
                        localStorage.setItem('matches_cache_v2', JSON.stringify({ data: freshMatches, ts: Date.now() }));
                    } catch (e) {}
                }
                setLoading(false);

                // Counts (requests badge + unread messages badge)
                if (countsResult.status === 'fulfilled') {
                    setRequestsCount(countsResult.value?.requestCount || 0);
                    setUnreadMessageCount(countsResult.value?.unreadMessages || 0);
                }

                // Lazy-load secondary data (who liked me, visitors) after render
                setTimeout(() => {
                    api.interactions.whoLikedMe().then(setWhoLikedMe).catch(() => {});
                    api.interactions.getVisitors().then(setVisitorsData).catch(() => {});
                }, 800);

            } catch (err: any) {
                console.error('Auth/init error', err);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);


    // Check for Deep Links, Payment Return & Actions
    useEffect(() => {
        // Use hook for reactivity
        const orderId = searchParams.get('order_id');
        const action = searchParams.get('action');
        const tab = searchParams.get('tab');
        const chatId = searchParams.get('chatId');

        if (tab) setActiveTab(tab);
        if (chatId) setActiveTab('connections');

        if (action === 'open_premium') {
            setInitialStoreTab('premium');
            setShowCoinStore(true);
            // Clean URL without refresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('action');
            window.history.replaceState({}, '', newUrl.toString());
        }

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
                });
        }
    }, [searchParams]);

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    const navItems = [
        { id: 'matches', label: 'Matches', icon: Heart },
        { id: 'map', label: 'Live Map', icon: MapPin },
        { id: 'community', label: 'Lounge', icon: Coffee },
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount },
        { id: 'connections', label: 'Chat', icon: MessageCircle, badge: unreadMessageCount },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    // Fetch data based on active tab — guard against repeated re-fetches on tab switch
    const hasFetchedRequests = useRef(false);
    const hasFetchedConnections = useRef(false);

    useEffect(() => {
        if (activeTab === 'requests' && !hasFetchedRequests.current) {
            hasFetchedRequests.current = true;
            fetchRequests();
        }
        if (activeTab === 'connections' && !hasFetchedConnections.current) {
            hasFetchedConnections.current = true;
            fetchConnections();
        }
        if (activeTab === 'map' && mapProfiles.length === 0) fetchMapProfiles();
    }, [activeTab]);

    const fetchMapProfiles = async () => {
        try {
            setMapLoading(true);
            const data = await api.matches.getMapUsers();
            setMapProfiles(data.profiles || []);
        } catch (err) {
            console.error('Failed to load map users', err);
        } finally {
            setMapLoading(false);
        }
    };

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

        // Fetch visitors
        try {
            const vData = await api.interactions.getVisitors();
            setVisitorsData(vData);
        } catch (e) { console.error('Visitors error:', e); }
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
        } catch (e: any) {
            console.error('fetchRequests error:', e);
            toast.error(`Failed to load requests: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchConnections = async () => {
        try {
            setLoading(true);
            const data = await api.interactions.getConnections();
            setConnections(data);

            // Calculate total unread
            const totalUnread = data.reduce((acc: number, curr: any) => acc + (curr.unreadCount || 0), 0);
            setUnreadMessageCount(totalUnread);

            // Handle Push Notification Deep Link
            const urlChatId = searchParams.get('chatId');
            if (urlChatId) {
                const connToOpen = data.find((c: any) => c.partner?.id === urlChatId);
                if (connToOpen) {
                    setSelectedConnection(connToOpen);
                    // Clean URL
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('chatId');
                    newUrl.searchParams.delete('tab');
                    window.history.replaceState({}, '', newUrl.toString());
                }
            }
        } catch (e: any) {
            console.error('fetchConnections error:', e);
            toast.error(`Failed to load connections: ${e.message || 'Network error — check if backend is running'}`);
        } finally {
            setLoading(false);
        }
    };

    // Real-time Message Listener for Unread Counts
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            const isChatting = activeTab === 'connections' && selectedConnection?.partner?.id === msg.senderId;

            if (!isChatting) {
                setUnreadMessageCount(prev => prev + 1);
            }

            setConnections(prev => {
                const existingIndex = prev.findIndex(c => c.partner?.id === msg.senderId);

                if (existingIndex > -1) {
                    const newConns = [...prev];
                    const [targetConn] = newConns.splice(existingIndex, 1);
                    if (!isChatting) {
                        targetConn.unreadCount = (targetConn.unreadCount || 0) + 1;
                    }
                    return [targetConn, ...newConns];
                }

                fetchConnections();
                return prev;
            });
        };

        socket.on('receiveMessage', handleNewMessage);

        return () => {
            socket.off('receiveMessage', handleNewMessage);
        };
    }, [socket, activeTab, selectedConnection]);

    // Handle instant read update
    const handleMarkRead = (partnerId: string) => {
        setConnections(prev => {
            const connIndex = prev.findIndex(c => c.partner?.id === partnerId);
            if (connIndex === -1) return prev;

            const oldUnread = prev[connIndex].unreadCount || 0;
            if (oldUnread === 0) return prev; // No change

            // Update global count
            setUnreadMessageCount(curr => Math.max(0, curr - oldUnread));

            // Return new connections list with 0 unread
            const newConns = [...prev];
            newConns[connIndex] = { ...newConns[connIndex], unreadCount: 0 };
            return newConns;
        });
    };

    const handleMessageSentAction = (partnerId: string) => {
        setConnections(prev => {
            const existingIndex = prev.findIndex(c => c.partner?.id === partnerId);
            if (existingIndex > -1) {
                const newConns = [...prev];
                const [targetConn] = newConns.splice(existingIndex, 1);
                return [targetConn, ...newConns];
            }
            return prev;
        });
    };

    // Client-side filter function - ROBUST & AUDITED
    const filterMatches = (matchList: any[]) => {
        if (!activeFilters) return matchList;

        return matchList.filter((match) => {
            const meta = match.metadata || {};

            // Unified Data Accessors (Check root first, then meta)
            const age = match.age ?? meta.basics?.age ?? meta.age ?? 0;
            const heightStr = match.height || meta.basics?.height || meta.height || '';
            const religionStr = (match.religion?.religion || meta.religion?.religion || meta.background?.religion || match.religion || '').toLowerCase();
            const casteStr = (match.religion?.caste || meta.religion?.caste || '').toLowerCase();
            const dietStr = (match.lifestyle?.diet || meta.lifestyle?.diet || match.diet || '').toLowerCase();
            const maritalStr = (match.maritalStatus || meta.maritalStatus || 'Single').toLowerCase();
            const incomeStr = (match.career?.income || meta.career?.income || '').toLowerCase();

            // Safe Location search across multiple fields
            const locStr = [match.city, match.state, match.location_name, meta.location?.city, meta.location?.state].filter(Boolean).join(' ').toLowerCase();

            // 1. Age Filter
            if (activeFilters.ageRange) {
                // Ignore if age is 0 (missing data) - prevent filtering out everyone? 
                // Currently: if age is outside range, remove it.
                if (age > 0 && (age < activeFilters.ageRange[0] || age > activeFilters.ageRange[1])) return false;
            }

            // 2. Height Filter
            if (heightStr) {
                const parseHeight = (h: string): number => {
                    const clean = h.replace(/[^0-9.]/g, ' ').trim().split(/\s+/).map(Number);
                    if (h.includes("'") || clean.length >= 2) return (clean[0] * 12) + (clean[1] || 0);
                    if (clean[0] > 8 && clean[0] < 250) return Math.round(clean[0] / 2.54); // cm assumption
                    if (clean[0] < 8) return clean[0] * 12; // feet assumption
                    return 0;
                };
                const inches = parseHeight(heightStr);
                // Only filter if we successfully parsed a valid height
                if (inches > 0 && (inches < activeFilters.heightRange[0] || inches > activeFilters.heightRange[1])) return false;
            }

            // 3. Marital Status (Normalize 'Single' <-> 'Never Married')
            if (activeFilters.maritalStatus && activeFilters.maritalStatus.length > 0) {
                const normalizedFilters = activeFilters.maritalStatus.map(s => {
                    const lower = s.toLowerCase();
                    if (lower.includes('never married') || lower.includes('single')) return 'single';
                    return lower;
                });
                const normalizedStatus = maritalStr === 'never married' ? 'single' : maritalStr;

                // Matches if status is in list OR (status is 'single' and list has 'never married')
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

            // 6. Lifestyle (Diet, Smoking, Drinking)
            if (activeFilters.diet && !dietStr.includes(activeFilters.diet.toLowerCase())) return false;

            if (activeFilters.smoking) {
                const smoking = (match.lifestyle?.smoking || meta.lifestyle?.smoking || 'No').toLowerCase();
                if (smoking !== activeFilters.smoking.toLowerCase()) return false;
            }
            if (activeFilters.drinking) {
                const drinking = (match.lifestyle?.drinking || meta.lifestyle?.drinking || 'No').toLowerCase();
                if (drinking !== activeFilters.drinking.toLowerCase()) return false;
            }

            // 7. Income (Min LPA)
            if (activeFilters.minIncome) {
                let val = 0;
                // If explicitly says LPA, trust it
                if (incomeStr.toLowerCase().includes('lpa')) {
                    const match = incomeStr.match(/([\d.]+)/);
                    val = match ? parseFloat(match[0]) : 0;
                } else {
                    // Heuristic: If number > 100, assume it's raw rupees and convert to LPA
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

    // Get filtered matches
    const displayMatches = activeFilters ? filterMatches(matches) : matches;

    // Incoming Call Listener - REMOVED (Handled by Global CallManager)
    /*
    useEffect(() => {
        if (!socket) return;
        socket.on("callUser", (data: any) => {
             // Let CallManager handle this globally to avoid double modals
             console.log("Dashboard: Handing over incoming call to CallManager");
        });
        return () => { socket.off("callUser"); };
    }, [socket]);
    */

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
        <header className={`sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-100/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 ${activeTab === 'map' ? 'hidden sm:block' : ''}`}>
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
                            <span className="text-xl font-heading font-bold text-gray-800 dark:text-gray-200"> AI</span>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all
                                    ${activeTab === item.id
                                        ? 'bg-primary/10 text-primary dark:text-indigo-400'
                                        : 'text-muted-foreground hover:bg-secondary/50 dark:hover:bg-gray-700 hover:text-foreground md:dark:hover:text-gray-200'}
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
                            onClick={() => {
                                setInitialStoreTab('coins');
                                setShowCoinStore(true);
                            }}
                            className="flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-yellow-200"
                        >
                            <Coins size={14} className="fill-yellow-500 text-yellow-600" />
                            <span>{currentUser.coins || 0}</span>
                        </button>
                    )}






                    {(activeTab === 'matches' || activeTab === 'map') && (
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
                    {/* Theme Toggle - Mobile Only */}
                    <button
                        onClick={() => setTheme(mounted && theme === 'dark' ? 'light' : 'dark')}
                        className="md:hidden w-10 h-10 rounded-full hover:bg-secondary/20 flex items-center justify-center transition-colors text-muted-foreground"
                        title="Toggle theme"
                        aria-label="Toggle dark mode"
                    >
                        {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <NotificationBell />






                    {currentUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[2px] cursor-pointer" onClick={() => setActiveTab('profile')}>
                            <img src={currentUser.photos?.[0] || currentUser.photoUrl || "/avatar-fallback.svg"} className="rounded-full w-full h-full border-2 border-background object-cover" alt="Profile" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.full_name || 'Me')}`; }} />
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
                        <div className="w-20 h-20 rounded-full p-[3px] border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-105 relative">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">
                                    +
                                </div>
                            </div>
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />
                    </label>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Your Story</span>
                </div>

                {/* My Active Story (if any) */}
                {currentUser?.stories?.map((story: any, i: number) => (
                    <div key={'me' + i} className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group" onClick={() => setCurrentStoryIndex(i)}>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                                <div className="w-full h-full rounded-full p-[2px] bg-background">
                                    <img src={currentUser.photos?.[0] || currentUser.photoUrl || '/avatar-fallback.svg'} className="w-full h-full rounded-full object-cover" alt="You" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.full_name || 'Me')}`; }} />
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
                                    <img src={match.photoUrl || '/avatar-fallback.svg'} className="w-full h-full rounded-full object-cover" alt={match.name} onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || 'User')}`; }} />
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
    const [aiFilters, setAiFilters] = useState<any>(null); // New: Store AI's understanding

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setIsSearching(true); // Trigger "Thinking" UI
        setAiFilters(null);
        try {
            // Simulate AI "Thinking" delay for UX (at least 1.5s)
            const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
            const [results] = await Promise.all([
                api.matches.search(searchQuery),
                minDelay
            ]);

            setMatches(results.matches || []);
            setAiFilters(results.filters || null); // Save filters for feedback header
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const renderDiscoveryFeed = () => {
        if (loading) {
            return (
                <div className="w-full space-y-8 pb-32">
                    {/* Skeleton for AI Search */}
                    {/* AI "Thinking" UI - Replaces generic skeleton */}
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-indigo-100/50 dark:border-indigo-900/50 space-y-6 text-center relative overflow-hidden">
                        {/* Animated Gradient Background */}
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

                            {/* Fake Progress Steps */}
                            <div className="flex gap-2 mt-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_0ms]"></span>
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_200ms]"></span>
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_400ms]"></span>
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Header */}
                    <div className="flex items-center justify-between px-2">
                        <div className="h-8 w-56 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>

                    {/* Skeleton Cards Grid - 3 columns on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 dark:border-gray-800 animate-pulse">
                                {/* Image Skeleton with gradient shimmer */}
                                <div className="h-72 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skeleton-shimmer"></div>
                                </div>
                                {/* Content Skeleton */}
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                                        <div className="h-8 w-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                        <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                        <div className="h-6 w-14 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-xl"></div>
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
                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 dark:border-gray-800/50 space-y-4 overflow-hidden">
                    {/* Decorative gradient orbs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-1">
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
                            className="flex-1 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder-gray-500"
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


                {/* Recent Visitors Section */}
                {
                    visitorsData && visitorsData.visitors?.length > 0 && (
                        <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-indigo-300/40 rounded-full blur-2xl"></div>

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                        <Eye className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            Recent Visitors
                                            {!visitorsData.isPremium && (
                                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <Crown size={10} /> PREMIUM
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            People who viewed in your profile recently
                                        </p>
                                    </div>
                                </div>
                                {!visitorsData.isPremium && (
                                    <button
                                        onClick={() => setShowCoinStore(true)}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <Eye size={16} /> Unlock
                                    </button>
                                )}
                            </div>

                            {/* Visitors List */}
                            <div className="flex gap-3 overflow-x-auto no-scrollbar relative z-10">
                                {visitorsData.visitors.map((visitor: any, idx: number) => (
                                    <div
                                        key={visitor.id || idx}
                                        className={`flex-shrink-0 w-20 text-center group cursor-pointer ${visitor.isBlurred ? 'pointer-events-none' : ''}`}
                                        onClick={() => !visitor.isBlurred && setSelectedProfile(visitor)}
                                    >
                                        <div className={`relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden ring-2 ring-blue-200 ring-offset-2 ${visitor.isBlurred ? 'blur-md' : 'group-hover:ring-blue-400 transition-all'}`}>
                                            <img
                                                src={visitor.photoUrl || '/avatar-fallback.svg'}
                                                alt={visitor.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(visitor.name || 'User')}`; }}
                                            />
                                            {visitor.isBlurred && (
                                                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                                    <Lock size={20} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs font-semibold truncate ${visitor.isBlurred ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                            {visitor.name}
                                        </p>
                                        {!visitor.isBlurred && (
                                            <p className="text-[10px] text-gray-400">{visitor.age}, {visitor.location?.split(',')[0]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Who Liked You Section */}
                {
                    whoLikedMe && whoLikedMe.totalLikes > 0 && (
                        <div className="relative bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-pink-900/20 p-5 rounded-3xl border border-pink-100 dark:border-pink-900/30 overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-200/40 to-rose-300/40 rounded-full blur-2xl"></div>

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg shadow-pink-500/30">
                                        <Heart className="text-white" size={20} fill="white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                                                src={like.photoUrl || '/avatar-fallback.svg'}
                                                alt={like.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(like.name || 'User')}`; }}
                                            />
                                            {like.isBlurred && (
                                                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                                    <Lock size={20} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs font-semibold truncate ${like.isBlurred ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-pink-600 dark:group-hover:text-pink-400'}`}>
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
                    )
                }

                {/* Header for Feed - Enhanced */}
                {/* Header for Feed - Enhanced with AI Feedback */}
                {aiFilters && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 mb-6 aniimate-in fade-in slide-in-from-top-4">
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

                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-foreground">
                            {searchQuery ? (aiFilters ? 'AI Recommended Matches' : 'Search Results') : 'Daily Recommendations'}
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
                                onShowKundli={(data: any) => setSelectedKundli({
                                    data,
                                    names: { me: "You", partner: match.name }
                                })}
                                onGift={() => setGiftData({ userId: match.id, userName: match.name })}
                    isConnectedProp={connections.some((c: any) => c.partner?.id === match.id)}
                                onChat={() => {
                                    const conn = connections.find((c: any) => c.partner?.id === match.id);
                                    if (conn) {
                                        setSelectedConnection(conn);
                                    } else {
                                        setActiveTab('connections');
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                {
                    displayMatches.length === 0 && (
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
                    )
                }
            </div >
        );
    };

    const renderRequests = () => (
        <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-2 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1 text-gray-900 dark:text-white">Pending Requests ({requests.length})</h2>
            {requests.length === 0 && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">No pending requests</div>
            )}
            {requests.map((req: any) => (
                <div key={req.interactionId} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all hover:shadow-md justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img src={req.fromUser.photoUrl || '/avatar-fallback.svg'} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shrink-0" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.fromUser.name || 'User')}`; }} />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin size={12} />
                            {typeof req.fromUser.location === 'string' ? req.fromUser.location : (req.fromUser.location?.city || "Unknown Location")}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button onClick={() => handleDeclineRequest(req.interactionId)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><X size={20} /></button>
                        <button onClick={() => handleAcceptRequest(req.interactionId)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700">Accept</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderConnections = () => {
        // Sort connections so online users appear at the top, preserving the recent-message order within groups
        const onlineConns = connections.filter(c => onlineUsers.includes(c.partner.id));
        const offlineConns = connections.filter(c => !onlineUsers.includes(c.partner.id));
        const sortedConnections = [...onlineConns, ...offlineConns];

        return (
            <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-2 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1 text-gray-900 dark:text-white">Your Connections</h2>
                {sortedConnections.length === 0 && (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">No connections yet</div>
                )}
                {sortedConnections.map((conn: any) => (
                    <div
                        key={conn.interactionId}
                        className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all hover:shadow-md group"
                    >
                        <div
                            className="flex items-center gap-4 flex-1 cursor-pointer w-full sm:w-auto"
                            onClick={() => setSelectedConnection(conn)}
                        >
                            <div className="relative">
                                <img src={conn.partner.photoUrl || '/avatar-fallback.svg'} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shrink-0" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = () => { t.onerror = null; t.src = '/avatar-fallback.svg'; }; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conn.partner.name || 'User')}`; }} />
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${onlineUsers.includes(conn.partner.id) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                        {conn.partner.name}
                                    </h4>
                                    {conn.unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center shadow-sm animate-pulse">
                                            {conn.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {onlineUsers.includes(conn.partner.id) ? 'Online' : 'Offline'} • Click to chat
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 mt-2 sm:mt-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Are you sure you want to remove this connection?")) return;
                                    try {
                                        await api.interactions.deleteConnection(conn.interactionId);
                                        setConnections(prev => prev.filter((c: any) => c.interactionId !== conn.interactionId));
                                        toast.success("Connection removed");
                                    } catch (err) {
                                        toast.error("Failed to remove");
                                    }
                                }}
                            >
                                <Trash2 size={20} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full"
                                onClick={() => setSelectedConnection(conn)}
                            >
                                <MessageCircle size={20} />
                            </Button>
                        </div>
                    </div>
                ))
                }
            </div >
        );
    };

    return (
        <div className={`flex flex-col bg-background font-sans text-foreground pb-safe ${activeTab === 'map' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
            {renderHeader()}
            <main className={`flex-1 w-full max-w-7xl mx-auto lg:px-8 flex gap-8 ${activeTab === 'map' ? 'pt-0 px-0 sm:pt-6 overflow-hidden' : 'pt-6 px-4'}`}>
                {/* Main Feed Column */}
                <div className={`flex-1 min-w-0 flex flex-col ${activeTab === 'map' ? 'pb-0 h-full' : 'pb-32 sm:pb-24'}`}>
                    {activeTab === 'matches' && (
                        <div className="mb-8">{renderStories()}</div>
                    )}

                    {activeTab === 'matches' && renderDiscoveryFeed()}
                    {activeTab === 'map' && <InteractiveMap profiles={mapProfiles} currentUser={currentUser} onViewProfile={setSelectedProfile} onBack={() => setActiveTab('matches')} />}

                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'connections' && renderConnections()}

                    {activeTab === 'community' && (
                        <div className="h-[calc(100dvh-180px)] md:h-[calc(100vh-140px)] pt-2">
                            <CommunityChat currentUser={currentUser} onOpenStore={() => {
                                // Force Guest Flow for upgrading users per recent request?
                                // Actually, if they are here, they are logged in.
                                // But the prompt said "open premium store modal".
                                // Wait, the previous task CHANGED the "Get Verified" button to LOGOUT.
                                // But here, if they are sending "onOpenStore", they are likely in "Access Denied" state inside CommunityChat?
                                // If they are logged in and Access Denied, they need to verify.
                                // The user's LAST request was "force logout". 
                                // So I should probably stick to that logic for "Get Verified" buttons?
                                // BUT this prop is `onOpenStore`. 
                                // Let's keep the premium store logic for now unless explicitly told to force logout here too. 
                                // OH WAIT, the previous turn I DID change CommunityChat prop in `community/page.tsx` to force logout.
                                // I should probably do the same here for consistency if "Get Verified" is clicked.
                                // BUT this might be for "Store" in general?
                                // `CommunityChat` uses `onOpenStore` ONLY for the "Access Denied" button.
                                // So yes, I should force logout/register flow here too if I want consistency.
                                // However, keeping it as premium store for DASHBOARD users makes sense since they are already in the dashboard!
                                // The previous fix was for the "Community Landing Page" where users were confused.
                                // Here, they vary much ARE in the dashboard.
                                // If they click "Get Verified", they SHOULD see the premium store.
                                // So I will use the premium store modal.
                                setInitialStoreTab('premium');
                                setShowCoinStore(true);
                            }} />
                        </div>
                    )}

                    {activeTab === 'profile' && currentUser && (
                        isEditingProfile ? (
                            <ProfileEditor
                                initialData={currentUser}
                                onSave={async (newData) => {
                                    // Optimization: optimistic update
                                    setCurrentUser(newData);
                                    setIsEditingProfile(false);
                                    toast.success("Profile Saved!");

                                    // Verify with backend source of truth
                                    try {
                                        const freshData = await api.profile.getMe();
                                        setCurrentUser(freshData);
                                    } catch (e) { console.error("Refresh failed", e); }
                                }}
                                onCancel={() => setIsEditingProfile(false)}
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* Profile Stats Row */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
                                    <div className="flex w-full sm:w-auto justify-around sm:justify-start gap-2 sm:gap-8 mb-4 sm:mb-0">
                                        <div className="text-center min-w-[80px]">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{connections.length}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Connections</div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-gray-200 dark:bg-gray-700 sm:hidden"></div>
                                        <div className="text-center min-w-[80px]">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Requests</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-semibold"
                                        onClick={() => setActiveTab('connections')}
                                    >
                                        Manage Connections
                                    </Button>
                                </div>

                                {/* Mobile Quick Actions - Visible on all screens for better UX */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {/* Premium Status Card */}
                                    <div
                                        onClick={() => {
                                            setInitialStoreTab('premium');
                                            setShowCoinStore(true);
                                        }}
                                        className={`col-span-2 sm:col-span-1 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 ${currentUser.is_premium ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        <div className={`p-2 rounded-full ${currentUser.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                            <Crown size={20} />
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <div className={`font-bold text-sm ${currentUser.is_premium ? 'text-amber-800 dark:text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {currentUser.is_premium ? 'Premium Active' : 'Get Premium'}
                                            </div>
                                            <div className={`text-[10px] ${currentUser.is_premium ? 'text-amber-700 dark:text-amber-600/80' : 'text-gray-500 dark:text-gray-400'} font-medium`}>
                                                {currentUser.is_premium && currentUser.premium_expiry
                                                    ? `${Math.ceil((new Date(currentUser.premium_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left`
                                                    : 'Unlock Features'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boost Card */}
                                    <div
                                        onClick={async () => {
                                            if (!currentUser || currentUser.coins < 100) {
                                                setShowCoinStore(true);
                                                toast.error("Insufficient coins to boost!");
                                                return;
                                            }
                                            if (confirm("Boost your profile for 100 coins?")) {
                                                try {
                                                    await api.wallet.boostProfile();
                                                    toast.success("Profile Boosted!");
                                                    api.profile.getMe().then(setCurrentUser);
                                                } catch (e) { toast.error("Boost failed."); }
                                            }
                                        }}
                                        className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                            <Zap size={20} className="fill-indigo-600 dark:fill-indigo-400" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Boost</div>
                                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400">Get Visible</div>
                                        </div>
                                    </div>

                                    {/* Free Coins Card */}
                                    <div
                                        onClick={() => router.push('/refer')}
                                        className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                                            <Users size={20} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Free Coins</div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Refer Friend</div>
                                        </div>
                                    </div>

                                    {/* Push Notifications Toggle Card */}
                                    <div
                                        onClick={togglePushNotifications}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 ${
                                            pushEnabled
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300'
                                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-full transition-colors ${
                                            pushEnabled
                                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                        }`}>
                                            <Bell size={20} />
                                        </div>
                                        <div className="text-center">
                                            <div className={`font-bold text-sm ${
                                                pushEnabled ? 'text-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                                            }`}>{pushEnabled ? 'Notifs On' : 'Notifs Off'}</div>
                                            <div className={`text-[10px] ${
                                                pushEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                                            }`}>{pushEnabled ? 'Tap to disable' : 'Tap to enable'}</div>
                                        </div>
                                    </div>

                                    {/* Logout Card */}
                                    <div
                                        onClick={handleLogout}
                                        className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 cursor-pointer hover:border-red-300 dark:hover:border-red-500/50 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400">
                                            <LogOut size={20} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-sm text-red-900 dark:text-red-300">Log Out</div>
                                            <div className="text-[10px] text-red-500 dark:text-red-400">Sign Out</div>
                                        </div>
                                    </div>
                                </div>

                                <ProfileView
                                    profile={currentUser}
                                    onEdit={() => setIsEditingProfile(true)}
                                />
                            </div>
                        )
                    )}
                </div>


            </main>



            {/* Modals */}
            <CoinStoreModal
                isOpen={showCoinStore}
                onClose={() => setShowCoinStore(false)}
                initialTab={initialStoreTab}
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
                    onVideoCall={() => startCall(selectedConnection.partner, 'video', selectedConnection.interactionId)}
                    onAudioCall={() => startCall(selectedConnection.partner, 'audio', selectedConnection.interactionId)}
                    onMessagesRead={() => handleMarkRead(selectedConnection.partner.id)}
                    onMessageSent={() => handleMessageSentAction(selectedConnection.partner.id)}
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
                    onChat={() => {
                        const conn = connections.find((c: any) => c.partner?.id === selectedProfile.id);
                        setSelectedProfile(null);
                        if (conn) {
                            setSelectedConnection(conn);
                        } else {
                            setActiveTab('connections');
                        }
                    }}
                    onUpgrade={() => {
                        setSelectedProfile(null);
                        setShowCoinStore(true);
                    }}
                />
            )}

            {/* Video Call Modal - UPDATED: Handled globally by GlobalCallUI, removed from here */}

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

            {/* Gift Modal */}
            {giftData && (
                <GiftModal
                    isOpen={!!giftData}
                    onClose={() => setGiftData(null)}
                    toUserId={giftData.userId}
                    toUserName={giftData.userName}
                />
            )}

            {/* Global Kundli Modal */}
            {selectedKundli && (
                <KundliModal
                    isOpen={true}
                    onClose={() => setSelectedKundli(null)}
                    data={selectedKundli.data}
                    names={selectedKundli.names}
                />
            )}

            {/* Mobile Bottom Navigation - Premium Floating */}
            <div className="lg:hidden block">
                <BottomNav
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    requestsCount={requestsCount}
                    unreadCount={unreadMessageCount}
                />
            </div>


            {/* End of Main Content - Duplicate Block Removed */}
        </div >
    );
}
