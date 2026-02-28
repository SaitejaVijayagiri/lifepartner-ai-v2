'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Edit, Shield, X } from 'lucide-react';
import RequestVerificationButton from '@/components/RequestVerificationButton';
import Link from 'next/link';

interface ProfileViewProps {
    profile: any;
    onEdit: () => void;
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState('about');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Ensure we have an array
    const photos: string[] = profile.photos?.length > 0
        ? profile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    return (
        <div className="bg-white w-full rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm border border-gray-100 min-h-[600px]">

            {/* LEFT: Image Section */}
            <div className="w-full md:w-[40%] bg-gray-950 relative group shrink-0 h-[450px] md:h-auto overflow-hidden">
                <img
                    src={photos[currentPhotoIndex]}
                    alt={profile.name}
                    onClick={() => setIsFullscreen(true)}
                    className="w-full h-full object-contain md:object-cover opacity-90 transition-opacity duration-500 cursor-zoom-in"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`;
                    }}
                />

                {/* Overlay Text */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-20 pointer-events-none">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name}, {profile.age}</h2>
                    <p className="text-gray-300 text-sm font-medium">
                        {profile.career?.profession || "-"} • {typeof profile.location === 'string' ? profile.location : (profile.location?.city || "Unknown Location")}
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
                    <div className="w-[30%] h-full cursor-pointer" onClick={() => setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)} />
                    <div className="w-[40%] h-full cursor-zoom-in" onClick={() => setIsFullscreen(true)} />
                    <div className="w-[30%] h-full cursor-pointer" onClick={() => setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)} />
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
                        {['about', 'personal', 'career', 'preferences', 'family'].map(tab => (
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
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 h-full md:h-auto">

                    {activeTab === 'about' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-3">About Me</h3>
                                <p className="text-blue-800/90 leading-relaxed text-[15px]">
                                    {profile.aboutMe || "No bio added yet."}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Age / Height" value={`${profile.age} Yrs, ${profile.height || "-"}`} />
                                <InfoCard label="Marital Status" value={(!profile.maritalStatus || profile.maritalStatus === "Never Married" || profile.maritalStatus === "Single / Never Married") ? "Single" : profile.maritalStatus} />
                                <InfoCard label="Location" value={typeof profile.location === 'string' ? profile.location : (profile.location?.city || "Unknown")} />
                                <InfoCard label="Mother Tongue" value={profile.motherTongue || "-"} />
                                <InfoCard label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : "-"} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <h3 className="font-bold text-purple-900 mb-4">Horoscope & Faith</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                    <InfoCard label="Caste" value={profile.religion?.caste || "-"} />
                                    <InfoCard label="Inter-Caste" value={profile.religion?.interCasteOpen || "-"} />
                                    <InfoCard label="Gothra" value={profile.horoscope?.gothra || profile.religion?.gothra || "-"} />
                                    <InfoCard label="Manglik" value={profile.horoscope?.manglik || "-"} />
                                    <InfoCard label="Zodiac" value={profile.horoscope?.zodiacSign || "-"} />
                                    <InfoCard label="Nakshatra" value={profile.horoscope?.nakshatra || "-"} />
                                </div>
                            </div>

                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mt-6">
                                <h3 className="font-bold text-green-900 mb-4">Lifestyle & Interests</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Diet" value={profile.lifestyle?.diet || "-"} />
                                    <InfoCard label="Smoking" value={profile.lifestyle?.smoke || profile.lifestyle?.smoking || "No"} />
                                    <InfoCard label="Drinking" value={profile.lifestyle?.drink || profile.lifestyle?.drinking || "No"} />
                                </div>
                                {profile.interests && profile.interests.length > 0 && (
                                    <div className="mt-4">
                                        <div className="text-[10px] uppercase font-bold text-green-700/70 mb-2">Interests</div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map((tag: string, i: number) => (
                                                <span key={i} className="bg-white/60 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200/50">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 mt-6">
                                <h3 className="font-bold text-teal-900 mb-4">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-teal-800/70">Phone</span>
                                        <span className="text-sm font-medium text-teal-950">{profile.phone || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-teal-800/70">Email</span>
                                        <span className="text-sm font-medium text-teal-950">{profile.email || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'career' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-4">Career & Education</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoRow label="Profession" value={profile.career?.profession || "-"} />
                                    <InfoRow label="Company" value={profile.career?.company || "-"} />
                                    <InfoRow label="Education" value={profile.career?.education || "-"} />
                                    <InfoRow label="Degree" value={profile.career?.degree || "-"} />
                                    <InfoRow label="College" value={profile.career?.college || "-"} />
                                    <InfoRow label="Annual Income" value={profile.career?.income || "-"} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'family' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <h3 className="font-bold text-orange-900 mb-4">Family Background</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Family Type" value={profile.family?.type || profile.family?.familyType || "-"} />
                                    <InfoCard label="Values" value={profile.family?.values || profile.family?.familyValues || "-"} />
                                    <InfoCard label="Father" value={profile.family?.fatherOccupation || "-"} />
                                    <InfoCard label="Mother" value={profile.family?.motherOccupation || "-"} />
                                    <InfoCard label="Brothers" value={profile.family?.brothers || "0"} />
                                    <InfoCard label="Sisters" value={profile.family?.sisters || "0"} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {profile.prompt && (
                                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-4">
                                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                        <span className="text-xl">💭</span> Expectations
                                    </h3>
                                    <p className="text-indigo-800 text-sm italic leading-relaxed">
                                        "{profile.prompt}"
                                    </p>
                                </div>
                            )}
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 mb-4">Basic Preferences</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Age Range" value={profile.partnerPreferences?.ageRange || "Any"} />
                                    <InfoCard label="Height Range" value={profile.partnerPreferences?.heightRange || "Any"} />
                                    <InfoCard label="Min Income" value={profile.partnerPreferences?.income || "Any"} />
                                    <InfoCard label="Preferred Location" value={profile.partnerPreferences?.location || "Any"} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Image Overlay (Zoom) */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[20000] bg-black flex items-center justify-center animate-in fade-in zoom-in duration-200"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        className="absolute top-4 right-4 z-50 text-white p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(false);
                        }}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={photos[currentPhotoIndex]}
                        alt="Zoomed Profile"
                        className="w-full h-full object-contain cursor-zoom-out"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`;
                        }}
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
        <div className="font-semibold text-gray-900 text-sm break-words">{value}</div>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
);
