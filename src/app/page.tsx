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
import { useEffect, useState } from "react";

const ICON_SIZE = 20;

export default function Home() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("voice-hub");
  const [activeToolTab, setActiveToolTab] = useState<string | null>(null);


  // Handle URL parameters for direct tool navigation
  useEffect(() => {
    const category = searchParams.get('category');
    const tool = searchParams.get('tool');

    if (category) {
      setActiveCategory(category);
    }

    if (tool) {
      setActiveToolTab(tool);
      // Scroll to the tools section when navigating from search
      setTimeout(() => {
        const toolsSection = document.getElementById('tools-section');
        if (toolsSection) {
          toolsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [searchParams]);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 bg-background `}
    >
      <Header />

      {/* Main Content */}
      <main
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
        role="main"
      >
        {/* Ad Script Configuration */}
        <HeroSection />
        {/* Browser Compatibility Check */}
        <BrowserCompatibility />

        {/* Usage Warning */}
        <UsageWarning />
        <LayoutTest />

        {/*         <section id="tools-section" className="mt-8 mb-12">
          <h2 className="sr-only">
            Essential Tool Hubs
          </h2>
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <TabsList
              className="grid w-full grid-cols-5 bg-muted rounded-lg sm:rounded-xl h-10 sm:h-12 p-1" // Added p-1 for better visual
              role="tablist"
              aria-label="Essential tool hubs"
            >
              <TabsTrigger
                value="voice-hub"
                role="tab"
                aria-controls="voice-hub-panel"
                className="text-xs sm:text-sm py-2 sm:py-2.5 font-medium flex items-center justify-center" // Added flex classes for centering
              >
                <Volume2
                  size={ICON_SIZE}
                  className="mr-1 sm:mr-2"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Voice Hub</span>
                <span className="sm:hidden">Voice</span>
              </TabsTrigger>

              <TabsTrigger
                value="document-hub"
                role="tab"
                aria-controls="document-hub-panel"
                className="text-xs sm:text-sm py-2 sm:py-2.5 font-medium flex items-center justify-center"
              >
                <FileText
                  size={ICON_SIZE}
                  className="mr-1 sm:mr-2"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Document Hub</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>

              <TabsTrigger
                value="business-hub"
                role="tab"
                aria-controls="business-hub-panel"
                className="text-xs sm:text-sm py-2 sm:py-2.5 font-medium flex items-center justify-center"
              >
                <Briefcase
                  size={ICON_SIZE}
                  className="mr-1 sm:mr-2"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Business Hub</span>
                <span className="sm:hidden">Business</span>
              </TabsTrigger>

              <TabsTrigger
                value="visual-hub"
                role="tab"
                aria-controls="visual-hub-panel"
                className="text-xs sm:text-sm py-2 sm:py-2.5 font-medium flex items-center justify-center"
              >
                <Eye size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Visual Hub</span>
                <span className="sm:hidden">Visual</span>
              </TabsTrigger>

              <TabsTrigger
                value="security-hub"
                role="tab"
                aria-controls="security-hub-panel"
                className="text-xs sm:text-sm py-2 sm:py-2.5 font-medium flex items-center justify-center"
              >
                <Shield size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Security Hub</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="voice-hub"
              role="tabpanel"
              id="voice-hub-panel"
              aria-labelledby="voice-hub-tab"
              className="mt-4"
            >
              <VoiceHub initialTab={activeToolTab} />
            </TabsContent>

            <TabsContent
              value="document-hub"
              role="tabpanel"
              id="document-hub-panel"
              aria-labelledby="document-hub-tab"
              className="mt-4"
            >
              <DocumentHub initialTab={activeToolTab} />
            </TabsContent>

            <TabsContent
              value="business-hub"
              role="tabpanel"
              id="business-hub-panel"
              aria-labelledby="business-hub-tab"
              className="mt-4"
            >
              <BusinessHub initialTab={activeToolTab} />
            </TabsContent>

            <TabsContent
              value="visual-hub"
              role="tabpanel"
              id="visual-hub-panel"
              aria-labelledby="visual-hub-tab"
              className="mt-4"
            >
              <VisualHub initialTab={activeToolTab} />
            </TabsContent>

            <TabsContent
              value="security-hub"
              role="tabpanel"
              id="security-hub-panel"
              aria-labelledby="security-hub-tab"
              className="mt-4"
            >
              <SecurityHub initialTab={activeToolTab} />
            </TabsContent>
          </Tabs>
        </section> */}

        {/* The ad scripts and divs remain outside the main Tabs/Section for separation */}
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
    </div >
  );
}