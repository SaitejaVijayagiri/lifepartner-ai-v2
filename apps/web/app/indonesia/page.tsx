import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Indonesia | Aplikasi Cari Jodoh & Taaruf Aman Khusus Wanita | 100% Gratis VIP',
  description: 'Aplikasi cari jodoh & pernikahan AI terpercaya untuk wanita di Indonesia. 100% Gratis Queen VIP seumur hidup, chat langsung tanpa batas, nomor WhatsApp disembunyikan & AI Anti-Creep Shield. Jakarta, Surabaya, Bandung, Medan, Bali.',
  keywords: [
    'aplikasi cari jodoh indonesia',
    'aplikasi taaruf online aman',
    'cari jodoh gratis wanita',
    'dating app indonesia terpercaya',
    'biro jodoh online aman',
    'cari suami mapan',
    'safe dating app indonesia',
    'cari jodoh jakarta',
    'cari jodoh surabaya',
    'cari jodoh bandung'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/indonesia',
    languages: {
      'id-ID': 'https://lifepartnerai.in/indonesia',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Indonesia | Cari Jodoh & Taaruf Aman 100% Gratis VIP Wanita',
    description: 'Bebas dari penipuan dan pelecehan. Profil asli terverifikasi OTP dengan privasi nomor HP terjaga.',
    url: 'https://lifepartnerai.in/indonesia',
    siteName: 'LifePartner AI Indonesia',
    locale: 'id_ID',
    type: 'website'
  }
};

export default function IndonesiaLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Indonesia',
    'description': 'Platform cari jodoh dan pernikahan AI paling aman khusus wanita di Indonesia dengan fasilitas Queen VIP gratis seumur hidup.',
    'url': 'https://lifepartnerai.in/indonesia',
    'areaServed': 'Indonesia',
    'inLanguage': 'id-ID',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'IDR',
      'name': 'Gratis Queen VIP Seumur Hidup untuk Wanita & Chat Langsung'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Apakah benar-benar 100% gratis untuk wanita di Indonesia?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ya! Semua pengguna wanita otomatis mendapatkan status Queen VIP seumur hidup, gratis kirim pesan tanpa batas, gratis video call HD, dan 100 koin selamat datang tanpa dipungut biaya langganan.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Bagaimana cara aplikasi melindungi nomor telepon dan privasi saya?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Nomor telepon dan kontak pribadi Anda tidak akan pernah ditampilkan secara publik. Komunikasi dilakukan melalui chat terlindungi dengan fitur AI Anti-Creep dan foto sekali lihat anti-screenshot.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Apakah aplikasi ini cocok untuk niat taaruf dan menikah serius?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Sangat cocok. Anda dapat memilih mode Pernikahan Serius (Matrimony) untuk menyaring calon pasangan yang memiliki niat tulus membangun rumah tangga dan berkomitmen.'
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
            <span>🇮🇩</span>
            <span>Peluncuran Resmi Indonesia | 100% Gratis Queen VIP Khusus Wanita</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Cari Jodoh di Indonesia dengan Aman,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Prioritas Privasi & Perlindungan Wanita.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tak perlu khawatir dimintai nomor WhatsApp sembarangan atau menerima pesan tak pantas. 
            LifePartner AI menyembunyikan kontak pribadi Anda, dilengkapi AI Anti-Creep Shield, verifikasi OTP asli, dan chat langsung 100% gratis.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=indonesia"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Daftar Gratis (Aktivasi VIP Instan)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Lihat Hak Istimewa VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Gratis Khusus Wanita</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chat tanpa batas & 100 koin</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Blokir pesan tidak sopan</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Nomor Kontak Disembunyikan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Privasi terjaga 100%</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Verifikasi OTP Wajib</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bebas akun palsu dan bot</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Keunggulan LifePartner AI untuk Wanita Indonesia
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Menghadirkan kenyamanan dan rasa aman dalam mencari calon imam dan pasangan seumur hidup.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Bebas Biaya Langganan untuk Wanita</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Anda tidak perlu membayar jutaan rupiah untuk paket bulanan. Nikmati kebebasan kirim pesan, panggilan video, serta bonus 100 koin untuk memberi hadiah animasi langsung di chat.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep & Deteksi Pelecehan</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Teknologi AI menyaring kata-kata tidak sopan atau desakan nomor telepon pribadi secara otomatis sebelum sampai ke pesan Anda. Pelanggar langsung diblokir permanen.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Foto Sekali Lihat Anti-Screenshot</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Kirim foto diri dengan fitur snap yang otomatis hilang setelah dilihat dan dilindungi pencegah tangkapan layar, menjaga foto pribadi Anda agar tidak disalahgunakan.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Jangkauan Seluruh Kota di Indonesia</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Temukan jodoh idaman di Jabodetabek, Surabaya, Bandung, Medan, Semarang, Yogyakarta, Makassar, Bali, maupun WNI yang bekerja di luar negeri.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Menghubungkan Calon Pasangan di Seluruh Wilayah Indonesia
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Jakarta, Bogor, Depok, Tangerang, Bekasi, Bandung, Surabaya, Medan, Semarang, Yogyakarta, Denpasar, Makassar, Palembang, dan WNI Mancanegara.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Jakarta (Jabodetabek)', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Yogyakarta', 'Bali (Denpasar)', 'Makassar', 'Palembang', 'WNI Luar Negeri'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Pertanyaan yang Sering Diajukan (FAQ Indonesia)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Apakah data dan nomor HP saya aman dari kebocoran?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sangat aman. Platform kami menggunakan sistem masked contact, di mana kontak pribadi Anda tidak akan pernah tampak di profil umum.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Mengapa semua pengguna harus verifikasi OTP?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Verifikasi kode OTP melalui email dilakukan demi menjaga komunitas yang bersih dari bot, scammer, dan penipu dunia maya.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Apakah tersedia fitur taaruf yang sopan dan islami?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ya! Anda dapat mengisi biodata taaruf, visi pernikahan, dan kriteria pasangan secara terhormat tanpa interaksi yang melewati batas kesopanan.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=indonesia"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Mulai Cari Jodoh Gratis di Indonesia</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
