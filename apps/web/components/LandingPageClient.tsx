'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowRight, Bot, Video, Heart, Shield, Sparkles, Smartphone, Users, Play, Star, CheckCircle, Zap, BrainCircuit, Fingerprint, MessageCircle, ShieldCheck, Lock, Award, Gift, MapPin, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import AnimatedSearchSection from '@/components/AnimatedSearchSection';
import PublicMatchCard from '@/components/PublicMatchCard';
import SocialProofToasts from '@/components/SocialProofToasts';
import { api } from '@/lib/api';

export default function LandingPageClient() {
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    setIsLoggedIn(!!(token && userId));

    // Fetch public featured profiles for the marquee
    const fetchProfiles = async () => {
      try {
        const res = await api.profile.getPublicFeatured();
        if (res.success && res.profiles) {
          setFeaturedProfiles(res.profiles);
        }
      } catch (err) {
        console.error("Failed to fetch featured profiles", err);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 relative scroll-smooth">

      {/* Noise Texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate;
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .glass-card:hover {
            background: rgba(255, 255, 255, 0.85);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <Navbar />
      <WhatsAppFloat />
      <SocialProofToasts />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 lg:pt-44 pb-20 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        {/* Pastel Aurora Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50 dark:bg-gray-900">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
          <div className="absolute top-[10%] right-[-20%] w-[50%] h-[50%] bg-indigo-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-pink-200/50 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          <div className="text-left relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-indigo-700 text-xs font-bold mb-8 shadow-sm backdrop-blur-md uppercase tracking-widest hover:shadow-md transition-all cursor-default">
              <Sparkles size={12} className="text-indigo-500" />
              <span>Next-Gen Matchmaking</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter text-gray-900 dark:text-gray-100 mb-6 lg:mb-8 leading-[0.95]">
              Find Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-pulse-slow">
                Forever.
              </span>
              <br />
              <span className="text-2xl md:text-3xl font-sans font-bold text-gray-400 dark:text-gray-500 tracking-normal block mt-4">
                100% Free. Zero Fees.
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mb-12 leading-relaxed font-light">
              Experience the future of matrimony & dating. Our <span className="font-semibold text-indigo-700">AI-driven algorithm</span> connects you with compatible partners based on deep personality insights, values, and life goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/register">
                <button className="relative h-14 px-10 rounded-full bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 overflow-hidden group">
                  <span className="relative flex items-center gap-2">Join the Future <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                </button>
              </Link>
              <Link href="#app-features">
                <button className="h-14 px-10 rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 font-bold text-lg hover:bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:border-gray-700 transition-all shadow-sm hover:shadow-md">
                  Explore Features
                </button>
              </Link>
            </div>

            <div className="mt-16 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[
                  "/images/avatars/user-1.jpg",
                  "/images/avatars/user-2.jpg",
                  "/images/avatars/user-3.jpg",
                  "/images/avatars/user-4.jpg"
                ].map((src, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-gray-200 flex items-center justify-center overflow-hidden hover:z-10 hover:scale-110 transition-transform duration-300">
                    <img src={src} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  +2k
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex text-yellow-500 mb-1 gap-0.5"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">TrustScore 4.9/5</span>
              </div>
            </div>
          </div>

          {/* ORBITAL HERO VISUAL */}
          <div className="relative h-[700px] w-full flex items-center justify-center hidden lg:flex perspective-1000">
            {/* Central Core */}
            <div className="w-64 h-64 bg-indigo-200/40 rounded-full blur-[60px] absolute animate-pulse"></div>

            <div className="w-80 h-80 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center relative z-20 p-3 ring-1 ring-white/60 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden relative group border-4 border-white">
                <NextImage
                  src="/images/orbital.jpg"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt="Matched Profile"
                  priority
                />

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max">
                  <div className="bg-white/90 backdrop-blur-md border border-white/50 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                    <span className="text-pink-500 animate-pulse">❤️</span> 98% Compatible
                  </div>
                </div>
              </div>
            </div>

            {/* Orbit Rings */}
            <div className="absolute w-[500px] h-[500px] border border-gray-200 dark:border-gray-800/80 rounded-full animate-[spin_40s_linear_infinite]">
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-lg border-2 border-white"></div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center animate-[spin_30s_linear_infinite]">
              <div className="absolute w-16 h-16 bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center text-pink-500 shadow-xl border border-pink-100" style={{ transform: 'translate(260px) rotate(-90deg)' }}>
                <Heart fill="currentColor" size={24} className="opacity-80" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center animate-[spin_35s_linear_infinite_reverse]">
              <div className="absolute w-16 h-16 bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center text-indigo-500 shadow-xl border border-indigo-100" style={{ transform: 'translate(320px) rotate(10deg)' }}>
                <Bot size={28} />
              </div>
              <div className="absolute w-16 h-16 bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center text-green-500 shadow-xl border border-green-100" style={{ transform: 'translate(-320px) rotate(-10deg)' }}>
                <Video size={28} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- AI MATCHMAKER DEMO SECTION --- */}
      <AnimatedSearchSection />

      {/* --- INFINITE MARQUEE --- */}
      <section className="py-12 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 relative overflow-hidden z-20">
        <div className="absolute inset-y-0 left-0 w-4 sm:w-16 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-4 sm:w-16 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none"></div>
        
        {/* We have two different scrolling blocks here: One for text tags and the new one for Public Profiles! */}
        
        {/* Tag Marquee */}
        <div className="flex w-[200%] animate-scroll mb-10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-shrink-0 mx-12 flex items-center gap-4 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-sm hover:text-indigo-600 transition-colors cursor-default">
              <ShieldCheck size={18} /> Secure • Verified • Honest •
            </div>
          ))}
        </div>

        {/* Profiles Marquee */}
        {featuredProfiles.length > 0 && (
          <div className="w-full relative overflow-hidden py-4">

              
              <div 
                className="animate-scroll-cards"
                style={{ 
                  '--card-count': featuredProfiles.length,
                  animation: `scrollCards ${Math.max(20, featuredProfiles.length * 6)}s linear infinite`
                } as React.CSSProperties}
              >
                {/* Duplicate the list for seamless continuous loop */}
                {[...featuredProfiles, ...featuredProfiles.map(p => ({...p, id: p.id+"_dup"}))].map((profile, i) => (
                  <PublicMatchCard key={`${profile.id}_${i}`} match={profile} />
                ))}
              </div>
          </div>
        )}
      </section>

      {/* --- MEET THE FOUNDER / TRUST SECTION --- */}
      <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-6">
              <Zap size={14} /> Founder's Message
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-gray-100 mb-6">Matches made by AI.<br />Verified by Humans.</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              "Hi, I'm Saiteja. I built LifePartner AI because I was tired of matrimony sites filled with fake profiles and expensive paywalls.
              My mission is simple: <b>Zero fake profiles. Zero cost.</b>"
            </p>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><MessageCircle size={80} className="text-indigo-600" /></div>
              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Star size={18} className="text-amber-500 fill-amber-500" /> Direct Concierge Service</h4>
              <p className="text-indigo-800 text-sm mb-4 font-medium">
                We are building a community of genuine singles.
                <b>Want your profile to be the first profile seen by thousands?</b>
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-indigo-900 font-bold">
                  <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-950 flex items-center justify-center shadow-sm">📧</span>
                  <img src="mailto:lifepartnerai.in@gmail.com" className="hidden" /> {/* SEO hidden mailto */}
                  lifepartnerai.in@gmail.com
                </div>
              </div>
              <p className="text-xs text-indigo-500 mt-4 italic">Send me your details directly. I will personally verify and list your profile.</p>
              <div className="mt-6 pt-4 border-t border-indigo-200/50">
                <p className="text-sm font-bold text-indigo-800 mb-1">🚀 Join the Revolution</p>
                <p className="text-xs text-indigo-600">Passionate about changing the matrimony landscape? <b>We are hiring.</b> Drop your resume to the email or WhatsApp above.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/about">
                <button className="px-8 py-3 rounded-full bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl">
                  Read Our Story
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* --- FEATURES GRID --- */}
      <section id="app-features" className="py-32 relative bg-slate-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-indigo-600 font-bold tracking-[0.2em] uppercase text-xs mb-6">The Future of Dating</h2>
            <h3 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 dark:text-gray-100 mb-6">Upgrade Your Love Life.</h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-lg">Leave the swipe fatigue behind using our advanced AI tools designed for meaningful, long-term connections.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot size={32} className="text-indigo-600" />}
              title="AI Wingman"
              desc="Smart icebreakers and conversation starters generated by context-aware AI based on shared interests."
            />
            <FeatureCard
              icon={<MapPin size={32} className="text-pink-600" />}
              title="Interactive Live Map"
              desc="Discover nearby matches organically. See real-time activity and send icebreakers based on nearby locations."
            />
            <FeatureCard
              icon={<Video size={32} className="text-green-600" />}
              title="HD Video Calls"
              desc="Crystal clear, low-latency video calls built directly into the platform for safe virtual dates."
            />
            <FeatureCard
              icon={<Sparkles size={32} className="text-amber-500" />}
              title="Cosmic Matching"
              desc="Vedic astrology, numerology and psychometrics combined for deep compatibility analysis."
            />
            <FeatureCard
              icon={<Shield size={32} className="text-blue-500" />}
              title="Anti-Catfish"
              desc="Bank-grade AI identity verification ensures you only talk to real, verified humans."
            />
            <FeatureCard
              icon={<Zap size={32} className="text-yellow-500" />}
              title="Live Speed Dating"
              desc="Drop into anonymous 3-minute virtual dates. If the vibe matches, unlock their profile. If not, instantly skip!"
            />
          </div>
        </div>
      </section>

      {/* --- MEET SPOTS SECTION --- */}
      <section id="meet-spots" className="py-24 bg-indigo-900 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full filter blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-[-100px] w-[500px] h-[500px] bg-indigo-500/20 rounded-full filter blur-[100px] mix-blend-screen pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left text-white">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                <MapPin size={14} className="text-pink-400" /> In Real Life
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 leading-tight">
                Take it offline with <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Meet Spots</span>
              </h2>
              <p className="text-lg text-indigo-100/80 mb-8 leading-relaxed font-light">
                Tired of endless chatting? Skip the small talk and connect organically at curated local events. From pottery classes to group hikes, discover safe, verified meetups happening near you.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <MapPin className="text-pink-400" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">Discover Local Events</h4>
                    <p className="text-sm text-indigo-200/70">Find events sorted by distance or date. See exactly what's happening in your city today.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <Users className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">See Who's Going</h4>
                    <p className="text-sm text-indigo-200/70">Check the RSVP list before you go. Match with attendees before the event even starts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <ShieldCheck className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">Safe & Verified</h4>
                    <p className="text-sm text-indigo-200/70">Host or attend events with peace of mind. Only verified profiles can RSVP to exclusive spots.</p>
                  </div>
                </div>
              </div>

              <Link href={isLoggedIn ? '/dashboard?tab=events' : '/register'}>
                <button className="px-8 py-4 rounded-full bg-white text-indigo-900 font-bold hover:bg-gray-100 transition-all shadow-xl hover:scale-105 flex items-center gap-2">
                  <MapPin size={18} />
                  {isLoggedIn ? 'View Events Near You' : 'Explore Events Near You'}
                </button>
              </Link>
            </div>
            
            {/* Real-design Event Cards Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-3xl transform rotate-3 scale-105 opacity-30 blur-lg"></div>
              <div className="relative z-10 space-y-4">

                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={15} className="text-indigo-500" /> Happening Near You
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">3 Events</span>
                </div>

                {/* Card 1 — Coffee Meetup */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative">
                  {/* Gradient Banner */}
                  <div className="h-28 bg-gradient-to-br from-amber-400 to-orange-400 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,rgba(255,255,255,.8) 1px,transparent 0)', backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                        ☕ Coffee Meetup
                      </div>
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                        <Zap size={10} className="fill-yellow-400 text-yellow-400" /> 2h away
                      </div>
                    </div>
                  </div>
                  {/* Overlapping Avatar */}
                  <div className="absolute top-[4.5rem] left-5 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full scale-110 shadow-sm" />
                      <img src="/images/avatars/user-1.jpg" alt="Host"
                        className="relative w-14 h-14 rounded-full border-2 border-white dark:border-gray-900 object-cover shadow-md bg-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-fallback.svg'; }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="pt-10 p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Weekend Coffee Mingle</h3>
                    <p className="text-[11px] font-medium text-gray-500 mb-3">Hosted by <span className="font-bold text-gray-700 dark:text-gray-300">Priya S.</span></p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-3 space-y-2 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-[12px] text-gray-700 dark:text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Calendar size={10} className="text-indigo-600" /></div>
                        <span className="font-semibold">Sat, May 3 • 11:00 AM</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-700 dark:text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0"><MapPin size={10} className="text-rose-600" /></div>
                        <span className="font-medium">Starbucks, Banjara Hills</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Users size={10} className="text-blue-600" /></div>
                        <span>1.2 km away</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-[11px] font-bold text-gray-600">
                        <Users size={11} className="text-indigo-500" /> 8/15 Attending
                      </span>
                      <button className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:brightness-110 transition-all">
                        Join Now
                      </button>
                    </div>
                    <div className="flex items-center gap-1 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Share
                      </button>
                      <div className="w-px h-5 bg-gray-200" />
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors">
                        <Calendar size={13} /> Calendar
                      </button>
                      <div className="w-px h-5 bg-gray-200" />
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <MapPin size={13} /> Directions
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2 — Speed Dating (smaller/preview) */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-md opacity-90 flex flex-col relative">
                  <div className="h-20 bg-gradient-to-br from-rose-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,rgba(255,255,255,.8) 1px,transparent 0)', backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                        ⚡ Speed Dating
                      </div>
                      <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                        <Zap size={10} className="fill-yellow-400 text-yellow-400" /> Tomorrow
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-[3.5rem] left-5 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full scale-110 shadow-sm" />
                      <img src="/images/avatars/user-3.jpg" alt="Host"
                        className="relative w-12 h-12 rounded-full border-2 border-white object-cover shadow-md bg-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-fallback.svg'; }} />
                    </div>
                  </div>
                  <div className="pt-8 px-5 pb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Singles Speed Date Night</h3>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><MapPin size={10} /> The Skybar, Jubilee Hills • 3.8 km</p>
                    </div>
                    <button className="shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md">
                      Join
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SUCCESS STORIES --- */}
      <section id="success-stories" className="py-24 bg-white dark:bg-gray-950 relative border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider mb-4">Real Love</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 dark:text-gray-100 mb-4">Success Stories</h2>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 max-w-2xl mx-auto">See how AI helped these couples find their perfect match.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StoryCard
              image="/images/story-1.jpg"
              names="Priya & Rahul"
              story="We matched instantly! The AI suggested we both loved hiking and classical music. 6 months later, we're engaged!"
            />
            <StoryCard
              image="/images/register-hero-wiki.jpg"
              names="Sarah & James"
              story="I was skeptical about AI, but LifePartner's interactive map showed me James was grabbing coffee just down the street! Best decision ever."
            />
            <StoryCard
              image="/images/orbital.jpg"
              names="Anjali & Vikram"
              story="The compatibility score was spot on. Our families clicked immediately, and now we are planning our dream wedding."
            />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 dark:text-gray-100">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <StepCard step="01" title="Create Profile" desc="Sign up and build your smart biodata with AI assistance." />
            <StepCard step="02" title="AI Verification" desc="We verify your identity to ensure a safe community." />
            <StepCard step="03" title="Get Matched" desc="Receive daily curated matches based on your preferences." />
            <StepCard step="04" title="Connect" desc="Chat, video call, and meet your future partner." />
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-32 relative overflow-hidden px-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-[3rem] relative overflow-hidden shadow-2xl">
          {/* Background Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full filter blur-[100px]"></div>

          <div className="text-center py-20 px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">Ready to find <br />the one?</h2>
            <p className="text-indigo-200 text-xl mb-12 max-w-2xl mx-auto">Join the exclusive community of singles who value meaningful connections over mindless swiping.</p>

            <Link href="/register">
              <button className="group relative px-12 py-6 rounded-full bg-white dark:bg-gray-950 text-indigo-900 font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                <span className="relative z-10">Create Free Account</span>
              </button>
            </Link>
            <p className="mt-8 text-sm text-indigo-300 font-medium tracking-wide uppercase">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="glass-card p-10 rounded-[2rem] transition-all duration-500 group cursor-pointer bg-white dark:bg-gray-950 relative overflow-hidden hover:shadow-xl border border-gray-100 dark:border-gray-800">
      <div className="absolute top-0 left-0 w-1.5 h-0 bg-gradient-to-b from-indigo-500 to-purple-500 group-hover:h-full transition-all duration-500"></div>
      <div className="mb-8 p-5 rounded-2xl bg-indigo-50 w-fit group-hover:bg-white dark:bg-gray-950 group-hover:shadow-md transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  )
}

function StoryCard({ image, names, story }: { image: string, names: string, story: string }) {
  return (
    <div className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
      <div className="h-80 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
        <img src={image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={names} />
        <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
          <h3 className="text-2xl font-heading font-bold mb-2">{names}</h3>
          <p className="text-sm text-gray-200 italic">"{story}"</p>
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div className="text-center p-6 rounded-3xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2">
      <div className="text-6xl font-black text-indigo-100 mb-4">{step}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{desc}</p>
    </div>
  )
}

function PricingCard({ title, price, features, isPopular }: { title: string, price: string, features: string[], isPopular?: boolean }) {
  return (
    <div className={`p-8 rounded-[2rem] border ${isPopular ? 'border-amber-400 bg-white dark:bg-gray-950 ring-4 ring-amber-100 shadow-xl scale-105' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg'} relative flex flex-col`}>
      {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-md">Most Popular</div>}
      <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">{title}</h3>
      <div className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-8">{price}</div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
            <CheckCircle size={16} className={`flex-shrink-0 ${isPopular ? 'text-amber-500' : 'text-indigo-500'}`} /> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-xl font-bold transition-all ${isPopular ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-amber-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200'}`}>
        Choose {title}
      </button>
    </div>
  )
}
