import { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

// 1. GENERATE METADATA FOR GLOBAL BROWSER RANKINGS (Server Side)
export const metadata: Metadata = {
  title: 'LifePartner AI | #1 Free Worldwide Dating, Matrimony & Snaps App',
  description: "The world's first AI-powered 100% free worldwide dating and matrimony platform. Experience Snaps, 24h Stories, Music Vibe matching & instant direct chat with verified singles in USA, UK, Canada, Australia, India, Europe & worldwide with zero paywalls.",
  keywords: [
    // Worldwide Dating & Chat Keywords
    "Worldwide Dating App", "Free Worldwide Dating", "Global Matchmaking", "NRI Dating App", "Free Dating App Worldwide",
    "Instant Photo Snaps Dating", "24h Stories Dating App", "Music Match Dating App", "Spotify Playlist Dating",
    "Online Dating USA", "Online Dating UK", "Online Dating Canada", "Online Dating Australia", "International Singles Chat",
    
    // Matrimony & Marriage Keywords
    "Matrimony", "Free Matrimony App", "NRI Matrimony", "Telugu Matrimony", "Tamil Matrimony", "Hindi Matrimony", "Best Matchmaking Site",
    "AI Dating App", "Free Chat Matrimony", "Jeevansathi Alternative", "Shaadi Alternative", "Bharat Matrimony Alternative",
    "100% Free Matchmaking", "Direct Chat Matrimony", "No Subscription Dating", "Verified Single Profiles",
    
    // Multilingual & Multi-region Terms
    "Dating App USA", "Dating App India", "Dating App UK", "Dating App Europe", "Citas Gratis en Todo el Mundo",
    "फ्री डेटिंग ऐप", "ఉచిత మ్యాట్రిమోనీ చాట్", "இலவச டேட்டிங் ஆப்", "App de Rencontres Gratuite", "Kostenlose Dating App"
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in',
    languages: {
      'en': 'https://lifepartnerai.in',
      'es': 'https://lifepartnerai.in?lang=es',
      'hi': 'https://lifepartnerai.in?lang=hi',
      'te': 'https://lifepartnerai.in?lang=te',
      'ta': 'https://lifepartnerai.in?lang=ta',
      'fr': 'https://lifepartnerai.in?lang=fr',
      'de': 'https://lifepartnerai.in?lang=de',
      'ar': 'https://lifepartnerai.in?lang=ar',
      'zh': 'https://lifepartnerai.in?lang=zh',
      'ja': 'https://lifepartnerai.in?lang=ja',
      'pt': 'https://lifepartnerai.in?lang=pt',
    }
  },
  openGraph: {
    title: 'LifePartner AI | #1 Free Worldwide Dating, Matrimony & Snaps App',
    description: "Connect & chat with verified singles globally on LifePartner AI. Featuring Snaps, 24h Stories, Music Vibe matching, and zero subscription paywalls.",
    url: 'https://lifepartnerai.in',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://lifepartnerai.in/api/og?title=Connect%20%26%20Chat%20Free%20Worldwide&subtitle=Snaps%2C%20Stories%2C%20Music%20%26%20AI%20Matchmaking',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI - #1 Free Worldwide Dating & Matrimony Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifePartner AI | Best Free Worldwide Dating & Matrimony App',
    description: 'Join verified singles finding love globally on LifePartner AI. Featuring Snaps, 24h Stories, Music Matching & 100% Free Chat.',
    images: ['https://lifepartnerai.in/api/og?title=LifePartner%20AI%20Worldwide'],
  }
};

export default function LandingPage() {
  // 3. JSON-LD SCHEMA (Structured Data for Search Crawlers)
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LifePartner AI",
    "url": "https://lifepartnerai.in",
    "logo": "https://lifepartnerai.in/icons/icon-512x512.png",
    "sameAs": [
      "https://twitter.com/lifepartnerai",
      "https://www.instagram.com/lifepartnerai.in"
    ],
    "description": "The world's first AI-powered worldwide dating & matrimony platform offering Snaps, 24h Stories, Music Vibe matching, semantic AI search, and verified connections with zero paywalls.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "addressCountry": "IN"
    }
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LifePartner AI",
    "url": "https://lifepartnerai.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://lifepartnerai.in/matches?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is LifePartner AI 100% free for worldwide dating and matrimony chat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! LifePartner AI offers 100% free registration, instant direct messaging, voice notes, video calls, Snaps, and Stories worldwide with zero hidden paywalls or subscription fees."
        }
      },
      {
        "@type": "Question",
        "name": "What are the Snap, Stories, and Music features on LifePartner AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI includes instant ephemeral Snaps with screenshot protection, 24-hour video/photo Stories to share daily moments, and Spotify/Apple Music playlist integration to match soulmates based on shared music taste."
        }
      },
      {
        "@type": "Question",
        "name": "How does LifePartner AI connect life partners worldwide easily?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI combines AI semantic compatibility, daily Snaps & Stories vibe checks, zero-paywall direct chat, and verified local meetups to make finding a real life partner simple, transparent, and safe."
        }
      },
      {
        "@type": "Question",
        "name": "Can I switch languages on LifePartner AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, LifePartner AI supports multi-language switching for 11 global languages including English, Spanish, Hindi, Telugu, Tamil, French, German, Arabic, Chinese, Japanese, and Portuguese."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <LandingPageClient />
    </>
  );
}
