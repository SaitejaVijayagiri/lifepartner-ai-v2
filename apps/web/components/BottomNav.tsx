import React from 'react';
import { Heart, Video, Users, MessageCircle, User } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: number;
    gradient?: string;
}

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    requestsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, requestsCount }) => {
    const navItems: NavItem[] = [
        { id: 'matches', label: 'Matches', icon: Heart, gradient: 'from-rose-500 to-pink-500' },
        { id: 'reels', label: 'Vibe', icon: Video, gradient: 'from-purple-500 to-indigo-500' },
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount, gradient: 'from-amber-500 to-orange-500' },
        { id: 'connections', label: 'Chat', icon: MessageCircle, gradient: 'from-emerald-500 to-teal-500' },
        { id: 'profile', label: 'Profile', icon: User, gradient: 'from-blue-500 to-cyan-500' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
            {/* Gradient fade background */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none h-32 bottom-0"></div>

            <div className="relative flex justify-center pb-4 px-4">
                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 border border-gray-100/50 flex justify-between items-center px-3 py-2 w-full max-w-md">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className="relative flex-1 flex flex-col items-center justify-center py-2 group"
                            >
                                {/* Active background pill */}
                                {isActive && (
                                    <div className={`absolute inset-x-2 inset-y-1 bg-gradient-to-r ${item.gradient} rounded-2xl opacity-10 animate-in fade-in duration-300`}></div>
                                )}

                                <div className={`
                                    relative p-2.5 rounded-2xl transition-all duration-300 ease-out
                                    ${isActive
                                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-110`
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }
                                `}>
                                    <item.icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`}
                                        fill={isActive ? 'currentColor' : 'none'}
                                    />

                                    {/* Badge */}
                                    {item.badge && item.badge > 0 ? (
                                        <span className={`
                                            absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full 
                                            bg-gradient-to-r from-red-500 to-rose-500 text-[10px] font-bold text-white 
                                            ring-2 ring-white shadow-lg animate-in zoom-in duration-300
                                        `}>
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    ) : null}
                                </div>

                                {/* Label */}
                                <span className={`
                                    mt-1 text-[10px] font-semibold transition-all duration-300
                                    ${isActive ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}
                                `}>
                                    {item.label}
                                </span>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className={`absolute -bottom-0.5 w-1 h-1 rounded-full bg-gradient-to-r ${item.gradient} animate-in fade-in zoom-in duration-500`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
