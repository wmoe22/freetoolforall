"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Gauge, Loader2, Monitor, Smartphone, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PageSpeedMetric {
    score: number;
    displayValue?: string;
    numericValue?: number;
}

interface PageSpeedCategory {
    score: number;
    title: string;
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

interface AnalysisData {
    mobile: PageSpeedResult;
    desktop: PageSpeedResult;
    recommendations: string[];
    analyzedUrl: string;
}

export default function PageSpeedAnalyzer() {
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [activeTab, setActiveTab] = useState<"mobile" | "desktop">("mobile");

    const handleAnalyze = async () => {
        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        try {
            new URL(url);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsAnalyzing(true);
        const loadingToast = toast.loading("Analyzing performance...", {
            description: "Running PageSpeed Insights for mobile and desktop"
        });

        try {
            const response = await fetch("/api/utility/pagespeed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to analyze URL");
            }

            const data = await response.json();
            setAnalysis(data);

            toast.success("Analysis complete!", {
                id: loadingToast,
                description: `Performance Score: ${data.mobile.categories.performance.score}/100 (Mobile)`
            });
        } catch (error) {
            console.error("Error analyzing URL:", error);
            toast.error("Failed to analyze URL", {
                id: loadingToast,
                description: error instanceof Error ? error.message : "Please check the URL and try again"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 50) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return "bg-green-500/20 border-green-500/50";
        if (score >= 50) return "bg-yellow-500/20 border-yellow-500/50";
        return "bg-red-500/20 border-red-500/50";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return "Good";
        if (score >= 50) return "Needs Improvement";
        return "Poor";
    };

    const renderCategoryCard = (title: string, score: number, icon: React.ReactNode) => (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-zinc-400">{title}</span>
                </div>
                <span className={`text-xs ${getScoreColor(score)}`}>
                    {getScoreLabel(score)}
                </span>
            </div>
            <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}
                </span>
                <span className="text-zinc-500 text-sm mb-1">/100</span>
            </div>
            <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${score >= 90 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );

    const renderMetricCard = (label: string, metric: PageSpeedMetric) => (
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-400">{label}</span>
                {metric.score >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : metric.score >= 50 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                )}
            </div>
            <div className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                {metric.displayValue}
            </div>
        </div>
    );

    const renderDeviceResults = (data: PageSpeedResult) => (
        <div className="space-y-6">
            {/* Category Scores */}
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Category Scores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderCategoryCard("Performance", data.categories.performance.score, <Zap className="h-4 w-4" />)}
                        {renderCategoryCard("Accessibility", data.categories.accessibility.score, <CheckCircle2 className="h-4 w-4" />)}
                        {renderCategoryCard("Best Practices", data.categories["best-practices"].score, <TrendingUp className="h-4 w-4" />)}
                        {renderCategoryCard("SEO", data.categories.seo.score, <Gauge className="h-4 w-4" />)}
                    </div>
                </CardContent>
            </Card>

            {/* Core Metrics */}
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle>Core Web Vitals & Metrics</CardTitle>
                    <CardDescription>Key performance indicators for user experience</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {renderMetricCard("First Contentful Paint", data.metrics.fcp)}
                        {renderMetricCard("Largest Contentful Paint", data.metrics.lcp)}
                        {renderMetricCard("Total Blocking Time", data.metrics.tbt)}
                        {renderMetricCard("Cumulative Layout Shift", data.metrics.cls)}
                        {renderMetricCard("Speed Index", data.metrics.si)}
                        {renderMetricCard("Time to Interactive", data.metrics.tti)}
                    </div>
                </CardContent>
            </Card>

            {/* Opportunities */}
            {data.opportunities.length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle>Opportunities</CardTitle>
                        <CardDescription>Suggestions to improve performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.opportunities.map((opportunity, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-zinc-900 border border-zinc-700"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getScoreBgColor(opportunity.score)} border`}>
                                            <span className={`text-xs font-bold ${getScoreColor(opportunity.score)}`}>
                                                {opportunity.score}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-sm font-medium">{opportunity.title}</span>
                                                {opportunity.displayValue && (
                                                    <span className="text-xs text-zinc-400">{opportunity.displayValue}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400">{opportunity.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Diagnostics */}
            {data.diagnostics.length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle>Diagnostics</CardTitle>
                        <CardDescription>Additional performance insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.diagnostics.map((diagnostic, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-zinc-900 border border-zinc-700"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-sm font-medium">{diagnostic.title}</span>
                                                {diagnostic.displayValue && (
                                                    <span className="text-xs text-zinc-400">{diagnostic.displayValue}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400">{diagnostic.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        PageSpeed Insights Analyzer
                    </CardTitle>
                    <CardDescription>
                        Analyze your website's performance with Google PageSpeed Insights
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
                                        <Gauge className="h-4 w-4 mr-2" />
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
                    {/* Device Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "mobile" | "desktop")}>
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border border-zinc-700">
                            <TabsTrigger value="mobile" className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Mobile
                            </TabsTrigger>
                            <TabsTrigger value="desktop" className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                Desktop
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="mobile" className="mt-6">
                            {renderDeviceResults(analysis.mobile)}
                        </TabsContent>

                        <TabsContent value="desktop" className="mt-6">
                            {renderDeviceResults(analysis.desktop)}
                        </TabsContent>
                    </Tabs>

                    {/* AI Recommendations */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                AI-Powered Recommendations
                            </CardTitle>
                            <CardDescription>
                                Actionable insights to improve your website performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.recommendations.map((recommendation, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 flex items-start gap-3"
                                    >
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-medium border border-blue-500/50">
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
