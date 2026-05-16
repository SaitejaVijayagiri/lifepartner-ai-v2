import { useEffect, useState } from 'react';
import { Phone, Video, X, ArrowDownLeft, ArrowUpRight, PhoneCall, PhoneMissed, History, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface CallHistoryModalProps {
    onClose: () => void;
}

export default function CallHistoryModal({ onClose }: CallHistoryModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.calls?.getHistory().then((data: any) => {
            setLogs(data);
        }).catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const callDate = new Date(date);
        const diffMs = now.getTime() - callDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return callDate.toLocaleDateString();
    };

    return (
        <div
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Full-screen sheet — slides up on mobile, centered on desktop */}
            <div
                className="relative w-full sm:max-w-lg sm:rounded-3xl bg-white dark:bg-gray-900 flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
                style={{ height: '92dvh', maxHeight: '92dvh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Premium Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-5 text-white sm:rounded-t-3xl overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                                <History size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">Call History</h3>
                                <p className="text-white/70 text-xs mt-0.5">{loading ? 'Loading…' : `${logs.length} call${logs.length !== 1 ? 's' : ''} recorded`}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Call List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm font-medium">Loading history…</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <PhoneCall size={36} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg">No calls yet</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Your call history will appear here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {logs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all"
                                >
                                    {/* Avatar + call type badge */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={log.otherPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.otherId}`}
                                            className="w-14 h-14 rounded-full object-cover bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow"
                                            alt={log.otherName}
                                        />
                                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm ${log.type === 'VIDEO' ? 'text-indigo-600' : 'text-green-600'}`}>
                                            {log.type === 'VIDEO' ? <Video size={12} /> : <Phone size={12} />}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{log.otherName}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {log.isCaller
                                                ? <ArrowUpRight size={13} className="text-emerald-500 shrink-0" />
                                                : <ArrowDownLeft size={13} className="text-blue-500 shrink-0" />
                                            }
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(log.startedAt)}</span>
                                            <span className="text-gray-300 dark:text-gray-600">·</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Duration + status */}
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1 justify-end text-gray-700 dark:text-gray-200">
                                            <Clock size={12} className="text-gray-400" />
                                            <p className="text-sm font-semibold">{formatDuration(log.duration)}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 font-medium ${
                                            log.status === 'MISSED'
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                                                : log.status === 'COMPLETED'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {log.status === 'MISSED' && <PhoneMissed size={9} />}
                                            {log.status === 'COMPLETED' && <PhoneCall size={9} />}
                                            {log.status?.toLowerCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {logs.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 sm:rounded-b-3xl shrink-0 text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Call history is stored for 30 days</p>
                    </div>
                )}
            </div>
        </div>
    );
}
