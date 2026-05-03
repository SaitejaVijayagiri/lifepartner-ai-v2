'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ShieldAlert, PhoneForwarded, MapPin, X, Check } from 'lucide-react';

export default function DateSafetyOverlay() {
    const toast = useToast();
    const [activeDate, setActiveDate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showSOS, setShowSOS] = useState(false);
    const [fakingCall, setFakingCall] = useState(false);
    const [showSafetyCheck, setShowSafetyCheck] = useState(false);

    useEffect(() => {
        fetchActiveDate();
        const interval = setInterval(fetchActiveDate, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchActiveDate = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/active`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).then(r => r.json());
            
            if (res.success && res.dates) {
                // Find any date that is 'accepted' and occurring today or recently
                const now = new Date();
                const current = res.dates.find((d: any) => {
                    if (d.status !== 'accepted') return false;
                    const dateTime = new Date(d.date_time);
                    const timeDiffHours = (now.getTime() - dateTime.getTime()) / (1000 * 60 * 60);
                    // Active if within -2 hours (upcoming) to +6 hours (ongoing)
                    return timeDiffHours >= -2 && timeDiffHours <= 6;
                });
                
                if (current) {
                    setActiveDate(current);
                    if (current.safety_check_triggered && current.status === 'accepted') {
                        setShowSafetyCheck(true);
                    }
                } else {
                    setActiveDate(null);
                    setShowSafetyCheck(false);
                }
            }
        } catch (e) {
            console.error("Failed to fetch active dates", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFakeCall = () => {
        setFakingCall(true);
        toast.success("Initiating fake call... Your phone will ring in 10 seconds.");
        setTimeout(() => {
            // Real implementation would use capacitor native call plugin
            // For now, we simulate a loud ringtone if in browser
            const audio = new Audio('/fake_ringtone.mp3');
            audio.loop = true;
            audio.play().catch(() => {
                toast.success("🚨 FAKE CALL INCOMING 🚨", { duration: 10000 });
            });
            setTimeout(() => {
                audio.pause();
                setFakingCall(false);
            }, 15000);
        }, 10000);
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }

        toast.info("Fetching precise location...");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/${activeDate.id}/sos`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lat, lng, reason: 'Manual SOS' })
                }).then(r => r.json());

                if (res.success) {
                    toast.success("SOS sent to your Emergency Contact!");
                    setShowSOS(false);
                } else {
                    toast.error("Failed to send SOS");
                }
            } catch (e) {
                toast.error("Network error sending SOS");
            }
        }, () => {
            toast.error("Please enable Location Services to send your coordinates.");
        }, { enableHighAccuracy: true });
    };

    const handleMarkSafe = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/${activeDate.id}/safe`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).then(r => r.json());

            if (res.success) {
                toast.success("Date marked as safe. Have a great time!");
                setShowSafetyCheck(false);
                setShowSOS(false);
                setActiveDate(null); // Remove overlay
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const getWhatsAppLink = (lat?: number, lng?: number) => {
        let phone = '';
        if (activeDate?.my_metadata) {
            const md = typeof activeDate.my_metadata === 'string' ? JSON.parse(activeDate.my_metadata) : activeDate.my_metadata;
            phone = md?.emergency_contact?.phone || '';
        }
        if (!phone) return '';
        // Clean phone number
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length === 10) phone = '91' + phone;

        let msg = `🚨 SOS ALERT! I need help. I am on a date with ${activeDate?.partner_name} at ${activeDate?.location_name}.`;
        if (lat && lng) {
            msg += `\nMy live location: https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }
        return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    };

    const handleWhatsAppSOS = () => {
        if (!navigator.geolocation) {
            const link = getWhatsAppLink();
            if (link) window.open(link, '_blank');
            return;
        }

        toast.info("Getting location for WhatsApp SOS...");
        navigator.geolocation.getCurrentPosition((pos) => {
            const link = getWhatsAppLink(pos.coords.latitude, pos.coords.longitude);
            if (link) window.open(link, '_blank');
        }, () => {
            const link = getWhatsAppLink();
            if (link) window.open(link, '_blank');
        }, { enableHighAccuracy: true });
    };

    if (loading || !activeDate) return null;

    return (
        <>
            {/* Minimal persistent bubble */}
            <button 
                onClick={() => setShowSOS(true)}
                className="fixed bottom-24 right-4 z-[5000] w-14 h-14 bg-rose-600 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] flex items-center justify-center animate-pulse hover:scale-105 transition-transform"
            >
                <ShieldAlert className="text-white w-7 h-7" />
            </button>

            {/* Expanded Safety Modal */}
            {showSOS && (
                <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 relative border border-rose-100 dark:border-rose-900">
                        <button onClick={() => setShowSOS(false)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-3">
                                <ShieldAlert size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Date Safety</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Meeting at {activeDate.location_name}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleFakeCall}
                                disabled={fakingCall}
                                className="w-full py-4 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold flex items-center gap-3 transition-colors disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                                    <PhoneForwarded className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm md:text-base">Fake a Call</p>
                                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Phone will ring in 10s</p>
                                </div>
                            </button>

                            <button 
                                onClick={handleShareLocation}
                                className="w-full py-4 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-rose-500/30"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm md:text-base">Silent SOS Alert</p>
                                    <p className="text-xs font-normal text-rose-200">Emails location to Emergency Contact</p>
                                </div>
                            </button>

                            <button 
                                onClick={handleWhatsAppSOS}
                                className="w-full py-4 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold flex items-center gap-3 transition-colors shadow-lg shadow-[#25D366]/30"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm md:text-base">WhatsApp SOS</p>
                                    <p className="text-xs font-normal text-white/80">Opens chat with pre-filled GPS link</p>
                                </div>
                            </button>

                            <button 
                                onClick={handleMarkSafe}
                                className="w-full mt-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                End Date Safely
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Aggressive Safety Check Popup */}
            {showSafetyCheck && (
                <div className="fixed inset-0 z-[7000] bg-rose-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center border-4 border-rose-500">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Are you safe?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
                            It's been 45 minutes since your date started. We are about to trigger an SOS to your emergency contact.
                        </p>
                        <div className="space-y-3">
                            <button 
                                onClick={handleMarkSafe}
                                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95 text-lg"
                            >
                                Yes, I am Safe
                            </button>
                            <button 
                                onClick={handleShareLocation}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 text-lg"
                            >
                                NO, SEND SOS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
