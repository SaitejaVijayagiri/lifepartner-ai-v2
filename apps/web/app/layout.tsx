import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from '@/components/ClientProviders';
import NetworkStatus from '@/components/NetworkStatus';
import StickyCTA from '@/components/StickyCTA';

const fontSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fontHeading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lifepartnerai.in'),
  title: {
    default: "LifePartner AI | #1 Free Matrimony & Matchmaking App in India",
    template: "%s | LifePartner AI - Best Matrimony Site"
  },
  description: "Stop paying for matches. LifePartner AI is India's most advanced Free Matrimony app. 100% Verified Profiles for Telugu, Tamil, Hindi, & Kannada matchmaking. Interactive maps, secure video calls, and zero fake profiles.",
  keywords: [
    "Matrimony", "Free Matrimony", "Telugu Matrimony", "Tamil Matrimony", "Best Matchmaking Site",
    "AI Dating", "Jeevansathi Alternative", "Shaadi Alternative", "Bharat Matrimony",
    "Free Chat Matrimony", "Online Chat", "Chat with Strangers", "Video Dating",
    "Marriage Bureau", "Safe Matrimony", "Verified Profiles",
    "No Payment Matrimony", "100% Free Matchmaking", "Free Kundli Matching", "Biodata Maker"
  ],
  authors: [{ name: "LifePartner AI Team" }],
  creator: "LifePartner AI",
  manifest: 'https://lifepartnerai.in/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://lifepartnerai.in",
    title: "LifePartner AI | The Best Free Matrimony App for Indians",
    description: "Don't just swipe. Connect. The only offline-first, AI-driven matrimony platform for Verified Singles. Free Registration. Safe. Secure.",
    siteName: "LifePartner AI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LifePartner AI - #1 Trusted Matchmaking App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifePartner AI | Best Free Matrimony Site in India",
    description: "Join 10,000+ verified singles finding love on LifePartner AI. The smarter, safer alternative to Shaadi and Jeevansathi.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://lifepartnerai.in",
    languages: {
      'en-IN': 'https://lifepartnerai.in',
    },
  },
  category: "Dating Application",
  other: {
    "mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifePartner AI",
  },
  verification: {
    google: "h1YtVVKUNBUWiRdCy1nBnFSafvk76SNYhcwvwyxPtTE",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <meta name="google-site-verification" content="h1YtVVKUNBUWiRdCy1nBnFSafvk76SNYhcwvwyxPtTE" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        {/* Google AdSense - Real ID */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1408290775036355"
          crossOrigin="anonymous"></script>

        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G4V8Z3XF93"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G4V8Z3XF93');
          `}
        </Script>
        {/* Rich SEO Schema: DatingService + SoftwareApplication */}
        <Script id="rich-schema" type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "DatingService",
              "name": "LifePartner AI",
              "url": "https://lifepartnerai.in",
              "logo": "https://lifepartnerai.in/icon-512x512.png",
              "founders": [
                {
                  "@type": "Person",
                  "name": "Saiteja Vijayagiri"
                }
              ],
              "description": "India's first AI-powered free matrimony and matchmaking service.",
              "areaServed": "IN",
              "availableLanguage": ["English", "Telugu", "Hindi", "Tamil"],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "1250"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "name": "Free Registration"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "LifePartner AI App",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Android, iOS, Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              }
            }
          ])}
        </Script>
      </head>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <NetworkStatus />
          {children}
          <StickyCTA />
        </ClientProviders>
      </body>
    </html>
  );
}
