'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Calendar, Users, Plus, Loader2, Navigation, X, Coffee, Zap, Music, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
    { id: 'All', label: 'All', emoji: '✨' },
    { id: 'Coffee Meetup', label: 'Coffee', emoji: '☕' },
    { id: 'Speed Dating', label: 'Speed Date', emoji: '⚡' },
    { id: 'Group Activity', label: 'Activity', emoji: '🎯' },
    { id: 'Cultural Event', label: 'Cultural', emoji: '🎭' },
    { id: 'Other', label: 'Other', emoji: '🌟' },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Coffee Meetup':    'from-amber-400 to-orange-400',
    'Speed Dating':     'from-rose-500 to-pink-500',
    'Group Activity':   'from-green-500 to-emerald-500',
    'Cultural Event':   'from-violet-500 to-purple-600',
    'Other':            'from-indigo-500 to-blue-500',
};

export default function MeetSpots({ currentUser }: { currentUser: any }) {
    const toast = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    // Create Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [category, setCategory] = useState('Coffee Meetup');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        api.events.fixDb().catch(() => {}).finally(() => fetchEvents());
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let lat, lng;
            if (currentUser?.location?.lat && currentUser?.location?.lng) {
                lat = currentUser.location.lat;
                lng = currentUser.location.lng;
            }
            const res = await api.events.getAll(lat, lng);
            if (res.success) setEvents(res.events || []);
        } catch (err: any) {
            setEvents([]);
            console.warn('MeetSpots fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            // Fix timezone: datetime-local gives "2026-04-26T09:30" (no TZ).
            // new Date() in the browser interprets this as LOCAL time, so toISOString()
            // correctly converts it to UTC for backend storage.
            const localDate = new Date(eventDate);
            const res = await api.events.create({
                title,
                description,
                location_name: locationName,
                event_date: localDate.toISOString(), // ✅ Correct UTC ISO string
                category,
                lat: currentUser?.location?.lat,
                lng: currentUser?.location?.lng
            });
            if (res.success) {
                toast.success('Meet Spot created! 🎉');
                setShowCreateModal(false);
                setTitle(''); setDescription(''); setLocationName(''); setEventDate('');
                fetchEvents();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create event');
        } finally {
            setIsCreating(false);
        }
    };

    const handleRSVP = async (eventId: string) => {
        try {
            const res = await api.events.rsvp(eventId);
            if (res.success) {
                toast.success(res.attending ? '✅ RSVP Confirmed!' : 'RSVP Cancelled');
                setEvents(events.map(ev => ev.id === eventId
                    ? { ...ev, is_attending: res.attending, attendee_count: ev.attendee_count + (res.attending ? 1 : -1) }
                    : ev
                ));
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to RSVP');
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        // Format in USER's local timezone correctly
        return d.toLocaleString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const getTimeUntil = (dateString: string) => {
        const diff = new Date(dateString).getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d away`;
        if (hours > 0) return `${hours}h away`;
        return 'Starting soon!';
    };

    const filteredEvents = activeFilter === 'All'
        ? events
        : events.filter(e => e.category === activeFilter);

    return (
        <div className="space-y-5 pb-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 rounded-2xl shadow-xl text-white">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={18} className="text-yellow-300" />
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Community</span>
                        </div>
                        <h2 className="text-2xl font-bold">Meet Spots</h2>
                        <p className="text-sm text-indigo-200 mt-1">Discover &amp; host real-world meetups</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Host
                    </button>
                </div>
                {/* Stats row */}
                {events.length > 0 && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-indigo-200 relative z-10">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {events.length} upcoming</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {events.filter(e => e.is_attending).length} joined</span>
                    </div>
                )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                            activeFilter === cat.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                    >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-gray-400">Finding meetups near you...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center shadow-sm">
                    <div className="text-5xl mb-4">{activeFilter === 'All' ? '📍' : CATEGORIES.find(c => c.id === activeFilter)?.emoji}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {activeFilter === 'All' ? 'No upcoming meetups yet' : `No ${activeFilter} events`}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6 text-sm">
                        {activeFilter === 'All'
                            ? 'Be the first to host a local gathering for the community!'
                            : `No ${activeFilter} events yet. Switch filters or host one!`}
                    </p>
                    <Button onClick={() => setShowCreateModal(true)} variant="outline" className="rounded-full">
                        + Host a Meetup
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => {
                        const gradientClass = CATEGORY_COLORS[event.category] || 'from-indigo-500 to-blue-500';
                        return (
                            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                                {/* Card Banner */}
                                <div className={`h-28 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '14px 14px' }} />

                                    {/* Time badge */}
                                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                                        <Zap size={10} className="fill-yellow-300 text-yellow-300" />
                                        {getTimeUntil(event.event_date)}
                                    </div>

                                    {/* Category badge */}
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white">
                                        {CATEGORIES.find(c => c.id === event.category)?.emoji} {event.category}
                                    </div>

                                    {/* Creator avatar */}
                                    <div className="absolute -bottom-5 left-4">
                                        <img
                                            src={event.creator_photo || '/avatar-fallback.svg'}
                                            alt={event.creator_name}
                                            className="w-12 h-12 rounded-full border-3 border-white dark:border-gray-800 object-cover shadow-md bg-gray-100"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-fallback.svg'; }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-7 p-4 flex-1 flex flex-col">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 line-clamp-1">{event.title}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">by {event.creator_name}</p>

                                    <div className="space-y-1.5 mb-4 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                            <Calendar size={13} className="text-indigo-500 flex-shrink-0" />
                                            <span className="font-medium">{formatDate(event.event_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                            <MapPin size={13} className="text-rose-500 flex-shrink-0" />
                                            <span className="line-clamp-1">{event.location_name}</span>
                                        </div>
                                        {event.distance != null && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Navigation size={13} className="text-blue-400 flex-shrink-0" />
                                                <span>{parseFloat(event.distance).toFixed(1)} km away</span>
                                            </div>
                                        )}
                                        {event.description && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 italic line-clamp-2 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            <Users size={13} className={event.is_attending ? 'text-green-500' : 'text-gray-400'} />
                                            <span>{event.attendee_count} going</span>
                                        </div>

                                        <button
                                            onClick={() => handleRSVP(event.id)}
                                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                                event.is_attending
                                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                    : `bg-gradient-to-r ${gradientClass} text-white shadow-sm hover:shadow-md`
                                            }`}
                                        >
                                            {event.is_attending ? '✓ Joined' : '+ RSVP'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal — bottom sheet on mobile, centered dialog on desktop */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div
                        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300"
                        style={{ maxHeight: 'calc(100dvh - 72px)' }}
                    >
                        {/* Drag handle (mobile) */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Host a Meet Spot</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Create a local gathering for the community</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
                                {/* Category Chips */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.filter(c => c.id !== 'All').map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                    category === cat.id
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                                }`}
                                            >
                                                {cat.emoji} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input label="Event Title" placeholder="e.g. Weekend Coffee Mingle" value={title} onChange={e => setTitle(e.target.value)} required />

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Date &amp; Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full h-10 px-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        value={eventDate}
                                        onChange={e => setEventDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        required
                                    />
                                </div>

                                <Input label="Venue / Location" placeholder="e.g. Starbucks, Connaught Place" value={locationName} onChange={e => setLocationName(e.target.value)} required />

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                                    <textarea
                                        className="w-full h-20 p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                                        placeholder="What should people expect? Who should join?"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button" className="flex-1 rounded-xl">Cancel</Button>
                            <Button
                                type="submit"
                                form="create-event-form"
                                disabled={isCreating}
                                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isCreating ? 'Creating...' : 'Create Meet Spot 🎉'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
