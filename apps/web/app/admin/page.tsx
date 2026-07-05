
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, ShieldAlert, Activity, Search, Mail, Send, UserPlus, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [campaignStats, setCampaignStats] = useState<any>(null);

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
            const [statsRes, usersRes, txRes, photosRes, campaignStatsRes] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers({ search, limit: 20 }),
                api.admin.getTransactions({ limit: 50 }),
                api.admin.getPhotosPending(),
                api.admin.getCampaignStats()
            ]);
            setStats(statsRes);
            setUsers(usersRes);
            setTransactions(txRes);
            setPendingPhotos(photosRes);
            setCampaignStats(campaignStatsRes);
        } catch (e) {
            console.error("Admin Load Error", e);
        } finally {
            setLoading(false);
        }
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        <CardHeader>
                            <CardTitle>User Growth (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {/* @ts-ignore */}
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* @ts-ignore */}
                                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        {/* @ts-ignore */}
                                        <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => format(new Date(val), 'MMM dd')} />
                                        {/* @ts-ignore */}
                                        <YAxis tick={{fontSize: 12}} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Tooltip labelFormatter={(val) => format(new Date(val), 'dd MMM yyyy')} />
                                        {/* @ts-ignore */}
                                        <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="moderation">Photo Moderation</TabsTrigger>
                        <TabsTrigger value="transactions">Financials</TabsTrigger>
                        <TabsTrigger value="referrals">Referral Tracking</TabsTrigger>
                        <TabsTrigger value="campaigns">📧 Campaigns</TabsTrigger>
                    </TabsList>

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
                </Tabs>
            </div>
        </div>
    );
}
