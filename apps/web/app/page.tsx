import { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

// 1. GENERATE METADATA (Server Side)
export const metadata: Metadata = {
  title: 'LifePartner AI | #1 Free Worldwide Dating & Matrimony App',
  description: "The world's first AI-powered 100% free worldwide dating and matrimony platform. Connect & chat with verified singles globally in USA, UK, Canada, Australia, India, Europe & worldwide with zero paywalls.",
  keywords: [
    "Worldwide Dating App", "Free Worldwide Dating", "Global Matchmaking", "NRI Dating", "Free Dating App",
    "Matrimony", "Free Matrimony", "Telugu Matrimony", "Tamil Matrimony", "Hindi Matrimony", "Best Matchmaking Site",
    "AI Dating App", "Online Dating Worldwide", "Best Free Dating App", "Jeevansathi Alternative", "Shaadi Alternative", "Bharat Matrimony",
    "Free Chat Dating App", "Online Chat with Strangers", "Video Dating App", "International Dating",
    "Verified Single Profiles", "Global Singles", "No Subscription Dating", "100% Free Matchmaking", "Free Kundli Matching",
    "Dating USA", "Dating UK", "Dating Canada", "Dating Australia", "NRI Matrimony"
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in',
  },
  openGraph: {
    title: 'LifePartner AI | Best Free Worldwide Dating & Matrimony App',
    description: "Join verified singles finding love globally on LifePartner AI. The smarter, safer alternative for international dating & matrimony with zero hidden fees.",
    images: ['/api/og?title=Connect%20%26%20Chat%20Free%20Worldwide&subtitle=The%20World\'s%20First%20AI-Powered%20Dating%20%26%20Matchmaking%20Platform'],
  }
};

export default function LandingPage() {
  // 3. JSON-LD SCHEMA (Structured Data)
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
    "description": "The world's first AI-powered worldwide dating & matrimony platform offering semantic search, AI wingman, and verified connections with zero subscription paywalls.",
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
          "text": "Yes! LifePartner AI offers 100% free registration, profile browsing, instant messaging, and matchmaking worldwide with zero paywalls or forced subscription fees."
        }
      },
      {
        "@type": "Question",
        "name": "How does LifePartner AI support both Worldwide Dating and Matrimony?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LifePartner AI allows users to set their intent — whether seeking worldwide dating, international matchmaking, or traditional serious matrimony — ensuring you only connect with like-minded singles."
        }
      },
      {
        "@type": "Question",
        "name": "Can I chat with verified singles in the USA, UK, Canada, Australia, and India for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, LifePartner AI connects verified singles globally. You can search by country, city, interest, or language and chat instantly for free."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI verification prevent fake profiles and catfishing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Profiles undergo bank-grade photo and biometric verification, anti-spam filters, and privacy protection controls to guarantee authentic human matches."
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
