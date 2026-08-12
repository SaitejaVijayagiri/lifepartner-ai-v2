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

        {/* 2. WOMEN-FIRST SAFETY & TRUST SHIELD (Special Priority) */}
        <div className="bg-gradient-to-br from-pink-900 via-purple-900 to-slate-950 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl mb-16 relative overflow-hidden border border-pink-500/20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck size={14} className="text-pink-400" /> Women-First Safety & Privacy Pledge
            </div>
            <h3 className="text-3xl md:text-5xl font-heading font-black tracking-tight mb-4">
              Built for Women's Peace of Mind. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-purple-300">
                100% Control, Privacy & Verified Respect.
              </span>
            </h3>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 font-light">
              We prioritize women's safety first. With zero creep tolerance, screenshot-protected photo snaps, photo blur options, and AI facial verification, women feel confident and empowered to find genuine love.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-pink-500/20 p-4 rounded-2xl">
                <Lock className="text-pink-400 mb-2" size={22} />
                <h5 className="font-bold text-sm text-white mb-1">Message Control</h5>
                <p className="text-xs text-slate-400">Women decide who can connect or start a chat.</p>
              </div>
              <div className="bg-slate-900/80 border border-pink-500/20 p-4 rounded-2xl">
                <UserCheck className="text-purple-400 mb-2" size={22} />
                <h5 className="font-bold text-sm text-white mb-1">100% ID Verified</h5>
                <p className="text-xs text-slate-400">Strict AI identity checks eliminate fake profiles & bots.</p>
              </div>
              <div className="bg-slate-900/80 border border-pink-500/20 p-4 rounded-2xl">
                <Camera className="text-amber-400 mb-2" size={22} />
                <h5 className="font-bold text-sm text-white mb-1">Screenshot-Proof</h5>
                <p className="text-xs text-slate-400">Watermarked View-Once snaps prevent saving.</p>
              </div>
              <div className="bg-slate-900/80 border border-pink-500/20 p-4 rounded-2xl">
                <ShieldAlert className="text-green-400 mb-2" size={22} />
                <h5 className="font-bold text-sm text-white mb-1">One-Tap Safety</h5>
                <p className="text-xs text-slate-400">Instant safety overlay & date protection tools.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Visual 3-Fact Infographic Cards */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-3">
            Why Everyone Worldwide Chooses Us
          </h2>
          <h3 className="text-3xl md:text-4xl font-heading font-black text-gray-900 dark:text-gray-100">
            Dating & Matrimony Made 100% Free & Transparent.
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Card 1: 100% Free */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Zero Subscription Fees
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              100% Free Direct Chat
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Unlike traditional matrimony and dating apps that charge $30/month just to send a message, LifePartner AI lets you register, match, and chat instantly with zero paywalls.
            </p>
          </div>

          {/* Card 2: Snaps, Stories & Music */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Camera size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Authentic Vibes
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Snaps, Stories & Music
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Get to know the real person! View daily photo snaps, 24-hour video stories, and listen to shared Spotify song anthems before deciding to meet.
            </p>
          </div>

          {/* Card 3: AI Compatibility & Real Humans */}
          <div className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-200/80 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full mb-3 inline-block">
              Anti-Catfish Security
            </span>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              AI Verification & Safe Match
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Bank-grade identity verification ensures you only talk to real, verified human singles. AI semantic matching introduces soulmates aligned with your values.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
