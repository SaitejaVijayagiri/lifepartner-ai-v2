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

    useEffect(() => {
        fetchActiveDate();
    }, []);

    const fetchActiveDate = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/my-dates`, {
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
                                    <p className="text-sm md:text-base">SOS Alert</p>
                                    <p className="text-xs font-normal text-rose-200">Share location with Emergency Contact</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
