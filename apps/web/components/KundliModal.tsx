import { X, Star, Sparkles, Heart, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface KundliModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        score: number;
        total: number;
        details: any[];
    };
    names: { me: string, partner: string };
}

export default function KundliModal({ isOpen, onClose, data, names }: KundliModalProps) {
    if (!isOpen) return null;

    const percentage = Math.round((data.score / data.total) * 100);
    let verdict = "Excellent Match";
    let verdictIcon = <CheckCircle size={16} />;
    let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
    let ringColor = "#10b981";

    if (data.score < 18) {
        verdict = "Needs Consideration";
        verdictIcon = <XCircle size={16} />;
        colorClass = "text-red-500 bg-red-50 border-red-200";
        ringColor = "#ef4444";
    } else if (data.score < 24) {
        verdict = "Good Match";
        verdictIcon = <AlertCircle size={16} />;
        colorClass = "text-amber-600 bg-amber-50 border-amber-200";
        ringColor = "#f59e0b";
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Premium Header with Gradient */}
                <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-center overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    {/* Om symbol with glow */}
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-lg ring-2 ring-white/30">
                            🕉️
                        </div>
                        <h2 className="text-2xl font-bold text-white drop-shadow-md">Vedic Compatibility</h2>
                        <p className="text-white/80 text-sm mt-1 flex items-center justify-center gap-2">
                            <Heart size={14} fill="currentColor" />
                            {names.me} & {names.partner}
                        </p>
                    </div>
                </div>

                {/* Score Circle - Floating */}
                <div className="relative -mt-8 px-6">
                    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center border border-gray-100">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            {/* Circular Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r="62" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                <circle
                                    cx="72" cy="72" r="62"
                                    stroke={ringColor}
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray="390"
                                    strokeDashoffset={390 - (390 * percentage) / 100}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-black text-gray-900">{data.score}</span>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">out of 36</span>
                            </div>
                        </div>

                        {/* Verdict Badge */}
                        <div className={`mt-4 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${colorClass}`}>
                            {verdictIcon}
                            {verdict}
                        </div>
                    </div>
                </div>

                {/* Breakdown List */}
                <div className="px-6 pt-5 pb-4 max-h-56 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={12} />
                        Ashta Kuta Details
                    </h3>
                    <div className="space-y-3">
                        {data.details.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800">{item.name}</span>
                                    {item.v1 && <span className="text-xs text-gray-400">{item.v1} ↔ {item.v2}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${item.s === item.t ? 'bg-emerald-500' : item.s === 0 ? 'bg-red-400' : 'bg-amber-400'}`}
                                            style={{ width: `${(item.s / item.t) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`font-bold w-10 text-right ${item.s === item.t ? 'text-emerald-600' : item.s === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                                        {item.s}/{item.t}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-orange-50 text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Star size={10} className="text-amber-400" />
                        Based on Nakshatra & Moon Sign Analysis
                        <Star size={10} className="text-amber-400" />
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}

