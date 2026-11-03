import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Users, 
  Globe2, 
  Crown,
  Scale,
  Compass,
  Building2,
  Check
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Meet Handsome German Men & European Gentlemen | LifePartner AI (Internationale Partnersuche Deutschland)',
  description: 'Connect with handsome German men, European bachelors, and international singles. 100% Free direct chat, HD video calls, GDPR privacy, and verified profiles. Seriöse internationale Partnersuche für deutsche Männer & weltweite Traumfrauen.',
  keywords: [
    'meet handsome german men',
    'german gentlemen dating',
    'date european guys',
    'internationale partnersuche deutschland',
    'ausländische frauen kennenlernen seriös',
    'dating app für deutsche männer',
    'traumfrau weltweit finden',
    'seriöse partnervermittlung ausland',
    'berlin handsome men dating',
    'munich singles dating app',
    'cross-cultural dating germany',
    'free international dating app germany',
    'european bachelor matrimony'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/german-dating',
    languages: {
      'en': 'https://lifepartnerai.in/german-dating',
      'de-DE': 'https://lifepartnerai.in/german-dating'
    }
  },
  openGraph: {
    title: 'Meet Handsome German Men & European Gentlemen | LifePartner AI',
    description: 'Connect with verified German men and global women looking for authentic love, mutual respect, and lifelong partnership. 100% Free with zero paywalls.',
    url: 'https://lifepartnerai.in/german-dating',
    siteName: 'LifePartner AI Deutschland',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Handsome German Men & Global Singles Dating'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Handsome German Men & European Gentlemen | LifePartner AI',
    description: 'Connect with verified German men and global women. 100% Free chat, HD video calls, and European-global romance matching.',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200']
  }
};

export default function GermanDatingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI - German Gentlemen & International Dating',
    'description': 'Premium free international dating service connecting handsome German men and European bachelors with sincere, family-oriented women worldwide.',
    'url': 'https://lifepartnerai.in/german-dating',
    'areaServed': ['Germany', 'Austria', 'Switzerland', 'United States', 'United Kingdom', 'Canada', 'Global'],
    'inLanguage': ['en', 'de-DE'],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'EUR',
      'name': '100% Free Registration, Unlimited Direct Chat & Video Calls'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Why are handsome German men so sought after by international women?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'German men are admired worldwide for their reliability, honesty, strong work ethic, intellectual depth, and egalitarian romantic values. LifePartner AI connects genuine German gentlemen with worldwide women who cherish these qualities in a lifelong partner.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Ist die internationale Partnersuche für deutsche Männer wirklich 100% kostenlos?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ja, absolut. Bei LifePartner AI gibt es keine teuren Abo-Modelle, Coin-Abzocke oder Freischaltgebühren für Nachrichten. Profilerstellung, unbegrenzter Direktchat und HD-Videoanrufe sind dauerhaft 100% kostenlos.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does LifePartner AI protect privacy and prevent scam profiles?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'We adhere to stringent GDPR privacy standards, mandatory email OTP authentication, screenshot-prevented temporary media, and AI anti-bot monitoring to ensure a completely safe, scam-free environment.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Wie unterstützt die Plattform bei Sprachbarrieren? (How are language barriers handled?)',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Unsere integrierte KI-Übersetzung übersetzt Nachrichten in Echtzeit zwischen Deutsch, Englisch und über 30 weiteren Sprachen, sodass Sie mühelos und ohne Missverständnisse kommunizieren können.'
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
        'name': 'German Dating',
        'item': 'https://lifepartnerai.in/german-dating'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-indigo-100 dark:from-amber-950/80 dark:to-indigo-950/80 border border-amber-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <span>🇩🇪 🛡️ 🌍</span>
            <span>German Reliability Meets Global Romance | 100% Free &amp; GDPR Compliant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Meet Handsome German Men &amp; European Bachelors.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600">
              Internationale Partnersuche ohne Abo-Abzocke
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Whether you are an ambitious German gentleman looking for a genuine, affectionate international partner, or a woman worldwide seeking a reliable, handsome European partner—LifePartner AI provides a modern, transparent matchmaking platform. 100% Free direct chat, HD video calls, and zero subscription paywalls.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Kostenlos Registrieren / Join Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/germany"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center"
            >
              Deutschland Portal
            </Link>
          </div>

          {/* Key Value Prop Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">100% Kostenlos</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Keine Abofallen oder Bezahl-Sperren</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">DSGVO &amp; OTP Schutz</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Höchste europäische Sicherheitsstandards</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">KI-Werte Matching</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tiefgründige Persönlichkeitsanalyse</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Globe2 className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Echtzeit-Übersetzung</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mühelose weltweite Kommunikation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why German Men & International Singles Excel on LifePartner AI */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Why German Gentlemen Are Among the Most Respected Singles Globally
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A partnership platform built on respect, stability, authentic emotional commitment, and mutual goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-6">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Honesty, Drive &amp; Reliability</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                German men are widely recognized for their direct communication, emotional stability, professional dedication, and respectful treatment of women. On LifePartner AI, you connect with women who actively value maturity and loyalty.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Verlässlichkeit und Ehrlichkeit stehen bei internationalen Frauen hoch im Kurs.
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-6">
                <Scale size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Fairness &amp; Equal Partnership</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern romance thrives on shared ambition and equality. LifePartner AI facilitates genuine conversations about life plans, family visions, career support, and values before you ever take the next step.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Echtes Miteinander auf Augenhöhe für eine gemeinsame Zukunft.
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-6">
                <Compass size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Expansive Global Horizons</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Break out of local dating deadlocks. Connect with educated, affectionate women across Asia, North America, and Europe who are looking for serious, cross-cultural relationships with European gentlemen.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 text-xs font-semibold text-purple-600 dark:text-purple-400">
                Internationale Traumfrauen ohne geografische Einschränkungen kennenlernen.
              </div>
            </div>
          </div>
        </section>

        {/* German Direct Callout */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Exklusiv für deutsche Männer &amp; bachelors
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-3">
                Schluss mit leeren Versprechungen: Finden Sie Ihre internationale Traumfrau ohne Abo-Zwang.
              </h3>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                Herkömmliche Portale verlangen oft hunderte Euro für den einfachen Austausch von Nachrichten. Bei LifePartner AI ist die Kontaktaufnahme garantiert 100% kostenlos. Registrieren Sie sich mit wenigen Klicks, verifizieren Sie Ihr Profil und starten Sie sofort Direktchats mit passenden Frauen weltweit.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow transition-all"
                >
                  Kostenlos Profil anlegen
                </Link>
                <Link
                  href="/international-men"
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
                >
                  Weltweite Profile ansehen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Häufig gestellte Fragen (FAQ)</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">Wissenswertes zur internationalen Partnersuche und Sicherheit.</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Warum suchen viele internationale Frauen gezielt nach deutschen Männern?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Deutsche Männer gelten international als besonders treu, verantwortungsbewusst, beruflich engagiert und respektvoll im Umgang mit Frauen. Viele Frauen aus aller Welt schätzen diese Bodenständigkeit und suchen einen Partner für eine dauerhafte, harmonische Familie.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Wie unterscheidet sich LifePartner AI von herkömmlichen Agenturen?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Klassische Heiratsvermittlungen verlangen oft tausende Euro an Vermittlungsgebühren. LifePartner AI nutzt moderne KI-Algorithmen und stellt die direkte Kommunikation kostenlos zur Verfügung. Keine Zwischenhändler, keine versteckten Kosten.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Sind die Profile echt und verifiziert?
              </h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ja. Alle Mitglieder müssen eine E-Mail-OTP-Authentifizierung durchlaufen. Zudem prüfen unsere KI-Sicherheitsmodule verdächtige Aktivitäten, um Fake-Profile und Romance-Scams zuverlässig fernzuhalten.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 text-white shadow-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Finden Sie Ihre Traumpartnerin weltweit</h2>
            <p className="mt-3 text-amber-100 max-w-xl mx-auto text-sm sm:text-base">
              Verbinden Sie sich mit tausenden geprüften Singles weltweit. Kostenlos, sicher und diskret.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-md"
              >
                Jetzt kostenlos starten
              </Link>
              <Link
                href="/dating"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold border border-indigo-300/30 transition-all"
              >
                Mehr über LifePartner AI erfahren
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
