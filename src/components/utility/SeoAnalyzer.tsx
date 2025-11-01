"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Search, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SeoIssue {
    type: "error" | "warning" | "success";
    category: string;
    message: string;
    impact: "high" | "medium" | "low";
}

interface SeoAnalysis {
    score: number;
    issues: SeoIssue[];
    summary: {
        title: string;
        description: string;
        keywords: string[];
        headings: { h1: number; h2: number; h3: number };
        images: { total: number; withAlt: number };
        links: { internal: number; external: number };
    };
    recommendations: string[];
}

export default function SeoAnalyzer() {
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsAnalyzing(true);
        const loadingToast = toast.loading("Analyzing SEO...", {
            description: "Fetching and analyzing page content"
        });

        try {
            const response = await fetch("/api/utility/seo-analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze URL");
            }

            const data = await response.json();
            setAnalysis(data);

            toast.success("Analysis complete!", {
                id: loadingToast,
                description: `SEO Score: ${data.score}/100`
            });
        } catch (error) {
            console.error("Error analyzing URL:", error);
            toast.error("Failed to analyze URL", {
                id: loadingToast,
                description: "Please check the URL and try again"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Needs Improvement";
        return "Poor";
    };

    const getImpactColor = (impact: string) => {
        if (impact === "high") return "text-red-500";
        if (impact === "medium") return "text-yellow-500";
        return "text-blue-500";
    };

    const getIssueIcon = (type: string) => {
        if (type === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (type === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    };

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        SEO Analyzer
                    </CardTitle>
                    <CardDescription>
                        Analyze your website's SEO performance with AI-powered insights
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && handleAnalyze()}
                                className="bg-zinc-900 border-zinc-700"
                            />
                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !url.trim()}
                                className="min-w-[120px]"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Analyzing
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4 mr-2" />
                                        Analyze
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {analysis && (
                <>
                    {/* SEO Score */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                SEO Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className={`text-6xl font-bold ${getScoreColor(analysis.score)}`}>
                                    {analysis.score}
                                </div>
                                <div className="text-sm text-zinc-400 mt-2">
                                    {getScoreLabel(analysis.score)}
                                </div>
                            </div>
                            <Progress value={analysis.score} className="h-3" />
                        </CardContent>
                    </Card>

                    {/* Page Summary */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader>
                            <CardTitle>Page Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                    <p className="text-sm font-medium text-zinc-400">Title</p>
                                    <p className="text-sm mt-1">{analysis.summary.title || "No title found"}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                    <p className="text-sm font-medium text-zinc-400">Meta Description</p>
                                    <p className="text-sm mt-1">{analysis.summary.description || "No description found"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                        <p className="text-sm font-medium text-zinc-400">Headings</p>
                                        <p className="text-sm mt-1">
                                            H1: {analysis.summary.headings.h1} | H2: {analysis.summary.headings.h2} | H3: {analysis.summary.headings.h3}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                        <p className="text-sm font-medium text-zinc-400">Images</p>
                                        <p className="text-sm mt-1">
                                            {analysis.summary.images.withAlt}/{analysis.summary.images.total} with alt text
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                        <p className="text-sm font-medium text-zinc-400">Internal Links</p>
                                        <p className="text-sm mt-1">{analysis.summary.links.internal}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                                        <p className="text-sm font-medium text-zinc-400">External Links</p>
                                        <p className="text-sm mt-1">{analysis.summary.links.external}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Issues */}
                    {analysis.issues.length > 0 && (
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader>
                                <CardTitle>Issues Found</CardTitle>
                                <CardDescription>
                                    {analysis.issues.length} issue{analysis.issues.length !== 1 ? "s" : ""} detected
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysis.issues.map((issue, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg bg-zinc-900 border border-zinc-700"
                                        >
                                            <div className="flex items-start gap-3">
                                                {getIssueIcon(issue.type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium">{issue.category}</span>
                                                        <span className={`text-xs ${getImpactColor(issue.impact)}`}>
                                                            {issue.impact.toUpperCase()} IMPACT
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400">{issue.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Recommendations */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader>
                            <CardTitle>AI-Powered Recommendations</CardTitle>
                            <CardDescription>
                                Actionable insights to improve your SEO
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.recommendations.map((recommendation, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 flex items-start gap-3"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-zinc-300 flex-1">{recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
