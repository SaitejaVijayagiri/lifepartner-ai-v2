'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ChevronLeft } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export default function MapInner({ profiles, currentUser, onViewProfile, onBack, astrologyMode = false }: { profiles: any[], currentUser: any, onViewProfile?: (p: any) => void, onBack?: () => void, astrologyMode?: boolean }) {
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

    return (
        <div className="w-full h-full relative">

            {/* Radar Animation Overlay */}
            <div className="radar-overlay">
                <div className="radar-sweep"></div>
            </div>

            <MapContainer
                center={[myLat, myLng]}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={false}
            >
                {/* Premium Dark Mode Map Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Current User Marker */}
                {currentUser?.location?.lat && (
                    <Marker position={[myLat, myLng]} zIndexOffset={1000}>
                        <Popup className="premium-popup">
                            <div className="text-center p-1">
                                <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border-2 border-indigo-500 mb-2">
                                    {currentUser.photoUrl
                                        ? <img src={currentUser.photoUrl} alt="You" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold">{(currentUser.name || 'Y')[0]}</div>
                                    }
                                </div>
                                <p className="text-sm font-bold text-gray-900">You</p>
                                <p className="text-xs text-indigo-600">{currentUser.location?.city || 'Your Location'}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Nearby Match Markers */}
                {mapProfiles.map((profile: any) => {
                    // Decide if high match based on score (mocked randomly for visual demo here if missing)
                    const isHighMatch = (profile.score && profile.score > 80) || (!profile.score && Math.random() > 0.7);

                    // Generate Mock Guna Score and Icebreakers for Demo
                    const gunaScore = 18 + (profile.id.charCodeAt(0) % 18); // Generates 18 to 35
                    const icebreakers = ["☕ Craving filter coffee", "💻 Working late", "🎬 Watching a movie", "🍕 Pizza time", "🎵 Listening to AR Rahman"];
                    const showIcebreaker = !astrologyMode && profile.id.charCodeAt(profile.id.length - 1) % 4 === 0;
                    const icebreakerText = icebreakers[profile.id.charCodeAt(0) % icebreakers.length];

                    let markerHtml = '';

                    const isOnline = onlineUsers?.includes(profile.id);

                    const photoHtml = profile.photoUrl
                        ? `<img src="${profile.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                        : `<span style="color:white;font-weight:bold;">${(profile.name || '?')[0]}</span>`;

                    const onlineIndicatorHtml = isOnline
                        ? `<div class="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm z-30"></div>`
                        : '';

                    if (astrologyMode) {
                        markerHtml = `
                            <div class="relative w-12 h-12 flex items-center justify-center">
                                <div class="astrology-glow"></div>
                                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 z-10 bg-gray-900 shadow-glow flex flex-col items-center justify-center relative">
                                    ${photoHtml}
                                </div>
                                ${onlineIndicatorHtml}
                                <div class="absolute -bottom-2 -right-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-orange-200 z-20">
                                    🕉️ ${gunaScore}/36
                                </div>
                            </div>
                        `;
                    } else {
                        markerHtml = `
                            <div class="relative w-12 h-12 flex items-center justify-center">
                                ${showIcebreaker ? `<div class="map-icebreaker">${icebreakerText}</div>` : ''}
                                <div class="${isHighMatch ? 'match-aura-high' : 'fuzzy-zone'}"></div>
                                <div class="w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center ${isHighMatch ? 'border-amber-400 z-10 box-shadow-glow' : 'border-pink-500 z-10'} bg-gray-900 text-white">
                                    ${photoHtml}
                                </div>
                                ${onlineIndicatorHtml}
                            </div>
                        `;
                    }

                    const fuzzyIcon = L.divIcon({
                        className: 'bg-transparent border-0',
                        html: markerHtml,
                        iconSize: [48, 48],
                        iconAnchor: [24, 24],
                        popupAnchor: [0, -24]
                    });

                    // Use explicit exact GPS location as requested by the user
                    const exactLat = Number(profile.location_data.lat);
                    const exactLng = Number(profile.location_data.lng);

                    return (
                        <Marker
                            key={profile.id}
                            position={[exactLat, exactLng]}
                            icon={fuzzyIcon}
                            zIndexOffset={isHighMatch ? 900 : 100}
                        >
                            <Popup className="premium-popup">
                                <div className="text-center p-1 min-w-[120px] cursor-pointer hover:opacity-90 transition-opacity">
                                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">{profile.name}, {profile.age}</h3>
                                    {astrologyMode && <p className="text-xs font-bold text-orange-600 mb-1">🕉️ Guna: {gunaScore}/36</p>}
                                    {!astrologyMode && isHighMatch && <p className="text-xs font-bold text-amber-600 mb-1">✨ Strong Match ✨</p>}
                                    <p className="text-xs text-indigo-600 font-medium mb-1 line-clamp-1">{profile.career?.profession || profile.role || 'Professional'}</p>
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                                        <MapPin size={10} /> {profile.location_data?.city || profile.location}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onViewProfile) onViewProfile(profile);
                                        }}
                                        className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
