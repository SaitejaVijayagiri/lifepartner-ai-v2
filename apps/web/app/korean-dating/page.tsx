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
  Star, 
  Lock, 
  Users, 
  Globe2, 
  Flame, 
  Check, 
  Languages, 
  Tv, 
  Headphones,
  Compass
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Date Handsome Korean Men & Global Dating | LifePartner AI (한국 남성을 위한 글로벌 소개팅)',
  description: 'Connect with handsome Korean men, Seoul bachelors, and international singles. 100% Free direct chat, HD video calls, K-pop music matching, and verified profiles. 한국 남성과 전 세계 여성을 이어주는 100% 무료 글로벌 매칭 플랫폼.',
  keywords: [
    'date korean boys',
    'handsome korean men',
    'korean oppa dating app',
    'meet korean singles',
    'korean bts boys dating',
    'korean men international dating',
    '외국인 여자친구 사귀기',
    '한국 남자 국제연애',
    '글로벌 소개팅 어플',
    '한국인 해외 데이팅',
    'seoul handsome guys dating',
    'k-pop fan dating app',
    'k-drama romance dating',
    'cross-cultural dating korea',
    'free international dating app'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/korean-dating',
    languages: {
      'en': 'https://lifepartnerai.in/korean-dating',
      'ko-KR': 'https://lifepartnerai.in/korean-dating'
    }
  },
  openGraph: {
    title: 'Date Handsome Korean Men & Global Dating | LifePartner AI',
    description: 'Meet verified Korean men and global women looking for authentic love, friendship, and romance. 100% Free with zero paywalls.',
    url: 'https://lifepartnerai.in/korean-dating',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Handsome Korean Men & Global Singles Dating'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Date Handsome Korean Men & Global Dating | LifePartner AI',
    description: 'Meet verified Korean men and global women. 100% Free chat, HD video calls, and K-culture compatibility matching.',
    images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200']
  }
};

export default function KoreanDatingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI - Korean Dating & Global Singles Matching',
    'description': 'The premier global dating service connecting handsome Korean men with international women who appreciate Korean culture, language, and meaningful romance.',
    'url': 'https://lifepartnerai.in/korean-dating',
    'areaServed': ['South Korea', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Global'],
    'inLanguage': ['en', 'ko-KR'],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'name': '100% Free Registration, Unlimited Direct Chat & Video Calls'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Why do handsome Korean men choose LifePartner AI for international dating?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Korean men choose LifePartner AI because it connects them directly with verified international women who genuinely appreciate Korean culture, manners, and style. The platform is 100% free with no expensive subscription paywalls, offers instant translation assistance, and enforces mandatory OTP verification to eliminate fake profiles.'
        }
      },
      {
        '@type': 'Question',
        'name': '한국 남성도 해외 여성들과 무료로 대화하고 데이팅할 수 있나요? (Can Korean men chat with foreign women for free?)',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '네, LifePartner AI는 한국 남성 회원에게 100% 무료 다이렉트 채팅, 실시간 번역 지원, HD 화상통화를 제공합니다. 비싼 과금이나 유료 결제 없이 전 세계의 매력적인 여성 회원들과 진지한 만남 및 교제를 시작할 수 있습니다.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI match singles based on K-pop and K-culture interests?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our AI algorithms analyze musical tastes (via Spotify integration), favorite genres, lifestyle preferences, and relationship goals to create deep compatibility scores between Korean bachelors and global admirers.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is the platform safe from bots, romance scams, and fake photos?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every account requires verified email OTP and AI face-matching verification. Our screenshot-proof disappearing snaps and proactive anti-fraud moderation protect both men and women 24/7.'
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
        'name': 'Dating',
        'item': 'https://lifepartnerai.in/dating'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Korean Dating',
        'item': 'https://lifepartnerai.in/korean-dating'
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-950/80 dark:to-purple-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <span>🇰🇷 💖 🌍</span>
            <span>Where Korean Charisma Meets Global Romance | 100% Free Matchmaking</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Meet Handsome Korean Men &amp; Find Your Forever.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600">
              한국 남성을 위한 100% 무료 글로벌 소개팅
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Whether you are a cultured Korean gentleman looking for a beautiful foreign girlfriend, or a woman worldwide captivated by Korean charm, chivalry, and style—LifePartner AI provides the safest, 100% free international bridge. Zero subscription paywalls, verified video reels, and AI compatibility matching.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Join Free &amp; Meet Singles Today</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/korea"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              한국어 서비스 둘러보기
            </Link>
          </div>

          {/* Key Value Prop Pills */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% Free Forever</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">No coins, paywalls or messaging fees</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Mandatory OTP Verification</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero bots, fake accounts or romance scams</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Music className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">K-Pop &amp; Spotify Sync</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Connect through shared music passions</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Languages className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Real-Time Translation</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Flawless Korean-English communication</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Korean Men & International Women Love LifePartner AI */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why Handsome Korean Men &amp; Global Singles Choose LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A modern, cross-cultural dating experience tailored for genuine respect, high emotional intelligence, and lasting chemistry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-6">
                <Flame size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Irresistible Korean Charisma</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                From Seoul’s bustling Gangnam and Hongdae cafes to Busan’s seaside charm, Korean men are celebrated globally for their impeccable style, thoughtful manners, and dedication to their partners. Women worldwide are eagerly searching to meet gentlemen like you.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-rose-600 dark:text-rose-400">
                한국 남성의 세련된 스타일과 배려심에 매료된 해외 회원들이 기다립니다.
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Deep Compatibility &amp; Reels</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Skip stale text biodatas. Share your daily vibe with 24-hour video reels, voice intros, and aesthetic photos. Our AI matches your core personality traits, humor, and relationship aspirations with compatible partners globally.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-purple-600 dark:text-purple-400">
                목소리와 일상 릴스를 통해 진짜 나를 보여주는 스마트 매칭.
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Truly Global Connections</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect with intelligent, educated women across North America, Europe, Singapore, Australia, and worldwide who are genuinely passionate about Korean culture, food, language, and shared travels.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                미국, 유럽, 동남아 등 전 세계 진정성 있는 여성 회원들과의 교류.
              </div>
            </div>
          </div>
        </section>

        {/* Featured Lifestyle & Culture Showcase */}
        <section className="py-16 bg-gradient-to-b from-transparent via-rose-50/50 to-transparent dark:via-rose-950/20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-rose-600 dark:text-rose-400">The K-Romance Experience</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2">
              Shared Passions That Spark Real Love
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Connect over the music, cinema, food, and aesthetics that define your world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-950 mx-auto flex items-center justify-center text-pink-600 mb-4">
                <Headphones size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">K-Pop &amp; Playlists</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bond instantly over favorite artists from BTS and Stray Kids to NewJeans, IU, and Korean Indie gems.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 mx-auto flex items-center justify-center text-indigo-600 mb-4">
                <Tv size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">K-Drama Romance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Experience romance that feels like your favorite drama—thoughtful gestures, late-night cafe calls, and mutual devotion.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 mx-auto flex items-center justify-center text-amber-600 mb-4">
                <Compass size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">Seoul &amp; Travel Vibes</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share photos of Han River sunsets, Bukchon alleys, and Jeju getaways with international partners eager to explore Korea.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 mx-auto flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">Respect &amp; Intent</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No casual games or time-wasters. Designed for singles seeking sincere companionship, emotional safety, and lifelong partnership.
              </p>
            </div>
          </div>
        </section>

        {/* Korean Language Callout Banner */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-950 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 text-xs font-bold uppercase tracking-wider">
                한국 남성을 위한 특별한 혜택
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-3">
                복잡한 외국어 걱정 끝. AI 실시간 번역으로 전 세계 미녀들과 편안하게 소통하세요.
              </h3>
              <p className="mt-4 text-slate-200 text-sm sm:text-base leading-relaxed">
                영어가 유창하지 않아도 걱정하지 마세요. LifePartner AI의 내장 번역 엔진이 한국어 메시지를 자연스러운 영어로, 상대방의 답장을 한국어로 즉시 번역해 드립니다. 100% 무료로 지금 바로 글로벌 인연을 시작하세요.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-full bg-white text-slate-900 font-bold text-sm shadow hover:bg-slate-100 transition-all"
                >
                  지금 무료 회원가입
                </Link>
                <Link
                  href="/korea"
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
                >
                  한국 공식 페이지
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Everything you need to know about Korean and international dating on LifePartner AI.</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Why are women worldwide so attracted to Korean men on LifePartner AI?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Beyond global pop culture, Korean men are admired for their attentiveness, grooming, family values, and modern romantic etiquette. LifePartner AI gives verified Korean bachelors a respected stage where their authenticity is celebrated.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                한국 남성이 이용할 때 유료 결제나 구독 요금이 발생하나요? (Are there fees for Korean users?)
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                전혀 없습니다! LifePartner AI는 기존 데이팅 앱들의 과도한 아이템 결제 유도 시스템을 거부합니다. 가입, 프로필 탐색, 무제한 다이렉트 메시지, 고화질 영상통화까지 모든 핵심 기능이 100% 완전 무료입니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                How does the platform prevent fake profiles and bots?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every user must complete email OTP authentication. Additionally, our automated moderation and AI facial consistency checks inspect user profiles to prevent romance scams and identity theft.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Can I find serious matrimony partners as well as dating?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! When creating your profile, you can set your relationship intent to &apos;Serious Dating&apos; or &apos;Lifelong Marriage&apos;. Our AI matches you only with singles who align with your timeline and life vision.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Meet Your Match?</h2>
            <p className="mt-3 text-rose-100 max-w-xl mx-auto text-sm sm:text-base">
              Join thousands of handsome Korean gentlemen and international singles building authentic love stories today.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-md"
              >
                Create Free Profile
              </Link>
              <Link
                href="/international-men"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-rose-700/60 hover:bg-rose-700/80 text-white font-bold border border-rose-300/30 transition-all"
              >
                Explore International Singles
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
