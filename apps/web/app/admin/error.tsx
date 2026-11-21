'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Copy, Check, ExternalLink, Download } from 'lucide-react';

export default function AdminErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [showDetails, setShowDetails] = useState(false);
    const [testers, setTesters] = useState<any[]>([]);
    const [loadingTesters, setLoadingTesters] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);

    useEffect(() => {
        console.error('[Admin Error Boundary Caught]:', error);
        loadTestersEmergency();
    }, [error]);

    const loadTestersEmergency = async () => {
        try {
            setLoadingTesters(true);
            const res = await fetch('/api/testers');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data?.testers)) {
                    setTesters(data.testers);
                }
            }
        } catch (e) {
            console.error('Failed to load emergency testers', e);
        } finally {
            setLoadingTesters(false);
        }
    };

    const handleCopyEmails = () => {
        const emails = testers.map(t => (t.email || '').trim().toLowerCase()).filter(Boolean).join(', ');
        navigator.clipboard.writeText(emails);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
    };

    const handleHardReset = () => {
        try {
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                window.location.reload();
            }
        } catch (_) {
            reset();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <ShieldAlert size={26} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">
                            Admin Dashboard Notice
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            A display component encountered an issue ({error?.message || 'Unexpected error'}).
                            Your Google Play Closed Testers data is completely safe below!
                        </p>
                    </div>
                </div>

                {/* Emergency Testers Manager */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                🎯 Google Play Closed Testers ({testers.length})
                            </div>
                            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                                You can copy or export your tester emails right here even in emergency mode:
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyEmails}
                                disabled={testers.length === 0}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedAll ? 'Copied All!' : `Copy (${testers.length}) Emails`}</span>
                            </button>

                            <a
                                href="/api/testers?format=csv"
                                download="google_play_testers.csv"
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs shadow-sm flex items-center gap-1.5"
                            >
                                <Download size={14} />
                                <span>Export CSV</span>
                            </a>
                        </div>
                    </div>

                    {testers.length > 0 && (
                        <div className="max-h-36 overflow-y-auto rounded-xl bg-white dark:bg-gray-950 p-2 border border-emerald-200 dark:border-emerald-900 font-mono text-[11px] text-gray-700 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-800">
                            {testers.map((t, idx) => (
                                <div key={t.id || idx} className="py-1 px-2 flex justify-between items-center">
                                    <span>{t.email}</span>
                                    <span className="text-[10px] text-gray-400">{t.status || 'pending'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                        onClick={handleHardReset}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw size={14} />
                        <span>Reload Admin Dashboard</span>
                    </button>

                    <button
                        onClick={() => reset()}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition-all cursor-pointer"
                    >
                        Try Again
                    </button>

                    <a
                        href="/dashboard"
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 text-xs font-semibold transition-all ml-auto"
                    >
                        Back to User Dashboard
                    </a>
                </div>

                {/* Collapsible Error Debug Details */}
                <div className="pt-2 text-left border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-mono flex items-center gap-1"
                    >
                        {showDetails ? '▼ Hide technical details' : '▶ Show technical details'}
                    </button>

                    {showDetails && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-950 rounded-xl text-left border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-48 text-[11px] font-mono text-rose-600 dark:text-rose-400 space-y-1">
                            <div><strong>Error:</strong> {error?.message || 'Unknown error'}</div>
                            {error?.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                            {error?.stack && (
                                <pre className="whitespace-pre-wrap text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                                    {error.stack}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
