'use client';

import { Heart, MapPin, Briefcase, X, Check } from 'lucide-react';

interface RequestsTabProps {
    requests: any[];
    handleAcceptRequest: (requestId: string) => Promise<void>;
    handleDeclineRequest: (requestId: string) => Promise<void>;
    loading: boolean;
}

export default function RequestsTab({
    requests,
    handleAcceptRequest,
    handleDeclineRequest,
    loading
}: RequestsTabProps) {
    if (loading && requests.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-500">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1 text-gray-900 dark:text-white">
                Pending Requests <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full text-base ml-2">{requests.length}</span>
            </h2>
            {requests.length === 0 && (
                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No pending requests at the moment</p>
                </div>
            )}
            {requests.map((req: any) => (
                <div key={req.interactionId} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-300 justify-between group overflow-hidden relative">
                    {/* Decorative gradient blur */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto relative z-10">
                        <div className="relative">
                            <img 
                                src={req.fromUser.photoUrl || '/avatar-fallback.svg'} 
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg shrink-0" 
                                alt={req.fromUser.name || 'User'}
                                onError={(e) => { 
                                    const t = e.target as HTMLImageElement; 
                                    t.onerror = null; 
                                    t.src = '/avatar-fallback.svg'; 
                                }} 
                            />
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-rose-400 to-pink-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                                <Heart size={12} fill="white" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {req.fromUser.name || 'Someone'}
                                {req.fromUser.age && <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{req.fromUser.age}</span>}
                            </h4>
                            <div className="flex flex-col gap-1 mt-1">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-indigo-400 shrink-0" />
                                    <span className="truncate">{typeof req.fromUser.location === 'string' ? req.fromUser.location : (req.fromUser.location?.city || "Unknown Location")}</span>
                                </p>
                                {req.fromUser.career?.profession && (
                                     <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                         <Briefcase size={14} className="text-indigo-400 shrink-0" /> 
                                         <span className="truncate">{req.fromUser.career.profession}</span>
                                     </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 relative z-10">
                        <button 
                            onClick={() => handleDeclineRequest(req.interactionId)} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 dark:bg-gray-800 dark:hover:bg-rose-900/20 border border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:text-rose-400 rounded-2xl font-bold transition-all"
                        >
                            <X size={18} strokeWidth={3} /> Decline
                        </button>
                        <button 
                            onClick={() => handleAcceptRequest(req.interactionId)} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                        >
                            <Check size={18} strokeWidth={3} /> Accept
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
