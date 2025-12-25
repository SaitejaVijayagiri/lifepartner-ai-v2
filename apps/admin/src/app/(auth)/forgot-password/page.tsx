'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setError('');

            if (!email || !email.includes('@')) {
                setError('Please enter a valid email address');
                return;
            }

            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send reset email';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl space-y-8 border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Reset Password
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        Enter your email to receive a password reset code
                    </p>
                </div>

                {!success ? (
                    <>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl font-medium"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full h-12 bg-indigo-600 text-white hover:bg-indigo-700 text-lg font-bold tracking-wide shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Sending...</span>
                                </div>
                            ) : 'Send Reset Code'}
                        </Button>
                    </>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Mail className="text-green-600" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Check Your Email</h3>
                            <p className="text-gray-600 text-sm">
                                We've sent a password reset code to <strong>{email}</strong>
                            </p>
                            <p className="text-gray-500 text-xs">
                                The code will expire in 10 minutes.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="text-indigo-600 hover:text-indigo-700 font-bold text-sm hover:underline"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}

                {!success && (
                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
