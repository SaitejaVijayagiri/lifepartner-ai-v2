import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown, Compass, Camera } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI India | #1 Free Verified Matrimony & Safe Dating for Indian Girls & Brides',
  description: 'India\'s safest 100% Free Matrimony & Dating App. Lifetime Queen VIP for Indian girls, Vedic Kundali Milan (36 Gunas), AI Anti-Harassment Shield, disappearing photos & masked contact numbers across Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune & nationwide.',
  keywords: [
    'indian matrimony',
    'free matrimony app india',
    'safe dating app for indian girls',
    'verified indian brides',
    'matrimony app without payment',
    'jeevansathi alternative free',
    'shaadi alternative free',
    'bharat matrimony alternative free',
    'free kundali matching online 36 gunas',
    'delhi matrimony',
    'mumbai matrimony',
    'bangalore matrimony',
    'hyderabad matrimony',
    'telugu matrimony free',
    'tamil matrimony free',
    'hindi matrimony free',
    'marathi matrimony free',
    'kannada matrimony free',
    'nri matrimony usa uk canada'
  ],
  alternates: {
    canonical: 'https://www.lifepartnerai.in/india',
    languages: {
      'x-default': 'https://www.lifepartnerai.in',
      'en': 'https://www.lifepartnerai.in',
      'en-IN': 'https://www.lifepartnerai.in/india',
      'en-US': 'https://www.lifepartnerai.in/usa',
      'en-GB': 'https://www.lifepartnerai.in/uk',
      'en-CA': 'https://www.lifepartnerai.in/canada',
      'en-AU': 'https://www.lifepartnerai.in/australia',
      'en-SG': 'https://www.lifepartnerai.in/singapore',
      'en-PH': 'https://www.lifepartnerai.in/philippines',
      'en-AE': 'https://www.lifepartnerai.in/uae',
      'ja-JP': 'https://www.lifepartnerai.in/japan',
      'ko-KR': 'https://www.lifepartnerai.in/korea',
      'ru-RU': 'https://www.lifepartnerai.in/russia',
      'id-ID': 'https://www.lifepartnerai.in/indonesia',
      'ms-MY': 'https://www.lifepartnerai.in/malaysia',
      'vi-VN': 'https://www.lifepartnerai.in/vietnam',
      'th-TH': 'https://www.lifepartnerai.in/thailand',
      'pt-BR': 'https://www.lifepartnerai.in/brazil',
      'de-DE': 'https://www.lifepartnerai.in/germany',
      'fr-FR': 'https://www.lifepartnerai.in/france'
}
  },
  openGraph: {
    title: 'LifePartner AI India | 100% Free Safe Matrimony & Dating for Indian Girls & Brides',
    description: 'No forced monthly subscriptions or unsolicited phone number leaks. 100% OTP verified brides & grooms, AI Anti-Harassment Shield, Vedic Kundali Milan, and disappearing photos.',
    url: 'https://www.lifepartnerai.in/india',
    siteName: 'LifePartner AI India',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://www.lifepartnerai.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI India - Safe Free Matrimony for Indian Girls & Brides'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifePartner AI India | #1 Free Verified Matrimony & Safe Matchmaking',
    description: 'India\'s safest matchmaking app for girls and women. Free lifetime VIP, Vedic Kundali Milan, and zero broker paywalls.',
    images: ['https://www.lifepartnerai.in/opengraph-image']
  }
};

export default function IndiaLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI India',
    'description': 'The safest AI-driven matrimonial and matchmaking platform built for Indian girls, women, and families with 100% free direct chat.',
    'url': 'https://www.lifepartnerai.in/india',
    'areaServed': [
      { '@type': 'Country', 'name': 'India' },
      { '@type': 'AdministrativeArea', 'name': 'Delhi NCR' },
      { '@type': 'AdministrativeArea', 'name': 'Maharashtra' },
      { '@type': 'AdministrativeArea', 'name': 'Karnataka' },
      { '@type': 'AdministrativeArea', 'name': 'Telangana' },
      { '@type': 'AdministrativeArea', 'name': 'Tamil Nadu' }
    ],
    'inLanguage': ['en-IN', 'hi', 'te', 'ta', 'mr', 'kn', 'bn', 'gu', 'pa'],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR',
      'name': 'Free Lifetime Queen VIP for Indian Girls & Free Matrimony Direct Chat'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI really 100% free for Indian girls and brides?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Female members automatically receive Lifetime Queen VIP status: 100% free unlimited direct messaging, high-definition video calls, and 100 welcome coins without any forced monthly subscriptions or paywalls.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect Indian women from harassment and contact number leaks?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Your phone number and private contact details are never displayed publicly. All communication takes place inside encrypted in-app messaging featuring real-time AI Anti-Creep interception, disappearing photos, and anti-screenshot technology.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Does LifePartner AI support free Vedic Kundali Milan (36 Gunas)?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Every profile includes an instant Vedic Kundali compatibility score based on traditional Ashtakoot 36 Guna matching, Manglik Dosha analysis, and planetary alignment at zero cost.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I find both verified domestic Indian profiles and NRI matches?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! You can discover verified singles and brides across all Indian states and cities, or filter for verified NRI grooms and brides living in the USA, UK, Canada, Australia, UAE, and Singapore.'
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
            <span>🇮🇳</span>
            <span>India Edition | 100% Free Lifetime VIP For Indian Women & Girls</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Matrimony & Dating in India,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Safe for Women, 100% Free & Zero Broker Fees.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tired of expensive matrimonial subscriptions, broker pressure, unsolicited phone calls, and privacy leaks?
            LifePartner AI empowers Indian girls and verified bachelors with Lifetime Queen VIP, AI Anti-Harassment Shield, Vedic Kundali Milan, and verified OTP authenticity.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=india"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Join Free as VIP (100% Free)</span>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited direct chat & 100 coins</p>
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
              <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Vedic Kundali Milan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ashtakoot 36 Guna matching</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% OTP Verified</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero fake profiles or brokers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why Indian Girls & Families Trust LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A modern, high-trust relationship & matrimonial platform built around women&apos;s dignity, privacy, and full autonomy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Lifetime Queen VIP Status (100% Free)</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Indian women enjoy free direct messaging, high-definition video calls, and priority placement in candidate feeds with zero subscription fees. Connect directly without forced payment paywalls.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Harassment & Anti-Creep Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our real-time AI security scans and blocks aggressive advances, toxic language, and premature phone number demands before they ever enter your inbox.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Screenshot-Blocked Disappearing Photos</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Share private photos safely. Our disappearing photo technology automatically deletes media after viewing and blocks unauthorized device screen captures.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Connect Across India & Global NRIs</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Meet ambitious, educated professionals in Bangalore, Hyderabad, Mumbai, Delhi NCR, Chennai, Pune, or connect with verified NRI bachelors in the USA, UK, Canada, Australia, and UAE.
              </p>
            </div>
          </div>
        </section>

        {/* Indian Cities Cloud */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Verified Profiles Across All Indian Cities
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Find highly compatible brides and grooms in your city or preferred location.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Chennai', 'Kolkata',
              'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Kochi & Kerala',
              'Visakhapatnam', 'Surat', 'Bhopal', 'Patna', 'Vadodara', 'Coimbatore', 'Nagpur',
              'US & Canada NRI', 'UK & Europe NRI', 'Dubai & Gulf NRI'
            ].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* Communities Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Matrimony Across All Mother Tongues & Communities
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-6">
            Connecting verified singles respecting your cultural heritage and values.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Telugu Matrimony', 'Tamil Matrimony', 'Hindi Matrimony', 'Marathi Matrimony',
              'Kannada Matrimony', 'Malayalam Matrimony', 'Bengali Matrimony', 'Punjabi Matrimony',
              'Gujarati Matrimony', 'Odia Matrimony', 'Brahmin Matrimony', 'Reddy Matrimony',
              'Kamma Matrimony', 'Kapu Matrimony', 'Iyer Matrimony', 'Iyengar Matrimony',
              'Maratha Matrimony', 'Sikh Matrimony', 'Jain Matrimony'
            ].map((comm) => (
              <span key={comm} className="px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-semibold border border-pink-200/60 dark:border-pink-800/40">
                {comm}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Frequently Asked Questions (India)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Is LifePartner AI really 100% free with no hidden charges?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! There are no forced subscriptions or paywalls. Female accounts automatically receive lifetime VIP privileges with unlimited direct messaging and full safety protections.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How do you prevent bots, fake biodatas, and brokers?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every member is authenticated via phone one-time password (OTP) verification. Suspicious accounts or commercial brokers are automatically banned by our AI integrity filter.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can I use this for both serious matrimony and modern dating?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! You can toggle between Serious Matrimony Mode and Modern Dating Mode anytime inside your profile preferences.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How does Vedic Kundali matching work on LifePartner AI?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our built-in Vedic astrology engine calculates Ashtakoot 36 Guna scores, Manglik analysis, and Nadi compatibility instantly when both profiles have birth date and time details.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=india"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Get Started Free in India</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
