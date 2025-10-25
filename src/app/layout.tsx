import ErrorBoundary from "@/components/ErrorBoundary";
import { Providers } from "@/components/providers";
import Analytics from "@/components/seo/Analytics";
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
    default: "SpeechFlow - Free Voice to Text & Text to Speech Converter",
    template: "%s | SpeechFlow",
  },
  description:
    "Transform your voice with seamless speech-to-text and text-to-speech conversion. Free online tool with no login required. Support for multiple languages and voice models.",
  keywords: [
    "speech to text",
    "text to speech",
    "voice converter",
    "audio transcription",
    "voice synthesis",
    "speech recognition",
    "TTS",
    "STT",
    "voice to text",
    "audio to text",
    "free speech converter",
    "online voice tools",
  ],
  authors: [{ name: "SpeechFlow Team" }],
  creator: "SpeechFlow",
  publisher: "SpeechFlow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://speechflow.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SpeechFlow - Free Voice to Text & Text to Speech Converter",
    description:
      "Transform your voice with seamless speech-to-text and text-to-speech conversion. Free online tool with no login required.",
    url: "/",
    siteName: "SpeechFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SpeechFlow - Voice Conversion Tools",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeechFlow - Free Voice to Text & Text to Speech Converter",
    description:
      "Transform your voice with seamless speech-to-text and text-to-speech conversion. Free online tool with no login required.",
    images: ["/og-image.png"],
    creator: "@speechflow",
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
    name: "SpeechFlow",
    description:
      "Free online speech-to-text and text-to-speech converter with no login required",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://speechflow.app",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Speech to Text Conversion",
      "Text to Speech Synthesis",
      "Multiple Voice Models",
      "Audio File Upload",
      "Real-time Transcription",
      "Download Audio Files",
    ],
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    permissions: "microphone",
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
          href={process.env.NEXT_PUBLIC_APP_URL || "https://speechflow.app"}
        />
        <script
          async={true}
          data-cfasync="false"
          src="//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js"
        ></script>
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
      </body>
      <script
        async={true}
        data-cfasync="false"
        src="//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js"
      ></script>
    </html>
  );
}
