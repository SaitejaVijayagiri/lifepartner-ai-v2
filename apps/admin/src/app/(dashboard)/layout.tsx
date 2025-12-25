'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Flag, LogOut, ShieldAlert, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading, logout, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return;

            if (user) return; // Authenticated

            // Allow short delay for hydration
            await new Promise(resolve => setTimeout(resolve, 500));

            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            // If no token, or token exists but context failed to load user:
            // Stop infinite loop by NOT redirecting automatically.
            // UI will handle the "Not Logged In" state.
            console.log("AdminLayout: Check failed. Token exists?", !!token);

            if (token && storedUser && !user) {
                // Context failed to hydrate despite token?? 
                // Try one last manual verify? No, let's just ask user to relogin.
                // This state (Token+NoUser) after AuthLoading=false means AuthContext tried and failed.
            }
        };

        checkAccess();
    }, [user, authLoading]);

    if (authLoading || isVerifying) {
        if (!user || (!user.is_admin)) {
            // If we are still checking, return null (or loading, but loading is handled above)
            // If user is present but NOT admin:
            if (user && !user.is_admin) {
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
            return null;
        }



        const navItems = [
            { name: 'Overview', href: '/', icon: LayoutDashboard },
            { name: 'Users', href: '/users', icon: Users },
            { name: 'Verifications', href: '/verifications', icon: BadgeCheck },
            { name: 'Reports', href: '/reports', icon: Flag },
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
