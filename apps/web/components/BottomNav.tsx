'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Users, MessageCircle, User, Coffee, MapPin, Calendar, MoreHorizontal, X } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    requestsCount: number;
    unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, requestsCount, unreadCount }) => {
    const [showMore, setShowMore] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    // Close drawer when clicking outside (but NOT when clicking the More button itself — that uses its own toggle)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const clickedOutsidePopup = moreRef.current && !moreRef.current.contains(e.target as Node);
            const clickedMoreButton = moreButtonRef.current && moreButtonRef.current.contains(e.target as Node);
            if (clickedOutsidePopup && !clickedMoreButton) {
                setShowMore(false);
            }
        };
        if (showMore) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMore]);

    // Primary nav — 5 items always visible
    const primaryItems = [
        { id: 'matches', label: 'Matches', icon: Heart, gradient: 'from-rose-500 to-pink-500' },
        { id: 'map', label: 'Map', icon: MapPin, gradient: 'from-purple-500 to-indigo-500' },
        { id: 'events', label: 'Meetups', icon: Calendar, gradient: 'from-violet-500 to-purple-600' },
        { id: 'connections', label: 'Chat', icon: MessageCircle, badge: unreadCount, gradient: 'from-emerald-500 to-teal-500' },
        { id: 'profile', label: 'Profile', icon: User, gradient: 'from-blue-500 to-cyan-500' },
    ];

    // Secondary items in "More"
    const secondaryItems = [
        { id: 'requests', label: 'Requests', icon: Users, badge: requestsCount, gradient: 'from-amber-500 to-orange-500' },
        { id: 'community', label: 'Lounge', icon: Coffee, gradient: 'from-indigo-500 to-blue-500' },
    ];

    const isMoreActive = secondaryItems.some(i => i.id === activeTab);
    const moreBadge = requestsCount || 0;

    const handleSelect = (id: string) => {
        setActiveTab(id);
        setShowMore(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] pb-6 px-4 md:hidden">
            <div className="relative flex justify-center">

                {/* ─── More Popup (renders ABOVE the nav bar) ─── */}
                {showMore && (
                    <div
                        ref={moreRef}
                        className="absolute bottom-full mb-3 right-3 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
                        style={{ zIndex: 1001 }}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">More</span>
                            <button onClick={() => setShowMore(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={14} />
                            </button>
                        </div>
                        {secondaryItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left ${
                                        isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-xl ${isActive ? `bg-gradient-to-r ${item.gradient} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                        <item.icon size={16} strokeWidth={2} />
                                    </div>
                                    <span className="font-semibold text-sm">{item.label}</span>
                                    {item.badge && item.badge > 0 ? (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ─── Main Nav Bar ─── */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 border border-gray-100/50 dark:border-gray-800/50 flex justify-between items-center px-2 py-2 w-full max-w-md">
                    {primaryItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setShowMore(false);
                                    setActiveTab(item.id);
                                }}
                                className="relative flex-1 flex flex-col items-center justify-center py-1.5 group"
                            >
                                {isActive && (
                                    <div className={`absolute inset-x-1 inset-y-1 bg-gradient-to-r ${item.gradient} rounded-xl opacity-10`} />
                                )}

                                <div className={`
                                    relative p-2 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-md scale-110`
                                        : 'text-gray-400 dark:text-gray-500 group-active:bg-gray-100 dark:group-active:bg-gray-800'
                                    }
                                `}>
                                    <item.icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        fill={isActive ? 'currentColor' : 'none'}
                                    />
                                    {item.badge && item.badge > 0 ? (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    ) : null}
                                </div>

                                <span className={`mt-1 text-[9px] font-bold leading-tight transition-colors ${isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {item.label}
                                </span>

                                {isActive && (
                                    <div className={`absolute -bottom-0.5 w-1 h-1 rounded-full bg-gradient-to-r ${item.gradient}`} />
                                )}
                            </button>
                        );
                    })}

                    {/* ─── More Button ─── */}
                    <button
                        ref={moreButtonRef}
                        onClick={() => setShowMore(prev => !prev)}
                        className="relative flex-1 flex flex-col items-center justify-center py-1.5 group"
                    >
                        {(showMore || isMoreActive) && (
                            <div className="absolute inset-x-1 inset-y-1 bg-gray-200 dark:bg-gray-700 rounded-xl opacity-40" />
                        )}
                        <div className={`
                            relative p-2 rounded-xl transition-all duration-200
                            ${showMore || isMoreActive
                                ? 'bg-gray-700 dark:bg-gray-600 text-white shadow-md scale-110'
                                : 'text-gray-400 dark:text-gray-500 group-active:bg-gray-100 dark:group-active:bg-gray-800'
                            }
                        `}>
                            <MoreHorizontal size={20} strokeWidth={2} />
                            {moreBadge > 0 && !showMore ? (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                                    {moreBadge > 9 ? '9+' : moreBadge}
                                </span>
                            ) : null}
                        </div>
                        <span className={`mt-1 text-[9px] font-bold leading-tight ${showMore || isMoreActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                            More
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
