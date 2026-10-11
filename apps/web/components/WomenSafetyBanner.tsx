'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, ShieldCheck, Lock, Sparkles, ArrowRight, EyeOff, MessageCircle, Heart, Star, CheckCircle } from 'lucide-react';

export default function WomenSafetyBanner() {
  const safetyFeatures = [
    {
      icon: <Crown className="text-amber-400 fill-amber-400/20" size={22} />,
      title: "100% Free Lifetime VIP",
      desc: "Every woman receives unlimited direct messaging, audio notes, and HD video calls with zero subscriptions forever."
    },
    {
      icon: <ShieldCheck className="text-pink-400" size={22} />,
      title: "AI Anti-Creep Shield",
      desc: "Intelligent real-time filtering actively blocks unsolicited numbers, external links, and inappropriate harassment."
    },
    {
      icon: <Lock className="text-purple-400" size={22} />,
      title: "Screenshot-Proof Snaps",
      desc: "Disappearing ephemeral photos vanish after viewing and actively block screenshots to safeguard your privacy."
    },
    {
      icon: <EyeOff className="text-indigo-400" size={22} />,
      title: "Ghost Mode & Blur Control",
      desc: "Hide your profile from contacts and relatives, or keep photos blurred until you approve a suitor's request."
    }
  ];

  return (
    <section id="women-safety-first" className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 text-white border-y border-pink-900/30">
      {/* Decorative ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Pill & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
            <Crown size={14} className="text-amber-400 fill-amber-400" />
            <span>Women-First Safety Standard</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mb-4">
            Built for Women. <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-purple-400">Zero Creeps. 100% Free VIP.</span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Online dating and matrimony shouldn't be an exhausting hurdle of unsolicited messages or forced paywalls. On LifePartner AI, women are protected, cherished, and empowered with complete privacy control.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {safetyFeatures.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900/80 backdrop-blur-xl border border-pink-500/20 hover:border-pink-500/50 p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                <p className="text-slate-300 text-xs leading-relaxed font-light">{f.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-pink-400">
                <CheckCircle size={13} />
                <span>Guaranteed for All Women</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Conversion Box */}
        <div className="bg-gradient-to-r from-pink-900/30 via-purple-900/30 to-indigo-900/30 border border-pink-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="currentColor" />
              ))}
              <span className="text-xs font-bold text-slate-200 ml-2">Rated 4.9/5 by 40,000+ Women</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-white">
              Ready to meet verified gentlemen safely?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Create your account in 10 seconds. Select Female to automatically unlock Lifetime Queen VIP privileges.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Link href="/register?new=true&gender=Female" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black text-sm hover:opacity-95 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer">
                <span>Join Free as Female 👑</span>
                <ArrowRight size={16} />
              </button>
            </Link>

            <Link href="/for-women" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Safety Guide & FAQ</span>
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
