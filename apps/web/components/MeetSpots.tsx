'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Calendar, Users, Plus, Loader2, Navigation, X, Zap, Sparkles, Trash2, LocateFixed } from 'lucide-react';
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
    'Coffee Meetup':  'from-amber-400 to-orange-400',
    'Speed Dating':   'from-rose-500 to-pink-500',
    'Group Activity': 'from-green-500 to-emerald-500',
    'Cultural Event': 'from-violet-500 to-purple-600',
    'Other':          'from-indigo-500 to-blue-500',
};
const MY_FILTERS = [
    { id: '', label: 'All Events' },
    { id: 'hosting', label: '🎤 Hosting' },
    { id: 'attending', label: '✅ Attending' },
];

export default function MeetSpots({ currentUser }: { currentUser: any }) {
    const toast = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [myFilter, setMyFilter] = useState('');
    const [attendeeModal, setAttendeeModal] = useState<{ eventId: string; title: string } | null>(null);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);

    // Form state
    const [form, setForm] = useState({ title: '', description: '', location_name: '', event_date: '', category: 'Coffee Meetup', max_attendees: '' });
    const [gpsLoading, setGpsLoading] = useState(false);
    const [formLat, setFormLat] = useState<number | null>(null);
    const [formLng, setFormLng] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const lat = currentUser?.location?.lat;
    const lng = currentUser?.location?.lng;

    useEffect(() => {
        api.events.fixDb().catch(() => {}).finally(() => fetchEvents());
    }, [myFilter]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.events.getAll(lat, lng, myFilter || undefined);
            if (res.success) setEvents(res.events || []);
        } catch { setEvents([]); } finally { setLoading(false); }
    };

    const grabGPS = () => {
        if (!navigator.geolocation) return toast.error('GPS not available on this device');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormLat(pos.coords.latitude);
                setFormLng(pos.coords.longitude);
                setGpsLoading(false);
                toast.success('📍 Exact location captured!');
            },
            () => { setGpsLoading(false); toast.error('Could not get location. Please allow access.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            const res = await api.events.create({
                ...form,
                event_date: new Date(form.event_date).toISOString(),
                lat: formLat ?? lat,
                lng: formLng ?? lng,
                max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
            });
            if (res.success) {
                toast.success('Meet Spot created! 🎉');
                setShowCreate(false);
                setForm({ title: '', description: '', location_name: '', event_date: '', category: 'Coffee Meetup', max_attendees: '' });
                setFormLat(null); setFormLng(null);
                fetchEvents();
            }
        } catch (err: any) { toast.error(err.message || 'Failed to create'); } finally { setIsCreating(false); }
    };

    const handleRSVP = async (eventId: string) => {
        try {
            const res = await api.events.rsvp(eventId);
            if (res.success) {
                toast.success(res.attending ? '✅ RSVP Confirmed!' : 'RSVP Cancelled');
                setEvents(prev => prev.map(ev => ev.id === eventId
                    ? { ...ev, is_attending: res.attending, attendee_count: ev.attendee_count + (res.attending ? 1 : -1) }
                    : ev));
            }
        } catch (err: any) { toast.error(err.message || 'Failed to RSVP'); }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Cancel this event? All RSVPs will be removed.')) return;
        try {
            await api.events.deleteEvent(eventId);
            toast.success('Event cancelled');
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err: any) { toast.error(err.message || 'Failed to delete'); }
    };

    const openAttendees = async (eventId: string, title: string) => {
        setAttendeeModal({ eventId, title });
        setLoadingAttendees(true);
        try {
            const res = await api.events.getAttendees(eventId);
            setAttendees(res.attendees || []);
        } catch { setAttendees([]); } finally { setLoadingAttendees(false); }
    };

    const formatDate = (s: string) => new Date(s).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    const timeUntil = (s: string) => {
        const h = Math.floor((new Date(s).getTime() - Date.now()) / 3600000);
        return h < 1 ? 'Starting soon!' : h < 24 ? `${h}h away` : `${Math.floor(h/24)}d away`;
    };

    const filtered = events.filter(e => activeCategory === 'All' || e.category === activeCategory);
    const isFull = (e: any) => e.max_attendees && e.attendee_count >= e.max_attendees;

    return (
        <div className="space-y-5 pb-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 rounded-2xl text-white">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-yellow-300" /><span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Community</span></div>
                        <h2 className="text-2xl font-bold">Meet Spots</h2>
                        <p className="text-sm text-indigo-200 mt-0.5">Discover &amp; host real-world meetups nearby</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95">
                        <Plus size={16} /> Host
                    </button>
                </div>
                {events.length > 0 && (
                    <div className="mt-3 flex gap-4 text-xs text-indigo-200 relative z-10">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {events.length} upcoming</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {events.filter(e => e.is_attending).length} joined by you</span>
                    </div>
                )}
            </div>

            {/* My Events filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {MY_FILTERS.map(f => (
                    <button key={f.id} onClick={() => setMyFilter(f.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${myFilter === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                        {cat.emoji} {cat.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center py-16 gap-3"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /><p className="text-sm text-gray-400">Finding meetups near you...</p></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                    <div className="text-4xl mb-3">📍</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No meetups found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Be the first to host one in your area!</p>
                    <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full">+ Host a Meetup</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(event => {
                        const grad = CATEGORY_COLORS[event.category] || 'from-indigo-500 to-blue-500';
                        const full = isFull(event);
                        return (
                            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all flex flex-col">
                                <div className={`h-24 bg-gradient-to-br ${grad} relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,rgba(255,255,255,.4) 1px,transparent 0)', backgroundSize: '14px 14px' }} />
                                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                                        <Zap size={9} className="fill-yellow-300 text-yellow-300" /> {timeUntil(event.event_date)}
                                    </div>
                                    {full && <div className="absolute top-3 right-14 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white">FULL</div>}
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                                        {CATEGORIES.find(c => c.id === event.category)?.emoji}
                                    </div>
                                    <div className="absolute -bottom-5 left-4">
                                        <img src={event.creator_photo || '/avatar-fallback.svg'} alt={event.creator_name}
                                            className="w-11 h-11 rounded-full border-2 border-white dark:border-gray-800 object-cover shadow bg-gray-100"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-fallback.svg'; }} />
                                    </div>
                                    {event.is_creator && (
                                        <button onClick={() => handleDelete(event.id)} className="absolute bottom-2 right-3 p-1.5 bg-black/30 hover:bg-red-500/80 rounded-full text-white transition-colors" title="Cancel event">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className="pt-7 p-4 flex-1 flex flex-col gap-1">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">{event.title}</h3>
                                        {event.is_creator && <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">HOST</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-400">by {event.creator_name}</p>

                                    <div className="space-y-1 mt-1 mb-3 flex-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Calendar size={12} className="text-indigo-500" /><span className="font-medium">{formatDate(event.event_date)}</span></div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><MapPin size={12} className="text-rose-500" /><span className="line-clamp-1">{event.location_name}</span></div>
                                        {event.distance != null && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Navigation size={12} className="text-blue-400" /><span>{parseFloat(event.distance).toFixed(1)} km away</span></div>}
                                        {event.description && <p className="text-[11px] text-gray-400 italic line-clamp-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700 mt-1">{event.description}</p>}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={() => openAttendees(event.id, event.title)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                                            <Users size={13} className={event.is_attending ? 'text-green-500' : 'text-gray-400'} />
                                            <span>{event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''} going</span>
                                        </button>
                                        {event.is_creator ? (
                                            <span className="text-[10px] text-gray-400 italic">Your event</span>
                                        ) : (
                                            <button onClick={() => handleRSVP(event.id)} disabled={full && !event.is_attending}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    event.is_attending ? 'bg-green-50 dark:bg-green-900/30 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                    : full ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                    : `bg-gradient-to-r ${grad} text-white shadow-sm hover:shadow-md`}`}>
                                                {event.is_attending ? '✓ Joined' : full ? 'Full' : '+ RSVP'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Attendee List Modal */}
            {attendeeModal && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: '60dvh' }}>
                        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                            <div><p className="text-xs text-gray-400">Attendees</p><h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{attendeeModal.title}</h4></div>
                            <button onClick={() => setAttendeeModal(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loadingAttendees ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-500" /></div>
                            : attendees.length === 0 ? <p className="text-center text-gray-400 text-sm py-6">No attendees yet</p>
                            : attendees.map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <img src={a.photo || '/avatar-fallback.svg'} alt={a.name} className="w-9 h-9 rounded-full object-cover bg-gray-100" onError={e => { (e.target as HTMLImageElement).src='/avatar-fallback.svg'; }} />
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{a.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col" style={{ maxHeight: 'calc(100dvh - 72px)' }}>
                        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" /></div>
                        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                            <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Host a Meet Spot</h3><p className="text-xs text-gray-400">Create a local gathering</p></div>
                            <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            <form id="create-form" onSubmit={handleCreate} className="space-y-4">
                                {/* Category chips */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.filter(c => c.id !== 'All').map(cat => (
                                            <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.category === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                                                {cat.emoji} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Input label="Event Title" placeholder="e.g. Weekend Coffee Mingle" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Date &amp; Time</label>
                                    <input type="datetime-local" className="w-full h-10 px-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} min={new Date().toISOString().slice(0, 16)} required />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Venue / Location</label>
                                    <Input placeholder="e.g. Starbucks, Connaught Place" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} required />
                                    <button type="button" onClick={grabGPS} disabled={gpsLoading}
                                        className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-60">
                                        {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                                        {formLat ? '📍 GPS location captured' : 'Use my exact GPS location (more accurate)'}
                                    </button>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Max Attendees <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input type="number" min="2" max="500" placeholder="Leave blank for unlimited"
                                        className="w-full h-10 px-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                                    <textarea className="w-full h-16 p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="What should people expect?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Cancel</Button>
                            <Button type="submit" form="create-form" disabled={isCreating} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isCreating ? 'Creating...' : 'Create 🎉'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
