'use client';

import React, { useState } from 'react';
import { Camera, Eye, ShieldCheck, Flame, Play, Music, Heart, Sparkles, Send, Volume2, Disc, Lock, Radio, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function FeatureShowcaseSection() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'snaps' | 'stories' | 'music'>('snaps');
  const [playingSong, setPlayingSong] = useState(false);
  const [likedStory, setLikedStory] = useState(false);

  return (
    <section id="stories-snaps-music" className="py-28 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-pink-400" /> Express Yourself Worldwide
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-black tracking-tight text-white mb-6">
            Snaps, Stories & Music Vibe.
          </h2>
          <p className="text-slate-300 text-lg md:text-xl font-light leading-relaxed">
            Dating and matrimony shouldn't be dry resumes. Share authentic daily moments, express your personality through 24h stories, and connect deeply over shared music.
          </p>
        </div>

        {/* Interactive Feature Selector Tabs */}
        <div className="flex justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveTab('snaps')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'snaps'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Camera size={18} />
            <span>⚡ Instant Snaps</span>
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'stories'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 scale-105'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Flame size={18} />
            <span>📸 24h Stories</span>
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'music'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 scale-105'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Music size={18} />
            <span>🎵 Music Vibe Match</span>
          </button>
        </div>

        {/* Main Interactive Showcase Grid */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Feature Highlight Details */}
          <div className="lg:col-span-5 space-y-6">
            {activeTab === 'snaps' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="text-amber-400 font-mono text-xs uppercase tracking-widest block mb-2">Real-Time Moments</span>
                <h3 className="text-3xl font-black text-white mb-4">{t('snapTitle')}</h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  {t('snapDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Eye size={16} />
                    </div>
                    <span>View Once & Ephemeral daily snaps for total authenticity.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <span>Bank-grade screenshot protection and privacy lock.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Camera size={16} />
                    </div>
                    <span>Instant camera icebreakers with verified matches.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="text-pink-400 font-mono text-xs uppercase tracking-widest block mb-2">Daily Life Highlights</span>
                <h3 className="text-3xl font-black text-white mb-4">{t('storiesTitle')}</h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  {t('storiesDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Flame size={16} />
                    </div>
                    <span>Share daily moments, hobbies, travels, and pets.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <span>Reply to any story to start a natural direct chat instantly.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <span>Interactive emoji stickers, polls, and mood tags.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'music' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest block mb-2">Soulmate Harmonies</span>
                <h3 className="text-3xl font-black text-white mb-4">{t('musicTitle')}</h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  {t('musicDesc')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Disc size={16} />
                    </div>
                    <span>Display top Spotify / Apple Music anthems on your profile.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Radio size={16} />
                    </div>
                    <span>Chat Jukebox: Listen to songs together inside private chat.</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Heart size={16} />
                    </div>
                    <span>Music compatibility score calculated by shared taste.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Visual Mockup Screen */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 border border-slate-800 rounded-[3rem] p-4 shadow-2xl ring-1 ring-slate-800/80">

              {/* Top Speaker notch */}
              <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-10 h-1.5 rounded-full bg-slate-800"></div>
              </div>

              {/* Mockup Screen Viewport */}
              <div className="bg-slate-900 rounded-[2.2rem] overflow-hidden min-h-[460px] relative flex flex-col justify-between border border-slate-800">

                {/* SNAP MOCKUP */}
                {activeTab === 'snaps' && (
                  <div className="relative h-full flex flex-col justify-between p-5 min-h-[460px] bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950">
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center gap-2">
                        <img src="/images/avatars/user-2.jpg" alt="Anya - Snap Profile" className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white block">Anya, 26</span>
                          <span className="text-[10px] text-amber-300 font-mono">📍 New York • Snap 2m ago</span>
                        </div>
                      </div>
                      <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Lock size={10} /> View Once
                      </div>
                    </div>

                    <div className="my-auto text-center py-8 relative">
                      <div className="w-44 h-56 mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-2xl relative group">
                        <img src="/images/orbital.jpg" alt="Snap Moment Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <button className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-amber-200 mt-3 font-medium">"Sunday coffee & reading in Central Park ☕📚"</p>
                    </div>

                    <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reply to Anya's Snap..."
                        className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-amber-400"
                        readOnly
                      />
                      <button className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STORIES MOCKUP */}
                {activeTab === 'stories' && (
                  <div className="relative h-full flex flex-col justify-between p-5 min-h-[460px] bg-gradient-to-b from-pink-950/40 via-slate-900 to-slate-950">
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center gap-2">
                        <img src="/images/avatars/user-1.jpg" alt="Priya - Story Profile" className="w-9 h-9 rounded-full border-2 border-pink-500 object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white block">Priya, 25</span>
                          <span className="text-[10px] text-pink-300 font-mono">📍 London • 24h Story</span>
                        </div>
                      </div>
                      <span className="bg-pink-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">LIVE</span>
                    </div>

                    <div className="my-auto text-center py-6 relative">
                      <div className="w-48 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-pink-500/50 shadow-2xl relative">
                        <img src="/images/register-hero-wiki.jpg" alt="Story Feed Preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-xl text-left border border-white/10">
                          <span className="text-[11px] text-white font-semibold block">✈️ Flying back from Paris!</span>
                          <span className="text-[9px] text-pink-300">🎵 Playing: Coldplay - Yellow</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-slate-800">
                      <div className="flex gap-2">
                        {['❤️', '🔥', '😍', '☕'].map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => setLikedStory(true)}
                            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-pink-500/20 border border-slate-800 text-sm flex items-center justify-center transition-all"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setLikedStory(!likedStory)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          likedStory ? 'bg-pink-500 text-white' : 'bg-slate-800 text-pink-400'
                        }`}
                      >
                        <Heart size={14} fill={likedStory ? 'white' : 'none'} />
                        <span>{likedStory ? 'Sent!' : 'React'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MUSIC MOCKUP */}
                {activeTab === 'music' && (
                  <div className="relative h-full flex flex-col justify-between p-5 min-h-[460px] bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950">
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center gap-2">
                        <img src="/images/avatars/user-4.jpg" alt="Kabir - Music Match Profile" className="w-9 h-9 rounded-full border-2 border-cyan-400 object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white block">Kabir & You</span>
                          <span className="text-[10px] text-cyan-300 font-mono">🎧 94% Music Vibe Match</span>
                        </div>
                      </div>
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Volume2 size={10} /> Jukebox
                      </span>
                    </div>

                    <div className="my-auto py-4">
                      {/* Album Art Card */}
                      <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 ${playingSong ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }}>
                            <Disc size={32} />
                          </div>
                          <div>
                            <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Shared Anthem</span>
                            <h4 className="text-base font-black text-white">Kesariya (Arijit Singh)</h4>
                            <p className="text-xs text-slate-400">Top 1 on Kabir's Spotify</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-4">
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-500 ${playingSong ? 'w-3/4' : 'w-1/4'}`}></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-mono text-slate-500">
                            <span>{playingSong ? '2:14' : '0:45'}</span>
                            <span>4:28</span>
                          </div>
                        </div>

                        {/* Player Control Buttons */}
                        <button
                          onClick={() => setPlayingSong(!playingSong)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                        >
                          <Play size={14} fill="white" />
                          <span>{playingSong ? 'Pause Chat Jukebox' : 'Listen Together in Chat'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3 text-center">
                      <span className="text-[11px] text-cyan-200 font-medium">
                        ✨ "You both love Arijit Singh, Coldplay & AR Rahman!"
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
