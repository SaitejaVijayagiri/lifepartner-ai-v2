import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI France | Rencontres Sérieuses & Mariage en Toute Sécurité pour Femmes | 100% Gratuit VIP',
  description: 'La plateforme de rencontre sérieuse par IA la plus sécurisée pour les femmes en France. 100% Gratuit Queen VIP à vie, messages directs illimités, numéro de téléphone masqué & bouclier AI Anti-Creep. Paris, Lyon, Marseille, Bordeaux et toute la France.',
  keywords: [
    'application rencontre serieuse france',
    'rencontre pour mariage',
    'site de rencontre gratuit femme',
    'rencontre paris celibataires',
    'rencontre lyon',
    'france dating app',
    'safe dating app france'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/france',
    languages: {
      'fr-FR': 'https://lifepartnerai.in/france',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI France | Rencontres Sérieuses 100% Gratuites pour Femmes',
    description: 'Sans abonnement forcé ni harcèlement. Profils humains vérifiés par OTP, respect absolu de la vie privée et photos éphémères.',
    url: 'https://lifepartnerai.in/france',
    siteName: 'LifePartner AI France',
    locale: 'fr_FR',
    type: 'website'
  }
};

export default function FranceLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI France',
    'description': 'Plateforme de rencontres sérieuses et mariage par intelligence artificielle axée sur la sécurité et le respect des femmes en France.',
    'url': 'https://lifepartnerai.in/france',
    'areaServed': 'France',
    'inLanguage': 'fr-FR',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'EUR',
      'name': 'Statut Queen VIP Gratuit à Vie pour Femmes et Messagerie Directe Illimitée'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Est-ce véritablement gratuit pour les femmes en France ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Oui ! Chaque femme inscrite bénéficie automatiquement du statut Queen VIP à vie avec messages directs illimités, appels vidéo HD et 100 pièces offertes sans aucun abonnement payant.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Comment mes coordonnées et mon numéro sont-ils protégés ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Votre numéro de téléphone n\'est jamais affiché publiquement. Les échanges s\'effectuent dans l\'application avec filtrage AI Anti-Creep et photos éphémères anti-capture d\'écran.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Puis-je trouver des partenaires en France et à l\'international ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Oui ! Vous pouvez échanger avec des célibataires vérifiés à Paris, Lyon, Marseille, Bordeaux ou avec des membres respectueux et qualifiés à l\'étranger.'
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
            <span>🇫🇷</span>
            <span>Lancement Officiel en France | 100% Gratuit Queen VIP pour Femmes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Rencontres Sérieuses en France,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Avec Respect, Sécurité & Zéro Harcèlement.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Fini les messages déplacés, les demandes indiscrètes de numéro et les abonnements à 40 € par mois.
            LifePartner AI masque vos coordonnées, bloque les comportements inappropriés et offre l'accès VIP gratuit à toutes les femmes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=france"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Rejoindre Gratuitement (VIP Immédiat)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Découvrir les Avantages VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Gratuit pour Femmes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Discussions illimitées & pièces</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Bouclier Anti-Harcèlement</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Interception IA instantanée</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Coordonnées Masquées</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Numéro de téléphone préservé</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Vérification OTP Réelle</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zéro faux profils ni bots</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Pourquoi les Françaises Choisissent LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Une plateforme pensée pour les femmes en quête d'une relation authentique et durable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Statut Queen VIP à Vie sans Frais</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Envoyez des messages directs illimités, effectuez des appels vidéo HD et profitez de 100 pièces offertes pour des cadeaux virtuels sans rien payer.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Bouclier IA Anti-Creep en Temps Réel</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Notre intelligence artificielle analyse les conversations et bloque les propos déplacés ou les insistances excessives. Les contrevenants sont immédiatement exclus.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Photos Éphémères Anti-Capture d'Écran</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Partagez des photos en mode snap qui disparaissent après visionnage avec une protection active contre les captures d'écran.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Présence dans Toute la France et à l'Étranger</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Trouvez des personnes sérieuses à Paris, Lyon, Marseille, Bordeaux, Toulouse, Nantes ou parmi les expatriés français dans le monde entier.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Présent dans Toutes les Métropoles Françaises
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            Paris (Île-de-France), Lyon, Marseille, Bordeaux, Toulouse, Nice, Nantes, Strasbourg, Lille, Montpellier et Français de l'étranger.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Paris & Île-de-France', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Nice & Côte d’Azur', 'Nantes', 'Lille', 'Français à l’Étranger'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Foire Aux Questions (FAQ France)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Les femmes doivent-elles payer pour discuter ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Non, jamais. Les femmes disposent du statut Queen VIP gratuit à vie pour échanger librement et en toute sécurité.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Comment mes données sont-elles protégées ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Vos informations personnelles et votre numéro sont cryptés et ne sont jamais visibles sur votre profil public.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Peut-on choisir entre histoire d'amour ou mariage ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Oui ! Vous pouvez ajuster vos préférences à tout moment : Rencontre amoureuse (Dating) ou Mariage sérieux (Matrimony).
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=france"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Commencer Gratuitement en France</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
