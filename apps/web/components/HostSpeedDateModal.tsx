'use client';

import React, { useState } from 'react';
import { Video, Sparkles, X, Users, Calendar, Clock, Radio } from 'lucide-react';
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
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledDate, setScheduledDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [scheduledTime, setScheduledTime] = useState('20:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter an event title');
            return;
        }

        let scheduled_at: string | undefined = undefined;
        if (isScheduled) {
            if (!scheduledDate || !scheduledTime) {
                toast.error('Please select both date and time for scheduled event');
                return;
            }
            const schedObj = new Date(`${scheduledDate}T${scheduledTime}`);
            if (isNaN(schedObj.getTime()) || schedObj <= new Date()) {
                toast.error('Scheduled date and time must be in the future!');
                return;
            }
            scheduled_at = schedObj.toISOString();
        }

        setIsSubmitting(true);
        try {
            const res = await fetchAPI('/dates/events/create', {
                method: 'POST',
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    target_gender: targetGender,
                    max_participants: maxParticipants,
                    scheduled_at
                })
            });

            if (res.success) {
                toast.success(isScheduled ? '📅 Live event scheduled successfully!' : '🎉 Your Live Speed Dating event is now LIVE!');
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
            <div className="relative w-full max-w-md bg-gray-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white overflow-hidden max-h-[92vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Modal Header */}
                <div className="flex flex-col items-center text-center space-y-2 mb-5">
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
                        Start an instant live stream or schedule a future date & time for singles to join!
                    </p>
                </div>

                {/* Instant vs Scheduled Mode Toggle */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/10 mb-4">
                    <button
                        type="button"
                        onClick={() => setIsScheduled(false)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                            !isScheduled
                                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Radio size={14} className={!isScheduled ? 'animate-pulse text-white' : ''} />
                        <span>🔴 Go Live Now</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsScheduled(true)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                            isScheduled
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Calendar size={14} />
                        <span>📅 Schedule for Later</span>
                    </button>
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

                    {/* Scheduled Date & Time Controls */}
                    {isScheduled && (
                        <div className="p-3.5 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-300">
                                <Clock size={14} />
                                <span>Select Date & Time for Event</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                        required={isScheduled}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-300 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                                        required={isScheduled}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
                                <option value="female">Female</option>
                                <option value="male">Male</option>
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
                            {isSubmitting
                                ? 'Saving Event...'
                                : isScheduled
                                ? '📅 Schedule Live Event'
                                : '🔴 Launch Live Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
