'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Calendar, Users, Plus, Loader2, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MeetSpots({ currentUser }: { currentUser: any }) {
    const toast = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationName, setLocationName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [category, setCategory] = useState('Coffee Meetup');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchEvents();
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
            if (res.success) {
                setEvents(res.events || []);
            }
        } catch (err: any) {
            toast.error("Failed to load meet spots");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            const res = await api.events.create({
                title,
                description,
                location_name: locationName,
                event_date: eventDate,
                category,
                // Passing current user's lat/lng for simplicity, though normally we'd geocode the location_name
                lat: currentUser?.location?.lat,
                lng: currentUser?.location?.lng
            });
            if (res.success) {
                toast.success("Meet Spot created!");
                setShowCreateModal(false);
                // Reset form
                setTitle('');
                setDescription('');
                setLocationName('');
                setEventDate('');
                fetchEvents();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create event");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRSVP = async (eventId: string) => {
        try {
            const res = await api.events.rsvp(eventId);
            if (res.success) {
                toast.success(res.attending ? "RSVP Confirmed!" : "RSVP Cancelled");
                setEvents(events.map(ev => {
                    if (ev.id === eventId) {
                        return {
                            ...ev,
                            is_attending: res.attending,
                            attendee_count: ev.attendee_count + (res.attending ? 1 : -1)
                        };
                    }
                    return ev;
                }));
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to RSVP");
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Meet Spots</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Discover safe, local meetups hosted by the community.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <Plus size={18} />
                    <span>Host a Meetup</span>
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center shadow-sm">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin size={32} className="text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No upcoming meetups nearby</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">Be the first to host a local gathering! Coffee dates, group hikes, or speed dating events.</p>
                    <Button onClick={() => setShowCreateModal(true)} variant="outline" className="rounded-full">Create the first event</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                            {/* Card Header Map Graphic / Pattern */}
                            <div className="h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 dark:opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.4) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-white/20">
                                    {event.category}
                                </div>
                                {/* Creator Avatar */}
                                <div className="absolute -bottom-6 left-6">
                                    <img src={event.creator_photo || '/avatar-fallback.svg'} alt={event.creator_name} className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-sm bg-gray-100" />
                                </div>
                            </div>
                            
                            <div className="pt-8 p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
                                    Hosted by <span className="font-semibold">{event.creator_name}</span>
                                </p>
                                
                                <div className="space-y-2 mb-4 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Calendar size={16} className="text-indigo-500 flex-shrink-0" />
                                        <span>{formatDate(event.event_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <MapPin size={16} className="text-rose-500 flex-shrink-0" />
                                        <span className="line-clamp-1">{event.location_name}</span>
                                    </div>
                                    {event.distance !== undefined && event.distance !== null && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <Navigation size={16} className="text-blue-500 flex-shrink-0" />
                                            <span>{Math.round(event.distance)} km away</span>
                                        </div>
                                    )}
                                    {event.description && (
                                        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 italic border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                            &ldquo;{event.description}&rdquo;
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <Users size={16} className={event.is_attending ? "text-green-500" : "text-gray-400"} />
                                        <span>{event.attendee_count} {event.attendee_count === 1 ? 'Going' : 'Going'}</span>
                                    </div>
                                    
                                    <Button 
                                        onClick={() => handleRSVP(event.id)}
                                        variant={event.is_attending ? "outline" : "primary"}
                                        className={`rounded-full h-8 px-4 text-xs font-bold transition-all ${event.is_attending ? 'border-green-200 text-green-700 hover:bg-green-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                    >
                                        {event.is_attending ? '✓ Joined' : 'RSVP Now'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="text-indigo-500" />
                                Host a Meet Spot
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                    <select 
                                        className="w-full h-10 px-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        required
                                    >
                                        <option value="Coffee Meetup">Coffee Meetup</option>
                                        <option value="Speed Dating">Speed Dating</option>
                                        <option value="Group Activity">Group Activity</option>
                                        <option value="Cultural Event">Cultural Event</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <Input label="Event Title" placeholder="e.g. Weekend Coffee Mingle" value={title} onChange={e => setTitle(e.target.value)} required />
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full h-10 px-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
                                        value={eventDate}
                                        onChange={e => setEventDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <Input label="Venue / Location Name" placeholder="e.g. Starbucks, Connaught Place" value={locationName} onChange={e => setLocationName(e.target.value)} required />
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                                    <textarea 
                                        className="w-full h-24 p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="What should people expect? Who should join?"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button">Cancel</Button>
                            <Button type="submit" form="create-event-form" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Event
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
