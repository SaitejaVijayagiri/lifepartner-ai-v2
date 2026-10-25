import { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

// 1. GENERATE METADATA FOR GLOBAL BROWSER RANKINGS (Server Side)
export const metadata: Metadata = {
  title: 'LifePartner AI | #1 Free AI Matrimony, Worldwide Dating & Safe Matchmaking App',
  description: "The world's #1 AI-powered 100% free matrimony and worldwide dating platform. Connect & chat with verified singles across India, USA, UK, Canada, Australia, UAE, Singapore, Japan, Korea & 190+ countries with zero subscription paywalls and Women-First privacy protection.",
  keywords: [
    // Global & Multi-Country Target Keywords
    "Worldwide Dating App", "Free Worldwide Dating", "Global Matchmaking App", "NRI Dating App", "Free Dating App Worldwide",
    "Safe Dating App for Women", "Women First Dating App", "Free VIP Dating for Women", "Verified Single Profiles",
    "USA Dating App", "UK Dating App", "Canada Dating App", "Australia Dating App", "UAE Dating App", "Singapore Dating App",
    "Japan Dating App", "Tokyo Matchmaking", "South Korea Dating App", "Seoul Matchmaking",
    "Philippines Dating App", "Indonesia Dating App", "Aplikasi Cari Jodoh Gratis",
    "Malaysia Dating App", "Vietnam Dating App", "App Hẹn Hò Miễn Phí",
    "Russia Dating App", "Знакомства в России", "Brazil Dating App", "Germany Dating App", "France Dating App",
    
    // Snaps, Stories & Music Features
    "Instant Photo Snaps Dating", "24h Stories Dating App", "Music Match Dating App", "Spotify Playlist Dating",
    "Screenshot Proof Snaps", "AI Anti-Creep Shield",
    
    // Matrimony & Marriage Keywords
    "Free Matrimony App", "Global Matrimony", "NRI Matrimony", "Telugu Matrimony Free", "Tamil Matrimony Free", "Hindi Matrimony Free", "Kannada Matrimony Free", "Malayalam Matrimony Free", "Marathi Matrimony Free", "Bengali Matrimony Free", "Punjabi Matrimony Free", "Gujarati Matrimony Free", "Best Matchmaking Site",
    "AI Dating App", "Free Chat Matrimony", "Jeevansathi Alternative", "Shaadi Alternative", "Bumble Alternative",
    "100% Free Matchmaking", "Direct Chat Matrimony", "No Subscription Dating",
    "Safe Matrimony App for Women", "Career Women Matrimony", "Anti Harassment Matrimonial App",
    "NRI Matrimony USA", "NRI Matrimony UK", "NRI Matrimony Canada", "NRI Matrimony Australia", "NRI Matrimony Dubai",
    "Free Kundali Matching Online", "Guna Milan 36 Points",
    
    // Multilingual & Multi-region Terms
    "Dating App USA", "Dating App Japan", "Dating App Korea", "Dating App Philippines", "Dating App Indonesia",
    "Знакомства Онлайн", "Citas Gratis en Todo el Mundo", "無料マッチングアプリ", "한국 데이팅 앱", "App de Rencontres Gratuite"
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in',
    languages: {
      'x-default': 'https://lifepartnerai.in',
      'en': 'https://lifepartnerai.in',
      'en-IN': 'https://lifepartnerai.in',
      'en-US': 'https://lifepartnerai.in/usa',
      'en-GB': 'https://lifepartnerai.in/uk',
      'en-CA': 'https://lifepartnerai.in/canada',
      'en-AU': 'https://lifepartnerai.in/australia',
      'en-SG': 'https://lifepartnerai.in/singapore',
      'en-PH': 'https://lifepartnerai.in/philippines',
      'en-AE': 'https://lifepartnerai.in/uae',
      'ja-JP': 'https://lifepartnerai.in/japan',
      'ko-KR': 'https://lifepartnerai.in/korea',
      'ru-RU': 'https://lifepartnerai.in/russia',
      'id-ID': 'https://lifepartnerai.in/indonesia',
      'ms-MY': 'https://lifepartnerai.in/malaysia',
      'vi-VN': 'https://lifepartnerai.in/vietnam',
      'th-TH': 'https://lifepartnerai.in/thailand',
      'pt-BR': 'https://lifepartnerai.in/brazil',
      'de-DE': 'https://lifepartnerai.in/germany',
      'fr-FR': 'https://lifepartnerai.in/france',
    }
  },
  openGraph: {
    title: 'LifePartner AI | #1 Free AI Matrimony & Worldwide Dating App',
    description: "Connect & chat with verified singles globally on LifePartner AI. 100% Free Direct Chat, AI Compatibility, and Women-First Privacy Protection across India, USA, UK, Canada, Australia, Japan, Korea & worldwide.",
    url: 'https://lifepartnerai.in',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://lifepartnerai.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI - #1 Free Worldwide Dating & Matrimony Platform',
      },
      {
        url: 'https://lifepartnerai.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI - Verified Matrimony & Matchmaking',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifePartner AI | #1 Free AI Matrimony & Worldwide Dating App',
    description: 'Join verified singles finding love globally on LifePartner AI. Featuring 100% Free Direct Chat, AI Matchmaking, Snaps, Stories & Women-First Safety.',
    images: ['https://lifepartnerai.in/opengraph-image', 'https://lifepartnerai.in/og-image.jpg'],
  }
};

export default function LandingPage() {
  // 3. JSON-LD SCHEMA (Structured Data for Search Crawlers)
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LifePartner AI",
    "url": "https://lifepartnerai.in",
    "logo": "https://lifepartnerai.in/icon-512x512.png",
    "sameAs": [
      "https://twitter.com/lifepartnerai",
      "https://www.instagram.com/lifepartnerai.in",
      "https://www.youtube.com/@lifepartnerai"
    ],
    "description": "The world's #1 AI-powered worldwide dating & matrimony platform offering 100% free direct chat, AI compatibility matching, Women-First safety protection, Snaps, 24h Stories, and Music Vibe matching with zero paywalls.",
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
    "alternateName": ["LifePartner AI Matrimony", "LifePartner AI Dating"],
    "url": "https://lifepartnerai.in"
  };

  const jsonLdApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LifePartner AI",
    "url": "https://lifepartnerai.in",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web, Android, iOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "100% Free Registration, Direct Chat, and Lifetime Queen VIP for Female Users"
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
        "name": "For Women (100% Free VIP & Safety)",
        "item": "https://lifepartnerai.in/for-women"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Matchmaking & Relationship Guides",
        "item": "https://lifepartnerai.in/blog"
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
          "description": "Connect with verified Indian singles, NRI professionals, and international singles in USA, UK, Canada, Australia, and worldwide."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "100% Free Lifetime Queen VIP for Women",
          "description": "Exclusive privacy protections, AI Anti-Creep filter, masked contact information, and unlimited free messaging and video calls for women."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Vedic Kundali Milan & AI Compatibility",
          "description": "Free 36 Gunas Vedic astrology compatibility combined with deep psychological personality matching."
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
        "name": "How does LifePartner AI protect female privacy and prevent screenshots?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI provides every female member with 100% Free Lifetime Queen VIP status, an AI Anti-Creep harassment filter, masked contact details, and disappearing Snaps with built-in screenshot protection."
        }
      },
      {
        "@type": "Question",
        "name": "Can NRI singles in USA, UK, Canada, and Australia find matrimony and dating matches for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! LifePartner AI supports NRI and worldwide matchmaking across 190+ countries including USA, UK, Canada, Australia, UAE, Singapore, Japan, Korea, and Europe with multi-language support."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI Wingman and Cosmic Matching work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our context-aware AI analyzes deep personal values, lifestyle habits, Vedic astrology compatibility, and shared music tastes to suggest the highest quality soulmate matches."
        }
      },
      {
        "@type": "Question",
        "name": "Why is LifePartner AI safer for Indian women than traditional matrimony apps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI grants 100% Lifetime Queen VIP status to all women with 100 free coins, proactive AI anti-creep message filtering that blocks vulgar language and unsolicited phone numbers, masked contact info, and screenshot-protected disappearing snaps."
        }
      },
      {
        "@type": "Question",
        "name": "Does LifePartner AI support regional Indian languages like Telugu, Tamil, and Hindi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, LifePartner AI is fully localized in Telugu, Tamil, Hindi, Kannada, Malayalam, Marathi, Bengali, and Punjabi, as well as English, Japanese, Korean, Russian, and Arabic for global users."
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
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
