'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Crown, DollarSign, Flag } from 'lucide-react';

interface Stats {
    totalUsers: number;
    premiumUsers: number;
    totalRevenue: number;
    pendingReports: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.admin.getStats();
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading stats...</div>;

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Premium Users', value: stats?.premiumUsers, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Pending Reports', value: stats?.pendingReports, icon: Flag, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Platform Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value || 0}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${card.bg}`}>
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* TODO: Recent Users or Activity Graph */}
        </div>
    );
}
