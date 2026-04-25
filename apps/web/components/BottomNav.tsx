'use client';

import React, { useState } from 'react';
import { Heart, Users, MessageCircle, User, Coffee, MapPin, Calendar, Menu, X, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    requestsCount: number;
    unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, requestsCount, unreadCount }) => {
    const [showMore, setShowMore] = useState(false);

    // Primary nav — always visible (5 items max for clean mobile UX)
    const primaryItems = [
        { id: 'matches', label: 'Matches', icon: Heart, gradient: 'from-rose-500 to-pink-500' },
        { id: 'map', label: 'Live Map', icon: MapPin, gradient: 'from-purple-500 to-indigo-500' },
        { id: 'events', label: 'Meet Spots', icon: Calendar, gradient: 'from-violet-500 to-purple-600' },
        { id: 'connections', label: 'Chat', icon: MessageCircle, badge: unreadCount, gradient: 'from-emerald-500 to-teal-500' },
        { id: 'profile', label: 'Profile', icon: User, gradient: 'from-blue-500 to-cyan-500' },
    ];

    // Secondary nav — shown in "More" drawer
    const secondaryItems = [
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount, gradient: 'from-amber-500 to-orange-500' },
        { id: 'community', label: 'Lounge', icon: Coffee, gradient: 'from-indigo-500 to-blue-500' },
    ];

    const handleTabSelect = (id: string) => {
        setActiveTab(id);
        setShowMore(false);
    };

    const isMoreActive = secondaryItems.some(i => i.id === activeTab);
    const moreBadge = (requestsCount || 0) + 0; // sum any secondary badges

    return (
        <>
            {/* More Drawer Backdrop */}
            {showMore && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Drawer — slides up from bottom */}
            <div className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-out ${showMore ? 'bottom-[76px]' : '-bottom-40'}`}>
                <div className="mx-4 mb-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100/50 dark:border-gray-800/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <MoreHorizontal size={18} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">More</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {secondaryItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabSelect(item.id)}
                                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                                        isActive
                                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="relative">
                                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.badge && item.badge > 0 ? (
                                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                    <span className="text-sm font-semibold">{item.label}</span>
                                    {item.badge && item.badge > 0 && !isActive ? (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Bottom Nav Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
                <div className="relative flex justify-center pb-4 px-4">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 border border-gray-100/50 dark:border-gray-800/50 flex justify-between items-center px-3 py-2 w-full max-w-md">
                        {primaryItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setShowMore(false);
                                        setActiveTab(item.id);
                                    }}
                                    className="relative flex-1 flex flex-col items-center justify-center py-2 group"
                                >
                                    {/* Active background pill */}
                                    {isActive && (
                                        <div className={`absolute inset-x-2 inset-y-1 bg-gradient-to-r ${item.gradient} rounded-2xl opacity-10 animate-in fade-in duration-300`} />
                                    )}

                                    <div className={`
                                        relative p-2.5 rounded-2xl transition-all duration-300 ease-out
                                        ${isActive
                                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-110`
                                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-lg animate-in zoom-in duration-300">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        ) : null}
                                    </div>

                                    <span className={`
                                        mt-1 text-[10px] font-semibold transition-all duration-300
                                        ${isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                                    `}>
                                        {item.label}
                                    </span>

                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <div className={`absolute -bottom-0.5 w-1 h-1 rounded-full bg-gradient-to-r ${item.gradient} animate-in fade-in zoom-in duration-500`} />
                                    )}
                                </button>
                            );
                        })}

                        {/* More Button */}
                        <button
                            onClick={() => setShowMore(!showMore)}
                            className="relative flex-1 flex flex-col items-center justify-center py-2 group"
                        >
                            {isMoreActive && (
                                <div className="absolute inset-x-2 inset-y-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl opacity-10 animate-in fade-in duration-300" />
                            )}
                            <div className={`
                                relative p-2.5 rounded-2xl transition-all duration-300 ease-out
                                ${showMore || isMoreActive
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-110'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                            `}>
                                {showMore ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2} />}
                                {/* Show badge if secondary items have notifications */}
                                {moreBadge > 0 && !showMore ? (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-lg">
                                        {moreBadge > 9 ? '9+' : moreBadge}
                                    </span>
                                ) : null}
                            </div>
                            <span className={`mt-1 text-[10px] font-semibold transition-all duration-300 ${showMore || isMoreActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                More
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
