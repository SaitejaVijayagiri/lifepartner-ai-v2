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
              href="/for-women"
              className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-all text-center flex items-center justify-center gap-2"
            >
              <span>👑 Women's Safety & Free VIP</span>
            </Link>
          </div>
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
