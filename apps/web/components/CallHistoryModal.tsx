import { useEffect, useState } from 'react';
import { Phone, Video, X, Clock, ArrowDownLeft, ArrowUpRight, PhoneCall, PhoneMissed, History } from 'lucide-react';
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
        if (!seconds) return '0s';
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
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-5 text-white rounded-t-3xl overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <History size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Call History</h3>
                                <p className="text-white/70 text-xs">{logs.length} calls recorded</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Call List */}
                <div className="overflow-y-auto p-4 flex-1 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-sm">Loading history...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <PhoneCall size={32} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No calls yet</p>
                            <p className="text-gray-400 text-sm">Your call history will appear here</p>
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-all group"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={log.otherPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.otherId}`}
                                            className="w-12 h-12 rounded-full object-cover bg-gray-200 border-2 border-white shadow-sm"
                                            alt={log.otherName}
                                        />
                                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-gray-100 shadow-sm ${log.type === 'VIDEO' ? 'text-indigo-600' : 'text-green-600'
                                            }`}>
                                            {log.type === 'VIDEO' ? <Video size={10} /> : <Phone size={10} />}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{log.otherName}</h4>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            {log.isCaller ? (
                                                <ArrowUpRight size={12} className="text-green-500" />
                                            ) : (
                                                <ArrowDownLeft size={12} className="text-blue-500" />
                                            )}
                                            <span>{getRelativeTime(log.startedAt)}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${log.status === 'MISSED' ? 'text-red-500' : 'text-gray-700'}`}>
                                        {formatDuration(log.duration)}
                                    </p>
                                    <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${log.status === 'MISSED'
                                            ? 'bg-red-50 text-red-500'
                                            : log.status === 'COMPLETED'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {log.status === 'MISSED' && <PhoneMissed size={10} />}
                                        {log.status === 'COMPLETED' && <PhoneCall size={10} />}
                                        {log.status.toLowerCase()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {logs.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl text-center">
                        <p className="text-xs text-gray-400">
                            Call history is stored for 30 days
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

