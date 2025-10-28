"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShortenedUrl {
    shortCode: string;
    originalUrl: string;
    shortUrl: string;
    createdAt: string;
}

export default function UrlShortener() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);

    const handleShorten = async () => {
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

        setIsLoading(true);
        const loadingToast = toast.loading("Shortening URL...", {
            description: "Creating your short link"
        });

        try {
            const response = await fetch("/api/utility/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error("Failed to shorten URL");
            }

            const data = await response.json();

            const newShortenedUrl: ShortenedUrl = {
                shortCode: data.shortCode,
                originalUrl: url,
                shortUrl: data.shortUrl,
                createdAt: new Date().toISOString(),
            };

            setShortenedUrls(prev => [newShortenedUrl, ...prev]);
            setUrl("");

            toast.success("URL shortened successfully!", {
                id: loadingToast,
                description: "Your short link is ready to use"
            });
        } catch (error) {
            console.error("Error shortening URL:", error);
            toast.error("Failed to shorten URL", {
                id: loadingToast,
                description: "Please try again"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!", {
            description: "Short URL has been copied"
        });
    };

    const openUrl = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        URL Shortener
                    </CardTitle>
                    <CardDescription>
                        Create short, shareable links from long URLs
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Enter URL to shorten</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://example.com/very-long-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleShorten()}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Button
                                onClick={handleShorten}
                                disabled={isLoading || !url.trim()}
                                className="min-w-[100px]"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Shorten"
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {shortenedUrls.length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle>Your Shortened URLs</CardTitle>
                        <CardDescription>
                            Click to copy or open your shortened links
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {shortenedUrls.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-blue-400 truncate">
                                                {item.shortUrl}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {item.originalUrl}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyToClipboard(item.shortUrl)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openUrl(item.shortUrl)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Created {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}