'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application Error Boundary Caught:', error);
    }, [error]);

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
                        onClick={() => reset()}
                        className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        onClick={() => {
                            try {
                                localStorage.removeItem('matches_cache_v2');
                            } catch (_) {}
                        }}
                        className="flex-1 py-3 px-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
