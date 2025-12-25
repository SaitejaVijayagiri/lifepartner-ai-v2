'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    is_premium?: boolean;
    is_admin?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (storedUser) {
                    // 1. Optimistic Load
                    setUser(JSON.parse(storedUser));
                }

                if (token) {
                    // 2. Fresh Data Fetch
                    try {
                        const freshProfile = await api.profile.getMe();
                        // Transform profile to User object (adapter)
                        const updatedUser = {
                            id: freshProfile.userId || freshProfile.id,
                            name: freshProfile.name,
                            email: freshProfile.email,
                            photoUrl: freshProfile.photoUrl,
                            is_premium: freshProfile.is_premium,
                            is_admin: freshProfile.is_admin
                        };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    } catch (apiErr) {
                        console.error("Token verification failed", apiErr);
                        // Optional: logout() if strictly 401? api.ts handles 401 redirect, so we just log here.
                    }
                }
            } catch (e) {
                console.error("Auth Hydrate Failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const login = (userData: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        setUser(userData);
    };

    const logout = () => {
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
