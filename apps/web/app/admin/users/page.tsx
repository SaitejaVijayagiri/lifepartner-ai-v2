'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Ban, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadUsers();
    }, [page, search]); // Simple debounce might be needed for search in prod

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getUsers(page, search);
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async (userId: string, currentBanStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return;

        try {
            await api.admin.banUser(userId, !currentBanStatus);
            toast.success(currentBanStatus ? "User Unbanned" : "User Banned");
            loadUsers(); // Refresh
        } catch (e) {
            toast.error("Action Failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        className="pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100/50">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">User</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Joined</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading && users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 flex items-center gap-1">
                                                {user.name}
                                                {user.is_admin && <Shield size={12} className="text-indigo-500" />}
                                            </span>
                                            <span className="text-gray-500 text-xs">{user.email}</span>
                                            {user.phone && <span className="text-gray-400 text-[10px]">{user.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {user.is_premium && (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">Premium</span>
                                            )}
                                            {user.is_banned && (
                                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">Banned</span>
                                            )}
                                            {!user.is_banned && !user.is_premium && (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">Active</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!user.is_admin && (
                                            <button
                                                onClick={() => handleBan(user.id, user.is_banned)}
                                                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${user.is_banned
                                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                            >
                                                {user.is_banned ? 'Unban User' : 'Ban Access'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="disabled:opacity-50 hover:text-gray-900"
                >
                    &larr; Previous
                </button>
                <span>Page {page}</span>
                <button
                    disabled={users.length < 20}
                    onClick={() => setPage(p => p + 1)}
                    className="disabled:opacity-50 hover:text-gray-900"
                >
                    Next &rarr;
                </button>
            </div>
        </div>
    );
}
