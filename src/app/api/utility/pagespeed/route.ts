import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PAGESPEED_API_KEY = process.env.GOOGLECLOUD_API_KEY || "";
const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface PageSpeedMetric {
    score: number;
    displayValue?: string;
    numericValue?: number;
}

interface PageSpeedCategory {
    score: number;
    title: string;
}

interface PageSpeedAudit {
    title: string;
    description: string;
    score: number | null;
    displayValue?: string;
    details?: any;
}

interface PageSpeedResult {
    categories: {
        performance: PageSpeedCategory;
        accessibility: PageSpeedCategory;
        "best-practices": PageSpeedCategory;
        seo: PageSpeedCategory;
    };
    metrics: {
        fcp: PageSpeedMetric;
        lcp: PageSpeedMetric;
        tbt: PageSpeedMetric;
        cls: PageSpeedMetric;
        si: PageSpeedMetric;
        tti: PageSpeedMetric;
    };
    opportunities: Array<{
        title: string;
        description: string;
        displayValue?: string;
        score: number;
    }>;
    diagnostics: Array<{
        title: string;
        description: string;
        displayValue?: string;
    }>;
}

function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

async function fetchPageSpeedData(url: string, strategy: 'mobile' | 'desktop'): Promise<any> {
    const apiUrl = `${PAGESPEED_API_URL}?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${PAGESPEED_API_KEY}&category=performance&category=accessibility&category=best-practices&category=seo`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch PageSpeed data');
    }

    return await response.json();
}

function parsePageSpeedData(data: any): PageSpeedResult {
    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;
    const categories = lighthouseResult.categories;

    // Extract categories
    const categoriesData = {
        performance: {
            score: Math.round((categories.performance?.score || 0) * 100),
            title: categories.performance?.title || "Performance"
        },
        accessibility: {
            score: Math.round((categories.accessibility?.score || 0) * 100),
            title: categories.accessibility?.title || "Accessibility"
        },
        "best-practices": {
            score: Math.round((categories['best-practices']?.score || 0) * 100),
            title: categories['best-practices']?.title || "Best Practices"
        },
        seo: {
            score: Math.round((categories.seo?.score || 0) * 100),
            title: categories.seo?.title || "SEO"
        }
    };

    // Extract core metrics
    const metrics = {
        fcp: {
            score: Math.round((audits['first-contentful-paint']?.score || 0) * 100),
            displayValue: audits['first-contentful-paint']?.displayValue || "N/A",
            numericValue: audits['first-contentful-paint']?.numericValue || 0
        },
        lcp: {
            score: Math.round((audits['largest-contentful-paint']?.score || 0) * 100),
            displayValue: audits['largest-contentful-paint']?.displayValue || "N/A",
            numericValue: audits['largest-contentful-paint']?.numericValue || 0
        },
        tbt: {
            score: Math.round((audits['total-blocking-time']?.score || 0) * 100),
            displayValue: audits['total-blocking-time']?.displayValue || "N/A",
            numericValue: audits['total-blocking-time']?.numericValue || 0
        },
        cls: {
            score: Math.round((audits['cumulative-layout-shift']?.score || 0) * 100),
            displayValue: audits['cumulative-layout-shift']?.displayValue || "N/A",
            numericValue: audits['cumulative-layout-shift']?.numericValue || 0
        },
        si: {
            score: Math.round((audits['speed-index']?.score || 0) * 100),
            displayValue: audits['speed-index']?.displayValue || "N/A",
            numericValue: audits['speed-index']?.numericValue || 0
        },
        tti: {
            score: Math.round((audits['interactive']?.score || 0) * 100),
            displayValue: audits['interactive']?.displayValue || "N/A",
            numericValue: audits['interactive']?.numericValue || 0
        }
    };

    // Extract opportunities (things that can be improved)
    const opportunities: any[] = [];
    Object.keys(audits).forEach(key => {
        const audit = audits[key];
        if (audit.details?.type === 'opportunity' && audit.score !== null && audit.score < 1) {
            opportunities.push({
                title: audit.title,
                description: audit.description,
                displayValue: audit.displayValue,
                score: Math.round((audit.score || 0) * 100)
            });
        }
    });

    // Extract diagnostics
    const diagnostics: any[] = [];
    Object.keys(audits).forEach(key => {
        const audit = audits[key];
        if (audit.details?.type === 'table' && audit.score !== null && audit.score < 1 && !opportunities.find(o => o.title === audit.title)) {
            diagnostics.push({
                title: audit.title,
                description: audit.description,
                displayValue: audit.displayValue
            });
        }
    });

    return {
        categories: categoriesData,
        metrics,
        opportunities: opportunities.slice(0, 5), // Top 5 opportunities
        diagnostics: diagnostics.slice(0, 5) // Top 5 diagnostics
    };
}

async function generateAiRecommendations(mobileData: PageSpeedResult, desktopData: PageSpeedResult, url: string): Promise<string[]> {
    try {
        const prompt = `As a web performance expert, analyze these PageSpeed Insights results and provide 6 specific, actionable recommendations:

URL: ${url}

MOBILE RESULTS:
- Performance: ${mobileData.categories.performance.score}/100
- Accessibility: ${mobileData.categories.accessibility.score}/100
- Best Practices: ${mobileData.categories["best-practices"].score}/100
- SEO: ${mobileData.categories.seo.score}/100

Core Metrics (Mobile):
- FCP: ${mobileData.metrics.fcp.displayValue}
- LCP: ${mobileData.metrics.lcp.displayValue}
- TBT: ${mobileData.metrics.tbt.displayValue}
- CLS: ${mobileData.metrics.cls.displayValue}

DESKTOP RESULTS:
- Performance: ${desktopData.categories.performance.score}/100
- Accessibility: ${desktopData.categories.accessibility.score}/100

Top Opportunities (Mobile):
${mobileData.opportunities.slice(0, 3).map(o => `- ${o.title}: ${o.displayValue || ''}`).join('\n')}

Provide exactly 6 prioritized recommendations as a JSON array of strings. Focus on the most impactful improvements.`;

        const result = await model.generateContent(prompt + "\n\nReturn ONLY the JSON array, no other text.");
        const response = result.response;
        const text = response.text();

        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const recommendations = JSON.parse(jsonText);
        return Array.isArray(recommendations) ? recommendations : [];
    } catch (error) {
        console.error("Error generating AI recommendations:", error);
        return [
            "Optimize images by using modern formats like WebP and implementing lazy loading.",
            "Minimize JavaScript execution time by code splitting and removing unused code.",
            "Reduce server response time by implementing caching and using a CDN.",
            "Eliminate render-blocking resources by deferring non-critical CSS and JavaScript.",
            "Improve Largest Contentful Paint by optimizing your largest image or text block.",
            "Minimize Cumulative Layout Shift by setting explicit dimensions for images and embeds."
        ];
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        if (!isValidUrl(url)) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        if (!PAGESPEED_API_KEY) {
            return NextResponse.json(
                { error: 'PageSpeed API key not configured' },
                { status: 500 }
            );
        }

        // Fetch both mobile and desktop data
        const [mobileRawData, desktopRawData] = await Promise.all([
            fetchPageSpeedData(url, 'mobile'),
            fetchPageSpeedData(url, 'desktop')
        ]);

        // Parse the data
        const mobileData = parsePageSpeedData(mobileRawData);
        const desktopData = parsePageSpeedData(desktopRawData);

        // Generate AI recommendations
        const recommendations = await generateAiRecommendations(mobileData, desktopData, url);

        return NextResponse.json({
            mobile: mobileData,
            desktop: desktopData,
            recommendations,
            analyzedUrl: url
        });

    } catch (error) {
        console.error('Error in PageSpeed API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
