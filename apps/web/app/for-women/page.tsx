import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown, EyeOff, UserCheck, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI for Women | #1 Safe, 100% Free Dating & Matrimony for Women Worldwide',
  description: 'The world\'s #1 women-first dating and matrimony platform. 100% Free Lifetime VIP for women, AI Anti-Creep Shield, anti-screenshot disappearing snaps, masked contact protection, and verified gentlemen from 50+ countries.',
  keywords: [
    'safe dating app for women',
    'free dating app for women',
    'women first dating app',
    'bumble alternative free',
    'safe matrimony app',
    'anti harassment dating app',
    'verified singles for women',
    'dating app without paywalls for women',
    'international dating safe for women',
    'screenshot proof dating app'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/for-women',
    languages: {
      'en': 'https://lifepartnerai.in/for-women',
      'ja': 'https://lifepartnerai.in/japan',
      'ko': 'https://lifepartnerai.in/korea'
    }
  },
  openGraph: {
    title: 'LifePartner AI for Women | Safe, 100% Free VIP Dating & Matrimony',
    description: 'Designed by women, for women. Zero creeps, zero paywalls, lifetime VIP status, and verified gentlemen worldwide.',
    url: 'https://lifepartnerai.in/for-women',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://lifepartnerai.in/api/og?title=LifePartner%20AI%20for%20Women&subtitle=100%25%20Free%20VIP%20%E2%80%A2%20Anti-Creep%20Shield%20%E2%80%A2%20Safe%20Worldwide%20Dating',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI for Women'
      }
    ]
  }
};

export default function ForWomenPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI for Women',
    'description': 'Safe, women-first dating & matrimony platform offering 100% free VIP privileges, AI anti-creep shield, and verified global connections.',
    'url': 'https://lifepartnerai.in/for-women',
    'areaServed': 'Worldwide',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Lifetime VIP Account for Women'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is LifePartner AI really 100% free for women?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! Every female user receives our Lifetime Queen VIP membership with 100 free bonus coins, unlimited direct messages, voice notes, and HD video calls with zero subscriptions.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the AI Anti-Creep Shield protect women?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our AI scans in real-time to prevent unsolicited numbers, off-platform links, and inappropriate language from ever reaching your inbox. Offensive users are immediately flagged and permanently banned.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can other users take screenshots of my private photos or snaps?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'No. Our disappearing Snaps feature blocks screenshot attempts on supported devices and notifies you if suspicious screen activity is detected.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I connect with verified gentlemen from other countries?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! You can explore and chat with verified singles across USA, UK, Canada, Australia, Japan, Korea, Europe, and India.'
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
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs sm:text-sm font-extrabold mb-6 shadow-sm">
            <Crown size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span>Women-First Pledge: 100% Free Lifetime VIP & Anti-Creep Protection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight sm:leading-tight">
            Dating on your terms.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600">
              Zero creeps. Pure romance. Verified gentlemen.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Tired of aggressive DMs, unwanted phone number requests, and paywalls?
            LifePartner AI is built to give women complete privacy, respect, and control.
            Connect with verified, career-focused gentlemen across 50+ countries with zero forced subscriptions.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Join Free as a VIP Queen</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              Already a Member? Log In
            </Link>
          </div>

          {/* Queen VIP Trust Pillars */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/60 border border-pink-200/80 dark:border-pink-950/60 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 fill-amber-500/20 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">100% Free Lifetime VIP</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unlimited direct chat & video calls</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/60 border border-indigo-200/80 dark:border-indigo-950/60 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI filters spam & bad behavior</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/60 border border-purple-200/80 dark:border-purple-950/60 shadow-sm flex items-start gap-3">
              <EyeOff className="text-purple-600 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Masked Contacts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your phone & socials stay private</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/60 border border-rose-200/80 dark:border-rose-950/60 shadow-sm flex items-start gap-3">
              <Camera className="text-rose-600 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Anti-Screenshot Snaps</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Photos vanish after viewing</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6 Key Protections & Features Designed for Women */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Why Women Around the World Fall in Love with LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Traditional dating apps make women feel overwhelmed, unsafe, or monetized. Here is how we revolutionized the experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Crown size={28} className="fill-pink-500/20" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Automatic Queen VIP Status</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                When you sign up as a woman, your account is instantly upgraded to Queen VIP with 100 free bonus coins. Enjoy unlimited direct messages, priority match visibility, and free HD video calls without spending a single cent.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep & Harassment Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our proprietary AI algorithms filter out creepy pickup lines, unsolicited phone number pushes, and inappropriate media before they reach your eyes. One tap instantly blocks and reports any disrespectful user.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Screenshot-Proof Disappearing Snaps</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Want to share a fun, spontaneous moment without it remaining on someone else's camera roll? Send photos that vanish after 1 view. Screenshot prevention safeguards your personal moments.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Music size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Music Vibe & Spotify Connection</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Skip superficial resumes and boring biodatas. Share your favorite Spotify anthems and listen to music together during live chat. Music reveals someone's true soul and personality effortlessly.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">5. Verified Career Professionals</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Every user is verified via OTP and optional ID verification. Meet genuine software engineers, doctors, entrepreneurs, and professionals who share your relationship intent—whether serious dating or marriage.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe2 size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">6. Global Reach & Safe Meetups</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Connect locally in your city or meet charming partners in USA, UK, Canada, Australia, Japan, and Korea. Our built-in MeetSpot safety suggestions guide you to verified public venues for romantic dates.
              </p>
            </div>
          </div>
        </section>

        {/* Global Women Testimonials */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-pink-50/50 dark:bg-gray-900/30 rounded-3xl border border-pink-100 dark:border-gray-800">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-2">
              <Sparkles size={14} />
              <span>Real Stories From Real Women</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Loved by Women Across 50+ Countries
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4">
                "The Anti-Creep Shield is a breath of fresh air. Nobody was able to spam my phone number or send nasty stuff. I found a truly wonderful guy here who respects my time and values."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 flex items-center justify-center font-bold text-sm">
                  🇺🇸
                </div>
                <div>
                  <p className="font-bold text-sm">Emily R., 27</p>
                  <p className="text-xs text-slate-400">New York, USA</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4">
                "I was skeptical about dating apps because of paywalls and aggressive users. But LifePartner AI is 100% free for women and the vanishing snaps keep my photos safe. Very classy crowd."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  🇯🇵
                </div>
                <div>
                  <p className="font-bold text-sm">Yuka M., 29</p>
                  <p className="text-xs text-slate-400">Tokyo, Japan</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4">
                "Finding someone who shares both my career ambitions and traditional values was so easy. The Queen VIP perks and music vibe matching made chatting feel natural from day one."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  🇮🇳
                </div>
                <div>
                  <p className="font-bold text-sm">Priya S., 26</p>
                  <p className="text-xs text-slate-400">Hyderabad, India</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-center mb-10">
            Frequently Asked Questions by Women
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Is LifePartner AI truly 100% free for women?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes. Every female user automatically receives Queen VIP status. You can browse, direct message, exchange disappearing snaps, and make HD video calls with zero subscriptions, paywalls, or hidden costs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. How does the AI Anti-Creep Shield protect me?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our AI analyzes incoming chat interactions in real time to intercept predatory language, unsolicited phone numbers, and external messaging links. Problematic senders are immediately blocked, protecting your peace of mind.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Can anyone see my phone number or social media handles?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No. Your contact information is never shown publicly. You remain in complete control and can decide if and when you feel comfortable sharing contact details with a match.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Are male profiles real and verified?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes. All users must pass mandatory email OTP verification to log in, and optional ID badge checks confirm identity. This eliminates fake accounts and bot networks.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold mb-6 backdrop-blur-md">
                <Crown size={14} className="fill-amber-300 text-amber-300" />
                <span>Join Over 10,000+ Verified Singles Worldwide</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
                Your Safety. Your Peace. Your Love Story.
              </h2>
              <p className="text-pink-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                Take back control of your dating life. Sign up in 60 seconds and experience the safest, most respectful dating and matrimony community in the world.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-white text-pink-700 font-extrabold text-base shadow-xl hover:scale-105 hover:bg-pink-50 transition-all"
              >
                <span>Claim Your Free Queen VIP Account</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
