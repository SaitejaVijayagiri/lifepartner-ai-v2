import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Singapore | 100% Free AI Dating & Matrimony for Women | Verified Singles',
  description: 'Singapore\'s safest AI matchmaking platform for women & professionals. 100% Free Lifetime VIP, Unlimited Direct Chat, Masked Contacts & AI Anti-Creep Shield. Connect in SG & worldwide.',
  keywords: [
    'singapore dating app',
    'singapore matrimonial site',
    'safe dating app for women singapore',
    'free dating app singapore',
    'expat dating singapore',
    'ai matchmaking singapore',
    'singapore singles chat',
    'verified dating app sg',
    'nri matrimony singapore',
    'serious relationship singapore'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/singapore',
    languages: {
      'en-SG': 'https://lifepartnerai.in/singapore',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Singapore | Safe Matchmaking & 100% Free VIP for Women',
    description: 'Zero subscriptions. Verified OTP human profiles. AI Anti-Creep Shield protecting your privacy and phone number. Connect with quality singles in Singapore.',
    url: 'https://lifepartnerai.in/singapore',
    siteName: 'LifePartner AI Singapore',
    locale: 'en_SG',
    type: 'website'
  }
};

export default function SingaporeLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Singapore',
    'description': 'Singapore\'s premier 100% Free AI Dating and Matrimony platform with dedicated women\'s safety guarantees.',
    'url': 'https://lifepartnerai.in/singapore',
    'areaServed': 'Singapore',
    'inLanguage': 'en-SG',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'SGD',
      'name': 'Free Lifetime Queen VIP for Women & Direct Chat'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI free for women in Singapore?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! All female users automatically receive lifetime Queen VIP status with 100% free direct messaging, 100 welcome coins, and full AI Anti-Creep protection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect privacy for Singapore users?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Your phone number and private contact details are completely masked. Photos can be shared with screenshot-prevention and disappearing snaps, and every member must pass OTP email verification.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I find both local Singapore singles and international matches?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! LifePartner AI supports matching within Singapore (CBD, Orchard, Marina Bay, Jurong, Woodlands) as well as global and expat matchmaking.'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs sm:text-sm font-bold mb-6">
            <span>🇸🇬</span>
            <span>Singapore Official Launch | 100% Free Lifetime VIP For Women</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Matchmaking in Singapore,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Designed Around Women’s Safety & Privacy.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tired of aggressive messages, unsolicited phone number asks, and overpriced dating subscriptions?
            Experience LifePartner AI: Masked contacts, AI Anti-Creep Shield, verified OTP profiles, and 100% free direct messaging.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=singapore"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Join Free as VIP</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Explore Queen VIP Perks</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Free VIP For Women</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited chat & 100 coins</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Intercepts harassment instantly</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Masked Phone & Contacts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Never leaks private info</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% OTP Verified</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero bots or fake accounts</p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why Singapore Singles Trust LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A modern, intelligent dating and matrimony platform crafted for privacy-conscious professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Free Lifetime VIP for Women</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Women should never have to pay to find a respectful, genuine life partner. Enjoy unlimited direct messages, 100 free coins for profile boosts & virtual gifts, and priority matching badges completely free.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Protection</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our real-time AI scanner automatically intercepts toxic language, unsolicited number requests, and inappropriate comments before they ever reach your inbox. Creeps are blocked and banned immediately.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Anti-Screenshot Disappearing Snaps</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share photos with prospective matches using disappearing snaps. Screenshot-blocking technology ensures your images cannot be downloaded or redistributed without your knowledge.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Singapore & Expat Matchmaking</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Connect with local Singaporean singles across all communities or meet verified global expats living in Singapore. Intelligent AI filters match on values, education, lifestyle, and life ambitions.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Connecting Verified Singles Across Singapore
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Find meaningful connections across Central Area, Orchard, Tanjong Pagar, East Coast, Bishan, Tampines, Jurong, and international NRI/expat circles.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Singapore CBD', 'Orchard & River Valley', 'Marina Bay', 'Tanjong Pagar', 'East Coast', 'Bishan', 'Tampines', 'Jurong', 'Woodlands', 'Global SG Expats'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions (Singapore)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Is LifePartner AI really 100% free for women?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! Every female account receives lifetime Queen VIP status with unlimited direct chat, 100 welcome coins, and verified priority matching with zero hidden charges.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How do you prevent catfishing and fake accounts?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                All users must complete mandatory one-time password (OTP) email verification before accessing member profiles. Unverified users cannot send messages or contact verified women.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can I use this for both dating and marriage in Singapore?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! LifePartner AI supports both serious dating and matrimony. You can toggle your preference anytime in your profile settings.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=singapore"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Get Started Free in Singapore</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
