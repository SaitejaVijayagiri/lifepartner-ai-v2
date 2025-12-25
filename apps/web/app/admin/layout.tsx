'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Flag, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!user.is_admin) {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Admin...</div>;
    }

    if (!user || !user.is_admin) return null;



    const navItems = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Reports', href: '/admin/reports', icon: Flag },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" />
                    <span className="font-bold text-xl">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                    <div className="mt-4 px-4 text-xs text-slate-500">
                        Logged in as {user?.email}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm border-b px-8 py-4 sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-800">
                        {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h1>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
