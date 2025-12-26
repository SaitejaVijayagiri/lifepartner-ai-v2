'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Ban, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    is_admin: boolean;
    is_premium: boolean;
    is_banned: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isPremiumOnly, setIsPremiumOnly] = useState(false);
    const [loading, setLoading] = useState(true);

    // Search Debounce
    const debouncedSearch = useDebounce(search, 500);

    // Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const toast = useToast();

    useEffect(() => {
        loadUsers();
    }, [page, debouncedSearch, isPremiumOnly]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getUsers(page, debouncedSearch, isPremiumOnly);
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const initiateBanToggle = (user: User) => {
        setSelectedUser(user);
        setConfirmModalOpen(true);
    };

    const handleConfirmBan = async () => {
        if (!selectedUser) return;

        try {
            await api.admin.banUser(selectedUser.id, !selectedUser.is_banned);
            toast.success(selectedUser.is_banned ? "User Unbanned" : "User Banned");
            loadUsers(); // Refresh
            setConfirmModalOpen(false);
        } catch (e) {
            toast.error("Action Failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={isPremiumOnly}
                            onChange={(e) => setIsPremiumOnly(e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-medium">Premium Only</span>
                    </label>
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
                                                onClick={() => initiateBanToggle(user)}
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

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                title={selectedUser?.is_banned ? "Unban User" : "Ban User"}
                description={`Are you sure you want to ${selectedUser?.is_banned ? 'restore access for' : 'restrict access for'} ${selectedUser?.name}?`}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmBan}
                            className={selectedUser?.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {selectedUser?.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                    </>
                }
            >
                <div className="flex items-center gap-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                    <AlertTriangle className="flex-shrink-0" />
                    <p className="text-sm">
                        {selectedUser?.is_banned
                            ? "This will restore the user's ability to log in and use the platform."
                            : "This will immediately revoke the user's access to the platform."}
                    </p>
                </div>
            </Modal>
        </div>
    );
}
