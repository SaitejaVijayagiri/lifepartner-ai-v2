import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Malaysia | Aplikasi Cari Jodoh & Matrimoni Selamat untuk Wanita | 100% Percuma VIP',
  description: 'Aplikasi cari jodoh & kahwin AI paling dipercayai untuk wanita di Malaysia. 100% Percuma Queen VIP seumur hidup, mesej terus tanpa had, nombor telefon terlindung & AI Anti-Creep Shield. KL, Selangor, Pulau Pinang, Johor.',
  keywords: [
    'aplikasi cari jodoh malaysia',
    'cari jodoh muslim selamat',
    'dating app malaysia',
    'biro jodoh online selamat',
    'cari jodoh percuma wanita',
    'matrimoni malaysia',
    'safe dating app malaysia',
    'kuala lumpur singles',
    'penang dating',
    'johor dating'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/malaysia',
    languages: {
      'ms-MY': 'https://lifepartnerai.in/malaysia',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Malaysia | Cari Jodoh Selamat & 100% VIP Percuma untuk Wanita',
    description: 'Bebas gangguan dan penipuan. Profil disahkan OTP dengan nombor telefon terlindung dan AI pencegahan gangguan.',
    url: 'https://lifepartnerai.in/malaysia',
    siteName: 'LifePartner AI Malaysia',
    locale: 'ms_MY',
    type: 'website'
  }
};

export default function MalaysiaLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Malaysia',
    'description': 'Platform cari jodoh dan perkahwinan AI paling selamat khusus untuk wanita di Malaysia dengan status Queen VIP percuma.',
    'url': 'https://lifepartnerai.in/malaysia',
    'areaServed': 'Malaysia',
    'inLanguage': 'ms-MY',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'MYR',
      'name': 'Queen VIP Percuma Seumur Hidup untuk Wanita & Mesej Terus Tanpa Had'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Adakah platform ini benar-benar percuma untuk wanita di Malaysia?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ya, 100% percuma! Semua wanita yang mendaftar secara automatik menerima status Queen VIP seumur hidup dengan mesej tanpa had, 100 syiling alu-aluan, dan perlindungan privasi penuh tanpa sebarang yuran bulanan.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Bagaimanakah privasi dan nombor telefon saya dilindungi?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Nombor telefon peribadi dan WhatsApp anda disembunyikan sepenuhnya. Komunikasi dilakukan melalui sembang peribadi dengan perlindungan AI Anti-Creep dan snap foto anti-tangkapan skrin (anti-screenshot).'
        }
      },
      {
        '@type': 'Question',
        'name': 'Adakah platform ini sesuai untuk mencari jodoh perkahwinan yang serius?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Sangat sesuai. Semua ahli wajib melepasi pengesahan OTP emel. Anda boleh menetapkan mod carian kepada Perkahwinan Serius (Matrimony) untuk bertemu pasangan yang berniat mendirikan rumah tangga.'
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
            <span>🇲🇾</span>
            <span>Pelancaran Rasmi Malaysia | 100% Percuma Queen VIP untuk Wanita</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Cari Jodoh di Malaysia dengan Selamat,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Tanpa Rasa Risau & Privasi Terjamin.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Katakan selamat tinggal kepada spam dan gangguan mesej tidak senonoh. 
            LifePartner AI melindungi nombor peribadi anda dengan AI Anti-Creep Shield, pengesahan OTP tulen, dan sembang langsung 100% percuma.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=malaysia"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Daftar Percuma (VIP Segera)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Kelebihan Queen VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Percuma untuk Wanita</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mesej tanpa had & syiling</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sekat gangguan secara automatik</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Nombor & Privasi Terlindung</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Privasi anda kekal terpelihara</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Pengesahan OTP Wajib</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tiada akaun palsu atau bot</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Keistimewaan LifePartner AI untuk Wanita Malaysia
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Direka khas untuk membantu anda mencari calon suami atau pasangan hidup dengan adab, sopan, dan selamat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Keahlian Queen VIP Percuma Seumur Hidup</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Wanita tidak perlu membayar langganan bulanan yang mahal. Hantar mesej terus, sembang video berdefinisi tinggi, dan terima 100 syiling alu-aluan secara percuma.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Perisai AI Anti-Creep & Penapis Mesej</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Algoritma AI menapis perkataan kasar atau permintaan nombor telefon peribadi yang melampau secara serta-merta. Pelaku salah laku akan disekat serta-merta daripada platform.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Snap Foto Anti-Screenshot Hilang Sendiri</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Kongsi gambar peribadi melalui fungsi snap yang hilang selepas dilihat, dilengkapi pencegahan tangkapan skrin bagi memastikan privasi gambar anda kekal selamat.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Temui Pasangan di Seluruh Malaysia</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Cari calon yang serasi di Kuala Lumpur, Selangor, Pulau Pinang, Johor, Perak, Melaka, Sabah dan Sarawak, mahupun warga Malaysia di luar negara.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Menghubungkan Calon Pasangan di Seluruh Negeri Malaysia
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Kuala Lumpur, Petaling Jaya, Shah Alam, Pulau Pinang, Johor Bahru, Ipoh, Melaka, Kota Kinabalu, dan Kuching.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Kuala Lumpur', 'Selangor (PJ & Shah Alam)', 'Pulau Pinang', 'Johor Bahru', 'Ipoh', 'Melaka', 'Kuantan', 'Kota Kinabalu', 'Kuching', 'Rakyat Malaysia Luar Negara'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Soalan Lazim (FAQ Malaysia)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Adakah aplikasi ini sesuai untuk mencari jodoh perkahwinan berlandaskan adab?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ya! LifePartner AI menekankan kesopanan, perkenalan yang bermaruah, dan niat yang jelas untuk perkahwinan tanpa budaya songsang atau gangguan.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Adakah nombor telefon saya akan terdedah?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tidak sama sekali. Nombor telefon anda tidak pernah dipaparkan secara umum. Segala perbualan dilakukan dalam ruang sembang selamat aplikasi.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Bagaimana jika ada pengguna yang bersikap tidak sopan?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Anda boleh menekan butang Sekat (Block) atau Lapor (Report) dengan sekali klik. Sistem AI kami juga menyekat akaun bermasalah secara automatik.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=malaysia"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Mula Percuma di Malaysia</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
