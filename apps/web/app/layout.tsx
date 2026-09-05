import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from '@/components/ClientProviders';
import NetworkStatus from '@/components/NetworkStatus';
import StickyCTA from '@/components/StickyCTA';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import MessageToastBanner from '@/components/MessageToastBanner';
import NotificationToastBanner from '@/components/NotificationToastBanner';
import DateSafetyOverlay from '@/components/DateSafetyOverlay';
import PageViewTracker from '@/components/PageViewTracker';
import GlobalViewsBadge from '@/components/GlobalViewsBadge';
import AppModeHandler from '@/components/AppModeHandler';
import AnimatedSplash from '@/components/AnimatedSplash';

const fontSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const fontHeading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lifepartnerai.in'),
  alternates: {
    canonical: 'https://lifepartnerai.in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  title: {
    default: "LifePartner AI | Free Online Chat with Strangers, Matrimony & Dating App",
    template: "%s | LifePartner AI - Free Online Chat & Matchmaking App"
  },
  description: "Chat with strangers, random people & verified singles worldwide for 100% Free. LifePartner AI is the #1 Free Matrimony & Dating app. Talk to international guys, single Indian girls, and global NRI matches with zero payment, instant chat, and verified video calls.",
  keywords: [
    // High-Volume Global Stranger Chat & International Terms
    "online chat with strangers", "chat with random people", "chat with international guys",
    "talk to random people online", "free random video chat", "chat with single girls online",
    "talk to strangers free", "free international dating chat", "global chat with verified singles",
    "random chat online free no login", "chat with foreign guys online", "worldwide single chat",
    
    // High-Volume Indian & NRI Matrimony / Dating Terms
    "free matrimony chat without payment", "talk to single Indian girls", "free chat with verified girls",
    "best online chat app for matrimony India", "free Telugu matrimony chat", "free Tamil matrimony chat",
    "free Hindi matrimony chat", "jeevansathi free message chat alternative", "shaadi free chat app",
    "marriage bureau online chat free", "NRI matrimony chat", "NRI dating app free",
    
    // Core Matrimony & Matchmaking Terms
    "Matrimony", "Free Matrimony", "Telugu Matrimony", "Tamil Matrimony", "Best Matchmaking Site",
    "AI Dating", "Free Dating App", "Dating App Worldwide", "Find Love Globally", "Jeevansathi Alternative", "Shaadi Alternative", "Bharat Matrimony",
    "Free Chat Matrimony", "Online Chat", "Chat with Strangers", "Video Dating",
    "Marriage Bureau", "Safe Matrimony", "Verified Profiles", "NRI Matrimony", "Global Matchmaking",
    "No Payment Matrimony", "100% Free Matchmaking", "Free Kundli Matching", "Biodata Maker",
    "Singles Meetups", "Local Dating Events", "Offline Dating", "Meet Singles Near Me", "Verified Lounge"
  ],
  authors: [{ name: "LifePartner AI Team" }],
  creator: "LifePartner AI",
  manifest: 'https://lifepartnerai.in/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lifepartnerai.in",
    title: "LifePartner AI | The Best Free Matrimony & Dating App Worldwide",
    description: "Don't just swipe. Connect. The only offline-first, AI-driven worldwide matrimony & dating platform for Verified Singles. Free Registration. Safe. Secure.",
    siteName: "LifePartner AI",
    images: [
      {
        url: "https://lifepartnerai.in/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LifePartner AI - #1 Trusted Worldwide Matrimony & Dating App",
      },
      {
        url: "https://lifepartnerai.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LifePartner AI - #1 Matrimony & Matchmaking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifePartner AI | Best Free Matrimony & Dating App in India",
    description: "Join 10,000+ verified singles finding love on LifePartner AI. The smarter, safer alternative to Shaadi, Jeevansathi, and dating apps.",
    images: ["https://lifepartnerai.in/opengraph-image", "https://lifepartnerai.in/og-image.jpg"],
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
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/icon-192x192.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="shortcut icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LifePartner AI" />
        <meta name="google-site-verification" content="h1YtVVKUNBUWiRdCy1nBnFSafvk76SNYhcwvwyxPtTE" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        {/* Capacitor bridge: detect native WebView and enable native plugins */}
        <Script id="capacitor-bridge-detect" strategy="beforeInteractive">{`
          if (window.webkit || window.androidBridge || navigator.userAgent.includes('CapacitorApp')) {
            document.documentElement.setAttribute('data-capacitor', 'true');
          }
        `}</Script>

        {/* Google AdSense - Asynchronous Non-blocking strategy */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1408290775036355"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

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
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientProviders>
            <AnimatedSplash />
            <AppModeHandler />
            <PageViewTracker />
            <NetworkStatus />
            {children}
            <StickyCTA />
            <ThemeToggle />
            <MessageToastBanner />
            <NotificationToastBanner />
            <DateSafetyOverlay />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
