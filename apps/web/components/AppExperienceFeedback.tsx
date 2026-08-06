'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquareHeart, X, CheckCircle, ThumbsUp, AlertCircle, HeartHandshake } from 'lucide-react';
import { submitAppFeedback, trackDropOff } from '@/lib/analytics';
import { useToast } from '@/components/ui/Toast';

interface AppExperienceFeedbackProps {
    userId?: string;
    userName?: string;
    autoPrompt?: boolean;
}

export default function AppExperienceFeedback({ userId, userName, autoPrompt = false }: AppExperienceFeedbackProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('overall_experience');
    const [feedbackText, setFeedbackText] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const toast = useToast();

    const categories = [
        { id: 'match_quality', label: '💖 Match Quality', icon: '✨' },
        { id: 'images_loading', label: '🖼️ Photos & Images', icon: '📷' },
        { id: 'chat_experience', label: '💬 Chat & Responses', icon: '🗨️' },
        { id: 'drop_off_reason', label: '📉 App Drop-off Reason', icon: '🤔' },
        { id: 'overall_experience', label: '⭐ Overall App Experience', icon: '🚀' },
    ];

    // Optional auto-prompt trigger after user has interacted with the app for 60 seconds
    useEffect(() => {
        if (!autoPrompt) return;
        const promptDismissed = localStorage.getItem('lp_feedback_prompt_dismissed');
        if (promptDismissed) return;

        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 45000); // 45 seconds into session

        return () => clearTimeout(timer);
    }, [autoPrompt]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await submitAppFeedback({
            rating,
            category: selectedCategory,
            feedback_text: feedbackText,
            user_name: userName || 'User',
            prompt_context: autoPrompt ? 'auto_prompt' : 'manual'
        });

        setIsSubmitting(false);

        if (result.success) {
            setIsSubmitted(true);
            toast.success('Thank you for helping us improve LifePartner AI! ❤️');
            localStorage.setItem('lp_feedback_prompt_dismissed', 'true');
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
                setFeedbackText('');
            }, 2500);
        } else {
            toast.error(result.message || 'Failed to submit feedback');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        trackDropOff('feedback_modal', 'dismissed');
        localStorage.setItem('lp_feedback_prompt_dismissed', 'true');
    };

    return (
        <>
            {/* Floating Trigger Button (Bottom Right) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-medium text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/20"
                aria-label="App Experience Feedback"
            >
                <MessageSquareHeart size={18} className="animate-bounce text-pink-200 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-bold">Feedback & Rating</span>
                <span className="sm:hidden font-bold">Feedback</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-gray-800 dark:text-gray-100">
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        {isSubmitted ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400/40 flex items-center justify-center mb-4 text-emerald-500">
                                    <CheckCircle size={36} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Feedback Received!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                                    Your response directly helps us fix issues and deliver better matches for everyone.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Header */}
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        <HeartHandshake size={14} /> User Experience
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                        How is LifePartner AI working for you?
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Let us know if match images load well, match quality is good, or where you feel like dropping out.
                                    </p>
                                </div>

                                {/* Star Rating */}
                                <div className="flex flex-col items-center py-2 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                        Select your overall score
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`${
                                                        (hoverRating || rating) >= star
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                    } transition-colors duration-150`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                        {rating === 5 && '😍 Outstanding Experience'}
                                        {rating === 4 && '😊 Good App & Matches'}
                                        {rating === 3 && '😐 Average / Needs Fixes'}
                                        {rating === 2 && '🙁 Facing Issues / Images or Matches'}
                                        {rating === 1 && '😞 Poor / Might Drop Out'}
                                    </span>
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        What area is this regarding?
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all ${
                                                    selectedCategory === cat.id
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Comment Textarea */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Your Thoughts or Suggestions
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Tell us what you love or why you feel like dropping out (e.g. photos not loading, bad matches, features missing)..."
                                        className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
