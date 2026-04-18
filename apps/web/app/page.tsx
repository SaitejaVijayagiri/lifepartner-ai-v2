import { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

// 1. GENERATE METADATA (Server Side)
export const metadata: Metadata = {
  title: 'LifePartner AI | #1 Free Matrimony & Matchmaking App in India',
  description: "The world's first AI-powered offline-first matrimony platform. 100% Verified Profiles for Telugu, Tamil, Hindi, & Kannada matchmaking. Discover the smartest Dating App alternative today.",
  keywords: [
    "Matrimony", "Free Matrimony", "Telugu Matrimony", "Tamil Matrimony", "Best Matchmaking Site",
    "AI Dating", "Jeevansathi Alternative", "Shaadi Alternative", "Bharat Matrimony",
    "Free Chat Matrimony", "Online Chat", "Chat with Strangers", "Video Dating",
    "Marriage Bureau", "Safe Matrimony", "Verified Profiles",
    "No Payment Matrimony", "100% Free Matchmaking", "Free Kundli Matching", "Biodata Maker", "Dating App"
  ],
  alternates: {
    canonical: 'https://lifepartnerai.in',
  },
  openGraph: {
    title: 'LifePartner AI | Best Free Matrimony Site & Dating App in India',
    description: "Join 10,000+ verified singles finding love on LifePartner AI. The smarter, safer alternative to Shaadi and Jeevansathi.",
    images: ['/api/og?title=Find%20Your%20Forever&subtitle=The%20World\'s%20First%20AI-Powered%20Matchmaking%20Platform'],
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
      "https://www.instagram.com/lifepartnerai.in?utm_source=qr&igsh=MXVrdGhpeWd0ZHNkMw=="
    ],
    "description": "The world's first AI-powered offline-first matrimony platform offering semantic search and verified connections.",
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
      <LandingPageClient />
    </>
  );
}
