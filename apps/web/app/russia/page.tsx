import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Россия | Безопасные знакомства и брак для женщин | 100% Бесплатный VIP',
  description: 'Надежное AI-приложение для серьезных знакомств и брака для женщин в России. 100% Бесплатный Queen VIP, неограниченные сообщения, защита личных контактов и AI Anti-Creep Shield. Москва, Санкт-Петербург, вся Россия и мир.',
  keywords: [
    'знакомства для серьезных отношений',
    'сайт знакомств для брака',
    'безопасные знакомства для женщин',
    'бесплатный сайт знакомств',
    'знакомства москва',
    'знакомства спб',
    'международные знакомства',
    'ai знакомства',
    'dating app russia safe',
    'russia matrimony'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/russia',
    languages: {
      'ru-RU': 'https://lifepartnerai.in/russia',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Россия | Знакомства для серьезных отношений и брака 100% Бесплатно для женщин',
    description: 'Без спама, ботов и навязчивых предложений. Все профили проверены через OTP. Скрытые контакты и защита фото.',
    url: 'https://lifepartnerai.in/russia',
    siteName: 'LifePartner AI Russia',
    locale: 'ru_RU',
    type: 'website'
  }
};

export default function RussiaLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Russia (ЛайфПартнер AI Россия)',
    'description': 'Безопасная платформа для серьезных знакомств и создания семьи на основе искусственного интеллекта. Пожизненный бесплатный VIP для женщин.',
    'url': 'https://lifepartnerai.in/russia',
    'areaServed': 'Russia',
    'inLanguage': 'ru-RU',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'RUB',
      'name': 'Бесплатный статус Queen VIP для женщин и прямые сообщения'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Действительно ли сервис бесплатен для женщин?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Да, абсолютно! Каждая девушка автоматически получает статус Queen VIP навсегда: безлимитные прямые сообщения, HD-видеосвязь и 100 приветственных монет без обязательных подписок.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Как платформа защищает личный номер телефона и фото?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ваш номер телефона и мессенджеры полностью скрыты. Общение происходит внутри зашифрованного чата. Дополнительно поддерживаются исчезающие снап-фотографии с защитой от скриншотов.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Есть ли проверка пользователей на фейки и ботов?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Каждый пользователь обязан пройти верификацию через одноразовый код (OTP), отправленный на email. Непроверенные пользователи не могут отправлять сообщения верифицированным девушкам.'
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
            <span>🇷🇺</span>
            <span>Официальный запуск в России | 100% Бесплатный Queen VIP для женщин</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Знакомства для серьезных отношений,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Построенные на Уважении и Безопасности.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Забудьте о навязчивых сообщениях, выпрашивании контактов и сомнительных анкетах. 
            LifePartner AI защищает ваш номер телефона, блокирует токсичное общение с помощью AI Anti-Creep Shield и дарит женщинам полный доступ бесплатно.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=russia"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Зарегистрироваться бесплатно (VIP)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Привилегии Queen VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Бесплатно для женщин</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Безлимит чатов и 100 монет</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI-Защита от спама</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Мгновенный блок нарушителей</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Скрытые контакты</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Номер телефона не виден</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Обязательный OTP</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Только реальные люди</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Почему девушки выбирают LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Создано для тех, кто ищет достойного партнера и серьезные намерения без траты нервов.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Статус Queen VIP без абонентской платы</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Девушкам не нужно платить за сообщения и звонки. Общайтесь свободно, получайте приоритетные просмотры в ленте рекомендаций и 100 монет для отправки подарков.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. AI Anti-Creep Shield</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Искусственный интеллект сканирует диалоги в реальном времени и блокирует грубость, домогательства и попытки выманить личные данные. Безопасность гарантирована.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Исчезающие фото без скриншотов</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Делитесь фотоснимками в формате исчезающих снапов. Защита от сохранения экрана не позволит скопировать ваши личные фото.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Знакомства по всей России и миру</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Ищите надежного спутника жизни в Москве, Санкт-Петербурге, Екатеринбурге, Казани, Сочи или среди успешных мужчин за рубежом с проверенным статусом.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Города и регионы России
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Москва, Санкт-Петербург, Новосибирск, Екатеринбург, Казань, Нижний Новгород, Самара, Ростов-на-Дону, Краснодар, Сочи и международные знакомства.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Краснодар & Сочи', 'Самара', 'Уфа', 'Международный поиск'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Часто задаваемые вопросы (FAQ Россия)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Бесплатно ли это навсегда для женщин?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Да, пожизненный Queen VIP статус для женщин полностью бесплатен. Никаких скрытых платежей за переписку.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Как защищены мои личные данные?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Номер телефона, email и личные данные не отображаются в анкете. Общение происходит внутри защищенного приложения.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Можно ли выбрать цель: только свидания или серьезный брак?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Да! Вы можете переключить цель в профиле: Романтические свидания (Dating) или Серьезный брак (Matrimony).
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=russia"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Начать бесплатно в России</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
