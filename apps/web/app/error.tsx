'use client';
import { useEffect, useState } from 'react';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        console.error('Application Error Boundary Caught:', error);
        // Auto-clear corrupt match cache to prevent permanent crash loops
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('matches_cache_v2');
            }
        } catch (_) {}
    }, [error]);

    const handleHardReset = () => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('matches_cache_v2');
                localStorage.removeItem('dashboard_active_tab');
                localStorage.removeItem('dashboard_selected_connection');
                window.location.href = '/dashboard';
            }
        } catch (_) {
            reset();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl space-y-5">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                    ⚠️
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        Something went wrong
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        An unexpected display issue occurred. Don't worry, your data and preferences are safe.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={handleHardReset}
                        className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                        Clear Cache & Reload
                    </button>
                    <button
                        onClick={() => {
                            try {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('matches_cache_v2');
                                }
                            } catch (_) {}
                            reset();
                        }}
                        className="flex-1 py-3 px-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>

                {/* Collapsible Error Debug Details */}
                <div className="pt-2 text-left">
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline font-mono flex items-center gap-1 mx-auto"
                    >
                        {showDetails ? 'Hide error details' : 'Show technical details'}
                    </button>

                    {showDetails && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-950 rounded-xl text-left border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-48 text-[11px] font-mono text-rose-600 dark:text-rose-400 space-y-1">
                            <div><strong>Message:</strong> {error?.message || 'Unknown error'}</div>
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
