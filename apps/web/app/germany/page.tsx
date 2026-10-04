import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Deutschland | Sicheres Dating & Partnersuche für Frauen | 100% Kostenlos VIP',
  description: 'Die sicherste KI-Dating- & Heiratsplattform für Frauen in Deutschland. 100% Kostenloser Queen VIP-Status auf Lebenszeit, unbegrenzte Direktnachrichten, maskierte Kontaktdaten & AI Anti-Creep Shield. Berlin, München, Hamburg, Frankfurt & bundesweit.',
  keywords: [
    'dating app deutschland sicher',
    'seriöse partnersuche für frauen',
    'heiratsvermittlung online',
    'kostenlose dating app frauen',
    'dating berlin',
    'dating münchen',
    'germany dating app',
    'safe dating app germany'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/germany',
    languages: {
      'de-DE': 'https://lifepartnerai.in/germany',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Deutschland | Seriöse Partnersuche 100% Gratis für Frauen',
    description: 'Ohne teure Abos oder Belästigungen. Echte Profile mit OTP-Verifizierung, DSGVO-konformer Datenschutz und selbstlöschende Fotos.',
    url: 'https://lifepartnerai.in/germany',
    siteName: 'LifePartner AI Deutschland',
    locale: 'de_DE',
    type: 'website'
  }
};

export default function GermanyLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Germany (LifePartner AI Deutschland)',
    'description': 'Sichere KI-gestützte Plattform für ernsthafte Partnersuche und Ehe, abgestimmt auf Datenschutz und Sicherheit von Frauen in Deutschland.',
    'url': 'https://lifepartnerai.in/germany',
    'areaServed': 'Germany',
    'inLanguage': 'de-DE',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'EUR',
      'name': 'Lebenslanger kostenloser Queen VIP-Status für Frauen'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Ist die Nutzung für Frauen in Deutschland wirklich 100% kostenlos?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ja! Alle registrierten Frauen erhalten automatisch den lebenslangen Queen VIP-Status mit unbegrenzten Direktnachrichten, HD-Videoanrufen und 100 Willkommensmünzen ohne Abo-Verpflichtungen.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Wie werden meine Telefonnummer und privaten Daten geschützt?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ihre persönliche Rufnummer wird niemals öffentlich im Profil angezeigt. Die Kommunikation erfolgt verschlüsselt innerhalb der App mit AI Anti-Creep Shield und Screenshot-Schutz.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Kann ich Partner in Deutschland sowie international finden?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Ja! Sie können mit verifizierten Singles in Berlin, München, Hamburg, Frankfurt oder niveauvollen internationalen Mitgliedern in Kontakt treten.'
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
            <span>🇩🇪</span>
            <span>Offizieller Start in Deutschland | 100% Gratis Queen VIP für Frauen</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Seriöse Partnersuche in Deutschland,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Mit Höchstem Datenschutz & Respekt.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Schluss mit oberflächlichem Wischen, unerwünschten Anfragen und 40 € Monatsabos.
            LifePartner AI maskiert Ihre persönlichen Daten, blockiert toxisches Verhalten durch das AI Anti-Creep Shield und ist für Frauen dauerhaft kostenlos.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=germany"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Kostenlos registrieren (Sofort-VIP)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Queen VIP Vorteile ansehen</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Gratis für Frauen</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unbegrenzte Chats & Münzen</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">AI Anti-Creep Shield</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Filtert Belästigung sofort</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Maskierte Kontaktdaten</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Telefonnummer bleibt verborgen</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Strenge OTP-Prüfung</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Keine Fake-Profile oder Bots</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Warum Frauen in Deutschland LifePartner AI wählen
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Maßgeschneidert für Singles, die eine feste Bindung und eine echte Zukunft suchen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Queen VIP auf Lebenszeit ohne Gebühren</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Schreiben Sie Nachrichten, telefonieren Sie per HD-Video und nutzen Sie 100 Münzen für Spotlight-Boosts und Geschenke ohne versteckte Kosten.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Echtzeit AI Anti-Creep Filter</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Unsere KI erkennt anstößige Bemerkungen oder vorzeitiges Drängen auf Telefonnummern im Chat. Unangemessene Konten werden sofort gesperrt.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Selbstlöschende Snaps ohne Screenshot</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Teilen Sie Alltagsfotos im sicheren Snap-Modus: Bilder verschwinden nach dem Ansehen und können nicht per Screenshot kopiert werden.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Ganz Deutschland und weltweite Vernetzung</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Lernen Sie Singles in Berlin, München, Frankfurt, Hamburg oder aufgeschlossene internationale Partner mit geprüfter Identität kennen.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            In allen Metropolen und Bundesländern vertreten
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Berlin, München, Hamburg, Frankfurt am Main, Köln, Stuttgart, Düsseldorf, Leipzig, Nürnberg, Dresden und deutschsprachige Expats weltweit.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Deutschsprachige im Ausland'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Häufig gestellte Fragen (FAQ Deutschland)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Müssen Frauen jemals für Nachrichten bezahlen?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Nein, niemals. Weibliche Mitglieder erhalten dauerhaft kostenlosen Zugriff auf alle Chat- und Videofunktionen.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Wie wird meine Privatsphäre nach DSGVO geschützt?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Kontaktdaten werden verschlüsselt gespeichert und niemals Dritten zur Verfügung gestellt oder öffentlich im Profil angezeigt.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Kann ich zwischen Dating und ernsthafter Ehe wählen?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ja! Sie können Ihr Suchziel im Profil jederzeit zwischen Romantischem Kennenlernen (Dating) und Fester Heirat (Matrimony) wechseln.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=germany"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Jetzt kostenlos in Deutschland starten</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
