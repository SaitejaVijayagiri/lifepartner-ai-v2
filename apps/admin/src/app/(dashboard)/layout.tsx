'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Flag, LogOut, ShieldAlert, BadgeCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            console.log("[AdminLayout] CheckAccess", { authLoading, user: !!user, hasToken: !!localStorage.getItem('token') });
            if (authLoading) return;

            if (!user) {
                console.log("[AdminLayout] No user found. Redirecting to login.");
                router.push('/login');
                return;
            }

            console.log("[AdminLayout] User Authenticated:", user.email, "IsAdmin:", user.is_admin);
        };

        checkAccess();
    }, [user, authLoading, router]);

    // 1. Loading State
    if (authLoading || isVerifying) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    // 2. Unauthenticated State
    if (!user) {
        return null;
    }

    // 3. Unauthorized State
    if (!user.is_admin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Access Restricted</h1>
                <p className="text-gray-600 mt-2 mb-6">You do not have permission to view this area.</p>
                <button onClick={logout} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Logout & Switch Account
                </button>
            </div>
        );
    }

    // 4. Authenticated & Authorized State
    const navItems = [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Verifications', href: '/verifications', icon: BadgeCheck },
        { name: 'Reports', href: '/reports', icon: Flag },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
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
                    <div className="mt-4 px-4 text-xs text-slate-500 truncate">
                        {user.email}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                <header className="bg-white shadow-sm border-b px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">
                        {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h1>
                    <div className="md:hidden">
                        {/* Mobile Menu Trigger could go here */}
                    </div>
                </header>
                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
