import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI ประเทศไทย | แอพหาคู่และหาคู่แต่งงานสำหรับผู้หญิง ฟรี VIP ตลอดชีพ | ปลอดภัย 100%',
  description: 'แอพหาคู่และหาคู่แต่งงาน AI สำหรับผู้หญิงไทย แชทตรงและโทรวิดีโอฟรี 100% ไม่มีค่าธรรมเนียมแอบแฝง ปลอดภัยด้วย AI Anti-Creep Shield ป้องกันสกรีนช็อตและปกป้องเบอร์โทรศัพท์ส่วนตัว.',
  keywords: [
    'แอพหาคู่',
    'หาคู่แต่งงาน',
    'แอพหาคู่ ปลอดภัย',
    'หาคู่จริงจัง ผู้หญิง',
    'หาคู่ต่างชาติ ปลอดภัย',
    'หาแฟน กรุงเทพ',
    'Thailand dating app',
    'safe dating app for women thailand',
    'free dating app thailand',
    'bangkok singles'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/thailand',
    languages: {
      'th-TH': 'https://lifepartnerai.in/thailand',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI ประเทศไทย | แอพหาคู่สำหรับผู้หญิง ปลอดภัย ฟรี VIP ตลอดชีพ',
    description: 'แชทฟรีไม่จำกัด ปลอดภัยด้วยระบบยืนยันตัวตน OTP และ AI ป้องกันการคุกคาม ค้นหาคนที่ใช่ทั้งในไทยและทั่วโลก.',
    url: 'https://lifepartnerai.in/thailand',
    siteName: 'LifePartner AI Thailand',
    locale: 'th_TH',
    type: 'website'
  }
};

export default function ThailandLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Thailand (ไลฟ์พาร์ทเนอร์ AI ประเทศไทย)',
    'description': 'แพลตฟอร์มหาคู่และหาคู่แต่งงาน AI ที่ปลอดภัยที่สุดสำหรับผู้หญิงในประเทศไทย ฟรี VIP ตลอดชีพ.',
    'url': 'https://lifepartnerai.in/thailand',
    'areaServed': 'Thailand',
    'inLanguage': 'th-TH',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'THB',
      'name': 'ฟรี Queen VIP สำหรับผู้หญิงตลอดชีพ & แชทตรงฟรี'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'ผู้หญิงใช้งานได้ฟรีจริงหรือไม่?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'จริง 100%! สมาชิกผู้หญิงทุกคนจะได้รับสถานะ Queen VIP ตลอดชีพ พร้อมแชทตรงฟรีไม่จำกัด เหรียญต้อนรับ 100 เหรียญ และระบบความปลอดภัยระดับพรีเมียมโดยไม่มีค่าใช้จ่าย'
        }
      },
      {
        '@type': 'Question',
        'name': 'ระบบป้องกันการคุกคามและข้อมูลส่วนตัวทำงานอย่างไร?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'เบอร์โทรศัพท์และข้อมูลติดต่อส่วนตัวของคุณจะถูกซ่อนไว้โดยอัตโนมัติ AI Anti-Creep Shield จะช่วยตรวจจับและบล็อกข้อความที่ไม่สุภาพทันที พร้อมระบบสแนปป้องกันการแคปหน้าจอ'
        }
      },
      {
        '@type': 'Question',
        'name': 'สามารถหาคู่ได้ทั้งคนไทยและชาวต่างชาติหรือไม่?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'ได้ทั้งสองแบบ คุณสามารถเลือกจับคู่กับคนในกรุงเทพฯ เชียงใหม่ ภูเก็ต หรือคนต่างชาติที่มีโปรไฟล์ผ่านการยืนยันตัวตน OTP เรียบร้อยแล้ว'
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
            <span>🇹🇭</span>
            <span>เปิดตัวในประเทศไทยอย่างเป็นทางการ | ผู้หญิงรับสิทธิ์ VIP ฟรีตลอดชีพ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            แอพหาคู่ที่ให้ความสำคัญกับความปลอดภัย<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              และความสบายใจของผู้หญิงเป็นอันดับ 1
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            หมดปัญหากวนใจกับการขอเบอร์โทรตรงหรือข้อความคุกคามที่ไม่เหมาะสม LifePartner AI มอบระบบความปลอดภัยขั้นสูง 
            ซ่อนเบอร์โทรส่วนตัว แชทตรงฟรีไม่จำกัด และยืนยันตัวตนด้วยรหัส OTP 100%
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=thailand"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>สมัครสมาชิกฟรี (รับสิทธิ์ VIP ทันที)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>ดูสิทธิพิเศษ Queen VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">ผู้หญิงใช้ฟรี 100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">แชทไม่จำกัด & เหรียญฟรี</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI ป้องกันการคุกคาม</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">บล็อกพฤติกรรมไม่เหมาะสม</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">ซ่อนเบอร์โทรส่วนตัว</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">รักษาความเป็นส่วนตัวสูงสุด</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">ยืนยันตัวตน OTP</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">ไม่มีโปรไฟล์ปลอมหรือบอท</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              ทำไมสาวไทยถึงเลือก LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              สร้างขึ้นเพื่อผู้หญิงที่มองหาความสัมพันธ์ที่จริงจังและปลอดภัย โดยไม่ต้องกังวลเรื่องการละเมิดความเป็นส่วนตัว
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. สิทธิ์ VIP ตลอดชีพสำหรับผู้หญิง</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                ส่งข้อความ แชทตรง วิดีโอคอล HD ได้ฟรีตลอดชีพโดยไม่ต้องจ่ายค่าแพ็กเกจรายเดือน พร้อมรับ 100 เหรียญสำหรับส่งของขวัญแอนิเมชันน่ารักๆ ในห้องแชท
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                ระบบ AI ช่วยตรวจจับคำพูดหยาบคาย ลามก หรือการทักทายที่คุกคามในข้อความแชท หากพบพฤติกรรมที่ไม่เหมาะสม บัญชีผู้กระทำความผิดจะถูกระงับทันที
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. สแนปหายไปเอง & กันสกรีนช็อต</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                แชร์ภาพถ่ายแบบสแนปที่ดูได้เพียงครั้งเดียวแล้วหายไป พร้อมระบบแจ้งเตือนและป้องกันการแคปหน้าจอ เพื่อให้คุณมั่นใจได้ว่ารูปภาพส่วนตัวจะไม่ถูกบันทึก
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. พบคนที่ใช่ทั้งในไทยและทั่วโลก</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                ไม่ว่าคุณจะมองหาคนไทยที่จริงจัง หรือชาวต่างชาติคุณภาพดีในกรุงเทพฯ หรือต่างประเทศ ระบบ AI จะช่วยคัดกรองคนที่เข้ากับค่านิยมและวิถีชีวิตของคุณมากที่สุด
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            ครอบคลุมทุกพื้นที่ในประเทศไทยและสากล
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            เชื่อมต่อคนโสดคุณภาพดีในกรุงเทพฯ, เชียงใหม่, ภูเก็ต, พัทยา, ขอนแก่น, นนทบุรี และชาวต่างชาติที่อาศัยอยู่ในไทย
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['กรุงเทพฯ (Bangkok)', 'เชียงใหม่ (Chiang Mai)', 'ภูเก็ต (Phuket)', 'พัทยา (Pattaya)', 'ขอนแก่น (Khon Kaen)', 'นนทบุรี', 'หัวหิน', 'หาคู่ต่างชาติ (Expats)'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            คำถามที่พบบ่อย (FAQ ประเทศไทย)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. ผู้หญิงใช้ฟรีจริงหรือไม่? มีค่าใช้จ่ายแอบแฝงไหม?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ไม่มีค่าใช้จ่ายแอบแฝงใดๆ ผู้หญิงจะได้รับการอัปเกรดเป็น Queen VIP ทันทีที่สมัคร พร้อมส่งข้อความ แชทตรง และใช้วิดีโอคอลได้ฟรี 100%
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. การยืนยันตัวตนด้วย OTP คืออะไร?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                สมาชิกทุกคนต้องยืนยันรหัสความปลอดภัยทางอีเมลก่อน จึงจะสามารถเข้าใช้งานระบบได้ เพื่อให้มั่นใจว่าเป็นบุคคลจริง ไม่ใช่บอทหรือบัญชีปลอม
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. มีทั้งโหมดหาแฟนและหาคู่แต่งงานจริงจังหรือไม่?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                มีทั้งสองโหมด คุณสามารถปรับตั้งเป้าหมายในโปรไฟล์ได้ว่าต้องการหาแฟน (Dating) หรือหาคู่เพื่อการแต่งงาน (Matrimony)
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=thailand"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>เริ่มต้นใช้งานฟรีในประเทศไทย</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
