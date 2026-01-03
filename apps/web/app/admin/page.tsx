
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, ShieldAlert, Activity, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
            const [statsRes, usersRes, txRes] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers({ search, limit: 20 }),
                api.admin.getTransactions({ limit: 50 })
            ]);
            setStats(statsRes);
            setUsers(usersRes);
            setTransactions(txRes);
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

    if (loading && !stats) return <div className="p-20 text-center">Loading Admin Panel...</div>;

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

                {/* Main Content Tabs */}
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="transactions">Financials</TabsTrigger>
                        <TabsTrigger value="referrals">Referral Tracking</TabsTrigger>
                    </TabsList>

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
                </Tabs>
            </div>
        </div>
    );
}
