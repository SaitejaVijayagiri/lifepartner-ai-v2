import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI UK | 100% Free Safe Dating & Matrimony for Women | London & Nationwide',
  description: 'The UK\'s safest AI matchmaking platform for women. 100% Free Lifetime Queen VIP, unlimited direct messaging, masked contact details & AI Anti-Creep Shield. Connect across London, Manchester, Birmingham, Edinburgh & nationwide.',
  keywords: [
    'uk dating app',
    'safe dating app for women uk',
    'london singles dating',
    'free dating app uk',
    'uk matrimony site',
    'british dating app',
    'nri matrimony london',
    'verified dating app uk',
    'serious relationship uk'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/uk',
    languages: {
      'en-GB': 'https://lifepartnerai.in/uk',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI UK | Safe Dating & Matrimony for Women (100% Free VIP)',
    description: 'No forced monthly subscriptions. Verified human profiles via OTP, real-time AI anti-harassment interception, and disappearing photos.',
    url: 'https://lifepartnerai.in/uk',
    siteName: 'LifePartner AI UK',
    locale: 'en_GB',
    type: 'website'
  }
};

export default function UKLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI United Kingdom',
    'description': 'The safest AI-driven dating and marriage platform built around women\'s privacy and peace of mind in the United Kingdom.',
    'url': 'https://lifepartnerai.in/uk',
    'areaServed': 'United Kingdom',
    'inLanguage': 'en-GB',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'GBP',
      'name': 'Free Lifetime Queen VIP for Women & Unlimited Direct Messaging'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI really 100% free for women in the UK?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Women automatically receive lifetime Queen VIP status with unlimited direct messaging, HD video calling, and 100 free coins without any subscription fees.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect privacy and phone numbers?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Your phone number and WhatsApp are completely masked. Communication takes place inside the secure app with disappearing photos and screenshot protection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I find both UK local matches and international singles?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Connect with verified singles in Greater London, the Midlands, the North, Scotland, or with global expats and NRIs.'
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
            <span>🇬🇧</span>
            <span>United Kingdom Launch | 100% Free Lifetime VIP For Women</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Dating & Matrimony in the UK,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Built Around Safety, Respect & Zero Creeps.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Avoid swipe fatigue, unsolicited messages, and expensive dating subscriptions.
            LifePartner AI provides masked contacts, AI Anti-Creep Shield, verified OTP profiles, and 100% free direct messaging.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=uk"
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
                <p className="font-bold text-sm">Free VIP for Women</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited chat & 100 coins</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Blocks harassment automatically</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Masked Contact Info</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Never reveals your phone #</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% OTP Verified</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero fake profiles or bots</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why British Singles Choose LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A modern dating and marriage platform crafted for genuine compatibility and complete privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Free Lifetime VIP for Women</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enjoy unlimited direct messages, video calls, and 100 complimentary coins for spotlight boosts and animated gifts. No £30/month fees.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Protection</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Real-time AI scanning intercepts aggressive messages, unsolicited phone number demands, and lewd content. Harassers are banned immediately.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Anti-Screenshot Disappearing Photos</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share photos without worrying about leaks. Ephemeral snaps vanish after viewing, protected by active screenshot blocking.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Connect Across the UK & Globally</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Match with ambitious professionals across London, Manchester, Edinburgh, Birmingham, Leeds, or connect with verified international bachelors.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Connecting Verified Singles Across the United Kingdom
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            London (Central, Canary Wharf, South London), Manchester, Birmingham, Edinburgh, Glasgow, Leeds, Bristol, and British NRI/Expat networks.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Greater London', 'Canary Wharf & City', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds', 'Bristol', 'UK & Global NRI'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions (UK)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Is LifePartner AI really 100% free for women?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! Every female account receives lifetime Queen VIP status with unlimited direct chat, 100 welcome coins, and priority matching.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How do you prevent catfishing and fake accounts?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                All users must complete email OTP verification. Unverified accounts cannot view details or send messages.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can I use this for both dating and marriage in the UK?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! You can toggle between Dating Mode and Serious Matrimony Mode anytime in your profile settings.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=uk"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Get Started Free in the UK</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
