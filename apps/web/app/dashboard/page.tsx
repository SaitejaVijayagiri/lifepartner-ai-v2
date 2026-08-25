'use client';

import { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import VideoCallModal from '@/components/VideoCallModal';
import CallHistoryModal from '@/components/CallHistoryModal';
import { useSocket } from '@/context/SocketContext';
import { useCall } from '@/context/CallContext';
import { useTheme } from 'next-themes';
import { Bell, BellOff, Search, Sparkles, Filter, Briefcase, MapPin, Ruler, Heart, Video, Users, MessageCircle, User, Check, X, Coins, LogOut, Clock, Zap, Rocket, Crown, Lock, Eye, Trash2, Coffee, Moon, Sun, Calendar, ShieldAlert, Home, Radio } from 'lucide-react';

import { Notifications } from '@/lib/notifications';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/NotificationBell';
import ProfileView from '@/components/ProfileView';
import { useToast } from '@/components/ui/Toast';
import { FilterState } from '@/components/FilterModal';
import { BottomNav } from '@/components/BottomNav';
import InteractiveMap from '@/components/InteractiveMap';
import SpeedDatingLobby from '@/components/SpeedDatingLobby';
import SpeedDateFeedbackModal from '@/components/SpeedDateFeedbackModal';
import AppExperienceFeedback from '@/components/AppExperienceFeedback';
import DailyStreakModal from '@/components/DailyStreakModal';
import { fetchAPI } from '@/lib/api';

// Performance: Lazy-load heavy components that aren't needed on first paint
const HomeTab = dynamic(() => import('@/components/dashboard/HomeTab'), { ssr: false });
const LiveVideoEventsHub = dynamic(() => import('@/components/LiveVideoEventsHub'), { ssr: false });
const MatchesTab = dynamic(() => import('@/components/dashboard/MatchesTab'), { ssr: false });
const StoryModal = dynamic(() => import('@/components/StoryModal'), { ssr: false });
const ConnectionsTab = dynamic(() => import('@/components/dashboard/ConnectionsTab'), { ssr: false });
const RequestsTab = dynamic(() => import('@/components/dashboard/RequestsTab'), { ssr: false });
const KundliModal = dynamic(() => import('@/components/KundliModal'));
const ProfileEditor = dynamic(() => import('@/components/ProfileEditor'), { ssr: false });
const ProfileModal = dynamic(() => import('@/components/ProfileModal'));
const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });
const CoinStoreModal = dynamic(() => import('@/components/CoinStoreModal'));
const FilterModal = dynamic(() => import('@/components/FilterModal'), { ssr: false });
const GiftModal = dynamic(() => import('@/components/GiftModal'));
const GameModal = dynamic(() => import('@/components/GameModal'));
const CommunityChat = dynamic(() => import('@/components/CommunityChat'), { ssr: false });
const WebPushPrompt = dynamic(() => import('@/components/WebPushPrompt'), { ssr: false });
const MeetSpots = dynamic(() => import('@/components/MeetSpots'));
const FloatingLoveGuru = dynamic(() => import('@/components/FloatingLoveGuru'), { ssr: false });
const InstantsBar = dynamic(() => import('@/components/InstantsBar'), { ssr: false });
import { Capacitor } from '@capacitor/core';

// Duplicate InteractiveMap removed


/* Mock Data for Events */


export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 shadow-sm">
                    <div className="w-36 h-8 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-96 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                        <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    </div>
                    <div className="h-96 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                        <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    </div>
                    <div className="h-96 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                        <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    </div>
                </div>
            </div>
        }>
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [mapProfiles, setMapProfiles] = useState<any[]>([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['home']));

    useEffect(() => {
        setVisitedTabs(prev => {
            if (prev.has(activeTab)) return prev;
            const next = new Set(prev);
            next.add(activeTab);
            return next;
        });
    }, [activeTab]);
    const [requestsCount, setRequestsCount] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [initialStoreTab, setInitialStoreTab] = useState<'coins' | 'premium'>('coins');
    const [showCallHistory, setShowCallHistory] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [selectedKundli, setSelectedKundli] = useState<{ data: any, names: { me: string, partner: string } } | null>(null);

    /* Gift State */
    const [giftData, setGiftData] = useState<{ userId: string, userName: string } | null>(null);

    /* Speed Dating State */
    const [showSpeedDatingLobby, setShowSpeedDatingLobby] = useState(false);

    const [pushEnabled, setPushEnabled] = useState<boolean>(true);
    const [streakData, setStreakData] = useState<any>(null);
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [activeStorySet, setActiveStorySet] = useState<{ user: any; stories: any[] } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPushEnabled(localStorage.getItem('push_notifications_enabled') !== 'false');
        }
    }, []);

    useEffect(() => {
        if (currentUser?.id) {
            fetchAPI('/wallet/streak').then((res) => {
                if (res && res.canClaimToday) {
                    setStreakData(res);
                    setShowStreakModal(true);
                }
            }).catch(() => {});
        }
    }, [currentUser?.id]);

    /* Game State & Consent Modal State */
    const [gameTarget, setGameTarget] = useState<{ id: string; name: string } | null>(null);
    const [pendingGameInvite, setPendingGameInvite] = useState<{ from: string; senderName: string } | null>(null);

    /* Explicit Game Invitation Consent & Socket Listeners */
    useEffect(() => {
        if (!socket) return;

        const handleGlobalGameInvite = (data: { from: string; senderName: string }) => {
            // Ignore own invitations or if user is already in a game with this partner
            if (currentUser?.id && data.from === currentUser.id) return;
            if (gameTarget && gameTarget.id === data.from) return;

            setPendingGameInvite({ from: data.from, senderName: data.senderName });
        };

        const handleGameDecline = (data: { from: string }) => {
            toast.error("Your match declined the game invitation.");
        };

        socket.on("game_invite", handleGlobalGameInvite);
        socket.on("game_decline", handleGameDecline);

        return () => {
            socket.off("game_invite", handleGlobalGameInvite);
            socket.off("game_decline", handleGameDecline);
        };
    }, [socket, toast]);

    const handleAcceptInvite = () => {
        if (!pendingGameInvite) return;
        setGameTarget({ id: pendingGameInvite.from, name: pendingGameInvite.senderName });
        if (socket) {
            socket.emit("game_accept", { to: pendingGameInvite.from });
        }
        setPendingGameInvite(null);
    };

    const handleDeclineInvite = () => {
        if (!pendingGameInvite) return;
        if (socket) {
            socket.emit("game_decline", { to: pendingGameInvite.from });
        }
        toast.info("Game invitation declined.");
        setPendingGameInvite(null);
    };

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
    const savedScrollRef = useRef<number>(0);

    // Save scroll before opening chat, restore after closing
    const openChat = (conn: any) => {
        savedScrollRef.current = window.scrollY;
        setSelectedConnection(conn);
    };

    // Global listener for toast clicks
    useEffect(() => {
        const handleOpenChatEvent = (e: any) => {
            if (e.detail && e.detail.partnerId) {
                // Structure matches what ChatWindow expects:
                // interactionId = the partner's userId (chat API uses userId as connectionId)
                // partner = the nested object ChatWindow reads
                openChat({
                    interactionId: e.detail.partnerId,
                    partner: {
                        id: e.detail.partnerId,
                        name: e.detail.partnerName || 'User',
                        photoUrl: e.detail.partnerPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${e.detail.partnerId}`,
                        role: 'Online'
                    }
                });
            }
        };
        const handleChangeTabEvent = (e: any) => {
            if (e.detail && e.detail.tab) {
                setActiveTab(e.detail.tab);
            }
        };
        window.addEventListener('openChat', handleOpenChatEvent);
        window.addEventListener('changeTab', handleChangeTabEvent);
        return () => {
            window.removeEventListener('openChat', handleOpenChatEvent);
            window.removeEventListener('changeTab', handleChangeTabEvent);
        };
    }, []);
    const closeChat = () => {
        setSelectedConnection(null);
        // Restore scroll on next frame after DOM updates layout
        setTimeout(() => {
            window.scrollTo({ top: savedScrollRef.current, behavior: 'instant' });
        }, 50);
    };

    // Sync active chat partner to window global so MessageToastBanner can suppress notifications
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Handle both nested { partner: { id } } and flat { id } connection structures
            const partnerId = selectedConnection?.partner?.id || selectedConnection?.id || null;
            (window as any).__activeChatPartnerId = partnerId;
        }
        return () => {
            if (typeof window !== 'undefined') {
                (window as any).__activeChatPartnerId = null;
            }
        };
    }, [selectedConnection]);

    useEffect(() => {
        setMounted(true);

        const handleOpenStore = () => {
            setInitialStoreTab('coins');
            setShowCoinStore(true);
        };
        window.addEventListener('open_coin_store', handleOpenStore);
        return () => window.removeEventListener('open_coin_store', handleOpenStore);
    }, []);

    useEffect(() => {
        if (!searchParams) return;
        const notificationId = searchParams.get('notificationId');
        const action = searchParams.get('action') || 'notification_body';
        if (notificationId) {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.lifepartnerai.in';
            fetch(`${API_BASE_URL}/notifications/${notificationId}/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            }).catch(err => console.error('[Telemetry] Click tracking failed:', err));
        }
    }, [searchParams]);

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
                // FIX: Only require the essential fields (name, age, gender) to determine onboarding completion.
                // Previously also checked photos/photoUrl which caused redirect loops when:
                //   1. Supabase storage URLs are DNS-blocked (India ISPs) and fall back to dicebear
                //   2. User uploaded via base64 path but server returned proxy URL
                if (!profile || !profile.name || !profile.age || !profile.gender) {
                    router.push('/onboarding');
                    return;
                }
                setCurrentUser(profile);

                // Initialize Push Notifications
                if (Capacitor.isNativePlatform()) {
                    Notifications.init().then(() => Notifications.setupListeners()).catch(console.error);
                } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    // Only automatically initialize on web if they ALREADY granted it.
                    // Otherwise, WebPushPrompt component will handle asking them.
                    Notifications.init().then(() => Notifications.setupListeners()).catch(console.error);
                }

                // Matches - with stale-while-revalidate cache save
                if (matchesResult.status === 'fulfilled') {
                    const freshMatches = matchesResult.value?.matches || [];
                    setMatches(freshMatches);
                    if (freshMatches.length < 200) setHasMore(false);
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

            } catch (err: any) {
                console.error('Auth/init error', err);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    // Load saved Active Tab & Chat Connection on mount (Hydration-safe)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = localStorage.getItem('dashboard_active_tab');
            if (savedTab) {
                setActiveTab(savedTab);
            }
            const savedConn = localStorage.getItem('dashboard_selected_connection');
            if (savedConn) {
                try {
                    setSelectedConnection(JSON.parse(savedConn));
                } catch (e) {
                    console.error("Failed to parse saved connection from cache", e);
                }
            }
        }
    }, []);

    // Sync Active Tab to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboard_active_tab', activeTab);
        }
    }, [activeTab]);

    // Sync Selected Connection to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (selectedConnection) {
                localStorage.setItem('dashboard_selected_connection', JSON.stringify(selectedConnection));
            } else {
                localStorage.removeItem('dashboard_selected_connection');
            }
        }
    }, [selectedConnection]);

    // Check for Deep Links, Payment Return & Actions
    useEffect(() => {
        // Use hook for reactivity
        const orderId = searchParams.get('order_id');
        const action = searchParams.get('action');
        const tab = searchParams.get('tab');
        const edit = searchParams.get('edit');
        const chatId = searchParams.get('chatId');

        if (tab) {
            setActiveTab(tab);
            if (tab === 'profile' && edit === 'true') {
                setIsEditingProfile(true);
            }
        }
        if (chatId) {
            setActiveTab('connections');
            // Auto open the chat window! The internal ChatWindow component will fetch the real name/photo
            setSelectedConnection({
                interactionId: chatId,
                partner: {
                    id: chatId,
                    name: 'Partner',
                    photoUrl: ''
                }
            });
            
            // Clean URL without refresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('chatId');
            window.history.replaceState({}, '', newUrl.toString());
        }

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

    const primaryNavItems = useMemo(() => [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'matches', label: 'Matches', icon: Heart },
        { id: 'live_events', label: 'Live Video', icon: Radio, highlight: true },
        { id: 'connections', label: 'Chat', icon: MessageCircle, badge: unreadMessageCount },
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount },
    ], [unreadMessageCount, requestsCount]);

    const secondaryNavItems = useMemo(() => [
        { id: 'map', label: 'Live Map', icon: MapPin },
        { id: 'events', label: 'Meetups', icon: Calendar },
        { id: 'community', label: 'Lounge', icon: Coffee },
    ], []);

    const navItems = useMemo(() => [...primaryNavItems, ...secondaryNavItems], [primaryNavItems, secondaryNavItems]);

    // Fetch data based on active tab — guard against repeated re-fetches on tab switch
    // FIX: These refs prevent double-fetching within a single session, but reset on
    // component unmount so navigating away and back always loads fresh data.
    const hasFetchedRequests = useRef(false);
    const hasFetchedConnections = useRef(false);

    useEffect(() => {
        if (!hasFetchedConnections.current) {
            hasFetchedConnections.current = true;
            fetchConnections();
        }
        if (activeTab === 'requests' && !hasFetchedRequests.current) {
            hasFetchedRequests.current = true;
            fetchRequests();
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
    };

    const fetchMatches = async (pageNum = 1) => {
        try {
            if (pageNum > 1) setLoadingMore(true);
            const data = await api.matches.getAll(pageNum);
            const newMatches = data.matches || [];
            
            if (newMatches.length < 200) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (pageNum === 1) {
                setMatches(newMatches);
            } else {
                setMatches(prev => [...prev, ...newMatches]);
            }
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load matches', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchRequests = async () => {
        try {
            if (requests.length === 0) setLoading(true);
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
            if (connections.length === 0) setLoading(true);
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

    // Get filtered matches (Memoized for smooth 60fps tab switching)
    const displayMatches = useMemo(() => {
        return activeFilters ? filterMatches(matches) : matches;
    }, [matches, activeFilters]);

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
            localStorage.removeItem('dashboard_active_tab');
            localStorage.removeItem('dashboard_selected_connection');
            router.push('/login');
        }
    };

    const handleDeactivateAccount = async () => {
        if (confirm("Are you sure you want to deactivate your account for 15 days?\n\nThis will temporarily hide your profile, reels, and stories from other users. You can reactivate it at any time by logging back in.")) {
            try {
                await api.profile.deactivateAccount(15);
                toast.success("Account deactivated successfully.");
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('dashboard_active_tab');
                localStorage.removeItem('dashboard_selected_connection');
                router.push('/login');
            } catch (err: any) {
                toast.error(err.message || "Failed to deactivate account.");
            }
        }
    };

    const handleDeleteAccount = async () => {
        const confirmName = prompt("WARNING: This will permanently delete your account, matches, messages, and all data. This action is irreversible.\n\nTo proceed, please type 'DELETE' below:");
        if (confirmName === 'DELETE') {
            try {
                await api.profile.deleteAccount();
                toast.success("Your account has been permanently deleted.");
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('dashboard_active_tab');
                localStorage.removeItem('dashboard_selected_connection');
                router.push('/login');
            } catch (err: any) {
                toast.error(err.message || "Failed to delete account.");
            }
        } else if (confirmName !== null) {
            toast.error("Confirmation text did not match. Deletion cancelled.");
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
            <div className="max-w-7xl mx-auto px-4 h-16 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Premium Logo (Compact on mobile for max header space) */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
                        <div className="relative">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md shadow-purple-500/20 group-hover:scale-105 transition-all duration-300 border border-purple-500/30 bg-gray-950 flex items-center justify-center shrink-0">
                                <img src="/icon.png" alt="LifePartner AI Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-40 blur-lg transition-opacity pointer-events-none"></div>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-heading font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                LifePartner
                            </span>
                            <span className="text-xl font-heading font-bold text-gray-800 dark:text-gray-200"> AI</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 p-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-sm overflow-x-auto no-scrollbar">
                        {navItems.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap
                                    ${'highlight' in item && item.highlight
                                        ? activeTab === item.id
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                                            : 'bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 text-violet-700 dark:text-violet-300 hover:from-violet-200 hover:to-indigo-200'
                                        : activeTab === item.id
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white'}
                                `}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                                {'highlight' in item && item.highlight && activeTab !== item.id && (
                                    <span className="inline-flex w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                )}
                                {item.badge ? (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>
                                ) : null}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                    {/* Always Visible Coin Balance Badge */}
                    {currentUser && (
                        <button
                            onClick={() => {
                                setInitialStoreTab('coins');
                                setShowCoinStore(true);
                            }}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/20 hover:from-amber-500/20 hover:to-yellow-500/30 text-amber-700 dark:text-amber-300 px-2.5 py-1.5 rounded-full text-xs font-black transition-all border border-amber-300/80 dark:border-amber-700/60 shadow-sm shrink-0 active:scale-95"
                            title="Coins Balance - Click to add coins"
                        >
                            <Coins size={15} className="fill-amber-400 text-amber-600 dark:text-amber-300 shrink-0" />
                            <span className="font-extrabold">{currentUser.coins || 0}</span>
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

    if (loading && !currentUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-950 relative overflow-hidden">
                {/* Decorative background orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
                    {/* Bouncing Sparkles Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-bounce">
                        <Sparkles className="text-white" size={40} fill="white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-center">
                            <span>LifePartner</span>
                            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">AI</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-wide">
                            Setting up your personalized matches feed...
                        </p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex gap-2.5 mt-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-[bounce_1s_infinite_0ms]"></span>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[bounce_1s_infinite_200ms]"></span>
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-[bounce_1s_infinite_400ms]"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-background font-sans text-foreground pb-safe ${activeTab === 'map' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
            {renderHeader()}
            <main className={`flex-1 w-full max-w-7xl mx-auto lg:px-8 flex gap-8 ${activeTab === 'map' ? 'pt-0 px-0 sm:pt-6 overflow-hidden' : 'pt-3 sm:pt-6 px-3 sm:px-4'}`}>
                {/* Main Feed Column */}
                <div className={`flex-1 min-w-0 flex flex-col ${activeTab === 'map' ? 'pb-0 h-full' : 'pb-28 sm:pb-24'}`}>
                    <div className={activeTab === 'home' ? 'block' : 'hidden'}>
                        {visitedTabs.has('home') && (
                            <HomeTab
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                matches={matches}
                                onNavigateTab={(tab) => {
                                    if (tab === 'profile_edit') {
                                        setActiveTab('profile');
                                        setIsEditingProfile(true);
                                    } else {
                                        setActiveTab(tab);
                                    }
                                }}
                                onSelectProfile={setSelectedProfile}
                                onSelectKundli={setSelectedKundli}
                                onJoinLiveRoom={async (event?: any) => {
                                    if (event && (event.host_name || event.host_id)) {
                                        const myUserId = currentUser?.id || currentUser?.userId;
                                        if (myUserId && event.host_id === myUserId) {
                                            startCall({
                                                id: myUserId,
                                                name: event.title || 'Your Live Broadcast',
                                                photoUrl: currentUser.avatar_url || currentUser.photoUrl || event.host_avatar,
                                                _isHostRoom: true,
                                                eventId: event.id
                                            }, 'speed_date');
                                        } else {
                                            try {
                                                const res = await fetchAPI('/dates/events/join', {
                                                    method: 'POST',
                                                    body: JSON.stringify({ event_id: event.id })
                                                });
                                                if (res && res.error) {
                                                    toast.error(res.error);
                                                    return;
                                                }
                                            } catch (e: any) {
                                                toast.error(e.message || "Failed to join live event");
                                                return;
                                            }
                                            startCall({
                                                id: event.host_id || event.id,
                                                name: event.host_name,
                                                photoUrl: event.host_avatar,
                                                _speedDateInitiator: true
                                            }, 'speed_date');
                                        }
                                    } else {
                                        setShowSpeedDatingLobby(true);
                                    }
                                }}
                                onOpenStory={(storySet) => setActiveStorySet(storySet)}
                            />
                        )}
                    </div>

                    <div className={activeTab === 'live_events' ? 'block' : 'hidden'}>
                        {visitedTabs.has('live_events') && (
                            <LiveVideoEventsHub
                                onJoinLive={async (event?: any) => {
                                    if (event && (event.host_name || event.host_id)) {
                                        const myUserId = currentUser?.id || currentUser?.userId;
                                        if (myUserId && event.host_id === myUserId) {
                                            startCall({
                                                id: myUserId,
                                                name: event.title || 'Your Live Broadcast',
                                                photoUrl: currentUser.avatar_url || currentUser.photoUrl || event.host_avatar,
                                                _isHostRoom: true,
                                                eventId: event.id
                                            }, 'speed_date');
                                        } else {
                                            try {
                                                const res = await fetchAPI('/dates/events/join', {
                                                    method: 'POST',
                                                    body: JSON.stringify({ event_id: event.id })
                                                });
                                                if (res && res.error) {
                                                    toast.error(res.error);
                                                    return;
                                                }
                                            } catch (e: any) {
                                                toast.error(e.message || "Failed to join live event");
                                                return;
                                            }
                                            startCall({
                                                id: event.host_id || event.id,
                                                name: event.host_name,
                                                photoUrl: event.host_avatar,
                                                _speedDateInitiator: true
                                            }, 'speed_date');
                                        }
                                    } else {
                                        setShowSpeedDatingLobby(true);
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div className={activeTab === 'matches' ? 'block' : 'hidden'}>
                        {visitedTabs.has('matches') && (
                            <>
                                <InstantsBar />
                                <MatchesTab
                                    currentUser={currentUser}
                                    setCurrentUser={setCurrentUser}
                                    matches={matches}
                                    setMatches={setMatches}
                                    fetchMatches={fetchMatches}
                                    hasMore={hasMore}
                                    loadingMore={loadingMore}
                                    page={page}
                                    activeFilters={activeFilters}
                                    setActiveFilters={setActiveFilters}
                                    setSelectedProfile={setSelectedProfile}
                                    setSelectedKundli={setSelectedKundli}
                                    setGiftData={setGiftData}
                                    connections={connections}
                                    openChat={openChat}
                                    setActiveTab={setActiveTab}
                                    setShowCoinStore={setShowCoinStore}
                                    setShowSpeedDatingLobby={setShowSpeedDatingLobby}
                                />
                            </>
                        )}
                    </div>

                    <div className={activeTab === 'map' ? 'block h-full' : 'hidden'}>
                        {visitedTabs.has('map') && (
                            <InteractiveMap profiles={mapProfiles} currentUser={currentUser} onViewProfile={setSelectedProfile} onBack={() => setActiveTab('matches')} />
                        )}
                    </div>

                    <div className={activeTab === 'requests' ? 'block' : 'hidden'}>
                        {visitedTabs.has('requests') && (
                            <RequestsTab
                                requests={requests}
                                handleAcceptRequest={handleAcceptRequest}
                                handleDeclineRequest={handleDeclineRequest}
                                loading={loading}
                            />
                        )}
                    </div>

                    <div className={activeTab === 'connections' ? 'block' : 'hidden'}>
                        {visitedTabs.has('connections') && (
                            <ConnectionsTab
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                connections={connections}
                                setConnections={setConnections}
                                onlineUsers={onlineUsers}
                                openChat={openChat}
                                setGameTarget={setGameTarget}
                                setUnreadMessageCount={setUnreadMessageCount}
                                onOpenStory={(storySet) => setActiveStorySet(storySet)}
                            />
                        )}
                    </div>

                    <div className={activeTab === 'events' ? 'block' : 'hidden'}>
                        {visitedTabs.has('events') && (
                            <MeetSpots currentUser={currentUser} />
                        )}
                    </div>

                    <div className={activeTab === 'community' ? 'block' : 'hidden'}>
                        {visitedTabs.has('community') && (
                            <div className="h-[calc(100dvh-180px)] md:h-[calc(100vh-140px)] pt-2">
                                <CommunityChat currentUser={currentUser} onClose={() => setActiveTab('matches')} onOpenStore={() => {
                                    setInitialStoreTab('premium');
                                    setShowCoinStore(true);
                                }} />
                            </div>
                        )}
                    </div>

                    <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                        {visitedTabs.has('profile') && currentUser && (
                            isEditingProfile ? (
                                <ProfileEditor
                                    initialData={currentUser}
                                    onSave={async (newData) => {
                                        setCurrentUser(newData);
                                        setIsEditingProfile(false);
                                        toast.success("Profile Saved!");

                                        try {
                                            const freshData = await api.profile.getMe();
                                            setCurrentUser(freshData);
                                        } catch (e) { console.error("Refresh failed", e); }
                                    }}
                                    onCancel={() => setIsEditingProfile(false)}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <ProfileView
                                        profile={currentUser}
                                        onEdit={() => setIsEditingProfile(true)}
                                    />

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
                                                <div className="text-[10px] text-emerald-600 dark:text-indigo-400">Refer Friend</div>
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

                                    {/* Account Settings Section */}
                                    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <ShieldAlert className="text-amber-500" size={20} />
                                                Account Settings & Privacy
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Manage your account visibility and permanent data removal.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Deactivate Option */}
                                            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors flex flex-col justify-between space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Deactivate Account (15 Days)</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Temporarily hide your profile, reels, and stories from other users. You can reactivate by logging back in at any time.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDeactivateAccount}
                                                    className="w-full justify-center border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold"
                                                >
                                                    Deactivate Account
                                                </Button>
                                            </div>

                                            {/* Delete Option */}
                                            <div className="p-4 rounded-xl border border-dashed border-red-100 dark:border-red-900/20 bg-red-50/10 dark:bg-red-950/5 hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-colors flex flex-col justify-between space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Permanently Delete Account</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Permanently delete your profile, messages, matches, and all other database records. This action is irreversible.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDeleteAccount}
                                                    className="w-full justify-center border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold"
                                                >
                                                    Delete Permanently
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
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

            

            {selectedConnection && (
                <ChatWindow
                    connectionId={selectedConnection.interactionId || selectedConnection.id}
                    partner={selectedConnection.partner || {
                        id: selectedConnection.id,
                        name: selectedConnection.name || 'User',
                        photoUrl: selectedConnection.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedConnection.id}`,
                    }}
                    onClose={closeChat}
                    onVideoCall={() => startCall(selectedConnection.partner || selectedConnection, 'video', selectedConnection.interactionId)}
                    onAudioCall={() => startCall(selectedConnection.partner || selectedConnection, 'audio', selectedConnection.interactionId)}
                    onMessagesRead={() => handleMarkRead(selectedConnection.partner?.id || selectedConnection.id)}
                    onMessageSent={() => handleMessageSentAction(selectedConnection.partner?.id || selectedConnection.id)}
                />
            )}

            {selectedProfile && (() => {
                const latestMatch = matches.find((m: any) => m.id === selectedProfile.id);
                const profileToShow = latestMatch ? { ...selectedProfile, match_status: latestMatch.match_status } : selectedProfile;
                return (
                    <ProfileModal
                        profile={profileToShow}
                        currentUser={currentUser}
                        onClose={() => setSelectedProfile(null)}
                        onConnect={() => {
                            // Mark this match as pending in-state so "Request Sent" shows immediately
                            setMatches(prev => prev.map(m =>
                                m.id === profileToShow.id ? { ...m, match_status: 'pending' } : m
                            ));
                            // Invalidate localStorage cache so next fetch returns fresh pending status
                            try { localStorage.removeItem('matches_cache_v2'); } catch (e) {}
                            toast.success(`Interest sent to ${profileToShow.name}!`);
                        }}
                        isConnectedProp={connections.some((c: any) => c.partner?.id === profileToShow.id)}
                        onChat={() => {
                            const conn = connections.find((c: any) => c.partner?.id === profileToShow.id);
                            setSelectedProfile(null);
                            if (conn) {
                                openChat(conn);
                            } else {
                                setActiveTab('connections');
                            }
                        }}
                        onUpgrade={() => {
                            setSelectedProfile(null);
                            setShowCoinStore(true);
                        }}
                    />
                );
            })()}

            {/* Video Call Modal - UPDATED: Handled globally by GlobalCallUI, removed from here */}

            {/* Speed Dating Modals */}
            {showSpeedDatingLobby && (
                <SpeedDatingLobby
                    onClose={() => setShowSpeedDatingLobby(false)}
                    onMatchFound={(partner: any, initiator: boolean) => {
                        setShowSpeedDatingLobby(false);
                        // Both sides open the modal immediately.
                        // Initiator: no incomingCall → calls callUser() to send WebRTC offer
                        // Receiver: waits; when offer arrives via socket, CallContext replaces this
                        //           state with incomingCallData so auto-answer fires correctly
                        startCall({ ...partner, _speedDateInitiator: initiator }, 'speed_date');
                    }}
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

            {/* Web Push Prompt (Condition handled inside component) */}
            <WebPushPrompt />

            {/* Game Modal - Launched from Connections List */}
            {gameTarget && (
                <GameModal
                    onClose={() => setGameTarget(null)}
                    partnerName={gameTarget.name}
                    partnerId={gameTarget.id}
                />
            )}

            {/* Explicit Consent Game Invitation Popup */}
            {pendingGameInvite && (
                <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-white">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/30">
                            🎮
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg">Game Invitation</h3>
                            <p className="text-xs text-slate-300 mt-1">
                                <strong className="text-white">{pendingGameInvite.senderName}</strong> wants to play <strong className="text-emerald-400">Snakes & Ladders Arena</strong> with you!
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleDeclineInvite} variant="outline" className="flex-1 rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800">
                                Decline
                            </Button>
                            <Button onClick={handleAcceptInvite} className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg">
                                Accept & Join
                            </Button>
                        </div>
                    </div>
                </div>
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

            {activeTab === 'matches' && <FloatingLoveGuru />}

            {showStreakModal && streakData && (
                <DailyStreakModal
                    streakData={streakData}
                    onClose={() => setShowStreakModal(false)}
                    onClaimSuccess={(newBal, newStreak) => {
                        if (currentUser) setCurrentUser({ ...currentUser, coins: newBal });
                        setStreakData((prev: any) => ({ ...prev, canClaimToday: false, streakCount: newStreak }));
                    }}
                />
            )}

            {activeStorySet && (
                <StoryModal
                    stories={activeStorySet.stories}
                    initialIndex={0}
                    user={activeStorySet.user}
                    currentUser={currentUser}
                    onClose={() => setActiveStorySet(null)}
                    onDelete={async (deletedId: string) => {
                        try {
                            await api.profile.deleteStory(deletedId);
                            // Update currentUser stories locally
                            if (currentUser && currentUser.stories) {
                                const remainingStories = currentUser.stories.filter((s: any) => String(s.id) !== String(deletedId));
                                setCurrentUser({ ...currentUser, stories: remainingStories });
                            }
                            // Update activeStorySet locally
                            setActiveStorySet((prev: any) => {
                                if (!prev) return null;
                                const remaining = prev.stories.filter((s: any) => String(s.id) !== String(deletedId));
                                if (remaining.length === 0) return null;
                                return { ...prev, stories: remaining };
                            });
                            // Re-fetch me
                            api.profile.getMe().then(res => { if (res) setCurrentUser(res); });
                        } catch (e: any) {
                            console.error('Delete Story Error:', e);
                        }
                    }}
                    onStoryViewed={(storyId) => {
                        setActiveStorySet(prev => {
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
                    onHighlightToggle={(storyId, isHighlight) => {
                        setCurrentUser((prev: any) => {
                            if (!prev) return prev;
                            const updated = (prev.stories || []).map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updated };
                        });
                        setActiveStorySet((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const updated = prev.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updated };
                        });
                    }}
                />
            )}

            {/* End of Main Content - Duplicate Block Removed */}
        </div >
    );
}
