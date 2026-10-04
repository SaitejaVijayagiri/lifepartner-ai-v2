import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Philippines | 100% Free Safe Dating & Matrimony for Filipinas | Queen VIP',
  description: 'The safest AI dating & matrimony platform for Filipinas. 100% Free Lifetime Queen VIP, unlimited direct messaging, masked contact details & AI Anti-Creep Shield. Connect in Metro Manila, Cebu, Davao & worldwide.',
  keywords: [
    'philippines dating app',
    'safe dating app for filipinas',
    'free dating app philippines',
    'filipina matrimony',
    'serious relationship philippines',
    'manila singles chat',
    'cebu dating app',
    'verified dating app philippines',
    'international dating for filipinas'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/philippines',
    languages: {
      'en-PH': 'https://lifepartnerai.in/philippines',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Philippines | Safe Matchmaking & 100% Free VIP for Filipinas',
    description: 'No predatory fees or creeps. Real human profiles verified via OTP, real-time AI harassment interception, and disappearing photos.',
    url: 'https://lifepartnerai.in/philippines',
    siteName: 'LifePartner AI Philippines',
    locale: 'en_PH',
    type: 'website'
  }
};

export default function PhilippinesLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Philippines',
    'description': 'The safest AI-driven dating and marriage platform built around women\'s privacy and peace of mind in the Philippines.',
    'url': 'https://lifepartnerai.in/philippines',
    'areaServed': 'Philippines',
    'inLanguage': 'en-PH',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'PHP',
      'name': 'Free Lifetime Queen VIP for Filipinas & Unlimited Direct Messaging'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI really 100% free for Filipinas?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Filipinas automatically receive Lifetime Queen VIP perks: unlimited direct chat, HD video calling, and 100 free coins without any subscription charges.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect women\'s privacy and personal contact numbers?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Your phone number and WhatsApp details are never shown publicly. All communication takes place inside secure in-app chat with disappearing photos and screenshot protection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I find both local Filipino singles and verified international matches?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! You can match with genuine singles in Metro Manila, Cebu, Davao, or connect with verified international members seeking serious long-term relationships and marriage.'
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
            <span>🇵🇭</span>
            <span>Philippines Official Launch | 100% Free Lifetime VIP For Filipinas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Find True Love & Serious Marriage,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              With 100% Safety, Respect & Zero Creeps.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Protect your privacy and personal phone number. LifePartner AI gives women lifetime VIP privileges, 
            AI Anti-Creep Shield, verified OTP profiles, and 100% free direct messaging.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=philippines"
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
                <p className="font-bold text-sm">Free VIP for Filipinas</p>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone & WhatsApp hidden</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% OTP Verified</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero catfishes or scammers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why Filipinas Love LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Designed to help you meet sincere, respectful men who are serious about commitment and marriage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. 100% Free Lifetime Queen VIP</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enjoy unlimited direct messages, HD video calls, and 100 bonus coins for cute gifts and spotlight boosts. No paid subscriptions ever.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our smart AI automatically filters out disrespectful messages, lewd comments, and aggressive contact demands. Inappropriate users are banned instantly.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Screenshot-Safe Disappearing Snaps</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share photos with peace of mind. Our disappearing snap photos cannot be screenshotted or saved without your permission.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Connect Across the Philippines & Globally</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Find compatible singles in Metro Manila, Cebu, Davao, Pampanga, or connect with verified international bachelors looking for genuine Filipina partners.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Connecting Singles Across the Philippines
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Metro Manila, Quezon City, Makati, BGC Taguig, Cebu City, Davao City, Iloilo, Cagayan de Oro, Baguio, and Overseas Filipinos (OFW).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Metro Manila', 'Quezon City & Makati', 'BGC Taguig', 'Cebu City', 'Davao City', 'Iloilo', 'Pampanga', 'Baguio', 'Overseas Filipinos (OFW)'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions (Philippines)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Is LifePartner AI really 100% free for women?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! Filipinas are automatically granted Lifetime Queen VIP with unlimited direct messages, video calls, and 100 free coins.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How do you prevent scammers and fake profiles?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every user is required to complete email OTP verification. Unverified accounts cannot view contact details or send messages.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can I use this for serious matrimony?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! You can set your preference to Serious Matrimony Mode to meet men who are intentional about building a marriage and family.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=philippines"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Get Started Free in the Philippines</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
