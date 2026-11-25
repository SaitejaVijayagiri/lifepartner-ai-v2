'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Shield, Heart, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { startGoogleOAuthFlow } from '@/lib/notifications';

export default function NativeAppGate() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        // Authenticated native user -> straight to dashboard!
        window.location.replace('/dashboard');
        return;
      }
    } catch (_) {}

    // Not authenticated -> show the clean mobile app welcome screen
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
            <Heart size={40} className="text-white fill-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-black shadow-md">
            ⭐
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight text-white mb-1">LifePartner AI</h2>
        <div className="text-xs text-indigo-300 font-bold mb-2.5 tracking-wide">lifepartnerai.in</div>
        <div className="flex items-center gap-2 text-xs text-purple-300/80">
          <div className="w-3.5 h-3.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
          <span>Starting application...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 text-white flex flex-col justify-between overflow-y-auto px-5 py-6 sm:py-8 safe-area-inset">
      {/* Top Header / App Brand */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Heart size={22} className="text-white fill-white" />
          </div>
          <div>
            <span className="font-heading font-black text-lg tracking-tight bg-gradient-to-r from-pink-200 via-white to-purple-200 bg-clip-text text-transparent">
              LifePartner <span className="text-pink-400">AI</span>
            </span>
            <div className="text-[10px] text-purple-300/80 font-semibold tracking-wider uppercase">lifepartnerai.in • Official App</div>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-bold text-purple-200 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <LogIn size={13} />
          <span>Sign In</span>
        </Link>
      </div>

      {/* Middle Hero Visual & Value Props */}
      <div className="my-auto py-8 text-center max-w-sm mx-auto space-y-6">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-pink-300 text-xs font-bold shadow-inner">
          <Sparkles size={14} />
          <span>100% Free Forever • Zero Paywalls</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight leading-tight text-white">
          Find Your Soulmate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300">
            On Your Terms
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed font-light">
          Connect with verified singles worldwide. Unlimited direct chat, voice notes, HD video calls, and screenshot-protected photos.
        </p>

        {/* 3 Pillars */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 text-left">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-base mb-1">💬</div>
            <div className="text-[11px] font-bold text-white leading-tight">Free Chat</div>
            <div className="text-[9px] text-purple-300/70">No paywalls</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-base mb-1">🛡️</div>
            <div className="text-[11px] font-bold text-white leading-tight">Women First</div>
            <div className="text-[9px] text-purple-300/70">Anti-creep shield</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-base mb-1">⭐</div>
            <div className="text-[11px] font-bold text-white leading-tight">Selfie Check</div>
            <div className="text-[9px] text-purple-300/70">Selfie verified</div>
          </div>
        </div>
      </div>

      {/* Bottom Auth Actions */}
      <div className="space-y-3 max-w-sm mx-auto w-full pb-2">
        {/* Primary: Create Account */}
        <button
          onClick={() => router.push('/register')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-sm hover:opacity-95 active:scale-95 transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus size={18} />
          <span>Create Free Account</span>
          <ArrowRight size={16} />
        </button>

        {/* Secondary: Google One-Tap Sign In */}
        <button
          onClick={() => startGoogleOAuthFlow()}
          className="w-full py-3.5 rounded-2xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Existing User Link */}
        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-xs text-purple-200 hover:text-white font-semibold underline underline-offset-4"
          >
            I already have an account • Sign In
          </Link>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-center text-purple-300/60 pt-2 leading-relaxed">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
