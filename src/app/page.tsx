"use client";

import BrowserCompatibility from "@/components/BrowserCompatibility";
import FeaturesSection from "@/components/layout/FeaturesSection";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/layout/HeroSection";
import LayoutTest from "@/components/LayoutTest";
import LazyFAQSection from "@/components/lazy/LazyFAQSection";
import UsageWarning from "@/components/UsageWarning";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useState } from "react";

const ICON_SIZE = 20;

function HomeInner() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("voice-hub");
  const [activeToolTab, setActiveToolTab] = useState<string | null>(null);

  useEffect(() => {
    const category = searchParams.get("category");
    const tool = searchParams.get("tool");

    if (category) setActiveCategory(category);
    if (tool) {
      setActiveToolTab(tool);
      setTimeout(() => {
        const toolsSection = document.getElementById("tools-section");
        if (toolsSection) toolsSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen font-sans transition-colors duration-200 bg-background">
      <Header />
      <main
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
        role="main"
      >
        <HeroSection />
        <BrowserCompatibility />
        <UsageWarning />
        <LayoutTest />

        <Script id="adsterra-options-1" strategy="afterInteractive">
          {`
            atOptions = {
              key: '782ab596c62dc6dc9cbd9e788cf492d5',
              format: 'iframe',
              height: 90,
              width: 728,
              params: {}
            };
          `}
        </Script>
        <Script id="adsterra-options-2" strategy="afterInteractive">
          {`
            atOptions = {
              key: '5f5974a83798aa28cd290cbee513c6e2',
              format: 'iframe',
              height: 90,
              width: 728,
              params: {}
            };
          `}
        </Script>

        <div id="container-8250dc77e079516ac855643826e93e7d"></div>
        <div id="container-d7335c49fed82ef151c040dd10690d7e"></div>

        <FeaturesSection />
      </main>
      <LazyFAQSection />
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <HomeInner />
    </Suspense>
  );
}
