import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from '@/components/ClientProviders';
import NetworkStatus from '@/components/NetworkStatus';

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
    default: "LifePartner AI | The Future of Matrimony & Dating",
    template: "%s | LifePartner AI"
  },
  description: "Find your perfect match with LifePartner AI. The world's first offline-first, privacy-focused AI matchmaking platform with semantic search, vibe checks, and verified profiles.",
  keywords: ["Matrimony", "AI Dating", "Matchmaking", "Jeevansathi", "Shaadi", "Dating App", "AI Matchmaker", "Free Matrimony", "Verified Profiles"],
  authors: [{ name: "LifePartner AI Team" }],
  creator: "LifePartner AI",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lifepartnerai.in",
    title: "LifePartner AI | Smart Matchmaking for Modern India",
    description: "Stop swiping. Start connecting. Use AI to find compatible partners based on values, career, and personality.",
    siteName: "LifePartner AI",
    images: [
      {
        url: "/og-image.jpg", // We need to ensure this image exists or use a default
        width: 1200,
        height: 630,
        alt: "LifePartner AI Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifePartner AI | Secure & Smart Matrimony",
    description: "Join the revolution in matchmaking. Verified profiles, AI vibe checks, and zero fake accounts.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "./",
  },
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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
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
        {/* Organization Schema (SEO) */}
        <Script id="organization-schema" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "LifePartner AI",
            "url": "https://lifepartnerai.in",
            "logo": "https://lifepartnerai.in/icon-512x512.png",
            "sameAs": [
              "https://lifepartnerai.in",
              "https://twitter.com/lifepartnerai"
            ],
            "description": "The world's first AI-powered offline-first matrimony platform.",
            "founder": {
              "@type": "Person",
              "name": "Saiteja Vijayagiri"
            }
          })}
        </Script>
      </head>
      <body
        className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <NetworkStatus />
          {children}

        </ClientProviders>
      </body>
    </html>
  );
}
