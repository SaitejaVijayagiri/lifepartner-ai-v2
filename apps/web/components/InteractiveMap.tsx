'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Leaflet code must be dynamically imported with SSR disabled
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

export default function InteractiveMap({ profiles, currentUser }: { profiles: any[], currentUser: any }) {
    const [isMounted, setIsMounted] = useState(false);

    // Fix leafet icon issues in Next.js
    useEffect(() => {
        setIsMounted(true);
        // We do this to prevent SSR errors with Leaflet's global 'window' object
        import('leaflet').then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        });
    }, []);

    if (!isMounted) return <div className="w-full h-full min-h-[400px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-white/50">Loading Map...</div>;

    // Default to user's location, fallback to a center point (e.g. India center)
    const myLat = currentUser?.location?.lat ? parseFloat(currentUser.location.lat) : 20.5937;
    const myLng = currentUser?.location?.lng ? parseFloat(currentUser.location.lng) : 78.9629;
    const defaultZoom = currentUser?.location?.lat ? 10 : 4;

    // Filter out profiles with no valid coordinates
    const mapProfiles = profiles.filter(p => p.location && p.location.lat && p.location.lng);

    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-lg border border-indigo-900/30">
            {/* Overlay Gradient for premium look */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900/80 to-transparent z-[400] pointer-events-none" />

            <MapContainer
                center={[myLat, myLng]}
                zoom={defaultZoom}
                className="w-full h-full min-h-[400px] md:min-h-[500px]"
                zoomControl={false}
            >
                {/* Premium Dark Mode Map Tiles */}
                {/* @ts-expect-error */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Current User Marker (Distinctive) */}
                {currentUser?.location?.lat && (
                    /* @ts-expect-error */
                    <Marker position={[myLat, myLng]} zIndexOffset={1000}>
                        {/* @ts-expect-error */}
                        <Popup className="premium-popup">
                            <div className="text-center p-1">
                                <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border-2 border-indigo-500 mb-2">
                                    <img src={currentUser?.photos?.[0] || currentUser?.avatar_url || currentUser?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} alt="You" className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">You are here</h3>
                                <p className="text-xs text-gray-500">{currentUser?.location?.city || "Unknown"}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Nearby Matches Markers */}
                {mapProfiles.map((profile, i) => (
                    // Add slight random jitter to prevent markers overlapping if they have exact same city lat/lng
                    /* @ts-expect-error */
                    <Marker
                        key={profile.id}
                        position={[
                            parseFloat(profile.location.lat) + (Math.random() - 0.5) * 0.01,
                            parseFloat(profile.location.lng) + (Math.random() - 0.5) * 0.01
                        ]}
                    >
                        {/* @ts-expect-error */}
                        <Popup className="premium-popup">
                            <div className="text-center p-1 min-w-[120px] cursor-pointer hover:opacity-90 transition-opacity">
                                <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-pink-500 mb-2 relative">
                                    <img src={profile.photos?.[0] || profile.avatarUrl || profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt={profile.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight flex items-center justify-center gap-1">
                                    {profile.name}, {profile.age}
                                    {profile.isPremium && <span className="text-amber-400">👑</span>}
                                </h3>
                                <p className="text-xs text-indigo-600 font-medium mb-1 line-clamp-1">{profile.career?.profession || "Professional"}</p>
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                                    <MapPin size={10} /> {profile.location.city}
                                </div>
                                <button className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">
                                    View Profile
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Floating Action Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-bold text-gray-800">{mapProfiles.length} Matches Nearby</span>
            </div>
        </div>
    );
}
