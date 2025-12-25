'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Edit, Shield } from 'lucide-react';
import RequestVerificationButton from '@/components/RequestVerificationButton';
import Link from 'next/link';

interface ProfileViewProps {
    profile: any;
    onEdit: () => void;
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState('about');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [playingReel, setPlayingReel] = useState<string | null>(null);

    // Ensure we have an array
    const photos: string[] = profile.photos?.length > 0
        ? profile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    // Fallback Reels
    const demoReels = [
        "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-taking-photos-from-different-angles-of-a-model-34421-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-young-mother-playing-with-her-daughter-1208-large.mp4"
    ];
    const displayReels = (profile.reels && profile.reels.length > 0) ? profile.reels : demoReels;
    const hasReels = true;

    return (
        <div className="bg-white w-full rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm border border-gray-100 min-h-[600px]">

            {/* LEFT: Image Section */}
            <div className="w-full md:w-[40%] bg-gray-900 relative group shrink-0 h-[400px] md:h-auto overflow-hidden">
                <img
                    src={photos[currentPhotoIndex]}
                    alt={profile.name}
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                />

                {/* Overlay Text */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-20">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name}, {profile.age}</h2>
                    <p className="text-gray-300 text-sm font-medium">
                        {profile.career?.profession || "Professional"} • {typeof profile.location === 'string' ? profile.location : (profile.location?.city || "India")}
                    </p>
                </div>

                {/* Navigation Dots */}
                {photos.length > 1 && (
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-30">
                        {photos.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPhotoIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Prev/Next Touch Areas */}
                <div className="absolute inset-0 flex z-10">
                    <div className="w-1/2 h-full" onClick={() => setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)} />
                    <div className="w-1/2 h-full" onClick={() => setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)} />
                </div>
            </div>

            {/* RIGHT: Content & Details */}
            <div className="w-full md:w-[60%] flex flex-col bg-white">

                {/* Header with Edit Button */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">My Profile</h3>
                        {profile.is_verified && (
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <Shield size={10} className="fill-blue-600" /> Verified
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!profile.is_verified && (
                            <RequestVerificationButton />
                        )}


                        <Button onClick={onEdit} variant="outline" size="sm" className="gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                            <Edit size={16} /> Edit Profile
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 px-6">
                    <div className="flex space-x-6 overflow-x-auto no-scrollbar py-3">
                        {['about', 'personal', 'career', 'family', ...(hasReels ? ['vibe check'] : [])].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    pb-2 text-sm font-semibold capitalize whitespace-nowrap transition-all
                                    ${activeTab === tab
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-400 hover:text-gray-600 border-transparent'}
                                `}
                            >
                                {tab === 'vibe check' ? '✨ Vibe Check' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 h-full md:h-auto">

                    {activeTab === 'about' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About Me</h3>
                                <p className="text-gray-700 leading-relaxed text-[15px]">
                                    {profile.aboutMe || "No bio added yet."}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Age / Height" value={`${profile.age} Yrs, ${profile.height || "-"}`} />
                                <InfoCard label="Marital Status" value={profile.maritalStatus || "-"} />
                                <InfoCard label="Location" value={typeof profile.location === 'string' ? profile.location : (profile.location?.city || "Unknown")} />
                                <InfoCard label="Mother Tongue" value={profile.motherTongue || "-"} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Horoscope & Faith</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                <InfoCard label="Caste" value={profile.religion?.caste || "-"} />
                                <InfoCard label="Gothra" value={profile.horoscope?.gothra || profile.religion?.gothra || "-"} />
                                <InfoCard label="Manglik" value={profile.horoscope?.manglik || "-"} />
                                <InfoCard label="Zodiac" value={profile.horoscope?.zodiacSign || "-"} />
                                <InfoCard label="Nakshatra" value={profile.horoscope?.nakshatra || "-"} />
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact</h3>
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Phone</span>
                                        <span className="text-sm font-medium">{profile.phone || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Email</span>
                                        <span className="text-sm font-medium">{profile.email || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'career' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 gap-4">
                                <InfoRow label="Profession" value={profile.career?.profession || "-"} />
                                <InfoRow label="Company" value={profile.career?.company || "-"} />
                                <InfoRow label="Education" value={profile.career?.education || "-"} />
                                <InfoRow label="College" value={profile.career?.college || "-"} />
                                <InfoRow label="Annual Income" value={profile.career?.income || "-"} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'family' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                            <InfoCard label="Family Type" value={profile.family?.type || profile.family?.familyType || "-"} />
                            <InfoCard label="Values" value={profile.family?.values || profile.family?.familyValues || "-"} />
                            <InfoCard label="Father" value={profile.family?.fatherOccupation || "-"} />
                            <InfoCard label="Mother" value={profile.family?.motherOccupation || "-"} />
                            <InfoCard label="Brothers" value={profile.family?.brothers || "0"} />
                            <InfoCard label="Sisters" value={profile.family?.sisters || "0"} />
                        </div>
                    )}

                    {activeTab === 'vibe check' && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-300">
                            {displayReels.map((url: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative cursor-pointer group"
                                    onClick={() => setPlayingReel(url)}
                                >
                                    <video src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play size={24} className="text-white drop-shadow-md" fill="white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Player Modal */}
            {playingReel && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setPlayingReel(null)}>
                    <video
                        src={playingReel.startsWith('http') ? playingReel : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${playingReel}`}
                        className="max-h-[80vh] w-full max-w-md rounded-xl"
                        controls
                        autoPlay
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

// Helpers
const InfoCard = ({ label, value }: any) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</div>
        <div className="font-semibold text-gray-900 text-sm truncate">{value}</div>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
);
