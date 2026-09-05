'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Bell, X, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Notifications, isNativePlatform } from '@/lib/notifications';

interface WebPushPromptProps {
    onDismiss?: () => void;
}

export default function WebPushPrompt({ onDismiss }: WebPushPromptProps) {
    const [show, setShow] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        // Do not show on Native Android/iOS (Push is handled natively automatically)
        if (isNativePlatform()) {
            return;
        }

        // Wait 1.5 seconds before prompting so user settles on page
        const timer = setTimeout(() => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    // Check session storage so we don't annoy them repeatedly within the same session
                    const dismissed = sessionStorage.getItem('web_push_dismissed_session');
                    if (!dismissed) {
                        setShow(true);
                    }
                } else if (Notification.permission === 'granted') {
                    // Already granted! Silently initialize for web to update token if needed
                    Notifications.init().then(() => Notifications.setupListeners()).catch(console.error);
                }
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleEnable = async () => {
        setIsSubscribing(true);
        try {
            await Notifications.requestPermission();
            Notifications.setupListeners();
            setShow(false);
        } catch (e) {
            console.error("Failed to enable push", e);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleDismiss = () => {
        try {
            sessionStorage.setItem('web_push_dismissed_session', 'true');
        } catch (_) {}
        setShow(false);
        onDismiss?.();
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[400px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-[250] animate-in slide-in-from-bottom-5 duration-500 fade-in">
            <button 
                onClick={handleDismiss} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner shadow-white/20 flex-shrink-0 animate-pulse">
                    <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Turn on Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Never miss a match or video call.</p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 dark:text-green-400 font-bold text-xs">✓</span>
                        </div>
                        Instant alerts for new messages
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">📞</span>
                        </div>
                        Rings natively for Video Calls
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-pink-600 dark:text-pink-400 font-bold text-xs">💖</span>
                        </div>
                        Match requests & Liked alerts
                    </li>
                </ul>
            </div>

            <div className="flex gap-3">
                <Button 
                    variant="outline" 
                    onClick={handleDismiss}
                    className="flex-1 h-12 rounded-xl text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 font-semibold"
                >
                    Maybe Later
                </Button>
                <Button 
                    onClick={handleEnable}
                    disabled={isSubscribing}
                    className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-bold"
                >
                    {isSubscribing ? 'Enabling...' : 'Enable Now'}
                </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-1.5 opacity-60">
                 <ShieldCheck className="w-3.5 h-3.5 text-gray-500"/>
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Secure & Spam Free</span>
            </div>
        </div>
    );
}
