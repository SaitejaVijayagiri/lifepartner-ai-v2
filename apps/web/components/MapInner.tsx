'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

export default function MapInner({ profiles, currentUser }: { profiles: any[], currentUser: any }) {
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

    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-lg border border-indigo-900/30">
            {/* Stats overlay */}
            <div className="absolute top-3 left-3 z-[999] bg-gray-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-indigo-500/30 shadow">
                <span className="text-indigo-400 font-bold">{mapProfiles.length}</span> nearby matches
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
                {mapProfiles.map((profile: any) => (
                    <Marker
                        key={profile.id}
                        position={[
                            Number(profile.location_data.lat) + (Math.random() - 0.5) * 0.01,
                            Number(profile.location_data.lng) + (Math.random() - 0.5) * 0.01
                        ]}
                    >
                        <Popup className="premium-popup">
                            <div className="text-center p-1 min-w-[120px] cursor-pointer hover:opacity-90 transition-opacity">
                                <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-pink-500 mb-2 relative">
                                    {profile.photoUrl
                                        ? <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full bg-pink-400 flex items-center justify-center text-white text-xl font-bold">{(profile.name || '?')[0]}</div>
                                    }
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-0.5">{profile.name}, {profile.age}</h3>
                                <p className="text-xs text-indigo-600 font-medium mb-1 line-clamp-1">{profile.career?.profession || profile.role || 'Professional'}</p>
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                                    <MapPin size={10} /> {profile.location_data?.city || profile.location}
                                </div>
                                <button className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">
                                    View Profile
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
