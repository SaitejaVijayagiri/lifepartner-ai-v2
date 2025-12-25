'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        try {
            setError('');
            if (!email || !email.includes('@')) {
                setError('Please enter a valid email address');
                return;
            }

            setLoading(true);
            await api.auth.forgotPassword(email);
            setStep(2);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            setError('');
            if (!otp || otp.length < 6) {
                setError('Please enter a valid 6-digit OTP');
                return;
            }
            if (newPassword.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            setLoading(true);
            await api.auth.resetPassword({ email, otp, newPassword });
            setSuccess(true);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl space-y-8 border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {step === 1 ? 'Reset Password' : 'Verify & Set Password'}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        {step === 1
                            ? 'Enter your email to receive a reset code'
                            : `Enter the code sent to ${email}`}
                    </p>
                </div>

                {!success ? (
                    <>
                        <div className="space-y-5">
                            {step === 1 ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <Input
                                            type="email"
                                            placeholder="name@example.com"
                                            className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 font-medium"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSendOtp()}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                                            OTP Code
                                        </label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <Input
                                                type="text"
                                                placeholder="123456"
                                                className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 font-medium tracking-widest"
                                                value={otp}
                                                maxLength={6}
                                                onChange={e => setOtp(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 font-medium"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && handleResetPassword()}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full h-12 bg-indigo-600 text-white hover:bg-indigo-700 text-lg font-bold tracking-wide shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl"
                            onClick={step === 1 ? handleSendOtp : handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </div>
                            ) : (step === 1 ? 'Send Reset Code' : 'Reset Password')}
                        </Button>
                    </>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Password Reset!</h3>
                            <p className="text-gray-600 text-sm">
                                Your passsword has been successfully updated. You can now login with your new credentials.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-bold text-white transition-colors hover:bg-indigo-700"
                            >
                                Continue to Login
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
