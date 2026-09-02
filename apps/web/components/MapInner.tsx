'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation2 } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { Map as LeafletMap } from 'leaflet';

// Haversine formula to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
}

// Map Controls — only captures the map instance into the external ref
function MapCaptureRef({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
    const map = useMap();
    useEffect(() => { mapRef.current = map; }, [map, mapRef]);
    return null;
}

export default function MapInner({ profiles, currentUser, onViewProfile, onBack, astrologyMode = false }: { profiles: any[], currentUser: any, onViewProfile?: (p: any) => void, onBack?: () => void, astrologyMode?: boolean }) {
    const mapRef = useRef<LeafletMap | null>(null);
    useEffect(() => {
        // Fix Leaflet default icon URLs broken by webpack
        import('leaflet').then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        });
    }, []);

    const myLat = currentUser?.location?.lat ? parseFloat(currentUser.location.lat) : 20.5937;
    const myLng = currentUser?.location?.lng ? parseFloat(currentUser.location.lng) : 78.9629;
    const defaultZoom = currentUser?.location?.lat ? 10 : 4;

    // Only show profiles that have real coordinates
    const mapProfiles = (profiles || []).filter(
        (p: any) => p.location_data && p.location_data.lat && p.location_data.lng
    );

    const { onlineUsers } = useSocket() as any;

    // We must use dynamic require inside the component to avoid Next.js window undefined errors during build
    // Doing this globally ONCE per render instead of inside the map loop to massively improve speed
    const L = typeof window !== 'undefined' ? require('leaflet') : null;
    if (!L) return null;

    // Custom Icon for Current User (Radar Pulse)
    const myIconHtml = `
        <div style="position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,0.4),transparent);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,0.6),transparent);animation:ping 3s cubic-bezier(0,0,0.2,1) infinite reverse;"></div>
            <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #6366f1;background:#1f2937;display:flex;align-items:center;justify-content:center;color:white;position:relative;z-index:10;box-shadow:0 0 15px rgba(99,102,241,0.8);">
                ${currentUser?.photoUrl 
                    ? `<img src="${currentUser.photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';" />`
                    : `<span style="font-weight:bold;font-size:16px;">${(currentUser?.name || 'Y')[0]}</span>`
                }
            </div>
            <div style="position:absolute;bottom:-6px;background:#4f46e5;color:white;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:999px;white-space:nowrap;z-index:20;border:2px solid white;">You</div>
        </div>
    `;

    const myIcon = L.divIcon({
        className: 'bg-transparent border-0',
        html: myIconHtml,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -30]
    });

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={[myLat, myLng]}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={false}
            >
                {/* High-Performance Free Map Tiles (No API key needed) */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-map-tiles"
                    maxZoom={19}
                />

                {/* Capture map ref */}
                {currentUser?.location?.lat && <MapCaptureRef mapRef={mapRef} />}

                {/* Current User Marker */}
                {currentUser?.location?.lat && (
                    <Marker position={[myLat, myLng]} icon={myIcon} zIndexOffset={2000}>
                        <Popup className="premium-popup">
                            <div className="text-center p-2 min-w-[140px]">
                                <p className="text-sm font-bold text-gray-900 mb-1">Your Live Location</p>
                                <p className="text-xs text-indigo-600 font-medium flex items-center justify-center gap-1">
                                    <MapPin size={12} /> {currentUser.location?.city || 'Scanning...'}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-2">Discovering nearby singles</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Nearby Match Markers */}
                {mapProfiles.map((profile: any) => {
                    const exactLat = Number(profile.location_data.lat);
                    const exactLng = Number(profile.location_data.lng);
                    
                    // PRIVACY UPGRADE: Fuzz the location by ~500m (0.005 degrees)
                    // Use the user's ID string to generate a deterministic random offset 
                    // so the marker doesn't jump around on every re-render.
                    const idSum = profile.id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
                    const latOffset = ((idSum % 100) - 50) * 0.0001; // Between -0.005 and +0.005
                    const lngOffset = (((idSum * 2) % 100) - 50) * 0.0001;
                    
                    const fuzzyLat = exactLat + latOffset;
                    const fuzzyLng = exactLng + lngOffset;

                    // Calculate precise distance using the fuzzed location
                    const distanceKm = currentUser?.location?.lat 
                        ? getDistance(myLat, myLng, fuzzyLat, fuzzyLng)
                        : null;

                    // Decide if high match based on score
                    const isHighMatch = (profile.score && profile.score > 80) || (!profile.score && Math.random() > 0.7);

                    // Generate Mock Guna Score and Icebreakers for Demo
                    const gunaScore = 18 + (profile.id.charCodeAt(0) % 18);
                    const icebreakers = ["☕ Craving filter coffee", "💻 Working late", "🎬 Watching a movie", "🍕 Pizza time", "🎵 Listening to AR Rahman"];
                    const showIcebreaker = !astrologyMode && profile.id.charCodeAt(profile.id.length - 1) % 4 === 0;
                    const icebreakerText = icebreakers[profile.id.charCodeAt(0) % icebreakers.length];

                    const isOnline = onlineUsers?.includes(profile.id);

                    const photoHtml = profile.photoUrl
                        ? `<img src="${profile.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.onerror=null;this.style.display='none';this.parentNode.innerHTML='<span style=\\'color:white;font-weight:bold;font-size:14px;\\'>${(profile.name || '?')[0]}</span>';" />`
                        : `<span style="color:white;font-weight:bold;font-size:14px;">${(profile.name || '?')[0]}</span>`;

                    const onlineIndicatorHtml = isOnline
                        ? `<div style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:#22c55e;border-radius:50%;border:2px solid white;z-index:30;"></div>`
                        : '';

                    const borderColor = astrologyMode ? '#f97316' : (isHighMatch ? '#f59e0b' : '#ec4899');

                    const markerHtml = `
                        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;">
                            ${astrologyMode ? `<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.3),transparent);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : `<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.2),transparent);"></div>`}
                            <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:2.5px solid ${borderColor};background:#1f2937;display:flex;align-items:center;justify-content:center;color:white;position:relative;z-index:10;box-shadow:0 0 8px ${borderColor}66;">
                                ${photoHtml}
                            </div>
                            ${onlineIndicatorHtml}
                            ${distanceKm && parseFloat(distanceKm) < 5 ? `<div style="position:absolute;bottom:-10px;background:rgba(17,24,39,0.9);color:white;font-size:9px;font-weight:bold;padding:2px 6px;border-radius:999px;white-space:nowrap;z-index:20;border:1px solid rgba(255,255,255,0.2);">📍 ${distanceKm} km</div>` : ''}
                            ${astrologyMode ? `<div style="position:absolute;bottom:-8px;right:-10px;background:linear-gradient(to right,#ea580c,#f59e0b);color:white;font-size:9px;font-weight:bold;padding:2px 5px;border-radius:999px;white-space:nowrap;z-index:20;">🕉️ ${gunaScore}/36</div>` : ''}
                            ${showIcebreaker && !astrologyMode ? `<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:rgba(17,24,39,0.9);color:white;font-size:9px;padding:3px 6px;border-radius:999px;white-space:nowrap;border:1px solid rgba(99,102,241,0.5);">${icebreakerText}</div>` : ''}
                        </div>
                    `;

                    const fuzzyIcon = L.divIcon({
                        className: 'bg-transparent border-0',
                        html: markerHtml,
                        iconSize: [48, 48],
                        iconAnchor: [24, 24],
                        popupAnchor: [0, -24]
                    });

                    return (
                        <Marker
                            key={profile.id}
                            position={[fuzzyLat, fuzzyLng]}
                            icon={fuzzyIcon}
                            zIndexOffset={isHighMatch ? 900 : 100}
                        >
                            <Popup className="premium-popup">
                                <div className="text-center p-2 min-w-[140px]">
                                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">{profile.name}, {profile.age}</h3>
                                    {astrologyMode && <p className="text-xs font-bold text-orange-600 mb-1">🕉️ Guna: {gunaScore}/36</p>}
                                    {!astrologyMode && isHighMatch && <p className="text-xs font-bold text-amber-600 mb-1">✨ Strong Match ✨</p>}
                                    <p className="text-xs text-indigo-600 font-medium mb-2 line-clamp-1">{profile.career?.profession || profile.role || 'Professional'}</p>
                                    
                                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-gray-50 rounded-lg mb-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-600 font-semibold truncate flex-1">
                                            <MapPin size={10} className="text-indigo-500 shrink-0" />
                                            <span className="truncate">{typeof profile.location === 'string' ? profile.location : ([profile.location_data?.city, profile.location_data?.state].filter((x) => x && x !== "Unknown City" && x !== "Unknown State").join(", ") || "Unknown Location")}</span>
                                        </div>
                                        {distanceKm && (
                                            <div className="text-[10px] font-bold text-indigo-600 shrink-0 bg-indigo-100 px-1.5 py-0.5 rounded">
                                                {distanceKm} km
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onViewProfile) onViewProfile(profile);
                                        }}
                                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Recenter Button — rendered OUTSIDE MapContainer to respect BottomNav z-index and height */}
            {currentUser?.location?.lat && (
                <button
                    onClick={() => {
                        if (mapRef.current) {
                            mapRef.current.flyTo([myLat, myLng], 13, { duration: 1.5 });
                        }
                    }}
                    className="absolute bottom-32 sm:bottom-8 right-4 z-[900] p-3.5 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-full shadow-2xl hover:scale-110 hover:shadow-indigo-500/30 transition-all text-indigo-600 group"
                    title="Recenter to my location"
                >
                    <Navigation2 className="w-5 h-5 group-hover:fill-indigo-600 transition-all" />
                </button>
            )}

            {/* Custom Dark Theme & Leaflet Filter Styling */}
            <style jsx global>{`
                .dark-map-tiles {
                    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
                }
                .leaflet-container {
                    background: #0f172a !important;
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
}
