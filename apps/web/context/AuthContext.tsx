'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Notifications } from '@/lib/notifications';

interface User {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    is_premium?: boolean;
    is_admin?: boolean;
    free_direct_messages?: number;
    gender?: string | null;
    age?: number | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User, token: string, requiresOnboarding?: boolean) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const init = async () => {
            try {
                // Safeguard LocalStorage for In-App Browsers
                let storedUser = null;
                let token = null;
                try {
                    storedUser = localStorage.getItem('user');
                    token = localStorage.getItem('token');
                } catch (storageErr) {
                    console.warn("LocalStorage blocked", storageErr);
                }

                if (storedUser) {
                    // 1. Optimistic Load
                    setUser(JSON.parse(storedUser));
                }

                // Use userId or storedUser as a hint that a cookie MIGHT exist
                const userIdHint = localStorage.getItem('userId');

                if (userIdHint) {
                    // 2. Fresh Data Fetch
                    try {
                        const freshProfile = await api.profile.getMe();
                        
                        // 3. Attempt to fetch a token for Socket.io if missing from localStorage
                        if (!localStorage.getItem('token')) {
                            try {
                                const { token } = await api.auth.getToken();
                                if (token) {
                                    localStorage.setItem('token', token);
                                }
                            } catch (tokenErr) {
                                console.warn("Could not silently recover socket token", tokenErr);
                            }
                        }

                        // Transform profile to User object (adapter)
                        const updatedUser = {
                            id: freshProfile.userId || freshProfile.id,
                            name: freshProfile.name,
                            email: freshProfile.email,
                            photoUrl: freshProfile.photoUrl,
                            is_premium: freshProfile.is_premium,
                            is_admin: freshProfile.is_admin,
                            free_direct_messages: freshProfile.free_direct_messages,
                            gender: freshProfile.gender,
                            age: freshProfile.age
                        };
                        setUser(updatedUser);
                        try {
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        } catch (e) { /* ignore */ }

                        // Sync with native Android Bridge immediately
                        if (typeof window !== 'undefined') {
                            const bridge = (window as any).AndroidBridge || (window as any).androidBridge;
                            if (bridge) {
                                if (typeof bridge.loginUser === 'function') {
                                    bridge.loginUser(updatedUser.id);
                                }
                                const currentToken = localStorage.getItem('token') || token;
                                if (typeof bridge.setAuthToken === 'function' && currentToken) {
                                    bridge.setAuthToken(currentToken);
                                }
                            }
                        }

                        // Auto-Register FCM Push Token for all active users
                        Notifications.init().catch(console.error);

                        // Mandatory 2-Step Onboarding Redirect for incomplete profiles
                        // Only trigger if onboarding has NEVER been completed AND essential fields are missing
                        const hasCompletedOnboarding = Boolean(
                            freshProfile.onboarding_completed ||
                            localStorage.getItem('onboarding_completed') === 'true' ||
                            (freshProfile.gender && freshProfile.age)
                        );
                        const isIncomplete = !hasCompletedOnboarding;
                        if (isIncomplete && pathname && !pathname.startsWith('/onboarding') && !pathname.startsWith('/register') && !pathname.startsWith('/login')) {
                            console.warn("⚠️ Mandatory Onboarding Redirect triggered: Incomplete profile");
                            router.replace('/onboarding');
                        } else if (hasCompletedOnboarding) {
                            try {
                                localStorage.setItem('onboarding_completed', 'true');
                            } catch (_) {}
                        }

                    } catch (apiErr) {
                        console.error("Token verification failed", apiErr);
                    }
                }
            } catch (e) {
                console.error("Auth Hydrate Failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        init();

        // 4. Background Token Auto-Refresh (Every 25 minutes to prevent session expiration)
        const refreshInterval = setInterval(async () => {
            try {
                if (localStorage.getItem('token') || localStorage.getItem('userId')) {
                    const res = await api.auth.getToken();
                    if (res?.token) {
                        localStorage.setItem('token', res.token);
                    }
                }
            } catch (err) {
                console.warn("Background token refresh skipped", err);
            }
        }, 25 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [pathname]);

    const login = (userData: User, token: string, requiresOnboarding?: boolean) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        setUser(userData);

        if (typeof window !== 'undefined') {
            const bridge = (window as any).AndroidBridge || (window as any).androidBridge;
            if (bridge) {
                if (typeof bridge.loginUser === 'function') {
                    bridge.loginUser(userData.id);
                }
                if (typeof bridge.setAuthToken === 'function') {
                    bridge.setAuthToken(token);
                }
            }
        }

        // Auto-Register FCM Push Token on Login
        Notifications.init().catch(console.error);

        const isCompleted = Boolean(
            !requiresOnboarding &&
            ((userData.gender && userData.age) || (typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true'))
        );

        if (!isCompleted && requiresOnboarding) {
            router.replace('/onboarding');
        } else {
            try {
                localStorage.setItem('onboarding_completed', 'true');
            } catch (_) {}
            router.replace('/dashboard');
        }
    };

    const logout = async () => {
        try {
            await api.auth.logout();
        } catch (e) {
            console.error("Logout API call failed", e);
        }
        localStorage.clear();
        setUser(null);
        router.push('/login');
    };

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
