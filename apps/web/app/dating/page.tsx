import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Crown, Lock, Users, Globe2, ArrowRight, Camera, Music, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Dating | #1 Free Worldwide Dating App for Serious Relationships',
  description: 'Meet 100% verified singles worldwide for meaningful, serious dating. 100% Free direct chat, 24h stories, disappearing snaps, Spotify music matching, and Women-First privacy protection across USA, UK, Canada, Australia, Japan, Korea & 190+ countries.',
  keywords: [
    'free worldwide dating app',
    'safe dating app for women',
    'serious relationship dating app',
    'bumble alternative free',
    'hinge alternative free',
    'dating app without paywalls',
    'verified singles dating',
    'international dating app free',
    'screenshot proof snaps dating',
    'music match dating app'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/dating',
  },
  openGraph: {
    title: 'LifePartner AI Dating | #1 Free Worldwide Dating App',
    description: 'Meet verified singles worldwide with zero subscription paywalls, direct chat, stories, snaps, and Women-First safety.',
    url: 'https://lifepartnerai.in/dating',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
  }
};

const DATING_LOCATIONS = [
  { name: '🇺🇸 United States Singles', slug: 'united-states' },
  { name: '🇬🇧 United Kingdom Singles', slug: 'united-kingdom' },
  { name: '🇨🇦 Canada Singles', slug: 'canada' },
  { name: '🇦🇺 Australia Singles', slug: 'australia' },
  { name: '🇯🇵 Japan (日本)', slug: 'japan' },
  { name: '🇰🇷 South Korea (한국)', slug: 'korea' },
  { name: '🇸🇬 Singapore Singles', slug: 'singapore' },
  { name: '🇦🇪 UAE / Dubai Singles', slug: 'united-arab-emirates' },
  { name: '🇩🇪 Germany (Deutschland)', slug: 'germany' },
  { name: '🇫🇷 France (France)', slug: 'france' },
  { name: '🇧🇷 Brazil (Brasil)', slug: 'brazil' },
  { name: '🇷🇺 Russia (Россия)', slug: 'russia' },
  { name: '🇵🇭 Philippines Singles', slug: 'philippines' },
  { name: '🇮🇩 Indonesia Singles', slug: 'indonesia' },
  { name: '🇲🇾 Malaysia Singles', slug: 'malaysia' },
  { name: '🇹🇭 Thailand (ไทย)', slug: 'thailand' },
];

const DATING_INTENTS = [
  { name: 'Date Handsome Korean Boys (BTS & K-Culture)', slug: 'date-handsome-korean-boys' },
  { name: 'Meet Korean Oppa Singles Worldwide', slug: 'meet-korean-oppa-singles' },
  { name: 'Handsome German Men & European Bachelors', slug: 'handsome-german-men-dating' },
  { name: 'German Gentlemen Matrimony & Dating', slug: 'german-gentlemen-matrimony' },
  { name: 'Meet Handsome International Guys', slug: 'meet-handsome-international-guys' },
  { name: 'Safe Dating App for Women (Anti-Creep)', slug: 'safe-dating-app-for-women' },
  { name: 'Women-First Dating App', slug: 'women-first-dating-app' },
  { name: 'Free VIP Dating for Women', slug: 'free-vip-dating-for-women' },
  { name: 'Global Chat with Verified Singles', slug: 'global-chat-with-verified-singles' },
  { name: 'Anti-Harassment Dating App', slug: 'anti-harassment-dating-app' },
  { name: 'Online Chat with International Singles', slug: 'chat-with-international-guys' },
  { name: 'Online Chat with Strangers (Safe Alternative)', slug: 'online-chat-with-strangers' },
  { name: 'Free Random Video Chat (Moderated)', slug: 'free-random-video-chat' },
];

export default function DatingHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Dating',
    'description': 'The world\'s #1 AI-powered 100% free dating platform for serious, intentional singles worldwide.',
    'url': 'https://lifepartnerai.in/dating',
    'areaServed': 'Worldwide',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Dating Registration & Unlimited Direct Chat'
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold mb-6">
            <Flame size={14} className="text-pink-600 dark:text-pink-400" />
            <span>Real Connections • Disappearing Snaps • 100% Free</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Serious, Meaningful Dating <br />
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Built for Safety & Real Chemistry
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Dating without the games, subscription paywalls, or harassment. Connect with verified singles through 24-hour stories, disappearing snaps, music vibes, and AI compatibility.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/25 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Join Free Worldwide Dating</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/international-men"
              className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-purple-900/30 to-rose-900/30 border border-purple-500/30 hover:border-purple-500/60 text-purple-700 dark:text-purple-300 font-bold rounded-2xl transition-all text-center flex items-center justify-center gap-2"
            >
              <span>✨ Meet Handsome International Men</span>
            </Link>
          </div>
        </div>

        {/* Global Bachelors Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link
            href="/korean-dating"
            className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-950/40 dark:to-purple-950/40 border border-rose-200 dark:border-rose-900 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🇰🇷</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white">Trending</span>
            </div>
            <h3 className="text-lg font-bold group-hover:text-rose-600 transition-colors">Date Handsome Korean Men</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Connect with charismatic Korean bachelors, K-culture singles, and Seoul professionals. 100% Free chat &amp; AI translation.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 gap-1">
              <span>Explore Korean Singles</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/german-dating"
            className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-indigo-50 dark:from-amber-950/40 dark:to-indigo-950/40 border border-amber-200 dark:border-amber-900 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🇩🇪</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-600 text-white">Gentlemen</span>
            </div>
            <h3 className="text-lg font-bold group-hover:text-amber-600 transition-colors">German Gentlemen &amp; Bachelors</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Meet reliable, educated German men and European bachelors seeking serious international relationships.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 gap-1">
              <span>Explore German Singles</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/international-men"
            className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-950/40 dark:to-pink-950/40 border border-indigo-200 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🌍</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white">Global Hub</span>
            </div>
            <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">Worldwide Handsome Bachelors</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Curated verified bachelors from Korea, Germany, Japan, France, USA &amp; 190+ countries with zero paywalls.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
              <span>View All International Hubs</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
              <Camera size={24} />
            </div>
            <h3 className="text-base font-bold mb-2">Disappearing Snaps</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Share real candid moments with 10s auto-disappearing instant snaps and strict anti-screenshot protection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Music size={24} />
            </div>
            <h3 className="text-base font-bold mb-2">Music Vibes & Jukebox</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Match based on shared music taste, listen to synced songs, and watch full-screen landscape music together in chat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold mb-2">AI Anti-Creep Shield</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Automated AI filtering protects women from unwanted solicitations, unsolicited phone numbers, and inappropriate messages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold mb-2">100% Free Direct Chat</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Zero fake paywalls or ₹2,999/month subscriptions. Message, exchange photos, and video call verified matches without limits.
            </p>
          </div>
        </div>

        {/* Directory Sections */}
        <div className="space-y-12">
          {/* Dating by Country */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Explore Dating by Country</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Connect with singles in top international hubs worldwide.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {DATING_LOCATIONS.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/dating/location/${loc.slug}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200 dark:border-slate-800 hover:border-pink-300 dark:hover:border-pink-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{loc.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Dating Searches & Intent */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Popular Dating Searches for Women & Men</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Designed with privacy-first tools, verification, and intentional matchmaking.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DATING_INTENTS.map((intent) => (
                <Link
                  key={intent.slug}
                  href={`/dating/intent/${intent.slug}`}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-slate-200 dark:border-slate-800 hover:border-pink-300 dark:hover:border-pink-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{intent.name}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500 flex-shrink-0" />
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
