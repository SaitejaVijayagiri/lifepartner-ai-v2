import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Users, 
  Globe2, 
  Crown,
  Compass,
  Star,
  Flame,
  Languages,
  Check
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Meet Handsome International Men | Date Korean, German & Global Bachelors | LifePartner AI',
  description: 'Connect with verified handsome international men from South Korea, Germany, Japan, France, USA & worldwide. 100% Free direct chat, video calls, AI compatibility matching, and zero subscription paywalls.',
  keywords: [
    'meet handsome international men',
    'date handsome boys worldwide',
    'korean bts boys dating app',
    'handsome german men dating',
    'date european men',
    'handsome korean oppa dating',
    'international bachelor matrimony',
    'cross-cultural dating app',
    'verified international singles',
    'free international dating app',
    'global dating without paywall'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/international-men',
  },
  openGraph: {
    title: 'Meet Handsome International Men Worldwide | LifePartner AI',
    description: 'Connect with verified handsome men across Korea, Germany, and 190+ countries. 100% Free chat, HD video, and AI matchmaking.',
    url: 'https://lifepartnerai.in/international-men',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Handsome International Men on LifePartner AI'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Handsome International Men Worldwide | LifePartner AI',
    description: 'Find verified, attractive, and sincere international bachelors from Korea, Germany, and beyond with 100% free messaging.',
    images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200']
  }
};

const INTERNATIONAL_HUBS = [
  {
    country: 'South Korea',
    flag: '🇰🇷',
    subtitle: 'Charismatic, stylish & romantic gentlemen',
    description: 'Meet handsome Korean bachelors from Seoul, Gangnam & Busan who appreciate culture, modern style, and devoted romance.',
    href: '/korean-dating',
    tag: 'Trending Worldwide'
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    subtitle: 'Reliable, intellectual & family-oriented',
    description: 'Connect with handsome German professionals and European gentlemen from Berlin, Munich & Frankfurt seeking genuine love.',
    href: '/german-dating',
    tag: 'High Compatibility'
  },
  {
    country: 'Japan',
    flag: '🇯🇵',
    subtitle: 'Polite, dedicated & worldly bachelors',
    description: 'Discover sincere Japanese men from Tokyo, Kyoto & Osaka interested in global friendships and meaningful matrimony.',
    href: '/japan',
    tag: 'Cultural Harmony'
  },
  {
    country: 'France',
    flag: '🇫🇷',
    subtitle: 'Passionate, cultured & romantic',
    description: 'Meet charming French singles from Paris, Lyon & Nice who believe in deep conversations, poetry, and shared adventure.',
    href: '/france',
    tag: 'Pure Romance'
  },
  {
    country: 'United States & Canada',
    flag: '🇺🇸🇨🇦',
    subtitle: 'Ambitious, adventurous & open-minded',
    description: 'Chat with ambitious professionals and bachelors across North America seeking serious, lifelong international relationships.',
    href: '/usa',
    tag: 'Dynamic Lifestyle'
  },
  {
    country: 'United Kingdom & Australia',
    flag: '🇬🇧🇦🇺',
    subtitle: 'Witty, loyal & cosmopolitan',
    description: 'Connect with London professionals, Sydney bachelors, and European diaspora looking for mutual affection across borders.',
    href: '/uk',
    tag: 'Global Connection'
  }
];

export default function InternationalMenPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI - International Bachelors & Handsome Singles Matchmaking',
    'description': 'Premier global dating network featuring verified, attractive international men from South Korea, Germany, and over 190 countries.',
    'url': 'https://lifepartnerai.in/international-men',
    'areaServed': 'Worldwide',
    'inLanguage': 'en',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Registration & Direct Messaging'
    }
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://lifepartnerai.in'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Dating',
        'item': 'https://lifepartnerai.in/dating'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'International Men',
        'item': 'https://lifepartnerai.in/international-men'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100 via-purple-100 to-indigo-100 dark:from-rose-950/80 dark:to-indigo-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <span>✨ 🌍 💫</span>
            <span>The Global Bachelor Hub | Verified Handsome Men Across 190+ Countries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Meet Handsome International Men.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600">
              Korean Oppas, German Gentlemen &amp; Global Bachelors
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Break free from borders. LifePartner AI brings you a curated network of handsome, ambitious, and sincere men from South Korea, Germany, Europe, and around the globe. Enjoy 100% free direct messaging, crystal-clear HD video calls, and AI-powered real-time translation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Verified Men Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/korean-dating"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              🇰🇷 Korean Dating Special
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% Free Chat</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero subscriptions or paywalled messages</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">OTP Verified Profiles</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Strictly no bots or stolen images</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Languages className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Live AI Translation</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Korean, German, English &amp; 30+ languages</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Sparkles className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Soulmate Matching</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Values, lifestyle &amp; cultural compatibility</p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Hubs Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Explore Handsome Bachelors by Region
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Choose your ideal destination or match with eligible men worldwide in a few clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INTERNATIONAL_HUBS.map((hub) => (
              <div
                key={hub.country}
                className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{hub.flag}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                      {hub.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition-colors">
                    {hub.country}
                  </h3>
                  <p className="text-xs font-semibold text-rose-500 mb-3">{hub.subtitle}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {hub.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800">
                  <Link
                    href={hub.href}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                  >
                    <span>View singles in {hub.country}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Women Around the World Love This Platform */}
        <section className="py-16 bg-gradient-to-b from-transparent via-purple-50/50 to-transparent dark:via-purple-950/20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-purple-600 dark:text-purple-400">Safe, Empowering &amp; Beautiful</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2">
              Designed with Women&apos;s Safety First
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              No harassment, no intrusive phone number demands, and full control over who talks to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-pink-600 mb-4">
                <Crown size={22} />
              </div>
              <h4 className="font-bold text-base mb-2">Lifetime Free VIP Status</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                All female members enjoy automatic VIP privileges, priority matchmaking discovery, and unlimited direct chat without spending a single dollar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-4">
                <Lock size={22} />
              </div>
              <h4 className="font-bold text-base mb-2">Anti-Creep &amp; Anti-Capture Shield</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Photos and video snaps cannot be screen-captured. Phone numbers remain private and encrypted until you personally consent to share.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-4">
                <Sparkles size={22} />
              </div>
              <h4 className="font-bold text-base mb-2">Audio &amp; Video Reels First</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hear his voice, see his natural smile, and feel his vibe through 24-hour video stories before you exchange numbers or jump on a call.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Your International Love Story Begins Here</h2>
            <p className="mt-3 text-rose-100 max-w-xl mx-auto text-sm sm:text-base">
              Join thousands of handsome bachelors and charming women worldwide connecting today.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-md"
              >
                Sign Up 100% Free
              </Link>
              <Link
                href="/for-women"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-rose-700/60 hover:bg-rose-700/80 text-white font-bold border border-rose-300/30 transition-all"
              >
                Women-First Safety Features
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
