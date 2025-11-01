import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

interface SeoIssue {
    type: "error" | "warning" | "success";
    category: string;
    message: string;
    impact: "high" | "medium" | "low";
}

function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

async function fetchPageContent(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    return await response.text();
}

function analyzeHtml(html: string) {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Count headings
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

    // Count images and alt attributes
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const totalImages = imgTags.length;
    const imagesWithAlt = imgTags.filter(img => /alt=["'][^"']*["']/i.test(img)).length;

    // Count links
    const linkTags = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
    const internalLinks = linkTags.filter(link => {
        const hrefMatch = link.match(/href=["']([^"']*)["']/i);
        if (!hrefMatch) return false;
        const href = hrefMatch[1];
        return href.startsWith('/') || href.startsWith('#') || !href.startsWith('http');
    }).length;
    const externalLinks = linkTags.length - internalLinks;

    // Extract keywords from meta tags
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

    return {
        title,
        description,
        keywords,
        headings: { h1: h1Count, h2: h2Count, h3: h3Count },
        images: { total: totalImages, withAlt: imagesWithAlt },
        links: { internal: internalLinks, external: externalLinks },
    };
}

function generateIssues(summary: ReturnType<typeof analyzeHtml>): SeoIssue[] {
    const issues: SeoIssue[] = [];

    // Title checks
    if (!summary.title) {
        issues.push({
            type: "error",
            category: "Title",
            message: "Missing page title. Add a descriptive title tag.",
            impact: "high",
        });
    } else if (summary.title.length < 30) {
        issues.push({
            type: "warning",
            category: "Title",
            message: `Title is too short (${summary.title.length} chars). Aim for 50-60 characters.`,
            impact: "medium",
        });
    } else if (summary.title.length > 60) {
        issues.push({
            type: "warning",
            category: "Title",
            message: `Title is too long (${summary.title.length} chars). Keep it under 60 characters.`,
            impact: "medium",
        });
    } else {
        issues.push({
            type: "success",
            category: "Title",
            message: "Title length is optimal.",
            impact: "low",
        });
    }

    // Meta description checks
    if (!summary.description) {
        issues.push({
            type: "error",
            category: "Meta Description",
            message: "Missing meta description. Add a compelling description.",
            impact: "high",
        });
    } else if (summary.description.length < 120) {
        issues.push({
            type: "warning",
            category: "Meta Description",
            message: `Description is too short (${summary.description.length} chars). Aim for 150-160 characters.`,
            impact: "medium",
        });
    } else if (summary.description.length > 160) {
        issues.push({
            type: "warning",
            category: "Meta Description",
            message: `Description is too long (${summary.description.length} chars). Keep it under 160 characters.`,
            impact: "medium",
        });
    } else {
        issues.push({
            type: "success",
            category: "Meta Description",
            message: "Meta description length is optimal.",
            impact: "low",
        });
    }

    // Heading checks
    if (summary.headings.h1 === 0) {
        issues.push({
            type: "error",
            category: "Headings",
            message: "Missing H1 tag. Add a main heading to your page.",
            impact: "high",
        });
    } else if (summary.headings.h1 > 1) {
        issues.push({
            type: "warning",
            category: "Headings",
            message: `Multiple H1 tags found (${summary.headings.h1}). Use only one H1 per page.`,
            impact: "medium",
        });
    } else {
        issues.push({
            type: "success",
            category: "Headings",
            message: "H1 tag structure is correct.",
            impact: "low",
        });
    }

    // Image alt text checks
    if (summary.images.total > 0) {
        const missingAlt = summary.images.total - summary.images.withAlt;
        if (missingAlt > 0) {
            issues.push({
                type: "warning",
                category: "Images",
                message: `${missingAlt} image${missingAlt > 1 ? 's' : ''} missing alt text. Add descriptive alt attributes.`,
                impact: "medium",
            });
        } else {
            issues.push({
                type: "success",
                category: "Images",
                message: "All images have alt text.",
                impact: "low",
            });
        }
    }

    // Links check
    if (summary.links.internal === 0) {
        issues.push({
            type: "warning",
            category: "Internal Links",
            message: "No internal links found. Add links to other pages on your site.",
            impact: "medium",
        });
    }

    return issues;
}

function calculateScore(issues: SeoIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
        if (issue.type === "error") {
            if (issue.impact === "high") score -= 15;
            else if (issue.impact === "medium") score -= 10;
            else score -= 5;
        } else if (issue.type === "warning") {
            if (issue.impact === "high") score -= 10;
            else if (issue.impact === "medium") score -= 5;
            else score -= 2;
        }
    });

    return Math.max(0, Math.min(100, score));
}

async function generateAiRecommendations(summary: ReturnType<typeof analyzeHtml>, issues: SeoIssue[]): Promise<string[]> {
    try {
        const prompt = `As an SEO expert, analyze this webpage data and provide 5 specific, actionable recommendations to improve SEO:

Title: ${summary.title || "None"}
Description: ${summary.description || "None"}
H1 tags: ${summary.headings.h1}
H2 tags: ${summary.headings.h2}
H3 tags: ${summary.headings.h3}
Images: ${summary.images.total} (${summary.images.withAlt} with alt text)
Internal links: ${summary.links.internal}
External links: ${summary.links.external}

Issues found:
${issues.map(i => `- ${i.category}: ${i.message}`).join('\n')}

Provide exactly 5 recommendations as a JSON array of strings. Focus on practical, specific actions.`;

        const result = await model.generateContent(prompt + "\n\nReturn ONLY the JSON array, no other text.");
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handle markdown code blocks)
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
        // Fallback recommendations
        return [
            "Optimize your title tag to include primary keywords and stay within 50-60 characters.",
            "Write a compelling meta description that includes target keywords and calls-to-action.",
            "Ensure proper heading hierarchy (H1 > H2 > H3) throughout your content.",
            "Add descriptive alt text to all images for better accessibility and SEO.",
            "Increase internal linking to improve site navigation and distribute page authority.",
        ];
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        // Validate URL
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

        // Fetch page content
        const html = await fetchPageContent(url);

        // Analyze HTML
        const summary = analyzeHtml(html);

        // Generate issues
        const issues = generateIssues(summary);

        // Calculate score
        const score = calculateScore(issues);

        // Generate AI recommendations
        const recommendations = await generateAiRecommendations(summary, issues);

        return NextResponse.json({
            score,
            issues,
            summary,
            recommendations,
        });

    } catch (error) {
        console.error('Error in SEO analyze API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
