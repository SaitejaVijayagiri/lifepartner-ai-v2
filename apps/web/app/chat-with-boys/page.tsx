import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  MessageCircle, 
  Music, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Globe2, 
  Crown,
  PhoneCall,
  Video,
  Moon,
  Flame,
  Languages
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chat with Cute Boys & Handsome Men Online 100% Free | Safe Video, Voice & Direct Chat | LifePartner AI',
  description: 'Looking to chat with cute boys and handsome men online safely? LifePartner AI offers 100% free direct chat, HD video calls, audio notes, and disappearing snaps with verified bachelors across Korea, USA, Germany, and worldwide. 100% anti-creep & privacy protected.',
  keywords: [
    'chat with boys online free',
    'chat with cute guys online',
    'chat with handsome men online',
    'safe apps to chat with boys',
    'talk to single boys online',
    'chat with boys without phone number',
    'clean safe chat for girls',
    'talk to boys when lonely',
    'late night chat with guys free',
    'chat with korean boys free',
    'talk to foreign guys online free',
    'free audio call with boys app',
    'video call with handsome guys free',
    'chat with guys without paying',
    'women first safe chat app'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/chat-with-boys',
  },
  openGraph: {
    title: 'Chat with Cute Boys & Handsome Men Online 100% Free | LifePartner AI',
    description: 'Safe, private, and 100% free messaging with verified handsome men and cute guys worldwide. Zero phone number exposure, anti-screenshot snaps, and AI anti-creep shield.',
    url: 'https://lifepartnerai.in/chat-with-boys',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Chat with Cute Boys and Handsome Men Safely'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chat with Cute Boys & Handsome Men Online 100% Free | LifePartner AI',
    description: 'Safe direct chat, audio calls, and HD video dates with verified handsome guys worldwide. 100% Free for women.',
    images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200']
  }
};

export default function ChatWithBoysPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI - Safe Chat with Boys and Men for Women',
    'description': 'A safe, women-first communication and dating platform where women can chat with verified, cute, and respectful men without paying fees or sharing personal contact details.',
    'url': 'https://lifepartnerai.in/chat-with-boys',
    'areaServed': 'Worldwide',
    'inLanguage': 'en',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Lifetime Messaging & Video Calling for Women'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Can girls chat with boys online for free without sharing their phone number?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! On LifePartner AI, your mobile number, email, and social handles remain 100% masked and encrypted. You can send unlimited direct messages, voice notes, and HD video call cute guys directly inside the web or mobile app without ever revealing your personal contact details.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI keep chatting safe and free from creepy behavior?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every male user must verify their account via email OTP and face verification. In addition, our automated AI Anti-Creep Shield actively filters inappropriate content, prevents screenshot capturing on disappearing snaps, and allows instant 1-click blocking and reporting.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I chat with foreign boys and Korean guys?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Absolutely. LifePartner AI hosts thousands of verified bachelors from South Korea, Germany, the United States, United Kingdom, Canada, and Europe. Our built-in AI Real-Time Translation translates conversations seamlessly across English, Korean, German, and 30+ languages.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Do girls have to pay to message or video call handsome boys?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Never. Female users receive automatic Lifetime Queen VIP status with 100% free unlimited direct messaging, 100 welcome coins, priority profile discovery, and free HD audio/video calls.'
        }
      }
    ]
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
        'name': 'For Women',
        'item': 'https://lifepartnerai.in/for-women'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Chat with Boys',
        'item': 'https://lifepartnerai.in/chat-with-boys'
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <span>👑 💬 💖</span>
            <span>100% Safe &amp; Free Chat with Verified Guys for Women Worldwide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Chat with Cute Boys &amp; Handsome Men Online.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
              100% Free, Safe &amp; Anti-Creep Protected
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Tired of shady apps, creepy DMs, and paywalls? LifePartner AI gives women total control. Connect with verified, attractive, and respectful guys across Korea, USA, Germany, and worldwide. Enjoy unlimited free direct messaging, voice notes, disappearing snaps, and crystal-clear HD video calls—without ever exposing your phone number.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Free Chat with Cute Boys</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/korean-dating"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>🇰🇷 Chat with Korean Guys</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Masked Phone Numbers</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero phone number leaks or WhatsApp spam</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automatic filter blocks creepy messages</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% Free VIP for Girls</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">No paywalls, coins or message limits</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Camera className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Disappearing Snaps</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">10s view limit &amp; anti-screenshot</p>
              </div>
            </div>
          </div>
        </section>

        {/* What Girls Search: Chat by Mood & Category */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-pink-600 dark:text-pink-400">Choose Your Vibe</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2">
              How Would You Like to Connect Today?
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Find the perfect match for deep conversations, light flirting, or meaningful long-term romance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-pink-600 mb-4">
                <Flame size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Chat with Cute Boys</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect with verified handsome single bachelors in your city or college who are funny, ambitious, and respectful.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800 text-xs font-bold text-pink-600">
                100% Free Direct Messaging
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-4">
                <Languages size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Chat with Korean Oppas</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Adore K-dramas, K-pop, and polite Korean gentlemen? Chat directly with stylish Korean guys from Seoul and Busan with live AI translation.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800 text-xs font-bold text-purple-600">
                K-Pop &amp; Spotify Sync
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-4">
                <Moon size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Late-Night Heart-to-Heart</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Feeling bored, lonely, or need someone genuine to talk to about your day? Enjoy safe, comforting late-night text and audio chats.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800 text-xs font-bold text-indigo-600">
                Safe &amp; Clean Community
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-4">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">HD Voice &amp; Video Dates</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Confirm chemistry and verify his looks face-to-face with crystal-clear 1-on-1 video calls. No camera-roll spoofing allowed.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800 text-xs font-bold text-emerald-600">
                100% Free Unlimited Calls
              </div>
            </div>
          </div>
        </section>

        {/* Women-First Anti-Creep Safeguards */}
        <section className="py-16 bg-gradient-to-b from-transparent via-pink-50/50 to-transparent dark:via-pink-950/20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-pink-600 dark:text-pink-400">Total Peace of Mind</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2">
              Why Girls Choose LifePartner AI Over Traditional Dating Apps
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Designed from scratch to protect your emotional safety, dignity, and personal space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-6">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-lg font-bold mb-2">Zero Fake Catfish Accounts</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every guy passes email OTP authentication and AI face-consistency analysis. You are talking to real, living human beings with genuine intentions.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-6">
                <Lock size={24} />
              </div>
              <h4 className="text-lg font-bold mb-2">You Decide Who Stays in Your Chat</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                If a user says anything uncomfortable, one tap blocks and reports them. Our moderation system automatically bans malicious accounts immediately.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-6">
                <Music size={24} />
              </div>
              <h4 className="text-lg font-bold mb-2">Music Vibes &amp; Spotify Sync</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Break the ice effortlessly! Compare your top Spotify tracks, discover his favorite artists, and listen to synced songs together right in the chat room.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Answers to common questions about chatting safely with boys on LifePartner AI.</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Is it really 100% free for girls to chat with boys on LifePartner AI?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! Unlike commercial apps like Tinder or Shaadi that charge hundreds of dollars for chat unlocks, LifePartner AI is 100% free with unlimited direct messages, voice notes, and HD video calls for all women.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Can boys take screenshots of my photos or messages?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our disappearing snaps feature has strict anti-screenshot protection. Images disappear 10 seconds after viewing and cannot be downloaded or captured to local device galleries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                How do I meet cute boys from other countries like Korea, Germany, or the USA?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Simply set your match preferences to &apos;Global&apos; or explore our dedicated country portals. You can chat with handsome foreign bachelors and Korean oppas with built-in real-time translation.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Chat with Cute Boys Safely?</h2>
            <p className="mt-3 text-pink-100 max-w-xl mx-auto text-sm sm:text-base">
              Create your free profile in 30 seconds. No phone number sharing, zero creeps, 100% fun.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-md"
              >
                Sign Up 100% Free
              </Link>
              <Link
                href="/international-men"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-pink-700/60 hover:bg-pink-700/80 text-white font-bold border border-pink-300/30 transition-all"
              >
                Meet International Guys
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
