'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { RELIGION_OPTIONS, ZODIAC_OPTIONS } from '@/lib/religionUtils';

interface ProfileEditorProps {
    initialData: any;
    onSave: (newData: any) => void;
    onCancel: () => void;
}

export default function ProfileEditor({ initialData, onSave, onCancel }: ProfileEditorProps) {
    const toast = useToast();
    const [formData, setFormData] = useState(() => {
        const data = { ...(initialData || {}) };
        // Self-heal: If user has a main photo but empty photos array, seed the array so it's not lost on new uploads
        if (!data.photos || data.photos.length === 0) {
            data.photos = data.photoUrl ? [data.photoUrl] : [];
        }
        
        // Initialize a raw string for editing interests so commas don't get filtered out while typing
        if (Array.isArray(data.interests)) {
            data.interests_raw = data.interests.join(', ');
        } else if (typeof data.interests === 'string') {
            data.interests_raw = data.interests;
        }

        return data;
    });
    const [loading, setLoading] = useState(false);
    const [roasting, setRoasting] = useState(false);
    const [roastResult, setRoastResult] = useState<{roast: string, score: number, tips: string[]} | null>(null);

    const handleRoast = async () => {
        setRoasting(true);
        try {
            const res = await api.ai.profileRoast();
            if (res.error) {
                toast.error(res.error);
            } else {
                setRoastResult(res);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to summon the Love Guru.");
        } finally {
            setRoasting(false);
        }
    };

    const handleChange = (section: string, field: string, value: any) => {
        setFormData((prev: any) => {
            if (section === 'root') {
                return { ...prev, [field]: value };
            } else {
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section] || {}),
                        [field]: value
                    }
                };
            }
        });
    };

    const handleSave = async () => {
        // Enforce Location Fields
        if (!formData.location?.city || !formData.location?.district || !formData.location?.state) {
            toast.error("Please ensure City, District, and State are filled.");
            return;
        }

        setLoading(true);
        try {
            // Build clean payload — strip base64 from photoUrl to avoid bypassing backend upload
            const payload = { ...formData };

            // If the primary photoUrl is base64, don't send it separately — the backend will
            // derive it from the photos[] array after uploading to Supabase
            if (payload.photoUrl && typeof payload.photoUrl === 'string' && payload.photoUrl.startsWith('data:')) {
                delete payload.photoUrl;
            }

            // Convert raw comma separated interests back into an array before saving
            if (payload.interests_raw !== undefined) {
                payload.interests = payload.interests_raw.split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            const res = await api.profile.updateProfile(payload);
            if (res.success) {
                onSave(formData);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaimReward = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/claim-completion`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).then(r => r.json());
            
            if (res.success) {
                toast.success(res.message);
                setFormData((prev: any) => ({ ...prev, is_profile_completed_reward_claimed: true }));
            } else {
                toast.error(res.error || "Failed to claim reward");
            }
        } catch (e) {
            toast.error("Network error claiming reward.");
        } finally {
            setLoading(false);
        }
    };

    const countFields = [
        formData.photos?.length > 0,
        formData.aboutMe,
        formData.name,
        formData.gender,
        formData.maritalStatus,
        formData.motherTongue,
        formData.dob,
        formData.location?.city,
        formData.career?.profession,
        formData.expectations || formData.prompt
    ];
    const completionPercentage = Math.round((countFields.filter(Boolean).length / countFields.length) * 100);

    return (
        <div className="fixed inset-0 w-full h-[100dvh] md:relative md:h-auto bg-white dark:bg-gray-800 md:rounded-xl shadow-lg border-x-0 border-y md:border border-gray-100 dark:border-gray-800 overflow-y-auto z-[2000] md:z-auto animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300">
            <div className="bg-indigo-600 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center text-white sticky top-0 z-20">
                <h3 className="text-base md:text-lg font-bold">Edit Profile</h3>
                <button onClick={onCancel} className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* GAMIFICATION WIDGET & AI ROAST */}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold tracking-wide text-indigo-900 dark:text-indigo-100 text-sm">Profile Completeness</h4>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-indigo-200 dark:bg-indigo-950 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                            style={{ width: `${completionPercentage}%` }} 
                        />
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                        {completionPercentage === 100 ? "Your profile is fully complete!" : "Add more details to boost your matching rate completely!"}
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {/* The Roast Button */}
                    <Button 
                        onClick={handleRoast} 
                        disabled={roasting}
                        className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold shadow-lg shadow-rose-500/20 whitespace-nowrap"
                    >
                        {roasting ? "🔮 Guru Thinking..." : "🔥 Roast My Profile"}
                    </Button>

                    {completionPercentage === 100 && !formData.is_profile_completed_reward_claimed ? (
                        <Button 
                            onClick={handleClaimReward} 
                            disabled={loading}
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-500/20 whitespace-nowrap animate-pulse"
                        >
                            💰 Claim 50 Coins
                        </Button>
                    ) : completionPercentage < 100 ? (
                        <div className="w-full sm:w-auto bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700 text-xs font-bold text-indigo-800 dark:text-indigo-300 whitespace-nowrap text-center opacity-80 cursor-not-allowed flex items-center justify-center">
                            🔒 Earn 50 Coins at 100%
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ROAST RESULT DISPLAY */}
            {roastResult && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/50 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🔮</div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100">Guru's Verdict: {roastResult.score}/10</h3>
                                <p className="text-rose-800 dark:text-rose-200 mt-1 italic font-medium">"{roastResult.roast}"</p>
                            </div>
                            
                            <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-rose-200/50 dark:border-rose-800/50">
                                <h4 className="font-bold text-rose-900 dark:text-rose-100 mb-2 text-sm uppercase tracking-wider">How to Fix It:</h4>
                                <ul className="space-y-2">
                                    {roastResult.tips.map((tip, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-rose-800/90 dark:text-rose-200/90 items-start">
                                            <span className="text-rose-500 font-bold mt-0.5">·</span> 
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button onClick={() => setRoastResult(null)} className="text-rose-400 hover:text-rose-600 transition-colors">✕</button>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Photo Upload Section */}
                {/* Photo Gallery Upload Section */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Profile Photos</h4>

                    <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 p-6 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors relative group">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={async (e) => {
                                const files = e.target.files;
                                if (!files || files.length === 0) return;

                                const currentPhotos = formData.photos || [];
                                if (currentPhotos.length >= 5) {
                                    toast.error('Maximum 5 photos allowed. Remove one to add more.');
                                    return;
                                }

                                const slotsLeft = 5 - currentPhotos.length;
                                const newPhotos: string[] = [];

                                for (let i = 0; i < Math.min(files.length, slotsLeft); i++) {
                                    const file = files[i];
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error(`"${file.name}" is too large (>5MB). Please use a smaller photo.`);
                                        continue;
                                    }

                                    const base64 = await new Promise<string>((resolve, reject) => {
                                        const url = URL.createObjectURL(file);
                                        const img = new Image();
                                        img.onload = () => {
                                            URL.revokeObjectURL(url);
                                            const canvas = document.createElement('canvas');
                                            let { width, height } = img;
                                            const maxDim = 900;

                                            if (width > maxDim || height > maxDim) {
                                                const ratio = Math.min(maxDim / width, maxDim / height);
                                                width = Math.round(width * ratio);
                                                height = Math.round(height * ratio);
                                            }

                                            canvas.width = width;
                                            canvas.height = height;
                                            const ctx = canvas.getContext('2d');
                                            if (!ctx) return reject('Failed to get context');
                                            ctx.drawImage(img, 0, 0, width, height);
                                            resolve(canvas.toDataURL('image/jpeg', 0.75));
                                        };
                                        img.onerror = () => reject('Failed to load image');
                                        img.src = url;
                                    }).catch(() => null as any);

                                    if (base64) newPhotos.push(base64);
                                }

                                // Append new photos to existing
                                const updatedPhotos = [...currentPhotos, ...newPhotos];
                                setFormData((prev: any) => ({
                                    ...prev,
                                    photos: updatedPhotos
                                    // Note: DO NOT set photoUrl here if it's base64
                                    // The backend derives finalPhotoUrl from the processed photos[] array
                                }));
                            }}
                        />
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 text-2xl group-hover:scale-110 transition-transform">
                            📸
                        </div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100">Upload Photos</h5>
                        <p className="text-xs text-gray-500 mt-1">Drag & drop or Click to browse (Multiple allowed)</p>
                    </div>

                    {/* Preview Gallery */}
                    {(formData.photos?.length > 0 || formData.photoUrl) && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {(formData.photos?.length > 0 ? formData.photos : [formData.photoUrl]).map((photo: string, idx: number) => {
                                if (!photo) return null;
                                return (
                                <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group">
                                    <img src={photo} alt="Upload" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            const currentArr = formData.photos?.length > 0 ? formData.photos : [formData.photoUrl];
                                            if (currentArr.length <= 1) {
                                                toast.error("You must have at least one photo!");
                                                return;
                                            }
                                            const newPhotos = currentArr.filter((_: any, i: number) => i !== idx);
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                photos: newPhotos,
                                                photoUrl: idx === 0 ? (newPhotos[0] || '') : prev.photoUrl // Update primary if first deleted
                                            }));
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow-md transition-transform active:scale-95"
                                    >
                                        ✕
                                    </button>
                                    {/* Star for Primary - Fallback to idx === 0 if photoUrl logic is desynced */}
                                    {(formData.photoUrl === photo || idx === 0) && (
                                        <div className="absolute bottom-1 left-1 bg-yellow-400 text-white text-[10px] px-1 rounded shadow-sm font-bold">
                                            Main
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* About Me */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">About Me</h4>
                    <textarea
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        rows={3}
                        placeholder="Describe your personality, hobbies, and what you are looking for..."
                        value={formData.aboutMe || ''}
                        onChange={e => handleChange('root', 'aboutMe', e.target.value)}
                    />
                </div>

                {/* Section 1: Basic Info */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" value={formData.name || ''} onChange={e => handleChange('root', 'name', e.target.value)} />
                        {/* Gender Selector */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                                value={formData.gender || ''}
                                onChange={e => handleChange('root', 'gender', e.target.value)}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        {/* Marital Status Selector */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Marital Status</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                                value={formData.maritalStatus || ''}
                                onChange={e => handleChange('root', 'maritalStatus', e.target.value)}
                            >
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Awaiting Divorce">Awaiting Divorce</option>
                            </select>
                        </div>
                        {/* Mother Tongue */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Tongue</label>
                            <select className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500" value={formData.motherTongue || ''} onChange={e => handleChange('root', 'motherTongue', e.target.value)}>
                                <option value="">Select Language</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Telugu">Telugu</option>
                                <option value="Tamil">Tamil</option>
                                <option value="Malayalam">Malayalam</option>
                                <option value="Kannada">Kannada</option>
                                <option value="Bengali">Bengali</option>
                                <option value="Marathi">Marathi</option>
                                <option value="Gujarati">Gujarati</option>
                                <option value="Punjabi">Punjabi</option>
                                <option value="English">English</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        {/* Date of Birth (Calculates Age) */}
                        <Input
                            label="Date of Birth"
                            type="date"
                            value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
                            onChange={e => {
                                const dob = e.target.value;
                                // Calculate Age
                                if (dob) {
                                    const birthDate = new Date(dob);
                                    const today = new Date();
                                    let age = today.getFullYear() - birthDate.getFullYear();
                                    const m = today.getMonth() - birthDate.getMonth();
                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                        age--;
                                    }
                                    handleChange('root', 'age', age);
                                    handleChange('root', 'dob', dob);
                                }
                            }}
                        />
                        <Input label="Height (e.g. 5'9)" value={formData.height || ''} onChange={e => handleChange('root', 'height', e.target.value)} />
                        <div className="md:col-span-2 space-y-2 border border-gray-200 dark:border-gray-700 p-3 rounded-md bg-slate-50 dark:bg-gray-800/50 relative group">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                                <span>Current Location</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (navigator.geolocation) {
                                            const btn = e.currentTarget;
                                            btn.innerText = "📍 Locating...";
                                            navigator.geolocation.getCurrentPosition(async (position) => {
                                                try {
                                                    const { latitude, longitude } = position.coords;
                                                    // BigDataCloud (More reliable for India State/District)
                                                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                                                    const data = await res.json();

                                                    // Better Address Parsing
                                                    const detectedCity = data.locality || data.city || data.principalSubdivision || "Unknown City";
                                                    const detectedDistrict = data.localityInfo?.administrative?.find((x: any) => x.adminLevel === 5 || (x.name && x.name.toLowerCase().includes('district')))?.name || data.principalSubdivision || detectedCity;
                                                    const detectedState = data.principalSubdivision || data.localityInfo?.administrative?.find((x: any) => x.order === 4)?.name || "Unknown State";
                                                    const detectedCountry = data.countryName || "India";

                                                    // Update All Location Fields
                                                    handleChange('location', 'city', detectedCity);
                                                    handleChange('location', 'district', detectedDistrict);
                                                    handleChange('location', 'state', detectedState);
                                                    handleChange('location', 'country', detectedCountry);

                                                    // Save Coordinates for Proximity Search
                                                    handleChange('location', 'lat', latitude);
                                                    handleChange('location', 'lng', longitude);

                                                    btn.innerText = "✅ Detected";
                                                    setTimeout(() => btn.innerText = "📍 Use GPS", 2000);
                                                } catch (err) {
                                                    toast.error("Could not fetch address details. Please enter manually.");
                                                    btn.innerText = "📍 Use GPS";
                                                }
                                            }, () => {
                                                toast.error("Permission denied or unavailable.");
                                                btn.innerText = "📍 Use GPS";
                                            });
                                        }
                                    }}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded transition-colors"
                                >
                                    📍 Use GPS
                                </button>
                            </label>

                            {/* Validation Error Message */}
                            {(!formData.location?.district || !formData.location?.state) && (
                                <p className="text-[10px] text-amber-600 mb-1 ml-1 font-medium flex items-center gap-1">
                                    ⚠️ GPS recommended to fetch District & State.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="City (e.g. Mumbai)"
                                    value={formData.location?.city || (typeof formData.location === 'string' ? formData.location : '')}
                                    onChange={e => handleChange('location', 'city', e.target.value)}
                                />
                                <Input
                                    placeholder="District (e.g. Ranga Reddy)"
                                    value={formData.location?.district || ''}
                                    onChange={e => handleChange('location', 'district', e.target.value)}
                                    className={`${!formData.location?.district ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                                />
                                <Input
                                    placeholder="State (e.g. Telangana)"
                                    value={formData.location?.state || ''}
                                    onChange={e => handleChange('location', 'state', e.target.value)}
                                    className={`${!formData.location?.state ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                                />
                                <Input
                                    placeholder="Country (e.g. India)"
                                    value={formData.location?.country || ''}
                                    onChange={e => handleChange('location', 'country', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information (New) */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Email Address" value={formData.email || ''} onChange={e => handleChange('root', 'email', e.target.value)} />
                        <Input label="Phone Number" value={formData.phone || ''} onChange={e => handleChange('root', 'phone', e.target.value)} />
                    </div>
                </div>

                {/* Horoscope (New) */}


                {/* Partner Preferences (New) */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Partner Preferences</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expectations / Describe your ideal partner</label>
                            <textarea
                                className="w-full h-24 p-3 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500 text-sm"
                                placeholder="e.g. Someone who is ambitious, loves travel..."
                                value={formData.expectations || formData.prompt || ''}
                                onChange={e => handleChange('root', 'expectations', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Preferred Age Range" placeholder="e.g. 24-28" value={formData.partnerPreferences?.ageRange || ''} onChange={e => handleChange('partnerPreferences', 'ageRange', e.target.value)} />
                            <Input label="Preferred Height" placeholder="e.g. 5'2 - 5'6" value={formData.partnerPreferences?.heightRange || ''} onChange={e => handleChange('partnerPreferences', 'heightRange', e.target.value)} />
                            <Input label="Preferred Income" placeholder="e.g. > 10 LPA" value={formData.partnerPreferences?.income || ''} onChange={e => handleChange('partnerPreferences', 'income', e.target.value)} />
                            <Input label="Preferred Location" placeholder="e.g. Mumbai, Bangalore" value={formData.partnerPreferences?.location || ''} onChange={e => handleChange('partnerPreferences', 'location', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Section: Lifestyle (New) */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Lifestyle</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Diet</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                                value={formData.lifestyle?.diet || ''}
                                onChange={e => handleChange('lifestyle', 'diet', e.target.value)}
                            >
                                <option value="">Select Diet</option>
                                <option value="Veg">Veg</option>
                                <option value="Non-Veg">Non-Veg</option>
                                <option value="Vegan">Vegan</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Smoking</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                                value={formData.lifestyle?.smoke || formData.lifestyle?.smoking || ''}
                                onChange={e => handleChange('lifestyle', 'smoke', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Occasionally">Occasionally</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Drinking</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                                value={formData.lifestyle?.drink || formData.lifestyle?.drinking || ''}
                                onChange={e => handleChange('lifestyle', 'drink', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Occasionally">Occasionally</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Career */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Career & Education</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Profession" value={formData.career?.profession || ''} onChange={(e) => handleChange('career', 'profession', e.target.value)} />
                        <Input label="Company" value={formData.career?.company || ''} onChange={(e) => handleChange('career', 'company', e.target.value)} />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Highest Education</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                value={formData.career?.education || ''}
                                onChange={(e) => handleChange('career', 'education', e.target.value)}
                            >
                                <option value="">Select Education</option>
                                <option value="High School">High School</option>
                                <option value="Bachelor's">Bachelor's</option>
                                <option value="Master's">Master's</option>
                                <option value="PhD">PhD</option>
                                <option value="Professional Degree">Professional Degree</option>
                            </select>
                        </div>
                        <Input label="College / Univ" value={formData.career?.college || ''} onChange={(e) => handleChange('career', 'college', e.target.value)} />
                        <Input label="Degree Details" value={formData.career?.degree || ''} onChange={(e) => handleChange('career', 'degree', e.target.value)} />
                        <Input label="Annual Income" value={formData.career?.income || ''} onChange={(e) => handleChange('career', 'income', e.target.value)} />
                    </div>
                </div>

                {/* Section 3: Religion & Horoscope */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Religion & Horoscope</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Religion</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500"
                                value={formData.religion?.religion || ''}
                                onChange={(e) => handleChange('religion', 'religion', e.target.value)}
                            >
                                <option value="">Select Religion</option>
                                {RELIGION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Caste" value={formData.religion?.caste || ''} onChange={(e) => handleChange('religion', 'caste', e.target.value)} />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Inter-Caste Marriage</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500"
                                value={formData.religion?.interCasteOpen || ''}
                                onChange={(e) => handleChange('religion', 'interCasteOpen', e.target.value)}
                            >
                                <option value="">Select Preference</option>
                                <option value="Yes, open to inter-caste">Yes, open to inter-caste</option>
                                <option value="No, strictly same caste">No, strictly same caste</option>
                                <option value="Open Details">Open Details</option>
                            </select>
                        </div>
                        <Input label="Gothra" value={formData.religion?.gothra || formData.horoscope?.gothra || ''} onChange={(e) => handleChange('religion', 'gothra', e.target.value)} />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Zodiac Sign</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500"
                                value={formData.horoscope?.zodiacSign || ''}
                                onChange={e => handleChange('horoscope', 'zodiacSign', e.target.value)}
                            >
                                <option value="">Select Zodiac Sign</option>
                                {ZODIAC_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Nakshatra" value={formData.horoscope?.nakshatra || ''} onChange={(e) => handleChange('horoscope', 'nakshatra', e.target.value)} />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Manglik</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-indigo-500"
                                value={formData.horoscope?.manglik || ''}
                                onChange={(e) => handleChange('horoscope', 'manglik', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Don't Know">Don't Know</option>
                            </select>
                        </div>

                        <Input label="Birth Place" value={formData.horoscope?.birthPlace || ''} onChange={(e) => handleChange('horoscope', 'birthPlace', e.target.value)} />
                        <Input label="Time of Birth" value={formData.horoscope?.birthTime || ''} onChange={(e) => handleChange('horoscope', 'birthTime', e.target.value)} />
                    </div>
                </div>

                {/* Section 4: Family Details */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Family Background</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Father's Job" value={formData.family?.fatherOccupation || ''} onChange={(e) => handleChange('family', 'fatherOccupation', e.target.value)} />
                        <Input label="Mother's Job" value={formData.family?.motherOccupation || ''} onChange={(e) => handleChange('family', 'motherOccupation', e.target.value)} />
                        <Input label="Brothers" type="number" value={formData.family?.brothers || ''} onChange={(e) => handleChange('family', 'brothers', e.target.value)} />
                        <Input label="Sisters" type="number" value={formData.family?.sisters || ''} onChange={(e) => handleChange('family', 'sisters', e.target.value)} />
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Family Type</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md"
                                value={formData.family?.type || formData.family?.familyType || 'Nuclear'}
                                onChange={(e) => handleChange('family', 'type', e.target.value)}
                            >
                                <option>Nuclear</option>
                                <option>Joint</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Family Values</label>
                            <select
                                className="w-full h-10 px-3 border rounded-md"
                                value={formData.family?.values || formData.family?.familyValues || 'Moderate'}
                                onChange={(e) => handleChange('family', 'values', e.target.value)}
                            >
                                <option>Moderate</option>
                                <option>Traditional</option>
                                <option>Orthodox</option>
                                <option>Liberal</option>
                            </select>
                        </div>
                        <Input label="Native Place" value={formData.family?.nativePlace || ''} onChange={(e) => handleChange('family', 'nativePlace', e.target.value)} />
                    </div>
                </div>

                {/* Section 5: Hobbies */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4 uppercase tracking-wide">Interests</h4>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hobbies (Comma separated)</label>
                        <textarea
                            className="w-full h-20 p-3 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                            value={formData.interests_raw ?? (Array.isArray(formData.interests) ? formData.interests.join(', ') : (formData.interests || ''))}
                            onChange={(e) => handleChange('root', 'interests_raw', e.target.value)}
                        />
                    </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 z-20">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div >
    );
}
