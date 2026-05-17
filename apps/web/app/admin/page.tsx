
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
            const [statsRes, usersRes, txRes, photosRes] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers({ search, limit: 20 }),
                api.admin.getTransactions({ limit: 50 }),
                api.admin.getPhotosPending()
            ]);
            setStats(statsRes);
            setUsers(usersRes);
            setTransactions(txRes);
            setPendingPhotos(photosRes);
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

    if (loading && !stats) return <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Admin Panel...</p>
    </div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/dashboard')}>Exit Admin</Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-green-600 mt-1">
                                {stats?.premiumUsers || 0} Premium
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats?.totalRevenue || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                ₹{stats?.coinRevenue || 0} from Coins
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingReports || 0}</div>
                            <p className="text-xs text-red-600 mt-1">Action Required</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Activity className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Healthy</div>
                            <p className="text-xs text-muted-foreground mt-1">v2.1.0 Stable</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Chart */}
                {stats?.chartData && (
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>User Growth (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => format(new Date(val), 'MMM dd')} />
                                        <YAxis tick={{fontSize: 12}} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Tooltip labelFormatter={(val) => format(new Date(val), 'dd MMM yyyy')} />
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
                                    <div className="text-center p-10 text-gray-500">No photos to moderate.</div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {pendingPhotos.map(photo => (
                                            <div key={photo.id} className="border rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition">
                                                <div className="aspect-square bg-gray-100 relative">
                                                    <img src={photo.avatar_url} alt={photo.full_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-3">
                                                    <p className="font-semibold text-sm truncate">{photo.full_name}</p>
                                                    <p className="text-xs text-gray-500 truncate mb-3">{photo.email}</p>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleModerate(photo.id, 'approve')}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" /> OK
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive" 
                                                            className="w-full bg-red-500 hover:bg-red-600"
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
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b">
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
                                                <tr key={user.id} className="border-b hover:bg-gray-50/50">
                                                    <td className="p-4">
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.is_admin ? '(Admin)' : 'User'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div>{user.email}</div>
                                                        <div className="text-xs text-gray-400">{user.phone || '-'}</div>
                                                    </td>
                                                    <td className="p-4 font-bold text-amber-600">
                                                        {user.coins} 🪙
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {user.is_premium && (
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 w-fit">Premium</Badge>
                                                                    {user.premium_expiry && (
                                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                                            {Math.ceil((new Date(user.premium_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                                                            {!user.is_banned && !user.is_premium && <Badge variant="outline">Free</Badge>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-500">
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
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4 font-medium">User</th>
                                                <th className="p-4 font-medium">Type</th>
                                                <th className="p-4 font-medium">Amount</th>
                                                <th className="p-4 font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="border-b hover:bg-gray-50/50">
                                                    <td className="p-4">
                                                        <div className="font-medium">{tx.full_name}</div>
                                                        <div className="text-xs text-gray-500">{tx.email}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant={tx.type.includes('REFERRAL') ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                                            {tx.type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 font-bold">
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                    </td>
                                                    <td className="p-4 text-gray-500">
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
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4 font-medium">User</th>
                                                <th className="p-4 font-medium">Referral Code</th>
                                                <th className="p-4 font-medium">Referred By</th>
                                                <th className="p-4 font-medium">Coins Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.filter(u => u.referral_code).map((user) => (
                                                <tr key={user.id} className="border-b hover:bg-gray-50/50">
                                                    <td className="p-4 font-medium">{user.name}</td>
                                                    <td className="p-4 font-mono bg-gray-50 w-fit px-2 rounded">{user.referral_code}</td>
                                                    <td className="p-4 text-gray-400">{user.referred_by ? 'Yes' : '-'}</td>
                                                    <td className="p-4 font-bold text-green-600">{user.coins}</td>
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
                        {campaignResult && (
                            <div className={`p-4 rounded-xl border text-sm font-mono whitespace-pre-wrap ${campaignResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                {JSON.stringify(campaignResult, null, 2)}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Onboarding */}
                            <Card className="border-2 border-indigo-100">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                                        <UserPlus className="w-5 h-5" />
                                        Onboarding Reminder
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-gray-500">Sends a profile completion nudge to every registered user who signed up but never completed onboarding.</p>
                                    <Button
                                        onClick={() => runCampaign('onboarding')}
                                        disabled={!!campaignLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {campaignLoading === 'onboarding' ? 'Sending...' : '🚀 Run Campaign'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Re-engagement */}
                            <Card className="border-2 border-purple-100">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-700">
                                        <Mail className="w-5 h-5" />
                                        Re-engagement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-gray-500">Sends a "we miss you" email to active users who haven't logged in for 7+ days.</p>
                                    <Button
                                        onClick={() => runCampaign('reengagement')}
                                        disabled={!!campaignLoading}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {campaignLoading === 'reengagement' ? 'Sending...' : '💭 Run Campaign'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Invite */}
                            <Card className="border-2 border-rose-100">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-rose-700">
                                        <Send className="w-5 h-5" />
                                        Invite Non-Registered
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-gray-500">Send invite emails to people who are not yet registered. Enter emails below (comma or newline separated).</p>
                                    <textarea
                                        value={inviteEmails}
                                        onChange={e => setInviteEmails(e.target.value)}
                                        placeholder="john@example.com, jane@example.com\nor one per line"
                                        className="w-full h-28 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                                    />
                                    <Button
                                        onClick={() => runCampaign('invite')}
                                        disabled={!!campaignLoading || !inviteEmails.trim()}
                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                                    >
                                        {campaignLoading === 'invite' ? 'Sending...' : `💌 Send Invites (${inviteEmails.split(/[,\n]/).filter(e => e.trim()).length})`}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Run All */}
                        <Card className="border-2 border-gray-200 bg-gray-50">
                            <CardContent className="pt-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">Run All Automated Campaigns</p>
                                    <p className="text-sm text-gray-500">Runs both onboarding reminders and re-engagement emails in one go.</p>
                                </div>
                                <Button
                                    onClick={() => runCampaign('all')}
                                    disabled={!!campaignLoading}
                                    variant="outline"
                                    className="shrink-0"
                                >
                                    {campaignLoading === 'all' ? 'Running...' : '⚡ Run All Campaigns'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
