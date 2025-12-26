'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { IndianRupee, CreditCard, Award } from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    created_at: string;
    full_name: string;
    email: string;
    metadata?: any;
}

export default function RevenuePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(''); // 'COINS' | 'PREMIUM' | ''
    const toast = useToast();

    const [stats, setStats] = useState<{ totalRevenue: number, premiumRevenue: number, coinRevenue: number } | null>(null);

    useEffect(() => {
        loadData();
        loadStats();
    }, [filter]);

    const loadStats = async () => {
        try {
            const data = await api.admin.getStats();
            setStats(data);
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getTransactions(filter);
            setTransactions(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load revenue data");
        } finally {
            setLoading(false);
        }
    };

    // Use Global Stats if available, otherwise 0
    const totalRevenue = stats?.totalRevenue || 0;
    const premiumRevenue = stats?.premiumRevenue || 0;
    const coinRevenue = stats?.coinRevenue || 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Revenue & Transactions</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <IndianRupee size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Premium Subscriptions</p>
                            <h3 className="text-2xl font-bold text-purple-600 mt-1">₹{premiumRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Award size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Coin Purchases</p>
                            <h3 className="text-2xl font-bold text-yellow-600 mt-1">₹{coinRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                            <CreditCard size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-primary text-white bg-blue-600' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                    All Transactions
                </button>
                <button
                    onClick={() => setFilter('PREMIUM')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'PREMIUM' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                    Premium Only
                </button>
                <button
                    onClick={() => setFilter('COINS')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'COINS' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                >
                    Coins Only
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                <th className="p-4 font-semibold text-gray-600">User</th>
                                <th className="p-4 font-semibold text-gray-600">Type</th>
                                <th className="p-4 font-semibold text-gray-600">Amount</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions found.</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-500">
                                            {new Date(tx.created_at).toLocaleDateString()} <br />
                                            <span className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{tx.full_name || 'Unknown'}</div>
                                            <div className="text-gray-500 text-xs">{tx.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tx.type === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono font-medium">
                                            ₹{parseFloat(tx.amount.toString()).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold uppercase ${tx.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
