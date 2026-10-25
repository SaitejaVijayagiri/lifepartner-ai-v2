import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Playfair_Display, Roboto_Mono } from "next/font/google";
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

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
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
    canonical: './',
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
    default: "LifePartner AI | #1 Free AI Matrimony & Worldwide Dating App (100% Verified)",
    template: "%s | LifePartner AI - Free AI Matrimony & Worldwide Dating"
  },
  description: "Meet 100% verified singles for serious matrimony and meaningful dating worldwide—100% free. Zero subscription paywalls, AI compatibility matching, instant direct chat, HD video calls, and Women-First privacy protection.",
  keywords: [
    // Women-First & High-Trust Dating / Matrimony Keywords
    "safe dating app for women", "free matrimony app without payment", "women first dating app",
    "verified matrimony profiles", "100% free matchmaking app", "AI matrimony and dating",
    "free direct chat matrimony", "anti harassment dating app", "screenshot proof dating app",

    // Global & NRI Matchmaking Keywords
    "worldwide dating app free", "global matchmaking platform", "NRI matrimony free chat",
    "NRI dating app USA UK Canada Australia", "international matchmaking verified singles",
    "dating app USA", "dating app UK", "dating app Canada", "dating app Australia",
    "dating app Japan", "dating app Korea", "dating app Singapore", "dating app UAE",

    // Indian & Regional Matrimony Keywords
    "Matrimony", "Free Matrimony", "Telugu Matrimony Free", "Tamil Matrimony Free", "Hindi Matrimony Free",
    "Kerala Matrimony Free", "Marathi Matrimony", "Kannada Matrimony", "Bengali Matrimony",
    "Jeevansathi Alternative Free", "Shaadi Alternative Free", "Bharat Matrimony Alternative",
    "Bumble Alternative Free", "Hinge Alternative", "Free Kundli Matching", "AI Biodata Maker",
    "Verified Singles Meetups", "Doctor Matrimony", "Software Engineer Matrimony", "IAS IPS Matrimony",
    "Punjabi Matrimony Free", "Gujarati Matrimony Free", "Odia Matrimony Free",
    "safe matrimony for girls", "women-first matrimony app", "career women matrimony",
    "Kundli Milan free", "Ashtakoot Guna matching", "Kundali matching 36 gun",
    "NRI matrimony USA", "NRI matrimony UK", "NRI matrimony Canada", "NRI matrimony Australia", "NRI matrimony Dubai",
    "matrimony without brokers", "free direct video call matrimony", "anti harassment matrimony"
  ],
  authors: [{ name: "LifePartner AI Team" }],
  creator: "LifePartner AI",
  publisher: "LifePartner AI",
  manifest: 'https://lifepartnerai.in/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "en_CA", "en_AU", "en_IN", "ja_JP", "ko_KR", "hi_IN", "te_IN", "ta_IN"],
    url: "https://lifepartnerai.in",
    title: "LifePartner AI | #1 Free AI Matrimony & Worldwide Dating App",
    description: "Meet verified singles for serious matrimony and meaningful dating worldwide—100% free. Zero paywalls, instant direct chat, HD video calls, and Women-First privacy protection.",
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
    title: "LifePartner AI | #1 Free AI Matrimony & Worldwide Dating App",
    description: "Join 10,000+ verified singles finding love on LifePartner AI. 100% Free Direct Chat, AI Compatibility & Women-First Privacy Protection.",
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
        {/* Native Android / iOS WebView Optimizer & Pre-hydration Routing */}
        <Script id="native-app-optimizer" strategy="beforeInteractive">{`
          (function() {
            try {
              var isNative = !!(window.AndroidBridge || window.androidBridge || window.webkit || 
                                /LifePartnerApp|Capacitor/i.test(navigator.userAgent) ||
                                window.matchMedia('(display-mode: standalone)').matches ||
                                location.search.indexOf('app=') !== -1);
              if (isNative) {
                document.documentElement.setAttribute('data-capacitor', 'true');
                document.documentElement.classList.add('native-app-mode');
                var token = localStorage.getItem('token');
                var userId = localStorage.getItem('userId');
                if (token && userId && (location.pathname === '/' || location.pathname === '/register')) {
                  location.replace('/dashboard');
                }
              }
            } catch(e) {}
          })();
        `}</Script>

        {/* Google AdSense - only load on desktop/mobile web, NEVER inside native Android app */}
        <Script id="adsense-loader" strategy="afterInteractive">{`
          if (!document.documentElement.hasAttribute('data-capacitor') && !window.AndroidBridge && !window.androidBridge && !/LifePartnerApp|Capacitor/i.test(navigator.userAgent)) {
            var adScript = document.createElement('script');
            adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1408290775036355";
            adScript.async = true;
            adScript.crossOrigin = "anonymous";
            document.head.appendChild(adScript);
          }
        `}</Script>

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
              "description": "Worldwide AI-powered free matrimony, matchmaking & dating service connecting singles globally.",
              "areaServed": [
                { "@type": "AdministrativeArea", "name": "Worldwide" },
                { "@type": "Country", "name": "India" },
                { "@type": "Country", "name": "United States" },
                { "@type": "Country", "name": "United Kingdom" },
                { "@type": "Country", "name": "Canada" },
                { "@type": "Country", "name": "Australia" },
                { "@type": "Country", "name": "United Arab Emirates" },
                { "@type": "Country", "name": "Singapore" },
                { "@type": "Country", "name": "Germany" },
                { "@type": "Country", "name": "Malaysia" },
                { "@type": "Country", "name": "New Zealand" }
              ],
              "availableLanguage": ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali", "Punjabi", "Gujarati", "Spanish", "French", "Russian", "Arabic", "Japanese", "Korean"],
              "serviceType": [
                "AI Compatibility Matchmaking",
                "100% Free Matrimony Direct Chat",
                "Women-First Privacy & Anti-Creep Protection",
                "Vedic Astrology & Kundali Milan Matching",
                "Worldwide NRI Cross-Border Matchmaking"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "1250"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "name": "100% Free Registration & Chat"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "LifePartner AI App",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Android, iOS, Web",
              "countriesSupported": "Worldwide",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
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
        className={`${fontSans.variable} ${fontHeading.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased`}
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
