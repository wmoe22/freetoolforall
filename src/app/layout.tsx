import ErrorBoundary from "@/components/ErrorBoundary";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Usefreetools - Essential Digital Tools & Utilities",
    template: "%s | Usefreetools",
  },
  description:
    "Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features. Everything you need in one powerful, free platform.",
  keywords: [
    "free online tools",
    "digital utilities",
    "speech to text converter",
    "text to speech generator",
    "audio converter online",
    "file converter free",
    "image compressor",
    "document converter",
    "pdf tools online",
    "business document generator",
    "invoice generator free",
    "proposal generator",
    "meeting notes generator",
    "image resize online",
    "background remover free",
    "image crop tool",
    "audio trimmer online",
    "subtitle generator",
    "virus scanner online",
    "malware scanner free",
    "url scanner security",
    "file scanner online",
    "compress images online",
    "convert images free",
    "split pdf online",
    "merge pdf free",
    "compress pdf online",
    "online utilities",
    "web tools free",
    "productivity tools",
    "no registration required",
    "browser based tools",
  ],
  authors: [{ name: "Usefreetools Team" }],
  creator: "Usefreetools",
  publisher: "Usefreetools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Usefreetools - Essential Digital Tools & Utilities",
    description:
      "Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features. Everything you need in one powerful, free platform.",
    url: "/",
    siteName: "Usefreetools",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Usefreetools - Essential Digital Tools & Utilities",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Usefreetools - Essential Digital Tools & Utilities",
    description:
      "Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features.",
    images: ["/logo.png"],
    creator: "@wmoe22",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Usefreetools",
    alternateName: "Use Free Tools",
    description:
      "Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features. Everything you need in one powerful, free platform.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "1.0",
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: "en-US",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Usefreetools Team",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"
    },
    publisher: {
      "@type": "Organization",
      name: "Usefreetools",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"}/logo.png`,
        width: 512,
        height: 512
      }
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2024-01-01"
    },
    featureList: [
      "Speech to Text Converter",
      "Text to Speech Generator",
      "Audio File Converter",
      "Audio Trimmer Tool",
      "Subtitle Generator",
      "Document File Converter",
      "PDF Compressor",
      "Document Splitter & Merger",
      "Image Compressor",
      "Image Resizer",
      "Image Cropper",
      "Background Remover",
      "Image Format Converter",
      "Invoice Generator",
      "Proposal Generator",
      "Meeting Notes Generator",
      "File Virus Scanner",
      "URL Malware Scanner",
      "Security Analysis Tools"
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1"
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5"
        },
        author: {
          "@type": "Person",
          name: "Digital Tools User"
        },
        reviewBody: "Amazing collection of free tools. Everything works perfectly and no registration required!"
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"}
        />
        {/* SEO Meta Tags */}
        <meta name="google-site-verification" content="QckK5UKbbaFN0iyIx0y6hXcuK6-LWFB3sDMmlTt3p28" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="1 days" />
        <meta name="rating" content="General" />
        <meta name="distribution" content="Global" />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Usefreetools - Essential Digital Tools & Utilities" />
        <meta property="og:description" content="Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features. Everything you need in one powerful, free platform." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"}/logo.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Usefreetools - Free Digital Tools and Utilities" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Usefreetools" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@wmoe22" />
        <meta name="twitter:creator" content="@wmoe22" />
        <meta name="twitter:title" content="Usefreetools - Essential Digital Tools & Utilities" />
        <meta name="twitter:description" content="Complete toolkit with voice processing, document conversion, visual tools, business generators, and security features." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || "https://usefreetools.site"}/logo.png`} />
        <meta name="twitter:image:alt" content="Usefreetools - Free Digital Tools and Utilities" />

        {/* Additional SEO Meta Tags */}
        <meta name="author" content="Usefreetools Team" />
        <meta name="publisher" content="Usefreetools" />
        <meta name="copyright" content="© 2024 Usefreetools. All rights reserved." />
        <meta name="application-name" content="Usefreetools" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Usefreetools" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://comprehensiveimplementationstrode.com" />
        <script
          async={true}
          data-cfasync="false"
          src="//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js"
        ></script>
        <meta name="yandex-verification" content="c8f38899dca7f73e" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
        <script
          async={true}
          data-cfasync="false"
          src="//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js"
        ></script>

        <script async={true} data-cfasync="false" src="//comprehensiveimplementationstrode.com/d7335c49fed82ef151c040dd10690d7e/invoke.js"></script>
      </body>
    </html>
  );
}
