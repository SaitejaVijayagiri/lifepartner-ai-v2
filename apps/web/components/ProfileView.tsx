'use client';
import { getZodiacSymbol, getReligionSymbol } from '@/lib/religionUtils';
import { formatLocationString } from '@/lib/utils';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Edit, Shield, X, Coins } from 'lucide-react';
import RequestVerificationButton from '@/components/RequestVerificationButton';
import Link from 'next/link';

interface ProfileViewProps {
    profile: any;
    onEdit: () => void;
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState('highlights');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Ensure we have an array
    const photos: string[] = profile.photos?.length > 0
        ? profile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    return (
        <div className="bg-white dark:bg-gray-900 w-full rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm border border-gray-100 dark:border-gray-800 min-h-[600px]">

            {/* LEFT: Image Section */}
            <div className="w-full md:w-[40%] bg-gray-950 relative group shrink-0 h-[450px] md:h-auto overflow-hidden">
                <img
                    src={photos[currentPhotoIndex]}
                    alt={profile.name}
                    onClick={() => setIsFullscreen(true)}
                    className="w-full h-full object-contain md:object-cover opacity-90 transition-opacity duration-500 cursor-zoom-in"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`;
                    }}
                />

                {/* Photo Index Badge & Highlights Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                    {photos.length > 1 && (
                        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                            📸 {currentPhotoIndex + 1} / {photos.length}
                        </div>
                    )}
                    <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                        ⭐ Highlights
                    </span>
                </div>

                {/* Overlay Text */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6 z-20 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">{profile.name}, {profile.age}</h2>
                        {profile.is_verified && (
                            <span className="bg-blue-500 text-white p-0.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center w-4 h-4 shadow-md shadow-blue-500/30">
                                ✓
                            </span>
                        )}
                    </div>
                    <p className="text-gray-300 text-xs sm:text-sm font-medium mt-1 drop-shadow-sm flex items-center gap-1.5">
                        <span className="bg-white/15 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold text-white tracking-wider backdrop-blur-sm border border-white/10">
                            {profile.career?.profession || "Member"}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-gray-300">{formatLocationString(profile.location)}</span>
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
            <div className="w-full md:w-[60%] flex flex-col bg-white dark:bg-gray-900">

                {/* Header with Edit Button */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">My Profile</h3>
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


                        <Button onClick={onEdit} variant="outline" size="sm" className="gap-2 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                            <Edit size={16} /> Edit Profile
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 dark:border-gray-800 px-6">
                    <div className="flex space-x-6 overflow-x-auto no-scrollbar py-3">
                        {['highlights', 'about', 'personal', 'career', 'preferences', 'family'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    pb-2 text-sm font-semibold capitalize whitespace-nowrap transition-all
                                    ${activeTab === tab
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'}
                                `}
                            >
                                {tab === 'highlights' ? '⭐ Highlights' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 h-full md:h-auto">

                    {activeTab === 'highlights' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Key Highlights Card */}
                            <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 p-5 rounded-2xl border border-amber-400/30 shadow-md space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-sm uppercase tracking-wider">
                                        <span className="text-base">⭐</span>
                                        <span>Key Profile Highlights</span>
                                    </div>
                                    <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                                        Verified Overview
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <InfoCard label="Profession" value={profile.career?.profession || "Member"} />
                                    <InfoCard label="Education" value={profile.career?.education || profile.career?.degree || "-"} />
                                    <InfoCard label="Faith / Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                    <InfoCard label="Caste / Gothra" value={profile.religion?.caste || profile.horoscope?.gothra || "-"} />
                                    <InfoCard label="Location" value={formatLocationString(profile.location)} />
                                    <InfoCard label="Marital Status" value={(!profile.maritalStatus || profile.maritalStatus === "Never Married" || profile.maritalStatus === "Single / Never Married") ? "Single" : profile.maritalStatus} />
                                    <InfoCard label="Diet" value={profile.lifestyle?.diet || "-"} />
                                    <InfoCard label="Zodiac & Star" value={profile.horoscope?.zodiacSign ? `${getZodiacSymbol(profile.horoscope.zodiacSign)} ${profile.horoscope.zodiacSign}` : "-"} />
                                </div>
                            </div>

                            {/* Wallet & Coins Balance Card */}
                            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-600/10 p-5 rounded-2xl border border-amber-300/60 dark:border-amber-700/50 flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0 shadow-inner">
                                        <Coins size={24} className="fill-amber-400 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">My Coin Balance</div>
                                        <div className="text-2xl font-black text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                                            <span>{profile.coins || 0}</span>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Coins</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            const event = new CustomEvent('open_coin_store');
                                            window.dispatchEvent(event);
                                        }
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <span>+ Add Coins</span>
                                </button>
                            </div>

                            {/* Story Highlights Reel Preview */}
                            <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📸</span> Story Highlights Reel
                                    </h4>
                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Permanent Pin</span>
                                </div>
                                <p className="text-xs text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                                    Pin active stories to your profile highlights reel so matches can view your favorite moments anytime.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            {/* Wallet & Coins Balance Card */}
                            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-600/10 p-5 rounded-2xl border border-amber-300/60 dark:border-amber-700/50 flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0 shadow-inner">
                                        <Coins size={24} className="fill-amber-400 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">My Coin Balance</div>
                                        <div className="text-2xl font-black text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                                            <span>{profile.coins || 0}</span>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Coins</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            const event = new CustomEvent('open_coin_store');
                                            window.dispatchEvent(event);
                                        }
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <span>+ Add Coins</span>
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/80 dark:from-indigo-950/20 dark:to-blue-950/10 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-2 right-4 text-6xl text-indigo-200/40 dark:text-indigo-800/20 font-serif pointer-events-none select-none">“</div>
                                <h3 className="font-extrabold text-indigo-950 dark:text-indigo-100 mb-3 text-sm uppercase tracking-wider flex items-center gap-1.5">
                                    <span>✨</span> Personal Bio
                                </h3>
                                <p className="text-indigo-900/90 dark:text-indigo-300 leading-relaxed text-sm sm:text-[15px] font-medium relative z-10 italic">
                                    "{profile.aboutMe || "No bio added yet."}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Age / Height" value={`${profile.age} Yrs, ${profile.height || "-"}`} />
                                <InfoCard label="Marital Status" value={(!profile.maritalStatus || profile.maritalStatus === "Never Married" || profile.maritalStatus === "Single / Never Married") ? "Single" : profile.maritalStatus} />
                                <InfoCard label="Location" value={formatLocationString(profile.location)} />
                                <InfoCard label="Mother Tongue" value={profile.motherTongue || "-"} />
                                <InfoCard label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : "-"} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Horoscope & Faith</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                    <InfoCard label="Caste" value={profile.religion?.caste || "-"} />
                                    <InfoCard label="Inter-Caste" value={profile.religion?.interCasteOpen || "-"} />
                                    <InfoCard label="Gothra" value={profile.horoscope?.gothra || profile.religion?.gothra || "-"} />
                                    <InfoCard label="Manglik" value={profile.horoscope?.manglik || "-"} />
                                    <InfoCard label="Zodiac" value={profile.horoscope?.zodiacSign ? `${getZodiacSymbol(profile.horoscope.zodiacSign)} ${profile.horoscope.zodiacSign}` : "-"} />
                                    <InfoCard label="Nakshatra" value={profile.horoscope?.nakshatra || "-"} />
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/50 mt-6">
                                <h3 className="font-bold text-green-900 dark:text-green-100 mb-4">Lifestyle & Interests</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard label="Diet" value={profile.lifestyle?.diet || "-"} />
                                    <InfoCard label="Smoking" value={profile.lifestyle?.smoke || profile.lifestyle?.smoking || "No"} />
                                    <InfoCard label="Drinking" value={profile.lifestyle?.drink || profile.lifestyle?.drinking || "No"} />
                                </div>
                                {profile.interests && profile.interests.length > 0 && (
                                    <div className="mt-4">
                                        <div className="text-[10px] uppercase font-bold text-green-700/70 dark:text-green-400/80 mb-2">Interests</div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map((tag: string, i: number) => (
                                                <span key={i} className="bg-white/60 dark:bg-gray-800/60 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium border border-green-200/50 dark:border-green-800/50 shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-900/50 mt-6">
                                <h3 className="font-bold text-teal-900 dark:text-teal-100 mb-4">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-teal-800/70 dark:text-teal-400">Phone</span>
                                        <span className="text-sm font-medium text-teal-950 dark:text-teal-300">{profile.phone || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-teal-800/70 dark:text-teal-400">Email</span>
                                        <span className="text-sm font-medium text-teal-950 dark:text-teal-300">{profile.email || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'career' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Career & Education</h3>
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
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                                <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-4">Family Background</h3>
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
                            {(() => {
                                const exp = profile.expectations || (profile.prompt && profile.prompt !== profile.aboutMe ? profile.prompt : null);
                                return exp ? (
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-4">
                                    <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                        <span className="text-xl">💭</span> Expectations
                                    </h3>
                                    <p className="text-indigo-800 dark:text-indigo-300 text-sm italic leading-relaxed">
                                        "{exp}"
                                    </p>
                                </div>
                                ) : null;
                            })()}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-4">Basic Preferences</h3>
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
                            target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`;
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// Helpers
const InfoCard = ({ label, value }: any) => (
    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100/80 dark:border-gray-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
        <div className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1">{label}</div>
        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">{value}</div>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
        <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{value}</span>
    </div>
);
