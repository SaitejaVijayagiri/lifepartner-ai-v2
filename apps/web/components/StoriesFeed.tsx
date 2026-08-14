'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Play } from 'lucide-react';
import { fetchAPI, api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/Toast';

const StoryCreator = dynamic(() => import('@/components/StoryCreator'), { ssr: false });

interface StoriesFeedProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    onOpenStory: (storySet: { user: any; stories: any[] }) => void;
}

export default function StoriesFeed({ currentUser, setCurrentUser, onOpenStory }: StoriesFeedProps) {
    const [storyFeed, setStoryFeed] = useState<any[]>([]);
    const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
    const [storyFiles, setStoryFiles] = useState<File[] | null>(null);
    const [storyPreviewUrls, setStoryPreviewUrls] = useState<string[] | null>(null);
    const toast = useToast();

    const fetchStories = async () => {
        try {
            const res = await fetchAPI('/profile/stories/feed');
            if (res.feed) {
                setStoryFeed(res.feed);
            }
        } catch {}
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const markStoryViewed = (storyId: string) => {
        setViewedStoryIds(prev => new Set(prev).add(storyId));
    };

    const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            setStoryFiles(files);
            setStoryPreviewUrls(urls);
        }
    };

    const currentUserId = currentUser?.id || currentUser?.userId;
    const myActiveStories = currentUser?.stories?.filter((s: any) => new Date(s.expiresAt || s.expires_at) > new Date()) || [];

    return (
        <div className="w-full space-y-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 sm:p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span>Active Stories & Moments</span>
                </h3>
                <span className="text-[11px] font-bold text-gray-400">24h Expires</span>
            </div>

            <div className="relative">
                <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 no-scrollbar px-1 pt-1">
                    {/* Add / Create Story Button */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                        <label className="relative cursor-pointer">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] border-2 border-dashed border-indigo-400 dark:border-indigo-600 group-hover:border-rose-500 transition-all duration-300 group-hover:scale-105 relative">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md">
                                        <Plus size={18} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                            <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleStoryFileSelect} />
                        </label>
                        <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-rose-500 transition-colors">Add Story</span>
                    </div>

                    {/* My Active Story Ring */}
                    {myActiveStories.length > 0 && (
                        <div
                            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                            onClick={() => {
                                onOpenStory({
                                    stories: myActiveStories,
                                    user: { ...currentUser, id: currentUserId, name: currentUser.full_name || currentUser.name || 'You' }
                                });
                            }}
                        >
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                                    <div className="w-full h-full rounded-full p-[1.5px] bg-white dark:bg-gray-900">
                                        <img
                                            src={currentUser.photos?.[0] || currentUser.photoUrl || '/avatar-fallback.svg'}
                                            className="w-full h-full rounded-full object-cover"
                                            alt="Your Story"
                                            onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    You
                                </div>
                            </div>
                            <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200">Your Story</span>
                        </div>
                    )}

                    {/* Other Users' Stories Feed */}
                    {storyFeed.map((feedUser, idx) => {
                        const activeStories = feedUser.stories?.filter((s: any) => new Date(s.expiresAt || s.expires_at) > new Date()) || [];
                        if (activeStories.length === 0) return null;

                        const isAllViewed = currentUserId && activeStories.every((s: any) => 
                            viewedStoryIds.has(s.id) || s.views?.some((v: any) => (v.userId || v.user_id) === currentUserId)
                        );

                        return (
                            <div
                                key={feedUser.id}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group animate-in fade-in slide-in-from-right-4"
                                style={{ animationDelay: `${idx * 40}ms` }}
                                onClick={() => {
                                    activeStories.forEach((s: any) => markStoryViewed(s.id));
                                    onOpenStory({ user: feedUser, stories: activeStories });
                                }}
                            >
                                <div className="relative">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] transition-all duration-300 ease-in-out group-hover:scale-105 ${
                                        isAllViewed
                                            ? 'bg-slate-300 dark:bg-slate-700 shadow-sm'
                                            : 'bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-md shadow-orange-500/30'
                                    }`}>
                                        <div className="w-full h-full rounded-full p-[1.5px] bg-white dark:bg-gray-900">
                                            <img
                                                src={feedUser.photoUrl || '/avatar-fallback.svg'}
                                                className="w-full h-full rounded-full object-cover"
                                                alt={feedUser.name}
                                                onError={(e) => { (e.target as any).src = '/avatar-fallback.svg'; }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[70px]">
                                    {feedUser.name?.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Story Creator Modal */}
            {storyPreviewUrls && storyFiles && (
                <StoryCreator
                    storyFiles={storyFiles}
                    storyPreviewUrls={storyPreviewUrls}
                    onClose={() => { setStoryPreviewUrls(null); setStoryFiles(null); }}
                    onSuccess={async () => {
                        setStoryFiles(null);
                        setStoryPreviewUrls(null);
                        toast.success('🎉 Story published successfully!');
                        const me = await api.profile.getMe();
                        if (me) setCurrentUser(me);
                        fetchStories();
                    }}
                />
            )}
        </div>
    );
}
