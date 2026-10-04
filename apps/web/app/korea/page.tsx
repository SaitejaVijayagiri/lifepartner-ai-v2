import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI 한국 | 100% 무료 AI 데이팅 & 결혼 매칭 플랫폼 | 서울·부산·전국',
  description: '과금 유도와 유료 결제 없는 진짜 무료 글로벌 데이팅 & 결혼 매칭 앱 LifePartner AI. 이메일 OTP 본인인증 필수, AI 성향 분석, 캡처 방지 스냅, 24시간 스토리로 서울 및 전 세계 싱글과 안전하게 대화하세요.',
  keywords: [
    '무료 데이팅 앱',
    '소개팅 앱 추천',
    'AI 소개팅',
    '결혼정보 매칭',
    '글로벌 데이팅',
    '서울 소개팅',
    '부산 소개팅',
    '진지한 연애',
    '외국인 친구 사귀기',
    '국제연애 매칭',
    '안전한 소개팅 앱'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/korea',
    languages: {
      'ko-KR': 'https://lifepartnerai.in/korea',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI 한국 | 100% 무료 AI 데이팅 & 결혼 매칭',
    description: '결제 강요 없는 무제한 다이렉트 채팅과 HD 영상통화. 철저한 본인 인증과 AI 성향 분석으로 믿을 수 있는 인연을 찾으세요.',
    url: 'https://lifepartnerai.in/korea',
    siteName: 'LifePartner AI',
    locale: 'ko_KR',
    type: 'website'
  }
};

export default function KoreaLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Korea (라이프파트너 AI 한국)',
    'description': '한국 싱글을 위한 100% 무료 AI 데이팅 및 결혼 매칭 서비스.',
    'url': 'https://lifepartnerai.in/korea',
    'areaServed': 'South Korea',
    'inLanguage': 'ko-KR',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'KRW',
      'name': '100% 무료 가입 및 다이렉트 채팅'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '정말 모든 기능이 100% 무료인가요?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '네, 회원가입부터 프로필 탐색, 메시지 전송, 음성 및 HD 영상통화까지 유료 결제 없이 100% 무료로 이용하실 수 있습니다.'
        }
      },
      {
        '@type': 'Question',
        'name': '가짜 계정이나 알바 회원은 어떻게 차단하나요?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '가입 시 이메일 OTP(일회용 인증번호) 본인 인증을 완료해야만 로그인이 승인되며, AI 기반 실시간 필터링과 유해 사용자 즉각 차단 시스템이 상시 작동합니다.'
        }
      },
      {
        '@type': 'Question',
        'name': '어떤 지역의 회원들을 만날 수 있나요?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '서울, 경기, 인천, 부산, 대구, 대전, 광주 등 전국 주요 도시는 물론, 해외 거주 한국인 및 다양한 글로벌 싱글들과 매칭될 수 있습니다.'
        }
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

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold mb-6">
            <span>🇰🇷</span>
            <span>한국 공식 서비스 오픈 | 100% 무료 & 전원 OTP 인증</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            비싼 과금과 유료 결제는 이제 그만.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600">
              AI가 찾아주는 진짜 나만의 인연.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            하트나 다이아 결제 없이 메시지부터 영상통화까지 무제한 무료.
            철저한 이메일 OTP 인증과 AI 가치관 분석으로 서울, 수도권 및 전 세계의 진정성 있는 사람들과 연결됩니다.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>무료 가입하고 시작하기</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              로그인
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% 완전 무료</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">채팅·통화 유료 과금 없음</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">전원 OTP 인증</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">유령·알바 계정 원천 차단</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI 성향 분석</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">가치관 및 라이프스타일 매칭</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">안심 프라이버시</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">캡처 방지 스냅 & 철저한 보안</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Core Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              한국 사용자들이 LifePartner AI를 선택하는 4가지 이유
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              기존 소개팅 앱의 무의미한 과금과 불투명한 매칭에 지친 분들을 위해 설계되었습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 flex items-center justify-center mb-6">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. 과금 없는 100% 무료 다이렉트 대화</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                매칭 후 메시지를 보내려고 할 때마다 결제를 유도하던 일반적인 앱과 다릅니다. 메시지, 보이스톡, 고화질 영상통화까지 모두 무료로 이용하실 수 있습니다.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. 철저한 이메일 OTP 본인 인증</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                가입 시 전원 유효한 이메일 OTP 인증을 완료해야만 로그인이 승인됩니다. 가짜 프로필, 사기성 유저, 유령 계정을 사전에 원천 차단하여 안전한 커뮤니티를 보장합니다.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Music size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. 음악 취향 매칭 & 24시간 스토리</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                스포티파이 최애 플레이리스트를 연동하여 음악 감성으로 대화를 시작하세요. 사진과 영상으로 올리는 24시간 스토리를 통해 상대방의 자연스러운 일상을 엿볼 수 있습니다.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. 화면 캡처 방지 스냅 (프라이버시 안심)</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                열람 후 즉시 삭제되는 스냅 사진 기능과 화면 캡처 방지 기술이 적용되어, 개인 사진 유출 걱정 없이 자연스럽고 진솔한 모습을 공유할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Local Area Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-indigo-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            서울, 전국 각지 및 글로벌 매칭
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            강남, 홍대, 판교 등 서울·수도권은 물론 부산, 대구, 대전 등 전국 각지의 싱글과 해외 거주 인연까지 원하는 지역과 언어로 찾을 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['서울 (강남·마포·서초)', '경기·판교·인천', '부산·경남', '대구·경북', '대전·세종', '광주·전라', '해외 거주·글로벌 매칭'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            자주 묻는 질문 (FAQ)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. 가입 및 이용이 정말 무료인가요?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. 네, LifePartner AI는 회원 가입, 매칭, 대화 및 영상통화까지 강제 유료 과금 없이 100% 무료로 이용하실 수 있습니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. 본인 인증은 필수인가요?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. 네, 모든 회원은 가입 시 전송되는 6자리 이메일 OTP 인증을 마쳐야만 플랫폼 이용이 승인됩니다. 허위 계정이나 악성 유저를 방지하기 위한 필수 안전 조치입니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. 어떤 연령대의 회원들이 주로 활동하나요?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. 20대부터 40대까지 진지한 연애나 미래의 배우자를 찾고자 하는 성인 싱글들이 중심을 이루고 있으며, 취향과 가치관을 공유하는 따뜻한 커뮤니티를 지향합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                지금, 당신에게 꼭 맞는 인연을 찾아보세요
              </h2>
              <p className="text-rose-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                가입은 1분이면 완료됩니다. OTP 본인 인증 후 바로 이상형과의 매칭과 자유로운 대화가 시작됩니다.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-extrabold text-base shadow-xl hover:scale-105 transition-all"
              >
                <span>무료 회원가입 시작하기</span>
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
