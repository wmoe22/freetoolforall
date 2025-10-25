"use client";

import BrowserCompatibility from "@/components/BrowserCompatibility";
import BusinessHub from "@/components/hubs/BusinessHub";
import DocumentHub from "@/components/hubs/DocumentHub";
import SecurityHub from "@/components/hubs/SecurityHub";
import VisualHub from "@/components/hubs/VisualHub";
import VoiceHub from "@/components/hubs/VoiceHub";
import FeaturesSection from "@/components/layout/FeaturesSection";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/layout/HeroSection";
import LazyFAQSection from "@/components/lazy/LazyFAQSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsageWarning from "@/components/UsageWarning";
import { useStore } from "@/store/useStore";
import { Briefcase, Eye, FileText, Shield, Volume2 } from "lucide-react";
import { useEffect } from "react";

const ICON_SIZE = 18;

export default function Home() {
  const { isDarkMode } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 bg-background ${
        isDarkMode ? "dark" : ""
      }`}
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

        {/* Main Hub Section */}
        <section aria-labelledby="hubs-heading" className="mb-8 sm:mb-12">
          <h2 id="hubs-heading" className="sr-only">
            Essential Tool Hubs
          </h2>
          <Tabs defaultValue="voice-hub" className="">
            <TabsList
              className="grid w-full grid-cols-5 bg-muted rounded-lg sm:rounded-xl h-14 sm:h-auto"
              role="tablist"
              aria-label="Essential tool hubs"
            >
              <TabsTrigger
                value="voice-hub"
                role="tab"
                aria-controls="voice-hub-panel"
                className="text-sm sm:text-base py-3 sm:py-4 font-medium"
              >
                <Volume2 size={ICON_SIZE} className="mr-2" aria-hidden="true" />
                Voice Hub
              </TabsTrigger>
              <TabsTrigger
                value="document-hub"
                role="tab"
                aria-controls="document-hub-panel"
                className="text-sm sm:text-base py-3 sm:py-4 font-medium"
              >
                <FileText
                  size={ICON_SIZE}
                  className="mr-2"
                  aria-hidden="true"
                />
                Document Hub
              </TabsTrigger>
              <TabsTrigger
                value="business-hub"
                role="tab"
                aria-controls="business-hub-panel"
                className="text-sm sm:text-base py-3 sm:py-4 font-medium"
              >
                <Briefcase
                  size={ICON_SIZE}
                  className="mr-2"
                  aria-hidden="true"
                />
                Business Hub
              </TabsTrigger>
              <TabsTrigger
                value="visual-hub"
                role="tab"
                aria-controls="visual-hub-panel"
                className="text-sm sm:text-base py-3 sm:py-4 font-medium"
              >
                <Eye size={ICON_SIZE} className="mr-2" aria-hidden="true" />
                Visual Hub
              </TabsTrigger>
              <TabsTrigger
                value="security-hub"
                role="tab"
                aria-controls="security-hub-panel"
                className="text-sm sm:text-base py-3 sm:py-4 font-medium"
              >
                <Shield size={ICON_SIZE} className="mr-2" aria-hidden="true" />
                Security Hub
              </TabsTrigger>
            </TabsList>

            {/* Voice Hub */}
            <TabsContent
              value="voice-hub"
              role="tabpanel"
              id="voice-hub-panel"
              aria-labelledby="voice-hub-tab"
            >
              <VoiceHub />
            </TabsContent>

            {/* Document Hub */}
            <TabsContent
              value="document-hub"
              role="tabpanel"
              id="document-hub-panel"
              aria-labelledby="document-hub-tab"
            >
              <DocumentHub />
            </TabsContent>

            {/* Business Hub */}
            <TabsContent
              value="business-hub"
              role="tabpanel"
              id="business-hub-panel"
              aria-labelledby="business-hub-tab"
            >
              <BusinessHub />
            </TabsContent>

            {/* Visual Hub */}
            <TabsContent
              value="visual-hub"
              role="tabpanel"
              id="visual-hub-panel"
              aria-labelledby="visual-hub-tab"
            >
              <VisualHub />
            </TabsContent>

            {/* Security Hub */}
            <TabsContent
              value="security-hub"
              role="tabpanel"
              id="security-hub-panel"
              aria-labelledby="security-hub-tab"
            >
              <SecurityHub />
            </TabsContent>
          </Tabs>
        </section>
        <div id="container-8250dc77e079516ac855643826e93e7d"></div>
        <FeaturesSection />
      </main>
      <LazyFAQSection />
      <Footer />
    </div>
  );
}
