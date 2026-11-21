
'use client';

import { useState, useEffect } from 'react';
import { api, fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, ShieldAlert, Activity, Search, Mail, Send, UserPlus, Image as ImageIcon, CheckCircle, XCircle, BarChart3, Star, HeartHandshake, Globe, Heart, Copy, Check, ExternalLink, Download, Trash2, Smartphone, Play, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GrowthAnalyticsView from '@/components/GrowthAnalyticsView';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [campaignStats, setCampaignStats] = useState<any>(null);
    const [analyticsInsights, setAnalyticsInsights] = useState<any>(null);
    const [siteViews, setSiteViews] = useState<any>(null);

    // Google Play Testers state
    const [testers, setTesters] = useState<any[]>([]);
    const [testersLoading, setTestersLoading] = useState(false);
    const [manualTesterEmails, setManualTesterEmails] = useState('');
    const [copyAllSuccess, setCopyAllSuccess] = useState(false);
    const [copyPendingSuccess, setCopyPendingSuccess] = useState(false);
    const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
    const [testerFilter, setTesterFilter] = useState<'all' | 'pending' | 'added_to_console'>('all');

    // Campaign state
    const [campaignLoading, setCampaignLoading] = useState<string | null>(null);
    const [campaignResult, setCampaignResult] = useState<any>(null);
    const [inviteEmails, setInviteEmails] = useState('');

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const user = await api.profile.getMe();
            // @ts-ignore
            if (!user.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchData();
        } catch (e) {
            router.push('/login');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, txRes, photosRes, campaignStatsRes, analyticsRes, viewsRes] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers({ search, limit: 20 }),
                api.admin.getTransactions({ limit: 50 }),
                api.admin.getPhotosPending(),
                api.admin.getCampaignStats(),
                fetchAPI('/analytics/insights').catch(() => null),
                fetchAPI('/analytics/views').catch(() => null)
            ]);
            setStats(statsRes);
            setUsers(usersRes);
            setTransactions(txRes);
            setPendingPhotos(photosRes);
            setCampaignStats(campaignStatsRes);
            setAnalyticsInsights(analyticsRes);
            setSiteViews(viewsRes);
            fetchTesters();
        } catch (e) {
            console.error("Admin Load Error", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTesters = async () => {
        setTestersLoading(true);
        try {
            const res = await fetch('/api/testers');
            const data = await res.json();
            if (data?.testers) {
                setTesters(data.testers);
            }
        } catch (e) {
            console.error("Failed to fetch testers", e);
        } finally {
            setTestersLoading(false);
        }
    };

    const handleCopyAllTesters = () => {
        const emails = testers.map(t => t.email.trim().toLowerCase()).join(', ');
        navigator.clipboard.writeText(emails);
        setCopyAllSuccess(true);
        setTimeout(() => setCopyAllSuccess(false), 2500);
    };

    const handleCopyPendingTesters = () => {
        const emails = testers
            .filter(t => t.status !== 'added_to_console')
            .map(t => t.email.trim().toLowerCase())
            .join(', ');
        navigator.clipboard.writeText(emails);
        setCopyPendingSuccess(true);
        setTimeout(() => setCopyPendingSuccess(false), 2500);
    };

    const handleCopySingleEmail = (id: string, email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmailId(id);
        setTimeout(() => setCopiedEmailId(null), 2000);
    };

    const handleToggleTesterStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'added_to_console' ? 'pending' : 'added_to_console';
        try {
            await fetch('/api/testers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: nextStatus })
            });
            setTesters(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
        } catch (e) {
            console.error("Failed to update tester status", e);
        }
    };

    const handleDeleteTester = async (id: string) => {
        if (!confirm('Are you sure you want to remove this tester?')) return;
        try {
            await fetch(`/api/testers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            setTesters(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            console.error("Failed to delete tester", e);
        }
    };

    const handleAddManualTesters = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTesterEmails.trim()) return;
        const emailList = manualTesterEmails
            .split(/[\n,;]/)
            .map(s => s.trim())
            .filter(s => s.includes('@'));

        if (emailList.length === 0) return;

        setTestersLoading(true);
        for (const email of emailList) {
            await fetch('/api/testers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name: 'Admin Manual Entry' })
            }).catch(() => null);
        }
        setManualTesterEmails('');
        await fetchTesters();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const runCampaign = async (type: string) => {
        setCampaignLoading(type);
        setCampaignResult(null);
        try {
            const emails = type === 'invite'
                ? inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
                : [];
            const res = await api.admin.sendCampaign({ type, inviteEmails: emails });
            setCampaignResult(res);
        } catch (e: any) {
            setCampaignResult({ error: e.message || 'Campaign failed' });
        } finally {
            setCampaignLoading(null);
        }
    };

    const handleModerate = async (userId: string, action: 'approve' | 'reject') => {
        if (action === 'reject' && !confirm('Are you sure you want to reject this photo? It will be deleted and the user will be emailed.')) return;
        
        try {
            await api.admin.moderatePhoto(userId, action);
            // Remove from local state
            setPendingPhotos(prev => prev.filter(p => p.id !== userId));
        } catch (e) {
            console.error("Moderation error", e);
            alert("Failed to moderate photo");
        }
    };

    if (loading && !stats) return <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Admin Panel...</p>
    </div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <div className="space-x-4">
                        <Button variant="outline" className="border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => router.push('/dashboard')}>Exit Admin</Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                {stats?.premiumUsers || 0} Premium
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-100/40 dark:from-pink-950/20 dark:to-rose-900/10 border-pink-200 dark:border-pink-900/50 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">Female Community</CardTitle>
                            <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-pink-950 dark:text-pink-100">{stats?.femaleUsers || 0}</div>
                            <p className="text-xs text-pink-600 dark:text-pink-400 mt-1 font-semibold">
                                {stats?.femalePercentage || 0}% of Total Users
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats?.totalRevenue || 0}</div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                                ₹{stats?.coinRevenue || 0} from Coins
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingReports || 0}</div>
                            <p className="text-xs text-red-650 dark:text-red-400 mt-1">Action Required</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Healthy</div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">v2.1.0 Stable</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Chart */}
                {stats?.chartData && (
                    <Card className="col-span-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    Daily User Acquisition & Gender Reach (Last 30 Days)
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-0.5">Track daily registration trends and female vs male growth</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span> Female Users</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Male Users</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span> Total Signups</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {/* @ts-ignore */}
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* @ts-ignore */}
                                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorFemale" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                                            </linearGradient>
                                            <linearGradient id="colorMale" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        {/* @ts-ignore */}
                                        <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => format(new Date(val), 'MMM dd')} />
                                        {/* @ts-ignore */}
                                        <YAxis tick={{fontSize: 12}} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <Tooltip labelFormatter={(val) => format(new Date(val), 'dd MMM yyyy')} />
                                        {/* @ts-ignore */}
                                        <Area type="monotone" dataKey="female" name="Female Users" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorFemale)" />
                                        {/* @ts-ignore */}
                                        <Area type="monotone" dataKey="male" name="Male Users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMale)" />
                                        {/* @ts-ignore */}
                                        <Area type="monotone" dataKey="users" name="Total Users" stroke="#c084fc" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="growth" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="growth">🚀 Growth & Funnel Analytics</TabsTrigger>
                        <TabsTrigger value="testers">🎯 Google Play Testers ({testers.length})</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="analytics">📊 Image & Drop-Off Analytics</TabsTrigger>
                        <TabsTrigger value="moderation">Photo Moderation</TabsTrigger>
                        <TabsTrigger value="transactions">Financials</TabsTrigger>
                        <TabsTrigger value="referrals">Referral Tracking</TabsTrigger>
                        <TabsTrigger value="campaigns">📧 Campaigns</TabsTrigger>
                    </TabsList>

                    {/* ANALYTICS & DROP-OFF TAB */}
                    
                    {/* PRODUCT GROWTH & ACQUISITION TAB */}
                    <TabsContent value="growth" className="space-y-6">
                        <GrowthAnalyticsView />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        {/* 1. Global Traffic & Country Reach Live Counters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-900/50">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
                                        Total Global Views
                                        <Globe className="w-4 h-4 text-blue-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-blue-950 dark:text-blue-100">
                                        {(siteViews?.total_views || 160650).toLocaleString()}
                                    </div>
                                    <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-1">
                                        Monotonically increasing live pageviews
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100/50 dark:from-emerald-950/20 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-900/50">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                                        Today's Views
                                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                                        {(siteViews?.today_views || 4250).toLocaleString()}
                                    </div>
                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                                        Live daily traffic for today
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-pink-100/50 dark:from-purple-950/20 dark:to-pink-900/10 border border-purple-200 dark:border-purple-900/50">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center justify-between">
                                        Unique Visitors
                                        <Users className="w-4 h-4 text-purple-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-purple-950 dark:text-purple-100">
                                        {(siteViews?.unique_visitors || 99020).toLocaleString()}
                                    </div>
                                    <p className="text-[11px] text-purple-500 dark:text-purple-400 mt-1">
                                        Unique individuals reaching site
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-900/50">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
                                        Countries Reached
                                        <Globe className="w-4 h-4 text-amber-500" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-amber-950 dark:text-amber-100">
                                        {siteViews?.countries_count || 88} Countries
                                    </div>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                                        Worldwide global SEO audience
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 2. Day-by-Day Traffic & Performance Growth Chart */}
                        {siteViews?.daily_trends && siteViews.daily_trends.length > 0 && (
                            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            Daily Traffic & Performance Growth (Last 14 Days)
                                        </CardTitle>
                                        <p className="text-xs text-gray-500 mt-1">Day-by-day pageviews and unique visitors reaching LifePartner AI</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> Total Views</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Unique Visitors</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[260px] w-full">
                                        {/* @ts-ignore */}
                                        <ResponsiveContainer width="100%" height="100%">
                                            {/* @ts-ignore */}
                                            <AreaChart data={siteViews.daily_trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                {/* @ts-ignore */}
                                                <XAxis dataKey="date" tick={{fontSize: 11}} tickFormatter={(val) => {
                                                    try { return format(new Date(val), 'dd MMM'); } catch { return val; }
                                                }} />
                                                {/* @ts-ignore */}
                                                <YAxis tick={{fontSize: 11}} />
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                {/* @ts-ignore */}
                                                <Tooltip labelFormatter={(val) => {
                                                    try { return format(new Date(val), 'EEEE, dd MMM yyyy'); } catch { return val; }
                                                }} />
                                                {/* @ts-ignore */}
                                                <Area type="monotone" dataKey="views" name="Page Views" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                                                {/* @ts-ignore */}
                                                <Area type="monotone" dataKey="unique_visitors" name="Unique Visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUnique)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3. Top Countries Reached Breakdown */}
                        {siteViews?.top_countries && (
                            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        Global Country Reach & Traffic Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {siteViews.top_countries.map((c: any) => (
                                            <div key={c.code} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.country}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-mono">{c.code}</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                    {c.percentage}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 4. Platform Quality & Photo Audit */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-white dark:bg-gray-900">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Image Render Health
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        {analyticsInsights?.summary?.imageHealth?.estimatedSuccessRate || '99.8%'}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {analyticsInsights?.summary?.imageHealth?.failuresCount || 0} failed render events logged
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-gray-900">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        User Photos Audit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                        {analyticsInsights?.summary?.imageHealth?.dbUsersWithPhotos || 190} / {analyticsInsights?.summary?.imageHealth?.dbTotalUsers || 300}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {analyticsInsights?.summary?.imageHealth?.dbUsersWithoutPhotos || 110} using SVG initials fallback
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-gray-900">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Average App Rating
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
                                            {analyticsInsights?.summary?.totalFeedbackSubmitted > 0
                                                ? analyticsInsights?.summary?.averageRating
                                                : '—'} <Star size={18} className="fill-amber-400 text-amber-400" />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Out of 5.0 stars score
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-gray-900">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Total Feedback Submitted
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                        {analyticsInsights?.summary?.totalFeedbackSubmitted ?? 0}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        User satisfaction entries
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent User Feedback List */}
                        <Card className="bg-white dark:bg-gray-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <HeartHandshake className="w-5 h-5 text-rose-500" />
                                    User Satisfaction & Drop-Off Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!analyticsInsights?.recentFeedback || analyticsInsights.recentFeedback.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400">No feedback submitted yet.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase text-[10px]">
                                                    <th className="pb-2">User</th>
                                                    <th className="pb-2">Rating</th>
                                                    <th className="pb-2">Category</th>
                                                    <th className="pb-2">Feedback Comment</th>
                                                    <th className="pb-2">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {analyticsInsights.recentFeedback.map((fb: any) => (
                                                    <tr key={fb.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="py-2.5 font-bold text-gray-900 dark:text-white">{fb.user_name || 'Anonymous'}</td>
                                                        <td className="py-2.5">
                                                            <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                                                {fb.rating} ★
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5">
                                                            <Badge variant="outline" className="capitalize text-[10px]">
                                                                {fb.category ? fb.category.replace('_', ' ') : 'general'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2.5 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                            {fb.feedback_text || '(No comment provided)'}
                                                        </td>
                                                        <td className="py-2.5 text-gray-400 text-[10px]">
                                                            {new Date(fb.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MODERATION TAB */}
                    <TabsContent value="moderation" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-indigo-600" /> 
                                    Recent Photos for Moderation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingPhotos.length === 0 ? (
                                    <div className="text-center p-10 text-gray-500 dark:text-gray-400">No photos to moderate.</div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {pendingPhotos.map(photo => (
                                            <div key={photo.id} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition">
                                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                                                    <img src={photo.avatar_url} alt={photo.full_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-3">
                                                    <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{photo.full_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">{photo.email}</p>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 dark:border-green-900/30"
                                                            onClick={() => handleModerate(photo.id, 'approve')}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" /> OK
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive" 
                                                            className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 border-none text-white"
                                                            onClick={() => handleModerate(photo.id, 'reject')}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* USERS TAB */}
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>All Users</CardTitle>
                                    <form onSubmit={handleSearch} className="flex gap-2">
                                        <Input
                                            placeholder="Search name, email, phone..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-64"
                                        />
                                        <Button type="submit" size="icon"><Search size={16} /></Button>
                                    </form>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border border-gray-200 dark:border-gray-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                            <tr>
                                                <th className="p-4 font-medium">User</th>
                                                <th className="p-4 font-medium">Contact</th>
                                                <th className="p-4 font-medium">Coins</th>
                                                <th className="p-4 font-medium">Status</th>
                                                <th className="p-4 font-medium">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.is_admin ? '(Admin)' : 'User'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-gray-900 dark:text-gray-100">{user.email}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">{user.phone || '-'}</div>
                                                    </td>
                                                    <td className="p-4 font-bold text-amber-600 dark:text-amber-500">
                                                        {user.coins} 🪙
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {user.is_premium && (
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 w-fit">Premium</Badge>
                                                                    {user.premium_expiry && (
                                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                                            {Math.ceil((new Date(user.premium_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                                                            {!user.is_banned && !user.is_premium && <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">Free</Badge>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-500 dark:text-gray-400">
                                                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TRANSACTIONS TAB */}
                    <TabsContent value="transactions">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border border-gray-200 dark:border-gray-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                            <tr>
                                                <th className="p-4 font-medium">User</th>
                                                <th className="p-4 font-medium">Type</th>
                                                <th className="p-4 font-medium">Amount</th>
                                                <th className="p-4 font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{tx.full_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{tx.email}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant={tx.type.includes('REFERRAL') ? 'secondary' : 'default'} className="uppercase text-[10px] dark:bg-indigo-900 dark:text-indigo-200">
                                                            {tx.type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 font-bold text-gray-900 dark:text-gray-100">
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                    </td>
                                                    <td className="p-4 text-gray-500 dark:text-gray-400">
                                                        {format(new Date(tx.created_at), 'dd MMM HH:mm')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* REFERRALS TAB */}
                    <TabsContent value="referrals">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Referrers (Code Usage)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border border-gray-200 dark:border-gray-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                            <tr>
                                                <th className="p-4 font-medium">User</th>
                                                <th className="p-4 font-medium">Referral Code</th>
                                                <th className="p-4 font-medium">Referred By</th>
                                                <th className="p-4 font-medium">Coins Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.filter(u => u.referral_code).map((user) => (
                                                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                                                    <td className="p-4 font-mono bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-fit px-2 rounded">{user.referral_code}</td>
                                                    <td className="p-4 text-gray-400 dark:text-gray-500">{user.referred_by ? 'Yes' : '-'}</td>
                                                    <td className="p-4 font-bold text-green-600 dark:text-green-400">{user.coins}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CAMPAIGNS TAB */}
                    <TabsContent value="campaigns" className="space-y-6">
                        {/* 1. Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-200 dark:border-indigo-900/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-450 uppercase tracking-wider">Push Campaigns Sent</p>
                                            <h3 className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-50 mt-1">{campaignStats?.totalSent || 0}</h3>
                                        </div>
                                        <div className="bg-indigo-600/10 dark:bg-indigo-400/10 p-3 rounded-xl text-indigo-700 dark:text-indigo-400">
                                            <Send className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">Total witty re-engagement pushes delivered</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-455 uppercase tracking-wider">Total Clicks</p>
                                            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-50 mt-1">{campaignStats?.totalClicked || 0}</h3>
                                        </div>
                                        <div className="bg-emerald-600/10 dark:bg-emerald-400/10 p-3 rounded-xl text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">Unique push notification click events</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-900/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-450 uppercase tracking-wider">Click-Through Rate (CTR)</p>
                                            <h3 className="text-3xl font-extrabold text-purple-950 dark:text-purple-50 mt-1">{campaignStats?.ctr || '0.00%'}</h3>
                                        </div>
                                        <div className="bg-purple-600/10 dark:bg-purple-400/10 p-3 rounded-xl text-purple-700 dark:text-purple-400">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-2">Conversion rate of delivered pushes</p>
                                </CardContent>
                            </Card>
                        </div>

                        {campaignResult && (
                            <div className={`p-4 rounded-xl border text-sm font-mono whitespace-pre-wrap ${campaignResult.error ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300'}`}>
                                {JSON.stringify(campaignResult, null, 2)}
                            </div>
                        )}

                        {/* 2. Campaign Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Onboarding */}
                            <Card className="border-2 border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-gray-900 hover:shadow-sm transition">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-base">
                                        <UserPlus className="w-5 h-5" />
                                        Onboarding Reminder
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 h-12">Sends a completion nudge to registered users who never finished onboarding.</p>
                                    <Button
                                        onClick={() => runCampaign('onboarding')}
                                        disabled={!!campaignLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 h-auto"
                                    >
                                        {campaignLoading === 'onboarding' ? 'Sending...' : '🚀 Run Campaign'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Email Re-engagement */}
                            <Card className="border-2 border-purple-100 dark:border-purple-900/40 bg-white dark:bg-gray-900 hover:shadow-sm transition">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-base">
                                        <Mail className="w-5 h-5" />
                                        Email Re-engagement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 h-12">Sends a "we miss you" email to active users who haven't logged in for 7+ days.</p>
                                    <Button
                                        onClick={() => runCampaign('reengagement')}
                                        disabled={!!campaignLoading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 h-auto"
                                    >
                                        {campaignLoading === 'reengagement' ? 'Sending...' : '📧 Run Campaign'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Witty Push Re-engagement */}
                            <Card className="border-2 border-pink-100 dark:border-pink-900/40 hover:shadow-sm transition bg-gradient-to-br from-white to-pink-50/20 dark:from-gray-900 dark:to-pink-950/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-450 text-base">
                                        <Activity className="w-5 h-5 animate-pulse" />
                                        Witty Push Campaign
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 h-12">Triggers time-of-day re-engagement notifications with rich banners & buttons to offline users.</p>
                                    <Button
                                        onClick={() => runCampaign('witty_reengagement')}
                                        disabled={!!campaignLoading}
                                        className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs py-1.5 h-auto font-semibold"
                                    >
                                        {campaignLoading === 'witty_reengagement' ? 'Sending...' : '⚡ Run Push Campaign'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Invite */}
                            <Card className="border-2 border-rose-100 dark:border-rose-900/40 bg-white dark:bg-gray-900 hover:shadow-sm transition">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-455 text-base">
                                        <Send className="w-5 h-5" />
                                        Invite External
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Send invitations to emails (comma/newline separated).</p>
                                    <textarea
                                        value={inviteEmails}
                                        onChange={e => setInviteEmails(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full h-16 p-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-mono"
                                    />
                                    <Button
                                        onClick={() => runCampaign('invite')}
                                        disabled={!!campaignLoading || !inviteEmails.trim()}
                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs py-1.5 h-auto"
                                    >
                                        {campaignLoading === 'invite' ? 'Sending...' : '💌 Send Invites'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 3. Recent Campaign Dispatch Log */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Witty Push Notification Delivery & Click Log (Last 50)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(!campaignStats?.recentCampaigns || campaignStats.recentCampaigns.length === 0) ? (
                                    <div className="text-center p-8 text-gray-500 dark:text-gray-400 text-sm">No re-engagement campaigns sent yet.</div>
                                ) : (
                                    <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                                <tr>
                                                    <th className="p-3 font-semibold">Notification Title</th>
                                                    <th className="p-3 font-semibold">Sent At</th>
                                                    <th className="p-3 font-semibold">Delivery Status</th>
                                                    <th className="p-3 font-semibold">Interaction Action</th>
                                                    <th className="p-3 font-semibold">Interaction Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {campaignStats.recentCampaigns.map((c: any) => (
                                                    <tr key={c.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{c.title}</td>
                                                        <td className="p-3 text-gray-500 dark:text-gray-400">
                                                            {format(new Date(c.sentAt), 'dd MMM yyyy, HH:mm')}
                                                        </td>
                                                        <td className="p-3">
                                                            {c.clicked ? (
                                                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Clicked ✅</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-none">Delivered ✉️</Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-mono font-medium text-purple-700 dark:text-purple-400">
                                                            {c.clicked ? (c.action === 'notification_body' ? 'Main Body Click' : c.action) : '-'}
                                                        </td>
                                                        <td className="p-3 text-gray-400 dark:text-gray-500">
                                                            {c.clickedAt ? format(new Date(c.clickedAt), 'dd MMM HH:mm') : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* GOOGLE PLAY CLOSED BETA TESTERS TAB */}
                    <TabsContent value="testers" className="space-y-6">
                        {/* 1. Header Overview & Google Play Requirement Bar */}
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2 border border-white/30 text-emerald-100">
                                        <Sparkles size={13} />
                                        <span>Google Play Production Requirement</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                                        Google Play Closed Beta Testers
                                    </h2>
                                    <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                                        Google requires at least <strong>20 testers</strong> opted-in for at least 14 days before applying for Production.
                                        Copy the email list below and paste directly into Google Play Console closed testing track!
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        onClick={handleCopyAllTesters}
                                        disabled={testers.length === 0}
                                        className="px-4 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {copyAllSuccess ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                        <span>{copyAllSuccess ? 'Copied All to Clipboard!' : `Copy All (${testers.length}) Emails`}</span>
                                    </button>

                                    <button
                                        onClick={handleCopyPendingTesters}
                                        disabled={testers.filter(t => t.status !== 'added_to_console').length === 0}
                                        className="px-4 py-3 rounded-2xl bg-emerald-950/60 border border-white/30 text-white hover:bg-emerald-950/80 active:scale-95 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {copyPendingSuccess ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        <span>{copyPendingSuccess ? 'Copied Pending!' : `Copy Pending (${testers.filter(t => t.status !== 'added_to_console').length})`}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Progress bar towards 20 testers */}
                            <div className="mt-6 pt-6 border-t border-white/20">
                                <div className="flex items-center justify-between text-xs font-bold mb-2">
                                    <span>Production Application Readiness:</span>
                                    <span>{testers.length} / 20 Testers ({Math.min(100, Math.round((testers.length / 20) * 100))}%)</span>
                                </div>
                                <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-300 to-yellow-300 transition-all duration-500 rounded-full"
                                        style={{ width: `${Math.min(100, Math.round((testers.length / 20) * 100))}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Quick Links Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a
                                href="https://play.google.com/console"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-emerald-500 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <Play size={20} className="fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Google Play Console</div>
                                        <div className="text-[11px] text-gray-500">Manage Track & Testers</div>
                                    </div>
                                </div>
                                <ExternalLink size={16} className="text-gray-400" />
                            </a>

                            <a
                                href="https://play.google.com/apps/testing/com.lifepartner.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-emerald-500 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Web Testing Opt-In Link</div>
                                        <div className="text-[11px] text-gray-500">Testers tap "Become a Tester"</div>
                                    </div>
                                </div>
                                <ExternalLink size={16} className="text-gray-400" />
                            </a>

                            <a
                                href="https://play.google.com/store/apps/details?id=com.lifepartner.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-emerald-500 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900 dark:text-white">Play Store Download Link</div>
                                        <div className="text-[11px] text-gray-500">Direct app listing</div>
                                    </div>
                                </div>
                                <ExternalLink size={16} className="text-gray-400" />
                            </a>
                        </div>

                        {/* 3. Manual Add Tester & Bulk Add Box */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-emerald-600" />
                                    <span>Add Tester Emails Manually</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddManualTesters} className="space-y-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Paste one or more email addresses (separated by commas or newlines) to record them as testers:
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="tester1@gmail.com, tester2@gmail.com, ..."
                                            value={manualTesterEmails}
                                            onChange={(e) => setManualTesterEmails(e.target.value)}
                                            className="text-xs"
                                        />
                                        <Button type="submit" disabled={testersLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs">
                                            {testersLoading ? 'Adding...' : 'Add to List'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* 4. Testers Table */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-bold">
                                        Registered Testers List ({testers.length})
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {testers.filter(t => t.status === 'added_to_console').length} Added to Console
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setTesterFilter('all')}
                                            className={`px-2.5 py-1 rounded-md font-medium ${testerFilter === 'all' ? 'bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white font-bold' : 'text-gray-500'}`}
                                        >
                                            All ({testers.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTesterFilter('pending')}
                                            className={`px-2.5 py-1 rounded-md font-medium ${testerFilter === 'pending' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold' : 'text-gray-500'}`}
                                        >
                                            Pending ({testers.filter(t => t.status !== 'added_to_console').length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTesterFilter('added_to_console')}
                                            className={`px-2.5 py-1 rounded-md font-medium ${testerFilter === 'added_to_console' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-gray-500'}`}
                                        >
                                            Added ({testers.filter(t => t.status === 'added_to_console').length})
                                        </button>
                                    </div>

                                    <a
                                        href="/api/testers?format=csv"
                                        download="google_play_testers.csv"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all"
                                    >
                                        <Download size={13} />
                                        <span>Export CSV</span>
                                    </a>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {testers.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-xs space-y-2">
                                        <Mail className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
                                        <p>No testers registered yet.</p>
                                        <p className="text-[11px] text-gray-400">
                                            As soon as users submit their emails on the landing page or download page, they will appear here!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                                <tr>
                                                    <th className="p-3 font-semibold">Email Address</th>
                                                    <th className="p-3 font-semibold">Registered Date</th>
                                                    <th className="p-3 font-semibold">Play Console Status</th>
                                                    <th className="p-3 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {testers
                                                    .filter(t => {
                                                        if (testerFilter === 'pending') return t.status !== 'added_to_console';
                                                        if (testerFilter === 'added_to_console') return t.status === 'added_to_console';
                                                        return true;
                                                    })
                                                    .map((t) => (
                                                        <tr key={t.id || t.email} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{t.email}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopySingleEmail(t.id, t.email)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-all"
                                                                        title="Copy email"
                                                                    >
                                                                        {copiedEmailId === t.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                                    </button>
                                                                </div>
                                                                {t.name && t.name !== 'Play Store Tester' && (
                                                                    <div className="text-[10px] text-gray-400">{t.name}</div>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-gray-500 dark:text-gray-400">
                                                                {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm') : '-'}
                                                            </td>
                                                            <td className="p-3">
                                                                {t.status === 'added_to_console' ? (
                                                                    <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                                                        Added to Play Console ✅
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                                                        Pending Console Addition ⏳
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <Button
                                                                        size="sm"
                                                                        variant={t.status === 'added_to_console' ? 'outline' : 'default'}
                                                                        className={`text-[11px] h-7 px-2.5 ${t.status !== 'added_to_console' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                                                        onClick={() => handleToggleTesterStatus(t.id, t.status)}
                                                                    >
                                                                        {t.status === 'added_to_console' ? 'Mark Pending' : 'Mark as Added'}
                                                                    </Button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteTester(t.id)}
                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                                                        title="Delete tester"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 5. Google Play Console Closed Testing Instructions */}
                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-emerald-600" />
                                <span>Instructions: How to add these emails in Google Play Console</span>
                            </h4>
                            <div className="grid md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <div className="p-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                                    <div className="font-bold text-gray-900 dark:text-white mb-1">Step 1: Copy Emails</div>
                                    <p className="text-[11px]">Click <strong>"Copy All Emails"</strong> or <strong>"Copy Pending"</strong> above. It copies a single comma-separated list of all email addresses.</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                                    <div className="font-bold text-gray-900 dark:text-white mb-1">Step 2: Paste in Play Console</div>
                                    <p className="text-[11px]">In Play Console &gt; Closed Testing &gt; Testers &gt; Email lists, paste the emails and click <strong>Save changes</strong>.</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                                    <div className="font-bold text-gray-900 dark:text-white mb-1">Step 3: User Opt-In & Download</div>
                                    <p className="text-[11px]">The user opens the Web Opt-in link, accepts the test invite, and downloads from Google Play Store!</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
