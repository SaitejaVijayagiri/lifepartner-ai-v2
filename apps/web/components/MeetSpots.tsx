'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Calendar, Users, Plus, Loader2, Navigation, X, Zap, Sparkles, Trash2, LocateFixed, Pencil, Search, Share2, CalendarPlus, ArrowUpDown } from 'lucide-react';
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
    const [editingEvent, setEditingEvent] = useState<any | null>(null); // null = create mode, object = edit mode
    const [gpsLoading, setGpsLoading] = useState(false);
    const [formLat, setFormLat] = useState<number | null>(null);
    const [formLng, setFormLng] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [gpsReady, setGpsReady] = useState(false);

    const lat = currentUser?.location?.lat;
    const lng = currentUser?.location?.lng;

    // Use device GPS for distance calculation (falls back to profile location)
    const [deviceLat, setDeviceLat] = useState<number | undefined>(lat);
    const [deviceLng, setDeviceLng] = useState<number | undefined>(lng);

    // On mount: try GPS first, then fetch. Falls back immediately if GPS denied.
    useEffect(() => {
        const loadWithBestLocation = () => {
            api.events.fixDb().catch(() => {}).finally(() => {
                const latToUse = deviceLat ?? lat;
                const lngToUse = deviceLng ?? lng;
                fetchEvents(latToUse, lngToUse);
            });
        };

        if (navigator.geolocation) {
            // Give GPS 3 seconds, then fallback
            const timer = setTimeout(() => {
                setGpsReady(true);
                loadWithBestLocation();
            }, 3000);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(timer);
                    setDeviceLat(pos.coords.latitude);
                    setDeviceLng(pos.coords.longitude);
                    setGpsReady(true);
                    api.events.fixDb().catch(() => {}).finally(() => {
                        fetchEvents(pos.coords.latitude, pos.coords.longitude);
                    });
                },
                () => {
                    clearTimeout(timer);
                    setGpsReady(false);
                    loadWithBestLocation();
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            loadWithBestLocation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myFilter]);

    const fetchEvents = async (useLat?: number, useLng?: number) => {
        try {
            setLoading(true);
            const latToUse = useLat ?? deviceLat ?? lat;
            const lngToUse = useLng ?? deviceLng ?? lng;
            const res = await api.events.getAll(latToUse, lngToUse, myFilter || undefined);
            if (res.success) setEvents(res.events || []);
        } catch { setEvents([]); } finally { setLoading(false); }
    };

    const grabGPS = () => {
        if (!navigator.geolocation) return toast.error('GPS not available on this device');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setFormLat(latitude);
                setFormLng(longitude);

                // Reverse geocode via OpenStreetMap Nominatim (free, no key needed)
                try {
                    const r = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await r.json();
                    const addr = data.address || {};
                    // Build human-friendly venue string
                    const parts = [
                        addr.amenity || addr.shop || addr.building,
                        addr.road || addr.pedestrian,
                        addr.suburb || addr.neighbourhood,
                        addr.city || addr.town || addr.village
                    ].filter(Boolean);
                    const venueName = parts.slice(0, 3).join(', ');
                    if (venueName) {
                        setForm(f => ({ ...f, location_name: venueName }));
                    }
                } catch { /* ignore geocoding error, coords still saved */ }

                setGpsLoading(false);
            },
            () => { setGpsLoading(false); toast.error('Could not get location. Please allow location access.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            
            // If the user manually typed a location but didn't click GPS, forward-geocode it!
            let finalLat = formLat;
            let finalLng = formLng;
            
            if (!finalLat || !finalLng) {
                try {
                    const query = encodeURIComponent(form.location_name);
                    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
                    const data = await r.json();
                    if (data && data.length > 0) {
                        finalLat = parseFloat(data[0].lat);
                        finalLng = parseFloat(data[0].lon);
                    }
                } catch { /* Silent fail, will fallback below */ }
            }

            const payload = {
                ...form,
                event_date: new Date(form.event_date).toISOString(),
                lat: finalLat ?? lat,
                lng: finalLng ?? lng,
                max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
            };

            let res;
            if (editingEvent) {
                // Edit mode
                res = await api.events.editEvent(editingEvent.id, payload);
            } else {
                // Create mode
                res = await api.events.create(payload);
            }

            if (res.success) {
                toast.success(editingEvent ? 'Event updated! ✅' : 'Meet Spot created! 🎉');
                closeModal();
                fetchEvents();
            }
        } catch (err: any) { toast.error(err.message || 'Failed to save'); } finally { setIsCreating(false); }
    };

    const closeModal = () => {
        setShowCreate(false);
        setEditingEvent(null);
        setForm({ title: '', description: '', location_name: '', event_date: '', category: 'Coffee Meetup', max_attendees: '' });
        setFormLat(null); setFormLng(null);
    };

    const openEdit = (event: any) => {
        // Convert stored UTC ISO date to datetime-local format (browser local time)
        const localDate = new Date(event.event_date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const localStr = `${localDate.getFullYear()}-${pad(localDate.getMonth()+1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;

        setForm({
            title: event.title || '',
            description: event.description || '',
            location_name: event.location_name || '',
            event_date: localStr,
            category: event.category || 'Coffee Meetup',
            max_attendees: event.max_attendees ? String(event.max_attendees) : '',
        });
        if (event.lat) setFormLat(event.lat);
        if (event.lng) setFormLng(event.lng);
        setEditingEvent(event);
        setShowCreate(true);
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

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');

    const formatDate = (s: string) => new Date(s).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    const timeUntil = (s: string) => {
        const h = Math.floor((new Date(s).getTime() - Date.now()) / 3600000);
        return h < 1 ? 'Starting soon!' : h < 24 ? `${h}h away` : `${Math.floor(h/24)}d away`;
    };
    const isToday = (s: string) => {
        const d = new Date(s);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    const addToCalendar = (event: any) => {
        const start = new Date(event.event_date);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeetSpots//EN',
            'BEGIN:VEVENT',
            `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location_name}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
        a.click(); URL.revokeObjectURL(url);
    };

    const shareEvent = async (event: any) => {
        const text = `Join me at "${event.title}" on ${formatDate(event.event_date)} at ${event.location_name} 📍\n\nFind it on LifePartner AI`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try { await navigator.share({ title: event.title, text }); return; } catch {}
        }
        try {
            await navigator.clipboard.writeText(text);
            toast.success('📋 Event details copied!');
        } catch { toast.error('Could not copy'); }
    };

    const filtered = events
        .filter(e => activeCategory === 'All' || e.category === activeCategory)
        .filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.location_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'distance' && a.distance != null && b.distance != null)
                return parseFloat(a.distance) - parseFloat(b.distance);
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        });

    const todayEvents = filtered.filter(e => isToday(e.event_date));
    const upcomingEvents = filtered.filter(e => !isToday(e.event_date));
    const isFull = (e: any) => e.max_attendees && e.attendee_count >= e.max_attendees;

    const renderCard = (event: any) => {
        const grad = CATEGORY_COLORS[event.category] || 'from-indigo-500 to-blue-500';
        const full = isFull(event);
        return (
            <div key={event.id} className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800/50 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
                
                {/* Banner Section */}
                <div className={`h-32 bg-gradient-to-br ${grad} relative overflow-hidden`}>
                    {/* Abstract Texture Overlay */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,rgba(255,255,255,.8) 1px,transparent 0)', backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2 pointer-events-none">
                        <div className="flex-1 min-w-0">
                            <div className="inline-block max-w-full bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm border border-white/20 truncate pointer-events-auto">
                                {CATEGORIES.find(c => c.id === event.category)?.emoji} {event.category}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0 pointer-events-auto">
                            {full && <div className="bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm border border-red-400/50 animate-pulse">FULL</div>}
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                                <Zap size={10} className="fill-yellow-400 text-yellow-400 shrink-0" /> <span className="whitespace-nowrap">{timeUntil(event.event_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Creator Actions */}
                    {event.is_creator && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button onClick={() => openEdit(event)} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors shadow-sm border border-white/20" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(event.id)} className="p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full text-white transition-colors shadow-sm border border-red-400/50" title="Cancel"><Trash2 size={14} /></button>
                        </div>
                    )}
                </div>

                {/* Overlapping Avatar */}
                <div className="absolute top-[5.5rem] left-5 z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full scale-110 shadow-sm"></div>
                        <img src={event.creator_photo || '/avatar-fallback.svg'} alt={event.creator_name}
                            className="relative w-14 h-14 rounded-full border-2 border-white dark:border-gray-900 object-cover shadow-md bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-fallback.svg'; }} />
                    </div>
                </div>

                {/* Content Section */}
                <div className="pt-10 p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1 flex-1 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                        {event.is_creator && <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-black tracking-widest flex-shrink-0 border border-indigo-200 dark:border-indigo-800">HOST</span>}
                    </div>
                    
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-4">Hosted by <span className="font-bold text-gray-700 dark:text-gray-300">{event.creator_name}</span></p>
                    
                    {/* Event Details Box */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 dark:border-gray-800/50 flex-1">
                        <div className="flex items-center gap-2.5 text-[13px] text-gray-700 dark:text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0"><Calendar size={12} className="text-indigo-600 dark:text-indigo-400" /></div>
                            <span className="font-semibold">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px] text-gray-700 dark:text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0"><MapPin size={12} className="text-rose-600 dark:text-rose-400" /></div>
                            <span className="line-clamp-1 font-medium">{event.location_name}</span>
                        </div>
                        {event.distance != null && (
                            <div className="flex items-center gap-2.5 text-[13px] text-gray-500">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0"><Navigation size={12} className="text-blue-600 dark:text-blue-400" /></div>
                                <span>{parseFloat(event.distance).toFixed(1)} km away</span>
                            </div>
                        )}
                        {event.description && (
                            <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>
                            </div>
                        )}
                    </div>

                    {/* RSVP & Action Area */}
                    <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                        <button onClick={() => openAttendees(event.id, event.title)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 transition-colors shrink-0">
                            <Users size={12} className={event.is_attending ? 'text-green-500' : 'text-indigo-500'} />
                            {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''} Attending
                        </button>
                        
                        {event.is_creator ? (
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Your Event</span>
                        ) : (
                            <button onClick={() => handleRSVP(event.id)} disabled={full && !event.is_attending}
                                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex-1 sm:flex-none text-center ${
                                    event.is_attending 
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                    : full 
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 shadow-none'
                                    : `bg-gradient-to-r ${grad} text-white hover:shadow-lg hover:brightness-110`
                                }`}>
                                {event.is_attending ? '✓ Joined' : full ? 'Full' : 'Join Now'}
                            </button>
                        )}
                    </div>
                    
                    {/* Share & Calendar Footer */}
                    <div className="flex items-center gap-1 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800/60">
                        <button onClick={() => shareEvent(event)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Share2 size={14} /> Share
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        <button onClick={() => addToCalendar(event)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                            <CalendarPlus size={14} /> Calendar
                        </button>
                        {event.location_name && (
                            <>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location_name)}`, '_blank')}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <LocateFixed size={14} /> Directions
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5 pb-4">
            {/* Header — premium glassmorphism banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-purple-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={16} className="text-yellow-300" />
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Community</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Meet Spots</h2>
                            <p className="text-sm text-indigo-200/80 mt-1 font-light">Discover &amp; host real-world meetups nearby</p>
                        </div>
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 shrink-0">
                            <Plus size={16} /> Host Event
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                            <Calendar size={13} className="text-yellow-300" /> {events.length} Events
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                            <Users size={13} className="text-green-300" /> {events.filter(e => e.is_attending).length} RSVPs by you
                        </span>
                        {/* GPS Status */}
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ml-auto ${
                            (deviceLat && deviceLat !== lat) ? 'text-green-300' : 'text-indigo-300/60'
                        }`}>
                            <LocateFixed size={13} />
                            {(deviceLat && deviceLat !== lat) ? 'GPS Active' : 'No GPS'}
                        </span>
                    </div>
                </div>
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

            {/* Search + Sort row */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search events or venues..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={() => setSortBy(s => s === 'date' ? 'distance' : 'date')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300 transition-all flex-shrink-0"
                >
                    <ArrowUpDown size={13} />
                    {sortBy === 'date' ? 'By Date' : 'By Distance'}
                </button>
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
                <div className="bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-5">
                        <span className="text-4xl">{searchQuery ? '🔍' : '📍'}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{searchQuery ? 'No events found' : 'No meetups near you yet'}</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">{searchQuery ? `Try different keywords or clear the filter.` : 'Be the first to host a gathering in your city!'}</p>
                    {!searchQuery && <Button onClick={() => setShowCreate(true)} className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-8">🎉 Host the First Meetup</Button>}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* TODAY section */}
                    {todayEvents.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                    <Zap size={14} className="fill-orange-400" /> Happening Today
                                </span>
                                <div className="flex-1 h-px bg-orange-100 dark:bg-orange-900/30" />
                                <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">{todayEvents.length}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayEvents.map(event => renderCard(event))}
                            </div>
                        </div>
                    )}
                    {/* UPCOMING section */}
                    {upcomingEvents.length > 0 && (
                        <div>
                            {todayEvents.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                        <Calendar size={14} /> Upcoming
                                    </span>
                                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingEvents.map(event => renderCard(event))}
                            </div>
                        </div>
                    )}
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
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingEvent ? 'Edit Meet Spot' : 'Host a Meet Spot'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {editingEvent ? 'Update your event details' : 'Create a local gathering'}
                                </p>
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={18} /></button>
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
                                    {/* GPS Button */}
                                    {!formLat ? (
                                        <button type="button" onClick={grabGPS} disabled={gpsLoading}
                                            className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-60">
                                            {gpsLoading ? <><Loader2 size={12} className="animate-spin" /> Detecting your location...</> : <><LocateFixed size={12} /> 📍 Auto-detect my exact location</>}
                                        </button>
                                    ) : (
                                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                                <LocateFixed size={11} /> GPS Active: {formLat.toFixed(5)}, {formLng?.toFixed(5)}
                                            </span>
                                            <button type="button" onClick={() => { setFormLat(null); setFormLng(null); }}
                                                className="text-xs text-gray-400 hover:text-red-500 underline">clear</button>
                                        </div>
                                    )}
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
                            <Button variant="outline" onClick={closeModal} className="flex-1 rounded-xl">Cancel</Button>
                            <Button type="submit" form="create-form" disabled={isCreating} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isCreating ? 'Saving...' : editingEvent ? 'Save Changes ✅' : 'Create 🎉'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
