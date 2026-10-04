import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Heart, Sparkles, MessageCircle, Music, Camera, CheckCircle2, ArrowRight, Star, Lock, Users, Globe2, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LifePartner AI Brasil | Aplicativo de Namoro & Casamento Seguro para Mulheres | 100% Grátis VIP',
  description: 'O aplicativo de namoro sério e casamento com IA mais seguro para mulheres no Brasil. 100% Grátis Queen VIP vitalício, mensagens diretas ilimitadas, número de WhatsApp oculto e escudo AI Anti-Creep. São Paulo, Rio de Janeiro e todo o Brasil.',
  keywords: [
    'aplicativo de namoro seguro brasil',
    'site de relacionamento sério',
    'namoro para casamento brasil',
    'app de namoro gratis mulheres',
    'namoro são paulo',
    'namoro rio de janeiro',
    'brazil dating app',
    'safe dating app brazil'
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in/brazil',
    languages: {
      'pt-BR': 'https://lifepartnerai.in/brazil',
      'en': 'https://lifepartnerai.in'
    }
  },
  openGraph: {
    title: 'LifePartner AI Brasil | Namoro Seguro & 100% VIP Grátis para Mulheres',
    description: 'Sem mensalidades caras ou assédio. Perfis humanos verificados por OTP, proteção de fotos que desaparecem e contatos protegidos.',
    url: 'https://lifepartnerai.in/brazil',
    siteName: 'LifePartner AI Brasil',
    locale: 'pt_BR',
    type: 'website'
  }
};

export default function BrazilLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DatingService',
    'name': 'LifePartner AI Brazil (LifePartner AI Brasil)',
    'description': 'Plataforma de relacionamentos sérios e casamento com inteligência artificial pensada para a segurança e privacidade da mulher no Brasil.',
    'url': 'https://lifepartnerai.in/brazil',
    'areaServed': 'Brazil',
    'inLanguage': 'pt-BR',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL',
      'name': 'Queen VIP Grátis Vitalício para Mulheres e Mensagens Diretas Ilimitadas'
    }
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'O aplicativo é realmente 100% gratuito para mulheres no Brasil?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Sim! Todas as mulheres cadastradas recebem automaticamente o status Queen VIP vitalício com mensagens diretas ilimitadas, chamadas de vídeo em HD e 100 moedas de boas-vindas sem nenhuma assinatura mensal.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Como meus dados e meu número de WhatsApp são protegidos?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Seu telefone pessoal nunca é exibido publicamente no perfil. A conversa acontece no chat criptografado com o escudo AI Anti-Creep e suporte a fotos efêmeras que bloqueiam capturas de tela (print screen).'
        }
      },
      {
        '@type': 'Question',
        'name': 'Posso encontrar pessoas no Brasil e também no exterior?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Sim! Você pode conectar-se com solteiros verificados em São Paulo, Rio, Curitiba, Belo Horizonte ou com brasileiros e estrangeiros qualificados no exterior.'
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
            <span>🇧🇷</span>
            <span>Lançamento Oficial no Brasil | 100% Grátis Queen VIP para Mulheres</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Relacionamentos Sérios no Brasil,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600">
              Com Segurança, Respeito e Sem Golpes.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Esqueça mensagens invasivas, pedidos inoportunos de WhatsApp e assinaturas de R$ 150 por mês.
            O LifePartner AI protege seu contato com o escudo AI Anti-Creep, fotos com autodestruição e chat gratuito para mulheres.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?country=brazil"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Cadastre-se Grátis (VIP Instantâneo)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/for-women"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all text-center flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-500" />
              <span>Conhecer Benefícios VIP</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Crown className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Grátis para Mulheres</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conversas ilimitadas & moedas</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <ShieldCheck className="text-indigo-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Escudo AI Anti-Creep</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bloqueia assédio no ato</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <Lock className="text-pink-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Contatos Protegidos</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Número de WhatsApp oculto</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Verificação OTP Real</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sem perfis fakes ou bots</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Por que as Brasileiras Escolhem o LifePartner AI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Desenvolvido para conectar pessoas de bem com intenção sincera de construir um futuro a dois.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 flex items-center justify-center mb-6">
                <Crown size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Queen VIP Vitalício Sem Cobranças</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Envie mensagens diretas, faça chamadas de vídeo em alta definição e ganhe 100 moedas para enviar mimos especiais e destacar seu perfil de graça.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Proteção AI Anti-Creep em Tempo Real</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Nossa IA filtra palavras desrespeitosas ou cobranças agressivas de dados pessoais antes mesmo de chegarem até você. Usuários mal-intencionados são banidos.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Fotos Efêmeras Anti-Print Screen</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Envie fotos com a certeza de que elas desaparecerão após visualizadas e com proteção ativa contra captura de tela, garantindo total privacidade.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-6">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">4. Conecte-se em Todo o Brasil e no Mundo</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Conheça parceiros compatíveis em São Paulo, Rio, Minas, Sul do país, Nordeste ou brasileiros vivendo no exterior com objetivos de vida alinhados aos seus.
              </p>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 dark:bg-gray-900/40 rounded-3xl border border-slate-200/80 dark:border-gray-800 text-center">
          <Globe2 className="mx-auto text-pink-600 mb-3" size={32} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Presente em Todas as Capitais e Regiões do Brasil
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            São Paulo (Capital e Interior), Rio de Janeiro, Belo Horizonte, Curitiba, Porto Alegre, Brasília, Salvador, Recife, Fortaleza e Brasileiros no Exterior.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['São Paulo (SP)', 'Rio de Janeiro (RJ)', 'Belo Horizonte (MG)', 'Curitiba (PR)', 'Porto Alegre (RS)', 'Brasília (DF)', 'Salvador (BA)', 'Brasileiros no Exterior'].map((loc) => (
              <span key={loc} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-semibold border border-slate-200 dark:border-gray-700">
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">
            Perguntas Frequentes (FAQ Brasil)
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. É realmente grátis para mulheres?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sim! Mulheres possuem acesso Queen VIP gratuito para sempre, podendo conversar e conhecer pretendentes sem pagar mensalidades.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Como funciona a verificação por código OTP?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Todos os usuários devem confirmar um código enviado ao e-mail no momento do cadastro para garantir que são pessoas reais e bem-intencionadas.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h3 className="font-bold text-base mb-2">Q. Posso escolher entre namoro ou casamento sério?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Com certeza. Você pode alternar sua intenção entre Namoro (Dating) ou Casamento Sério (Matrimony) sempre que quiser no seu perfil.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register?country=brazil"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
            >
              <span>Começar Grátis no Brasil</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
