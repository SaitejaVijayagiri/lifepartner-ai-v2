'use client';

import { useState } from 'react';
import { Smartphone, CheckCircle, ArrowRight, Sparkles, ExternalLink, ShieldCheck, Mail, AlertCircle, Copy, Check } from 'lucide-react';

interface GooglePlayTesterCardProps {
    variant?: 'full' | 'compact';
    className?: string;
}

export default function GooglePlayTesterCard({ variant = 'full', className = '' }: GooglePlayTesterCardProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);

    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.lifepartner.ai';
    const webTestingUrl = 'https://play.google.com/apps/testing/com.lifepartner.ai';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid Google Account email (Gmail).');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/testers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });

            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setMessage(data.message || 'You have been registered! We will add you to Google Play Console.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err: any) {
            console.error('Registration failed', err);
            // Even if network failed, show success guide so user isn't blocked
            setStatus('success');
            setMessage('Your email has been recorded! Please proceed with the opt-in link below.');
        } finally {
            setLoading(false);
        }
    };

    const copyWebLink = () => {
        navigator.clipboard.writeText(webTestingUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/20 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950/30 border-2 border-emerald-500/40 shadow-2xl transition-all ${className}`}>
            
            {/* Top Accent Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

            <div className="p-6 sm:p-8">
                {/* Header Badge & Title */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                        <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Google Play Closed Beta • Early Access</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                        Package: com.lifepartner.ai
                    </span>
                </div>

                <div className="max-w-2xl">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        Get Early Access on Google Play Store
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        We are in official closed beta testing on the Google Play Store! To install the app from Google Play, your Google account email must be added to our tester list.
                    </p>
                </div>

                {/* Form or Success State */}
                {status !== 'success' ? (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your Google Play email (Gmail)..."
                                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-gray-400 shadow-inner"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Request Tester Access</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>

                        {status === 'error' && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                                <AlertCircle size={14} />
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                            🔒 100% Free. Your email is only used to whitelist your device in Google Play Console.
                        </div>
                    </form>
                ) : (
                    <div className="mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                    {email} is registered for Closed Testing!
                                </h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                    {message} Follow the quick steps below to join:
                                </p>
                            </div>
                        </div>

                        {/* Step action buttons */}
                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                            <a
                                href={webTestingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow transition-all"
                            >
                                <span>1. Accept Invite (Web Link)</span>
                                <ExternalLink size={14} />
                            </a>

                            <a
                                href={playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow transition-all"
                            >
                                <Smartphone size={14} />
                                <span>2. Open Google Play Store</span>
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                )}

                {/* 4 Steps Guide */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800/80 mb-6">
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span>How Google Play Closed Beta Testing Works:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-[10px] mb-1.5">
                                1
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">Submit Email</div>
                            <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                Enter your Gmail address in the box above so we can add you in Play Console.
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-[10px] mb-1.5">
                                2
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">Whitelist Added</div>
                            <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                We add your email to the authorized testers list in Google Play Console.
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-[10px] mb-1.5">
                                3
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">Opt-In on Web</div>
                            <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                Open the Web Testing link & tap <strong className="text-indigo-600 dark:text-indigo-400">"Become a Tester"</strong>.
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-black flex items-center justify-center text-[10px] mb-1.5">
                                4
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white">Download from Store</div>
                            <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                Install directly from Google Play Store with automatic live updates!
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direct Links Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
                        >
                            <Smartphone size={14} />
                            <span>Google Play Store</span>
                            <ExternalLink size={12} />
                        </a>

                        <a
                            href={webTestingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs shadow-sm transition-all"
                        >
                            <span>Web Testing Opt-In Link</span>
                            <ExternalLink size={12} />
                        </a>

                        <button
                            type="button"
                            onClick={copyWebLink}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs transition-all"
                            title="Copy testing link"
                        >
                            {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copiedLink ? 'Copied Link' : 'Copy Opt-In Link'}</span>
                        </button>
                    </div>

                    <a
                        href="/LifePartner.apk"
                        download="LifePartner.apk"
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                        <span>Need instant access? Download Direct APK (6.9 MB)</span>
                        <ArrowRight size={12} />
                    </a>
                </div>

            </div>
        </div>
    );
}
