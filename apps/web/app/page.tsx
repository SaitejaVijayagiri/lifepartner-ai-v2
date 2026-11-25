import { Metadata } from 'next';
import { headers } from 'next/headers';
import LandingPageClient from '@/components/LandingPageClient';
import NativeAppGate from '@/components/NativeAppGate';

// 1. GENERATE METADATA FOR GLOBAL BROWSER RANKINGS (Server Side)
export const metadata: Metadata = {
  title: 'LifePartner AI | Privacy-First Free Matrimony & Women-Safe Matchmaking',
  description: "Privacy-first AI matrimony and serious matchmaking built for women and families in India & NRI hubs worldwide. Control blurred photos until accepted, verify real Govt IDs & selfies, stop telemarketer spam, and chat free with mutual matches.",
  keywords: [
    "Privacy-First Matrimony", "Safe Matrimony App for Women", "Zero Telemarketer Matrimony",
    "Free Mutual Match Matrimony", "NRI Matrimony India USA UK Canada Australia UAE",
    "ID Verified Matrimony Profiles", "Family-Safe Biodata Link", "Blur Photo Matrimony",
    "Women First Matchmaking", "AI Anti-Creep Shield", "AI Anti-Scam Matrimony",
    "Telugu Matrimony Free", "Tamil Matrimony Free", "Hindi Matrimony Free",
    "Kannada Matrimony Free", "Malayalam Matrimony Free", "Marathi Matrimony Free",
    "Bengali Matrimony Free", "Punjabi Matrimony Free", "Gujarati Matrimony Free",
    "Free Kundali Matching Online", "Guna Milan 36 Points", "Intentional Matchmaking India"
  ],
  alternates: {
    canonical: 'https://www.lifepartnerai.in',
    languages: {
      'x-default': 'https://www.lifepartnerai.in',
      'en': 'https://www.lifepartnerai.in',
      'en-IN': 'https://www.lifepartnerai.in/india',
      'en-US': 'https://www.lifepartnerai.in/usa',
      'en-GB': 'https://www.lifepartnerai.in/uk',
      'en-CA': 'https://www.lifepartnerai.in/canada',
      'en-AU': 'https://www.lifepartnerai.in/australia',
      'en-SG': 'https://www.lifepartnerai.in/singapore',
      'en-PH': 'https://www.lifepartnerai.in/philippines',
      'en-AE': 'https://www.lifepartnerai.in/uae',
      'ja-JP': 'https://www.lifepartnerai.in/japan',
      'ko-KR': 'https://www.lifepartnerai.in/korea',
      'ru-RU': 'https://www.lifepartnerai.in/russia',
      'id-ID': 'https://www.lifepartnerai.in/indonesia',
      'ms-MY': 'https://www.lifepartnerai.in/malaysia',
      'vi-VN': 'https://www.lifepartnerai.in/vietnam',
      'th-TH': 'https://www.lifepartnerai.in/thailand',
      'pt-BR': 'https://www.lifepartnerai.in/brazil',
      'de-DE': 'https://www.lifepartnerai.in/germany',
      'fr-FR': 'https://www.lifepartnerai.in/france'
    }
  },
  openGraph: {
    title: 'LifePartner AI | Privacy-First Free Matrimony & Safe Matchmaking',
    description: "Built for women and serious families across India & NRI hubs worldwide. Zero telemarketer calls, blurred-photo privacy controls, Govt ID verification, and free mutual-match chat.",
    url: 'https://www.lifepartnerai.in',
    siteName: 'LifePartner AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.lifepartnerai.in/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI - Privacy-First Matrimony & Women-Safe Matchmaking',
      },
      {
        url: 'https://www.lifepartnerai.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LifePartner AI - Verified Matrimony & Matchmaking',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifePartner AI | Privacy-First Matrimony & Women-Safe Matchmaking',
    description: 'Zero telemarketer spam, blurred-photo lock until accepted, AI Anti-Scam & Anti-Creep Shield, and free mutual-match chat for serious matchmaking.',
    images: ['https://www.lifepartnerai.in/opengraph-image', 'https://www.lifepartnerai.in/og-image.jpg'],
  }
};

export default function LandingPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let isNativeApp = false;
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    isNativeApp =
      searchParams?.app === 'native' ||
      searchParams?.mode === 'standalone' ||
      /LifePartnerApp|Capacitor/i.test(userAgent);
  } catch (_) {}

  if (isNativeApp) {
    return <NativeAppGate />;
  }

  // Structured Data for Search Crawlers
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LifePartner AI",
    "url": "https://www.lifepartnerai.in",
    "logo": "https://www.lifepartnerai.in/icon-512x512.png",
    "sameAs": [
      "https://twitter.com/lifepartnerai",
      "https://www.instagram.com/lifepartnerai.in",
      "https://www.youtube.com/@lifepartnerai"
    ],
    "description": "Privacy-first AI matrimony and serious matchmaking platform with zero telemarketer spam, blurred-photo controls, Govt ID & selfie verification, AI anti-scam protection, and free mutual-match chat.",
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
    "alternateName": ["LifePartner AI Matrimony", "LifePartner AI Safe Matchmaking"],
    "url": "https://www.lifepartnerai.in"
  };

  const jsonLdApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LifePartner AI",
    "url": "https://www.lifepartnerai.in",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Free registration, free mutual-match chat, and Women-First safety protections."
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
        "item": "https://www.lifepartnerai.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "For Women (Free VIP & Safety Shield)",
        "item": "https://www.lifepartnerai.in/for-women"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Matrimony Guides & Safety Blog",
        "item": "https://www.lifepartnerai.in/blog"
      }
    ]
  };

  const jsonLdOfferCatalog = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "name": "Privacy-First Matrimony & Matchmaking Features",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Free Mutual-Match Matrimony Chat",
          "description": "Chat freely inside the app with mutual matches without paying unlock walls or exposing your personal mobile number."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Blurred-Photo Privacy & Family-Safe Biodata",
          "description": "Keep profile photos blurred until an interest is accepted and share read-only family biodata links without leaking contact details."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "India & NRI Worldwide Matchmaking",
          "description": "Connect with serious Indian and NRI matches across India, USA, UK, Canada, Australia, UAE, and Singapore."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Women-First Safety & Anti-Scam Shield",
          "description": "AI harassment and romance-scam masking, selfie + Govt ID review, masked calling, and Safe Meetup Angel Timer alerts."
        },
        "price": "0",
        "priceCurrency": "INR"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Vedic Kundali Milan & AI Compatibility",
          "description": "Free 36 Gunas Vedic astrology compatibility paired with lifestyle and values matching."
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
        "name": "Does LifePartner AI allow free chat for matrimony without forced paywalls?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Mutual matches can message and call inside the app for free without paying subscription unlock fees or exposing their private phone numbers."
        }
      },
      {
        "@type": "Question",
        "name": "How is LifePartner AI different from traditional matrimony websites?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We never sell user phone numbers to telemarketer call centers, clearly separate basic email confirmation from Govt ID & selfie verification, let women keep photos blurred until accepted, and offer read-only family biodata links."
        }
      },
      {
        "@type": "Question",
        "name": "How does LifePartner AI protect women's privacy and block scams?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every profile has masked contact info, optional blurred photos, an AI Anti-Creep & Anti-Scam Shield that flags and masks harassment or financial requests, repeat-reporter auto-quarantine, and Photo/ID verification requirements for unlimited Women VIP messaging."
        }
      },
      {
        "@type": "Question",
        "name": "Can NRI singles in the USA, UK, Canada, UAE, and Australia use LifePartner AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. LifePartner AI supports NRI and global matchmaking across 190+ countries including USA, UK, Canada, Australia, UAE, and Singapore with natural-language partner search."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI Compatibility and Vedic Kundali matching work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI evaluates shared values, lifestyle, profession, education, and optional 36-Guna Vedic compatibility to highlight serious long-term matches."
        }
      },
      {
        "@type": "Question",
        "name": "Does LifePartner AI support Indian and global languages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The interface supports Hindi, Telugu, Tamil, English, and major international languages for families and global NRI users."
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
