"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  AudioWaveform,
  Briefcase,
  Copy,
  Eye,
  FileText,
  Link,
  Maximize2,
  Mic,
  Palette,
  RefreshCw,
  Scissors,
  Search,
  Settings,
  Shield,
  Upload,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// Define all available tools with their categories and metadata
const ALL_TOOLS = [
  // Voice Hub Tools
  {
    id: "speech-to-text",
    name: "Speech to Text",
    category: "voice",
    description: "Convert audio files to text",
    icon: Upload,
    keywords: ["speech", "audio", "transcribe", "voice", "stt"],
    tabValue: "speech-to-text",
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    category: "voice",
    description: "Convert text to audio",
    icon: Volume2,
    keywords: ["text", "speech", "voice", "audio", "tts"],
    tabValue: "text-to-speech",
  },
  {
    id: "audio-converter",
    name: "Audio Converter",
    category: "voice",
    description: "Convert between audio formats",
    icon: AudioWaveform,
    keywords: ["audio", "convert", "format", "mp3", "wav"],
    tabValue: "audio-converter",
  },
  {
    id: "subtitle-generator",
    name: "Subtitle Generator",
    category: "voice",
    description: "Generate subtitles from audio",
    icon: FileText,
    keywords: ["subtitle", "captions", "srt", "audio", "video"],
    tabValue: "subtitle-generator",
  },
  {
    id: "audio-trimmer",
    name: "Audio Trimmer",
    category: "voice",
    description: "Trim and edit audio files",
    icon: Scissors,
    keywords: ["audio", "trim", "cut", "edit"],
    tabValue: "audio-trimmer",
  },

  // Document Hub Tools
  {
    id: "file-converter",
    name: "File Converter",
    category: "document",
    description: "Convert between document formats",
    icon: RefreshCw,
    keywords: ["convert", "pdf", "word", "excel", "document"],
    tabValue: "converter",
  },
  {
    id: "pdf-compress",
    name: "PDF Compressor",
    category: "document",
    description: "Compress PDF files",
    icon: Settings,
    keywords: ["pdf", "compress", "reduce", "size"],
    tabValue: "compress",
  },
  {
    id: "pdf-split",
    name: "PDF Splitter",
    category: "document",
    description: "Split PDF into multiple files",
    icon: Scissors,
    keywords: ["pdf", "split", "divide", "pages"],
    tabValue: "split",
  },
  {
    id: "pdf-merge",
    name: "PDF Merger",
    category: "document",
    description: "Merge multiple PDFs",
    icon: Copy,
    keywords: ["pdf", "merge", "combine", "join"],
    tabValue: "merge",
  },

  // Business Hub Tools
  {
    id: "proposal-generator",
    name: "Proposal Generator",
    category: "business",
    description: "Generate business proposals",
    icon: FileText,
    keywords: ["proposal", "business", "generate", "document"],
    tabValue: "proposal",
  },
  {
    id: "invoice-generator",
    name: "Invoice Generator",
    category: "business",
    description: "Create professional invoices",
    icon: FileText,
    keywords: ["invoice", "billing", "business", "payment"],
    tabValue: "invoice",
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    category: "business",
    description: "Generate meeting notes from audio",
    icon: Mic,
    keywords: ["meeting", "notes", "transcribe", "business"],
    tabValue: "meeting",
  },

  // Visual Hub Tools
  {
    id: "image-compress",
    name: "Image Compressor",
    category: "visual",
    description: "Compress images while maintaining quality",
    icon: Zap,
    keywords: ["image", "compress", "optimize", "reduce"],
    tabValue: "compress",
  },
  {
    id: "image-resize",
    name: "Image Resizer",
    category: "visual",
    description: "Resize images to specific dimensions",
    icon: Maximize2,
    keywords: ["image", "resize", "dimensions", "scale"],
    tabValue: "resize",
  },
  {
    id: "image-crop",
    name: "Image Cropper",
    category: "visual",
    description: "Crop images to specific areas",
    icon: Scissors,
    keywords: ["image", "crop", "cut", "trim"],
    tabValue: "crop",
  },
  {
    id: "image-convert",
    name: "Image Converter",
    category: "visual",
    description: "Convert between image formats",
    icon: RefreshCw,
    keywords: ["image", "convert", "format", "jpg", "png", "webp"],
    tabValue: "convert",
  },
  {
    id: "background-remove",
    name: "Background Remover",
    category: "visual",
    description: "Remove backgrounds from images",
    icon: Palette,
    keywords: ["background", "remove", "transparent", "image"],
    tabValue: "background",
  },

  // Security Hub Tools
  {
    id: "file-scanner",
    name: "File Scanner",
    category: "security",
    description: "Scan files for viruses and malware",
    icon: Shield,
    keywords: ["scan", "virus", "malware", "security", "file"],
    tabValue: "file-scanner",
  },
  {
    id: "url-scanner",
    name: "URL Scanner",
    category: "security",
    description: "Check URLs for malicious content",
    icon: Link,
    keywords: ["url", "scan", "security", "malicious", "website"],
    tabValue: "url-scanner",
  },
  /*  {
    id: "cookie-compliance",
    name: "GDPR Cookie Checker",
    category: "security",
    description: "Check website GDPR cookie compliance",
    icon: Shield,
    keywords: ["gdpr", "cookie", "compliance", "privacy", "security"],
    tabValue: "cookie-compliance",
  },
  {
    id: "email-blacklist",
    name: "Email Blacklist Checker",
    category: "security",
    description: "Check if domain or IP is on spam lists",
    icon: Shield,
    keywords: ["email", "blacklist", "spam", "reputation", "domain", "ip"],
    tabValue: "email-blacklist",
  }, */

  // Utility Hub Tools
  {
    id: "url-shortener",
    name: "URL Shortener",
    category: "utility",
    description: "Create short, shareable links from long URLs",
    icon: Link,
    keywords: ["url", "shortener", "link", "utility"],
    tabValue: "url-shortener",
  },
  {
    id: "token-counter",
    name: "LLM Token Counter",
    category: "utility",
    description: "Count tokens and estimate costs for LLM models",
    icon: Settings,
    keywords: ["token", "counter", "llm", "ai"],
    tabValue: "token-counter",
  },
  /*  {
    id: "hash-generator",
    name: "Hash Generator",
    category: "utility",
    description: "Generate MD5, SHA-1, and SHA-256 hashes",
    icon: Settings,
    keywords: ["hash", "generator", "md5", "sha"],
    tabValue: "hash-generator",
  }, 
  {
    id: "api-inspector",
    name: "API Response Inspector",
    category: "utility",
    description: "Inspect and format API responses",
    icon: Search,
    keywords: ["api", "inspector", "response", "format"],
    tabValue: "api-inspector",
  },*/
];

const CATEGORIES = [
  {
    id: "voice",
    name: "Voice Hub",
    icon: Volume2,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    id: "document",
    name: "Document Hub",
    icon: FileText,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    id: "business",
    name: "Business Hub",
    icon: Briefcase,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  {
    id: "visual",
    name: "Visual Hub",
    icon: Eye,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  {
    id: "security",
    name: "Security Hub",
    icon: Shield,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  {
    id: "utility",
    name: "Utility Hub",
    icon: Settings,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  },
];

const LayoutTest = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Filter tools based on search query and selected categories
  const filteredTools = useMemo(() => {
    let filtered = ALL_TOOLS;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((tool) =>
        selectedCategories.includes(tool.category)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId);
  };

  const handleToolClick = (tool: (typeof ALL_TOOLS)[0]) => {
    // Navigate to dedicated tool pages
    const toolRoutes: { [key: string]: string } = {
      // Voice Hub Tools
      "speech-to-text": "/tools/speech-to-text",
      "text-to-speech": "/tools/text-to-speech",
      "audio-converter": "/tools/audio-converter",
      "subtitle-generator": "/tools/subtitle-generator",
      "audio-trimmer": "/tools/audio-trimmer",

      // Document Hub Tools
      "file-converter": "/tools/file-converter",
      "pdf-compress": "/tools/pdf-compressor",
      "pdf-split": "/tools/pdf-splitter",
      "pdf-merge": "/tools/pdf-merger",

      // Business Hub Tools
      "proposal-generator": "/tools/proposal-generator",
      "invoice-generator": "/tools/invoice-generator",
      "meeting-notes": "/tools/meeting-notes",

      // Visual Hub Tools
      "image-compress": "/tools/image-compressor",
      "image-resize": "/tools/image-resizer",
      "image-crop": "/tools/image-cropper",
      "image-convert": "/tools/image-converter",
      "background-remove": "/tools/background-remover",

      // Security Hub Tools
      "file-scanner": "/tools/file-scanner",
      "url-scanner": "/tools/url-scanner",
      //'cookie-compliance': '/tools/cookie-compliance',
      // 'email-blacklist': '/tools/email-blacklist',

      // Utility Hub Tools
      "url-shortener": "/tools/url-shortener",
      "token-counter": "/tools/token-counter",
      //'hash-generator': '/tools/hash-generator',
      //'api-inspector': '/tools/api-inspector',
    };

    const route = toolRoutes[tool.id];
    if (route) {
      router.push(route);
    } else {
      // Fallback to home page with parameters if route not found
      const categoryMap = {
        voice: "voice-hub",
        document: "document-hub",
        business: "business-hub",
        visual: "visual-hub",
        security: "security-hub",
      };

      const categoryTab =
        categoryMap[tool.category as keyof typeof categoryMap];
      const toolTab = tool.tabValue;
      router.push(`/?category=${categoryTab}&tool=${toolTab}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Search and Filter Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {filteredTools.length} result{filteredTools.length !== 1 ? "s" : ""}
          </InputGroupAddon>
        </InputGroup>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Filter by category:
          </span>

          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategories.includes(category.id);

            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryToggle(category.id)}
                className="h-8"
              >
                <Icon size={14} className="mr-1.5" />
                {category.name}
              </Button>
            );
          })}

          {(searchQuery || selectedCategories.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-zinc-500 hover:text-zinc-700"
            >
              <X size={14} className="mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Active filters:</span>
            {selectedCategories.map((categoryId) => {
              const category = getCategoryInfo(categoryId);
              if (!category) return null;

              const Icon = category.icon;
              return (
                <Badge
                  key={categoryId}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <Icon size={12} />
                  {category.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="h-4 w-4 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <X size={10} />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {filteredTools.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={48} className="text-zinc-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                No tools found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Try adjusting your search query or filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const category = getCategoryInfo(tool.category);
              const CategoryIcon = category?.icon || FileText;

              return (
                <Card
                  key={tool.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleToolClick(tool)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-zinc-100 border dark:border-zinc-700 dark:bg-zinc-800 rounded-lg">
                          <Icon
                            size={20}
                            className="text-zinc-700 dark:text-zinc-300"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                            {tool.name}
                          </h3>
                        </div>
                      </div>
                      {category && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          <CategoryIcon size={10} />
                          {category.name.replace(" Hub", "")}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                      {tool.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {tool.keywords.slice(0, 3).map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="outline"
                          className="text-xs px-1.5 py-0.5"
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {tool.keywords.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0.5"
                        >
                          +{tool.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutTest;
