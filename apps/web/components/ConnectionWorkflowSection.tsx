'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Camera, Heart, ShieldCheck, Sparkles, MessageCircle, Video, Music, CheckCircle2, Globe2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ConnectionWorkflowSection() {
  const { t } = useLanguage();

  const steps = [
    {
      stepNumber: '01',
      title: t('step1Title'),
      desc: t('step1Desc'),
      icon: <Bot className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      badge: 'AI Discovery',
      accentColor: 'from-indigo-500 to-purple-600',
    },
    {
      stepNumber: '02',
      title: t('step2Title'),
      desc: t('step2Desc'),
      icon: <Camera className="w-7 h-7 text-pink-600 dark:text-pink-400" />,
      badge: 'Vibe Check',
      accentColor: 'from-pink-500 to-rose-600',
    },
    {
      stepNumber: '03',
      title: t('step3Title'),
      desc: t('step3Desc'),
      icon: <MessageCircle className="w-7 h-7 text-green-600 dark:text-green-400" />,
      badge: 'Zero Paywall Chat',
      accentColor: 'from-green-500 to-emerald-600',
    },
    {
      stepNumber: '04',
      title: t('step4Title'),
      desc: t('step4Desc'),
      icon: <Heart className="w-7 h-7 text-rose-600 dark:text-rose-400" />,
      badge: 'Lifelong Union',
      accentColor: 'from-rose-500 to-red-600',
    },
  ];

  return (
    <section id="how-life-partner-connects" className="py-28 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 dark:bg-indigo-950/30 rounded-full filter blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-50 dark:bg-pink-950/30 rounded-full filter blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Globe2 size={14} className="text-indigo-600" />
            <span>{t('connectTitle')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-gray-900 dark:text-gray-100 mb-6">
            How Life Partners Get Connected Easily.
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-light">
            {t('connectSub')}
          </p>
        </div>

        {/* 4 Step Workflow Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 relative group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Step Number Ribbon */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-4xl font-black text-gray-300 dark:text-gray-700 font-mono tracking-tighter">
                  {s.stepNumber}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white bg-gradient-to-r ${s.accentColor} shadow-sm`}>
                  {s.badge}
                </span>
              </div>

              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>

              {/* Bottom Decorative Indicator */}
              <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1.5">
                <CheckCircle2 size={14} />
                <span>Verified Seamless Step</span>
              </div>
            </div>
          ))}
        </div>

        {/* Worldwide Reach Highlight Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-indigo-800/50">
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-pink-300 uppercase tracking-widest mb-3">
                <Globe2 size={14} /> Global Matchmaking Network
              </span>
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                Connecting Singles in 190+ Countries.
              </h3>
              <p className="text-indigo-200 text-base leading-relaxed max-w-2xl font-light">
                Whether you are seeking NRI matrimony in the USA, UK, Canada, Australia, Europe, or local dating in India, LifePartner AI breaks language barriers and geographic borders to bring true love home.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link href="/register?new=true">
                <button className="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-black text-base hover:bg-slate-100 hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                  <span>Connect Worldwide Free</span>
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
