import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Việt Nam | Ứng Dụng Hẹn Hò & Kết Hôn An Toàn Cho Phụ Nữ | 100% Miễn Phí VIP',
  description: 'Nền tảng kết đôi AI an toàn nhất cho phụ nữ tại Việt Nam. 100% Miễn phí trọn đời Queen VIP, nhắn tin trực tiếp không giới hạn, ẩn số điện thoại & AI Anti-Creep Shield. TP.HCM, Hà Nội, Đà Nẵng & toàn quốc.',
  keywords: [
    'app hen ho uy tin',
    'tim ban doi ket hon',
    'app hen ho an toan cho nu',
    'tim nguoi yeu nghiem tuc',
    'tim chong ngoai quoc uy tin',
    'hen ho sai gon',
    'hen ho ha noi',
    'vietnam dating app',
    'safe dating app vietnam'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/vietnam',
    languages: {
      'vi-VN': 'https://lifepartnerai.in/vietnam',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Việt Nam | Kết Đôi & Kết Hôn An Toàn 100% Miễn Phí Cho Nữ',
    description: 'Không lo spam hay quấy rối. Hồ sơ xác thực OTP, bảo mật thông tin liên lạc và hỗ trợ ảnh tự xóa chống chụp màn hình.',
    url: 'https://lifepartnerai.in/vietnam',
    siteName: 'LifePartner AI Vietnam',
    locale: 'vi_VN',
    type: 'website'
  }
};

export default function VietnamLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Vietnam (LifePartner AI Việt Nam)',
    'description': 'Nền tảng hẹn hò và kết hôn AI an toàn nhất dành riêng cho phụ nữ tại Việt Nam với quyền lợi Queen VIP trọn đời.',
    'url': 'https://lifepartnerai.in/vietnam',
    'areaServed': 'Vietnam',
    'inLanguage': 'vi-VN',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'VND',
      'name': 'Miễn phí Queen VIP trọn đời cho phụ nữ & nhắn tin trực tiếp'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Phụ nữ có được sử dụng hoàn toàn miễn phí không?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Đúng vậy! Tất cả thành viên nữ đều được tự động kích hoạt quyền lợi Queen VIP trọn đời: nhắn tin không giới hạn, gọi video call HD và 100 xu tặng kèm mà không tốn bất kỳ chi phí duy trì nào.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Làm thế nào để bảo vệ số điện thoại và quyền riêng tư của tôi?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Số điện thoại và Zalo của bạn được ẩn hoàn toàn. Cuộc trò chuyện diễn ra qua hệ thống bảo mật với AI Anti-Creep tự động chặn hành vi thô lỗ và ảnh tự biến mất chống chụp màn hình.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Có thể tìm bạn đời trong nước lẫn quốc tế không?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Có! Bạn có thể kết nối với người độc thân tại TP.HCM, Hà Nội, Đà Nẵng hoặc những người nước ngoài đàng hoàng đã được xác thực OTP rõ ràng.'
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
            <span>🇻🇳</span>
            <span>Chính thức ra mắt tại Việt Nam | 100% Miễn phí Queen VIP cho Nữ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Tìm Bạn Đời Nghiêm Túc tại Việt Nam,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Ưu Tiên Sự An Toàn & Tôn Trọng Phụ Nữ.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Không còn nỗi lo bị làm phiền, lộ số điện thoại hay những tin nhắn khiếm nhã.
            LifePartner AI ẩn số liên lạc cá nhân, tích hợp AI Anti-Creep Shield, xác minh OTP chính chủ và nhắn tin miễn phí 100%.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=vietnam"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Đăng Ký Miễn Phí (Nhận VIP Ngay)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Đặc Quyền Queen VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Miễn phí cho Nữ</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Trò chuyện thả ga & tặng xu</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Chống Quấy Rối</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chặn hành vi thô lỗ tức thì</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Ẩn Số Điện Thoại</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bảo mật liên hệ tuyệt đối</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Xác Thực OTP Bắt Buộc</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Không có nick ảo hay bot</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Ưu Thế Của LifePartner AI Dành Cho Phụ Nữ Việt
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Môi trường văn minh, lịch sự dành cho những ai tìm kiếm hôn nhân và tình cảm lâu dài.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Đặc Quyền Queen VIP Trọn Đời</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Phụ nữ không phải trả phí đăng ký hay mua gói nhắn tin. Nhận ngay 100 xu để tặng quà hoạt hình dễ thương và nổi bật hơn trong mắt đối phương.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Khiên AI Anti-Creep Bảo Vệ Tự Động</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Bộ lọc AI quét hội thoại theo thời gian thực để ngăn chặn những lời mời thô thiển hoặc đòi số điện thoại quá sớm. Người dùng vi phạm sẽ bị khóa tài khoản vĩnh viễn.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Ảnh Snap Tự Xóa & Chống Chụp Màn Hình</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Chia sẻ khoảnh khắc đời thường bằng tính năng snap biến mất sau khi xem, có tính năng ngăn chặn chụp màn hình giúp hình ảnh cá nhân không bị lưu trữ trái phép.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Kết Đôi Tại Việt Nam & Quốc Tế</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tìm bạn đời lý tưởng tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng hoặc giao lưu cùng kiều bào và người nước ngoài có học thức, chân thành và nghiêm túc.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Kết Nối Thành Viên Trên Toàn Lãnh Thổ Việt Nam
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            TP. Hồ Chí Minh (Sài Gòn), Hà Nội, Đà Nẵng, Hải Phòng, Cần Thơ, Nha Trang, Huế, Vũng Tàu và cộng đồng người Việt tại hải ngoại.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Huế', 'Người Việt Hải Ngoại'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Câu Hỏi Thường Gặp (FAQ Việt Nam)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Phụ nữ có phải trả tiền để nhắn tin không?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Hoàn toàn không! Tài khoản nữ được cấp quyền Queen VIP trọn đời miễn phí để nhắn tin, gọi video và tìm bạn đời thoải mái.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Tại sao mọi người phải xác minh OTP?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Xác thực qua mã OTP email giúp loại bỏ hoàn toàn tài khoản lừa đảo, người tạo nhiều nick giả mạo, mang lại cộng đồng trong sạch.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Tôi có thể chọn mục đích hẹn hò hoặc kết hôn được không?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Có! Bạn có thể chuyển đổi mục tiêu bất kỳ lúc nào: Hẹn hò tìm hiểu (Dating) hoặc Kết hôn nghiêm túc (Matrimony).
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=vietnam"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Bắt Đầu Miễn Phí Tại Việt Nam</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
