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

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://lifepartnerai.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Free Matrimony & Matchmaking",
        "item": "https://lifepartnerai.in/matrimony"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Worldwide Dating & Chat",
        "item": "https://lifepartnerai.in/stranger-chat"
      }
    ]
  };

  const jsonLdOfferCatalog = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "name": "Free Matrimony & Matchmaking Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "100% Free Direct Chat Matrimony",
          "description": "Send unlimited direct messages and chat with verified matrimony matches without paying forced subscription fees."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Screenshot Protected Ephemeral Snaps",
          "description": "Share photo snaps with screenshot protection and watermarks for complete female privacy and safety."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "NRI & Worldwide Matchmaking",
          "description": "Connect with verified single Indian girls, NRI guys, and international singles in USA, UK, Canada, Australia, and worldwide."
        },
        "price": "0",
        "priceCurrency": "INR"
      }
    ]
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is LifePartner AI 100% free for matrimony chat and matchmaking without payment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! LifePartner AI is 100% free with zero paywalls. You can register, browse verified single profiles, send direct messages, share voice notes, and make HD video calls without forced subscriptions or credit card requirements."
        }
      },
      {
        "@type": "Question",
        "name": "How is LifePartner AI better than traditional matrimony sites like Jeevansathi or Shaadi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Traditional matrimony platforms charge thousands of rupees just to unlock contact numbers and are flooded with unverified agent profiles. LifePartner AI provides 100% free messaging, human + AI identity verification, screenshot-proof Snaps, and Spotify music vibe matching."
        }
      },
      {
        "@type": "Question",
        "name": "How does LifePartner AI protect photo privacy and prevent screenshots?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI implements instant ephemeral Snaps with built-in screenshot protection, photo blur controls, and watermarks to ensure complete privacy, especially for women."
        }
      },
      {
        "@type": "Question",
        "name": "Can NRI singles in USA, UK, Canada, and Australia find Indian matrimony matches for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! LifePartner AI supports NRI matchmaking across 190+ countries including USA, UK, Canada, Australia, UAE, Singapore, and Europe with multi-language support in English, Telugu, Hindi, Tamil, and 7 other languages."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI Wingman and Cosmic Matching work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our context-aware AI analyzes deep personal values, lifestyle habits, Vedic astrology compatibility, and shared music tastes to suggest highest quality soulmate matches."
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOfferCatalog) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <LandingPageClient />
    </>
  );
}
