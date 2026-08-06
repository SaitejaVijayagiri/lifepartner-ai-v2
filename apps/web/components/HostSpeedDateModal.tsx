'use client';

import React, { useState } from 'react';
import { Video, Sparkles, X, Users, HeartHandshake } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface HostSpeedDateModalProps {
    onClose: () => void;
    onEventCreated: (event: any) => void;
}

export default function HostSpeedDateModal({ onClose, onEventCreated }: HostSpeedDateModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetGender, setTargetGender] = useState<'all' | 'female' | 'male'>('all');
    const [maxParticipants, setMaxParticipants] = useState<number>(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter an event title');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetchAPI('/dates/events/create', {
                method: 'POST',
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    target_gender: targetGender,
                    max_participants: maxParticipants
                })
            });

            if (res.success) {
                toast.success('🎉 Your Live Speed Dating event is now LIVE!');
                onEventCreated(res.event);
                onClose();
            } else {
                toast.error(res.error || 'Failed to create live event');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error creating live event');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-gray-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Modal Header */}
                <div className="flex flex-col items-center text-center space-y-2 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                        <Video size={28} className="text-white" />
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> Host Live Event
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        Host a Live Speed Dating Room
                    </h2>
                    <p className="text-xs text-gray-400 max-w-xs">
                        Start an instant live speed dating room at any time. Singles near you will see your live banner!
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Friday Night Singles Roulette, Bollywood Vibe Check..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 placeholder:text-gray-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                            Description / Topic
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. 3-Minute quick dates, music & late night talks!"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 placeholder:text-gray-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-300 mb-1">
                                Target Matches
                            </label>
                            <select
                                value={targetGender}
                                onChange={(e) => setTargetGender(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                            >
                                <option value="all">Everyone (All)</option>
                                <option value="female">Women Singles</option>
                                <option value="male">Men Singles</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-300 mb-1">
                                Max Capacity
                            </label>
                            <select
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                            >
                                <option value={20}>20 Participants</option>
                                <option value={30}>30 Participants</option>
                                <option value={50}>50 Participants</option>
                                <option value={100}>100 Participants</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:scale-105 active:scale-95 font-bold text-xs text-white shadow-lg shadow-rose-500/25 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? 'Launching Live...' : '🔴 Launch Live Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
