'use client';

import React from 'react';
import { Globe, ShieldCheck, HeartHandshake, Sparkles, Camera, Music, Zap, CheckCircle2, MessageCircle, Lock, ShieldAlert, UserCheck, Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function GlobalOverviewBanner() {
  const { t } = useLanguage();

  const countries = [
    { flag: '🇺🇸', name: 'USA' },
    { flag: '🇬🇧', name: 'United Kingdom' },
    { flag: '🇨🇦', name: 'Canada' },
    { flag: '🇦🇺', name: 'Australia' },
    { flag: '🇮🇳', name: 'India (NRI & Local)' },
    { flag: '🇪🇺', name: 'Europe' },
    { flag: '🇦🇪', name: 'UAE & Gulf' },
    { flag: '🇧🇷', name: 'Brazil' },
    { flag: '🇯🇵', name: 'Japan' },
    { flag: '🇨🇳', name: 'China' },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6">

        {/* 1. Global Reach Live Ticker */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-200/80 dark:border-gray-800 mb-12 ring-1 ring-gray-100 dark:ring-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Globe size={18} />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Global Reach: 190+ Countries Supported
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
              <Sparkles size={13} />
              <span>Multi-Language Switcher Available (11 Languages)</span>
            </div>
          </div>

          {/* Marquee Flags list */}
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-2 scroll-smooth">
            {countries.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 shrink-0 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-indigo-300 transition-colors">
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
              </div>
            ))}
            <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0 text-xs font-black uppercase tracking-wider shadow-sm">
              + 180 More Countries
            </div>
          </div>
        </div>

        {/* 3. Visual 3-Fact Infographic Cards */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-3">
            Why Women &amp; Serious Families Trust Us
          </h2>
          <h3 className="text-3xl md:text-4xl font-heading font-black text-gray-900 dark:text-gray-100">
            Matrimony &amp; Matchmaking Built on Privacy.
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Card 1: Free Mutual-Match Chat & Zero Spam */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Zero Telemarketers
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Free Mutual-Match Chat
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Unlike legacy portals that paywall every reply or sell your contact info to sales call centers, LifePartner AI lets mutual matches chat and call safely inside the app.
            </p>
          </div>

          {/* Card 2: Blurred Photos & Family-Safe Biodata */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Consent-First Photos
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Photo Blur &amp; Family Biodata
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Keep your profile photos blurred until an interest is accepted, share view-once snaps in chat, and create read-only Family Biodata links for parents to review.
            </p>
          </div>

          {/* Card 3: Selfie & Govt ID Verification */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Anti-Catfish &amp; Scam Shield
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Govt ID &amp; Selfie Verification
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Basic email OTP confirmation is never shown as Govt ID Verified. Filter specifically for ID-verified profiles backed by anti-spoof screening and repeat-report auto-quarantine.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
