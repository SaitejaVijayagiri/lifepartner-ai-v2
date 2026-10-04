import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI USA | 100% Free Safe Dating & Matrimony for Women | Zero Subscriptions',
  description: 'America\'s safest AI dating & matrimony platform for women. 100% Free Lifetime Queen VIP, unlimited direct chat, masked phone numbers & AI Anti-Creep Shield. Connect across NYC, California, Texas, Florida & worldwide.',
  keywords: [
    'safe dating app for women usa',
    'free dating app for women',
    'ai matchmaking usa',
    'serious relationship app usa',
    'matrimony app usa',
    'dating app no forced subscription',
    'verified dating app america',
    'nyc singles safe dating',
    'california dating app',
    'nri matrimony usa'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/usa',
    languages: {
      'en-US': 'https://lifepartnerai.in/usa',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI USA | Safe AI Dating & Matrimony for Women (100% Free VIP)',
    description: 'No predatory paywalls or unsolicited contact leaks. Real human profiles verified via OTP, real-time AI Anti-Creep harassment interception, and disappearing photos.',
    url: 'https://lifepartnerai.in/usa',
    siteName: 'LifePartner AI USA',
    locale: 'en_US',
    type: 'website'
  }
};

export default function USALandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI United States',
    'description': 'The safest AI-driven dating and marriage platform built around women\'s privacy and peace of mind in the USA.',
    'url': 'https://lifepartnerai.in/usa',
    'areaServed': 'United States',
    'inLanguage': 'en-US',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': 'Free Lifetime Queen VIP for Women & Unlimited Direct Messaging'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI really 100% free for women in the United States?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Women automatically receive lifetime Queen VIP perks: unlimited direct chat, HD video calling, and 100 welcome coins without any monthly subscription charges.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect women\'s privacy and phone numbers?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Your phone number and private contact info are never shown publicly. All communication is managed through encrypted in-app messaging, featuring disappearing photos and anti-screenshot technology.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How are fake profiles, bots, and creeps handled?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every user must pass mandatory one-time password (OTP) verification before accessing verified profiles. In addition, real-time AI scans prevent unsolicited harassment or toxic behavior before it hits your inbox.'
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
            <span>🇺🇸</span>
            <span>United States Launch | 100% Free Lifetime VIP For Women</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Dating & Matrimony in America,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Built Around Safety, Respect & Zero Creeps.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tired of swipe fatigue, aggressive behavior, unsolicited number requests, and \$40/month dating app paywalls?
            LifePartner AI gives women lifetime VIP privileges, masked contact privacy, AI Anti-Creep Shield, and verified OTP safety.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=usa"
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
                <p className="font-bold text-sm">Masked Contact Details</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Never reveals your phone #</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% OTP Verified</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero catfishes or bot profiles</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why American Women Choose LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A serious, modern relationship platform built to put women's comfort, privacy, and control front and center.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Lifetime Queen VIP Privileges</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enjoy unlimited direct chats, high-definition video calls, and priority placement in candidate feeds. Plus, receive 100 complimentary coins to send animated gifts and boost your profile visibility whenever you want.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Harassment Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our proprietary AI models monitor text interactions in real time to filter out toxic remarks, premature contact number demands, and abusive language before you ever have to read them.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Screenshot-Blocked Disappearing Photos</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share photos without worrying about them ending up on the internet. Ephemeral snaps vanish after being viewed, backed by active screen-capture prevention mechanisms.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Connect Across All 50 States & Globally</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Whether you live in New York, the San Francisco Bay Area, Austin, Chicago, or Miami, connect with ambitious, verified singles who share your values, vision, and lifestyle standards.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Available Nationwide Across the United States
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            New York City, Los Angeles, San Francisco Bay Area, Chicago, Austin, Dallas, Houston, Miami, Seattle, Boston, Atlanta, and Washington D.C.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['New York City', 'Los Angeles & Orange County', 'San Francisco & Bay Area', 'Chicago', 'Austin & Dallas', 'Miami & Florida', 'Seattle', 'Boston', 'Atlanta', 'US & Global NRI'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions (USA)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Are there really no hidden subscriptions for women?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Zero. Female accounts are granted Lifetime Queen VIP status upon registration with unlimited direct messaging and full safety protections.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How do you prevent bots, scammers, and romance fraud?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every member is required to authenticate via one-time password (OTP) verification. Suspicious or fraudulent accounts are automatically flagged and removed.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can I use this for both serious dating and matrimony?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! You can toggle between Dating Mode and Serious Matrimony Mode anytime inside your profile settings.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=usa"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Get Started Free in the United States</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
