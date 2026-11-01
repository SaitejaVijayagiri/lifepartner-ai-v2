import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Crown, Lock, Users, Globe2, ArrowRight, CheckCircle2, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Matrimony | #1 Free Verified Matrimony & Matchmaking Worldwide',
  description: 'Find 100% verified brides and grooms globally. 100% Free registration, direct chat, AI compatibility matching, Vedic Kundali Milan, and Women-First privacy protection across India, USA, UK, Canada, Australia, UAE & worldwide.',
  keywords: [
    'free matrimony app',
    'verified matrimony profiles',
    'matrimony app without payment',
    'safe matrimony for women',
    'nri matrimony usa uk canada australia',
    'free matrimony chat',
    'kundali matching free',
    'jeevansathi alternative',
    'shaadi alternative',
    'bharat matrimony alternative free'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/matrimony',
  },
  openGraph: {
    title: 'LifePartner AI Matrimony | #1 Free Verified Matrimony Worldwide',
    description: 'Find verified brides and grooms globally with zero subscription paywalls, direct chat, and Women-First safety.',
    url: 'https://lifepartnerai.in/matrimony',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
  }
};

const POPULAR_LOCATIONS = [
  { name: 'London NRI Matrimony', slug: 'london' },
  { name: 'New York Matrimony', slug: 'new-york' },
  { name: 'Toronto NRI Matrimony', slug: 'toronto' },
  { name: 'Sydney Matrimony', slug: 'sydney' },
  { name: 'Dubai NRI Matrimony', slug: 'dubai' },
  { name: 'Singapore Matrimony', slug: 'singapore' },
  { name: 'Bangalore Matrimony', slug: 'bangalore' },
  { name: 'Hyderabad Matrimony', slug: 'hyderabad' },
  { name: 'Mumbai Matrimony', slug: 'mumbai' },
  { name: 'Delhi Matrimony', slug: 'delhi' },
  { name: 'Chennai Matrimony', slug: 'chennai' },
  { name: 'Pune Matrimony', slug: 'pune' },
];

const POPULAR_COMMUNITIES = [
  { name: 'Brahmin Matrimony', slug: 'brahmin' },
  { name: 'Reddy Matrimony', slug: 'reddy' },
  { name: 'Kamma Matrimony', slug: 'kamma' },
  { name: 'Kapu Matrimony', slug: 'kapu' },
  { name: 'Iyer Matrimony', slug: 'iyer' },
  { name: 'Iyengar Matrimony', slug: 'iyengar' },
  { name: 'Nair Matrimony', slug: 'nair' },
  { name: 'Ezhava Matrimony', slug: 'ezhava' },
  { name: 'Sikh Jat Matrimony', slug: 'sikh-jat' },
  { name: 'Maratha Matrimony', slug: 'maratha' },
  { name: 'Rajput Matrimony', slug: 'rajput' },
  { name: 'Aggarwal Matrimony', slug: 'aggarwal' },
];

const POPULAR_PROFESSIONS = [
  { name: 'Software Engineer Matrimony', slug: 'software-engineer' },
  { name: 'Doctor Matrimony', slug: 'doctor' },
  { name: 'Chartered Accountant Matrimony', slug: 'chartered-accountant' },
  { name: 'IAS / IPS Matrimony', slug: 'ias-ips' },
  { name: 'Business Owner Matrimony', slug: 'business-owner' },
  { name: 'Lawyer Matrimony', slug: 'lawyer' },
  { name: 'Civil Engineer Matrimony', slug: 'civil-engineer' },
  { name: 'Professor Matrimony', slug: 'professor' },
];

const POPULAR_INTENTS = [
  { name: '100% Free Matrimony Chat Without Payment', slug: 'free-matrimony-chat-without-payment' },
  { name: 'Safe Matrimony for Women', slug: 'safe-matrimony-for-women' },
  { name: 'NRI Matrimony USA, UK, Canada', slug: 'nri-matrimony-chat' },
  { name: 'Matrimony for Working & Career Women', slug: 'matrimony-for-working-women' },
  { name: 'Free Kundali Matching Online (36 Gunas)', slug: 'free-kundali-matching-online' },
  { name: 'Matrimony App Without Forced Subscription', slug: 'matrimony-app-without-subscription' },
];

export default function MatrimonyHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Matrimony',
    'description': 'The world\'s #1 AI-powered 100% free matrimony platform connecting verified brides and grooms globally.',
    'url': 'https://lifepartnerai.in/matrimony',
    'areaServed': 'Worldwide',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Matrimony Registration & Direct Chat'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold mb-6">
            <Crown size={14} className="text-rose-600 dark:text-rose-400" />
            <span>100% Free Worldwide Matrimony • No Subscription Paywalls</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Meet Verified Life Partners <br />
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              Without Paying Expensive Broker Fees
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Connect directly with verified brides, grooms, and singles for marriage across India, USA, UK, Canada, Australia, UAE, and 50+ countries. Zero locked chat boxes, free AI compatibility scores, and Women-First privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Create Free Matrimony Profile</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-all text-center flex items-center justify-center gap-2"
            >
              <span>👑 Women's Safety & Free VIP</span>
            </Link>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">100% Verified Profiles Only</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every profile requires phone OTP verification and AI-assisted photo moderation to eliminate fake accounts, scammers, and brokers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">100% Free Direct Chat</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Unlike legacy matrimony sites that charge ₹5,000+ just to view phone numbers, LifePartner AI lets verified matches message, voice chat, and video call completely free.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Globe2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Worldwide NRI Matchmaking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Connect with educated NRI singles in the USA, UK, Canada, Australia, UAE, Singapore, and Europe seeking serious, values-based marriages.
            </p>
          </div>
        </div>

        {/* Directory Sections */}
        <div className="space-y-12">
          {/* Matrimony by City */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Explore Matrimony by City & Country</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Browse verified profiles by top metropolitan areas and global NRI hubs.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {POPULAR_LOCATIONS.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/matrimony/location/${loc.slug}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{loc.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Matrimony by Community */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Matrimony by Community & Culture</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Find compatible life partners sharing your family values, heritage, and traditions.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {POPULAR_COMMUNITIES.map((comm) => (
                <Link
                  key={comm.slug}
                  href={`/matrimony/community/${comm.slug}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{comm.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Matrimony by Profession */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Matrimony by Profession</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Connect with ambitious, educated professionals who respect your career aspirations.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {POPULAR_PROFESSIONS.map((prof) => (
                <Link
                  key={prof.slug}
                  href={`/matrimony/profession/${prof.slug}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{prof.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Matrimony Intents */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Popular Matrimony Searches</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Direct access to our most requested matchmaking solutions.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {POPULAR_INTENTS.map((intent) => (
                <Link
                  key={intent.slug}
                  href={`/matrimony/intent/${intent.slug}`}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{intent.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
