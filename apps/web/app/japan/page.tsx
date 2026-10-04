import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI 日本 | 100%無料のAI婚活＆マッチングアプリ | 東京・大阪・全国対応',
  description: '日本向け完全無料のAI婚活・マッチングアプリ「LifePartner AI」。課金なしで直接チャット・ビデオ通話可能。本人確認必須・OTP認証・スクショ防止スナップで、安心・安全な真剣の出会いを。',
  keywords: [
    'マッチングアプリ',
    '無料マッチングアプリ',
    '婚活アプリ おすすめ',
    'AIマッチングアプリ',
    '完全無料 恋活',
    '真剣な出会い',
    '東京 マッチングアプリ',
    '大阪 マッチングアプリ',
    '国際結婚 マッチング',
    '海外移住 出会い',
    '身元確認 安全 デート'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/japan',
    languages: {
      'ja-JP': 'https://lifepartnerai.in/japan',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI 日本 | 100%無料のAI婚活＆マッチングアプリ',
    description: '月額料金ゼロ・強制課金なし。AI相性診断と本人確認で安心の出会い。東京・大阪・日本全国および世界中の独身者と繋がる。',
    url: 'https://lifepartnerai.in/japan',
    siteName: 'LifePartner AI',
    locale: 'ja_JP',
    type: 'website'
  }
};

export default function JapanLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Japan (ライフパートナーAI 日本)',
    'description': '日本向け100%無料のAIマッチング＆婚活プラットフォーム。',
    'url': 'https://lifepartnerai.in/japan',
    'areaServed': 'Japan',
    'inLanguage': 'ja-JP',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'JPY',
      'name': '完全無料登録・直接チャット'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '本当に完全無料で利用できますか？',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'はい、会員登録、プロフィール閲覧、メッセージ送信、通話まですべて追加課金なしの100%無料でご利用いただけます。'
        }
      },
      {
        '@type': 'Question',
        'name': 'サクラや業者の対策はされていますか？',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '全会員がメールアドレスによるOTPワンタイムパスワード認証を完了して初めてログイン可能となります。AIによる不適切コンテンツ検知と不正利用者の即時ブロック機能も備わっています。'
        }
      },
      {
        '@type': 'Question',
        'name': '日本のどの地域に対応していますか？',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': '東京、大阪、横浜、名古屋、福岡、札幌をはじめ、日本全国の地域および海外在住の日本人やグローバルな出会いに対応しています。'
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
            <span>🇯🇵</span>
            <span>日本公式ローンチ | 100% 無料・本人確認制 AI 婚活</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            月額課金にサヨナラ。<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
              AIが導く、安心・誠実な出会い。
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            従来の高額なマッチングアプリとは違い、メッセージ送信もビデオ通話も追加料金ゼロ。
            OTP本人確認とAI相性診断で、東京・大阪・全国および世界中の素敵なパートナーと出会えます。
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>無料で今すぐ始める</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              ログイン
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% 完全無料</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">メッセージ・通話も課金なし</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">全会員 OTP認証</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">サクラ・業者を徹底排除</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI 相性診断</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">価値観・ライフスタイル重視</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">プライバシー保護</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">スクショ防止＆安心設計</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              日本の皆様に LifePartner AI が選ばれる4つの理由
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              形式的なプロフィールや高額な月額料金に疲れた方へ、新しい出会いの体験をお届けします。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. 課金なし・無制限ダイレクトチャット</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                一般的なマッチングアプリのように、男性会員だけ毎月4,000円〜5,000円を払う必要はありません。男女ともにメッセージ、画像送信、HDビデオ通話まですべて無料で自由にお話しいただけます。
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. 厳格な本人確認（ワンタイムOTP認証）</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                当プラットフォームでは登録時に全ユーザーへメール認証コード（OTP）を発行し、確認が完了した実在の会員のみログイン可能です。サクラやなりすましを防止し、健全なコミュニティを維持しています。
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Music size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. 音楽相性マッチング＆24時間ストーリー</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Spotifyのお気に入り曲を同期して、趣味や感性でマッチング。写真や動画の24時間ストーリー機能で、お相手の日常の自然な姿を事前に知ることができます。
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. スクショ防止スナップ（プライバシー配慮）</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                閲覧後に自動で消えるスナップ写真機能を採用。スクリーンショット防止技術により、身バレやプライベート写真の無断保存を防ぎ、安心して自己表現していただけます。
              </p>
            </div>
          </div>
        </section>

        {/* Local Area Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-indigo-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            日本全国および世界各地のパートナー候補
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            東京、神奈川、大阪、愛知、福岡、北海道をはじめ、グローバルで活躍する日本人や日本文化に深い理解を持つ誠実な海外ユーザーとも繋がることができます。
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['東京', '大阪', '横浜', '名古屋', '福岡', '札幌', '京都', '神戸', '仙台', '海外在住・国際婚活'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            よくあるご質問（FAQ）
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. 本当に無料で利用できますか？</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. はい。LifePartner AI は基本利用料、マッチング、メッセージのやり取り、音声通話・ビデオ通話まで完全無料です。有料プランの強制購入なしで安心してご利用いただけます。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. 安全対策や会員認証はどうなっていますか？</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. 登録時にメールアドレス宛てに送信される6桁のOTP（ワンタイムパスワード）認証を完了しない限り、アカウントのログインや利用はできません。また、24時間の通報監視体制とAIコンテンツフィルターで安全を確保しています。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. どのような人が利用していますか？</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A. 20代〜40代を中心に、真剣に結婚や将来のパートナーを探している方、共通の趣味や価値観を大切にしたい独身者が多数登録しています。
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                理想のパートナーと、今日出会いましょう
              </h2>
              <p className="text-pink-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
                登録はわずか1分。本人確認完了後、すぐに素敵な相手とのマッチングとチャットがスタートします。
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-extrabold text-base shadow-xl hover:scale-105 transition-all"
              >
                <span>無料登録を始める</span>
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
