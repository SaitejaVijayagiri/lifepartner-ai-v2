
'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, MoreVertical, MapPin, Briefcase, GraduationCap, Globe, Shield, Star, Coins, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoCallButton from '@/components/VideoCallButton';
import VerificationBadge from './VerificationBadge';
import dynamic from 'next/dynamic';

const KundliModal = dynamic(() => import('./KundliModal'), { ssr: false });
const CoinStoreModal = dynamic(() => import('./CoinStoreModal'), { ssr: false });

interface ProfileModalProps {
    profile: any;
    currentUser?: any;
    onClose: () => void;
    onConnect?: () => void;
    onUpgrade?: () => void;
}

export default function ProfileModal({ profile, currentUser, onClose, onConnect, onUpgrade }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState('ai insight');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [lastInteracted, setLastInteracted] = useState(0);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [showKundli, setShowKundli] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!profile) return null;

    // 🛡️ Data Sanitization: Ensure all nested objects exist to prevent crashes
    const safeProfile = {
        ...profile,
        career: profile.career || {},
        family: profile.family || {},
        religion: profile.religion || {},
        horoscope: profile.horoscope || {},
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        location: profile.location || {},
        match_reasons: Array.isArray(profile.match_reasons) ? profile.match_reasons : [],
    };

    // Ensure photos array is valid
    const photos: string[] = safeProfile.photos.length > 0
        ? safeProfile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    // Auto-Slide Effect
    useEffect(() => {
        if (photos.length <= 1) return;

        const interval = setInterval(() => {
            // Only slide if user hasn't interacted in the last 4 seconds
            if (Date.now() - lastInteracted > 4000) {
                setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [photos.length, lastInteracted]);

    // TRACK PROFILE VIEW
    useEffect(() => {
        if (currentUser && profile.id && profile.id !== currentUser.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/interactions/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: profile.id })
            }).catch(err => console.error("Failed to track view", err));
        }
    }, [profile.id]);


    // Helper for safe Date parsing
    const getAge = (dob: string | undefined, defaultAge: any) => {
        if (!dob) return defaultAge;
        try {
            const date = new Date(dob);
            if (isNaN(date.getTime())) return defaultAge;
            return new Date().getFullYear() - date.getFullYear();
        } catch (e) { return defaultAge; }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md md:p-6 animate-in fade-in duration-300 overflow-hidden">
            <div className="bg-white w-full max-w-5xl h-[100dvh] md:h-[85vh] rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">

                {/* Enhanced Close Button (Floating & Glassy) - Fixed Position for Mobile Reliability */}
                <button
                    onClick={onClose}
                    className="fixed top-4 right-4 z-[10000] bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-3 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl border border-white/20"
                    style={{ position: 'fixed', top: 'max(16px, env(safe-area-inset-top))', right: '16px' }}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* LEFT: Immersive Image Section - Fixed Height on Mobile to Stop Jumps */}
                <div className="w-full md:w-[45%] h-[50%] md:h-full bg-gray-950 relative group shrink-0 flex items-center justify-center">

                    {/* Main Image */}
                    <img
                        src={photos[currentPhotoIndex]}
                        alt={profile.name}
                        onClick={() => setIsFullscreen(true)}
                        className="w-full h-full object-contain md:object-cover bg-black/90 block transition-opacity duration-500 cursor-zoom-in"
                    />

                    {/* Gradient Overlay for Text Readability (Subtler) */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6 z-20 pointer-events-none">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                                {profile.name}, {profile.age}
                                {profile.isPremium && <span className="text-amber-400 text-xl drop-shadow-lg animate-pulse" title="Premium Member">👑</span>}
                            </h2>
                            {profile.isVerified !== false && <VerificationBadge size={16} className="bg-blue-900/30 p-0.5 rounded-full" showTooltip />}
                        </div>
                        <p className="text-gray-300 text-xs font-medium flex items-center gap-2 drop-shadow-md">
                            <span>{profile.career?.profession || "-"}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span>{typeof profile.location === 'string' ? profile.location : (profile.location?.city || "Unknown Location")}</span>
                        </p>
                    </div>

                    {/* Photo Progress Bar (Instagram Story Style) */}
                    {photos.length > 1 && (
                        <div className="absolute top-4 left-4 right-16 flex gap-1 z-30">
                            {photos.map((_, idx) => (
                                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-white transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full' : 'w-0'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation Arrows for Visibility */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </>
                    )}

                    {/* Navigation Touch Areas */}
                    <div className="absolute inset-0 flex z-10">
                        <div className="w-[30%] h-full cursor-pointer" onClick={() => {
                            setLastInteracted(Date.now());
                            setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                        }} />
                        <div className="w-[40%] h-full cursor-zoom-in" onClick={() => setIsFullscreen(true)} />
                        <div className="w-[30%] h-full cursor-pointer" onClick={() => {
                            setLastInteracted(Date.now());
                            setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                        }} />
                    </div>
                </div>

                {/* RIGHT: Content & Details */}
                <div className="w-full md:w-[55%] flex flex-col bg-white h-[50%] md:h-full relative rounded-none z-30 md:z-auto">



                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden md:block px-8 pt-8 pb-4">
                        <div className="flex gap-2 mt-2 pl-4">
                            <div className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-xs font-bold border border-pink-100 flex items-center gap-1 w-max">
                                <span>🎁</span> {profile.total_gifts || 0} Gifts
                            </div>
                            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 flex items-center gap-1 w-max">
                                <span>❤️</span> {profile.total_likes || 0} Likes
                            </div>
                        </div>
                    </div>





                    {/* Sticky Tabs */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur z-40 border-b border-gray-100 px-4 md:px-6">
                        <div className="flex space-x-6 overflow-x-auto no-scrollbar py-2 md:py-3">
                            {['about', 'ai insight', 'personal', 'career', 'family', 'lifestyle', 'preferences'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        pb-2 text-xs md:text-sm font-semibold capitalize whitespace-nowrap transition-all
                                        ${activeTab === tab
                                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                                            : 'text-gray-400 hover:text-gray-600 border-transparent'}
                                    `}
                                >
                                    {tab === 'ai insight' ? '🤖 AI Insight' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-6">

                        {activeTab === 'ai insight' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-xl">🤖</div>
                                        <h3 className="font-bold text-indigo-900">AI Compatibility Analysis</h3>
                                    </div>
                                    <p className="text-indigo-800/80 italic text-sm leading-relaxed border-l-4 border-indigo-400 pl-4 py-1">
                                        "{profile.match_reasons?.[0] || profile.summary || "Strong compatibility based on shared values."}"
                                    </p>

                                    <div className="flex gap-3 mt-6">
                                        <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 border border-indigo-100 shadow-sm flex items-center gap-2">
                                            <span>✨</span> {profile.score || 0}% Match Score
                                        </div>
                                        <div className="bg-pink-100/50 px-4 py-2 rounded-xl text-xs font-bold text-pink-700 border border-pink-100 shadow-sm flex items-center gap-2">
                                            <span>🎁</span> {profile.total_gifts || 0} Gifts
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Placeholder for future detailed AI breakdown */}
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-3">About Me</h3>
                                    <p className="text-blue-800/90 leading-relaxed text-sm md:text-[15px]">
                                        {profile.aboutMe || "No bio provided."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <InfoCard label="Age / Height" value={`${profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : profile.age} Yrs, ${profile.height || "-"}`} />
                                    <InfoCard label="Marital Status" value={(!profile.maritalStatus) ? "Not Specified" : profile.maritalStatus} />
                                    <InfoCard label="Location" value={typeof profile.location === 'string' ? profile.location : (profile.location?.city || "Unknown")} />
                                    <InfoCard label="Mother Tongue" value={profile.motherTongue || "-"} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                    <h3 className="font-bold text-purple-900 mb-4">Horoscope & Faith</h3>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <InfoCard label="Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                        <InfoCard label="Caste" value={profile.religion?.caste || "-"} />
                                        <InfoCard label="Gothra" value={profile.horoscope?.gothra || profile.religion?.gothra || "-"} />
                                        <InfoCard label="Manglik" value={profile.horoscope?.manglik || "-"} icon="✨" />
                                        <InfoCard label="Zodiac" value={profile.horoscope?.zodiacSign || "-"} />
                                        <InfoCard label="Nakshatra" value={profile.horoscope?.nakshatra || "-"} />
                                        <InfoCard label="Time of Birth" value={profile.horoscope?.birthTime || "-"} />
                                        <InfoCard label="Birth Place" value={profile.horoscope?.birthPlace || "-"} />
                                    </div>
                                </section>

                                {/* Premium Contact Section */}
                                <section className="bg-teal-50 p-6 rounded-2xl border border-teal-100 mt-2">
                                    <h3 className="font-bold text-teal-900 mb-4 flex justify-between items-center">
                                        Contact Information
                                        {!currentUser?.is_premium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">PREMIUM</span>}
                                    </h3>

                                    {currentUser?.is_premium ? (
                                        <div className="bg-white/60 border border-teal-200/50 rounded-2xl p-5 space-y-4">
                                            <ContactRow icon="📞" label="Phone" value={profile.phone || "Not Available"} />
                                            <ContactRow icon="✉️" label="Email" value={profile.email || "hidden@email.com"} />
                                            <div className="pt-2">
                                                <VideoCallButton
                                                    targetUserId={profile.id}
                                                    targetUserName={profile.name}
                                                    targetUserPhoto={profile.photoUrl}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3 font-bold shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden rounded-2xl bg-white/50 border border-teal-200/50 p-8 text-center backdrop-blur-sm">
                                            <div className="absolute inset-0 blur-md opacity-40 bg-white/50 pointer-events-none p-6 space-y-4">
                                                <div className="h-4 bg-teal-200/50 rounded w-3/4 mx-auto" />
                                                <div className="h-4 bg-teal-200/50 rounded w-1/2 mx-auto" />
                                            </div>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 text-white text-2xl animate-bounce">
                                                    👑
                                                </div>
                                                <h4 className="font-bold text-teal-950 text-lg mb-4">Upgrade to Premium</h4>

                                                <div className="space-y-2 text-left mb-6 bg-white/60 p-4 rounded-xl border border-white/40 shadow-sm w-full max-w-[280px]">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="text-green-600">✓</span> Instant Contact Numbers
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="text-green-600">✓</span> Video & Audio Calls
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="text-green-600">✓</span> See Who Liked You
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span className="text-green-600">✓</span> Unlimited Interest Requests
                                                    </div>
                                                </div>

                                                <Button onClick={onUpgrade} className="bg-gradient-to-r from-gray-900 to-black text-white hover:scale-105 transition-transform rounded-full px-8 py-6 shadow-xl font-bold text-lg">
                                                    Unlock All Features
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'career' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">💼</div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{profile.career?.profession || "-"}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                {/* Show Company if Connected OR Premium */}
                                                {(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium)
                                                    ? (
                                                        <>
                                                            {profile.career?.company || "-"}
                                                            {currentUser?.is_premium && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">💎 UNLOCKED</span>}
                                                        </>
                                                    )
                                                    : "🔒 Connect to Unlock Company"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Education" value={profile.career?.education || "-"} />
                                        <InfoRow label="Degree" value={profile.career?.degree || "-"} />
                                        <InfoRow label="College" value={profile.career?.college || "-"} />
                                        <InfoRow
                                            label="Annual Income"
                                            value={(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium) ? (profile.career?.income || "Not Specified") : "🔒 Connect to Unlock"}
                                            highlight={(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium)}
                                            premiumUnlocked={currentUser?.is_premium && !(profile.match_status === 'accepted' || currentUser?.id === profile.id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                    <h3 className="font-bold text-orange-900 mb-4">Family Background</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoCard label="Family Type" value={profile.family?.type || profile.family?.familyType || "-"} />
                                        <InfoCard label="Values" value={profile.family?.values || profile.family?.familyValues || "-"} />
                                        <InfoCard label="Father" value={profile.family?.fatherOccupation || "-"} />
                                        <InfoCard label="Mother" value={profile.family?.motherOccupation || "-"} />
                                        <InfoCard label="Brothers" value={profile.family?.brothers || "0"} />
                                        <InfoCard label="Sisters" value={profile.family?.sisters || "0"} />
                                        <InfoCard label="Native Place" value={profile.family?.nativePlace || profile.location?.city || "City"} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lifestyle' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <h3 className="font-bold text-green-900 mb-4">Habits & Lifestyle</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoCard label="Diet" value={profile.lifestyle?.diet || "-"} icon="🥗" />
                                        <InfoCard label="Smoking" value={profile.lifestyle?.smoking || profile.lifestyle?.smoke || "-"} icon="🚬" />
                                        <InfoCard label="Drinking" value={profile.lifestyle?.drinking || profile.lifestyle?.drink || "-"} icon="🍷" />
                                    </div>
                                </div>

                                {profile.lifestyle?.hobbies && (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <h3 className="font-bold text-slate-900 mb-4">Interests & Hobbies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.lifestyle.hobbies.split(',').map((hobby: string, idx: number) => (
                                                <span key={idx} className="bg-white px-3 py-1.5 rounded-full text-sm text-slate-700 border border-slate-200 shadow-sm">
                                                    {hobby.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                        <InfoCard label="Age Range" value={profile.partnerPreferences?.ageRange || "Open"} />
                                        <InfoCard label="Height Range" value={profile.partnerPreferences?.heightRange || "Open"} />
                                        <InfoCard label="Min Income" value={profile.partnerPreferences?.income || "Any"} />
                                        <InfoCard label="Preferred Location" value={profile.partnerPreferences?.location || "Anywhere"} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Bottom Action Bar (Fixed on Mobile) */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 md:static md:bg-gray-50 z-[210]">
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-300 text-gray-600 font-bold hover:bg-gray-50" onClick={onClose}>
                                Skip
                            </Button>
                            <Button className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30" onClick={onConnect}>
                                Send Interest 💖
                            </Button>
                        </div>
                    </div>

                </div>

            </div>

            {
                showKundli && (
                    <KundliModal
                        isOpen={showKundli}
                        onClose={() => setShowKundli(false)}
                        data={profile.kundli || { score: 18, total: 36, details: [] }}
                        names={{ me: currentUser?.full_name || 'You', partner: profile.name }}
                    />
                )
            }

            <CoinStoreModal
                isOpen={showCoinStore}
                onClose={() => setShowCoinStore(false)}
                onSuccess={() => {
                    setShowCoinStore(false);
                    // Trigger refresh in parent if needed
                }}
            />
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
                    />
                </div>
            )}
        </div >
    );
}

// Sub-components for cleaner code
const InfoCard = ({ label, value, icon }: any) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</div>
        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1 break-words">
            {icon && <span>{icon}</span>} {value}
        </div>
    </div>
);

const InfoRow = ({ label, value, highlight, premiumUnlocked }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
        <span className="text-gray-500 text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${highlight ? 'text-green-700 font-bold' : 'text-gray-900'}`}>{value}</span>
            {premiumUnlocked && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">💎</span>}
        </div>
    </div>
);

const ContactRow = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-green-100/50 shadow-sm">
        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-xl">{icon}</div>
        <div>
            <div className="text-[10px] text-green-800 font-bold uppercase tracking-wider">{label}</div>
            <div className="text-gray-900 font-mono font-medium">{value}</div>
        </div>
    </div>
);
