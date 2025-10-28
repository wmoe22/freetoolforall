"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sha1Hash as generateSha1, sha256Hash as generateSha256, simpleMD5 } from "@/lib/crypto-utils";
import { Copy, Hash, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function HashGenerator() {
    const [inputText, setInputText] = useState("");
    const [md5Hash, setMd5Hash] = useState("");
    const [sha1Hash, setSha1Hash] = useState("");
    const [sha256Hash, setSha256Hash] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate all hashes
    const generateHashes = async () => {
        if (!inputText.trim()) {
            setMd5Hash("");
            setSha1Hash("");
            setSha256Hash("");
            return;
        }

        setIsGenerating(true);

        try {
            const [md5, sha1, sha256] = await Promise.all([
                Promise.resolve(simpleMD5(inputText)),
                generateSha1(inputText),
                generateSha256(inputText)
            ]);

            setMd5Hash(md5);
            setSha1Hash(sha1);
            setSha256Hash(sha256);
        } catch (error) {
            console.error("Error generating hashes:", error);
            toast.error("Failed to generate hashes", {
                description: "Please try again"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate hashes when input changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            generateHashes();
        }, 300); // Debounce for 300ms

        return () => clearTimeout(timeoutId);
    }, [inputText]);

    const copyToClipboard = (text: string, hashType: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${hashType} copied!`, {
            description: "Hash has been copied to clipboard"
        });
    };

    const clearAll = () => {
        setInputText("");
        setMd5Hash("");
        setSha1Hash("");
        setSha256Hash("");
        toast.info("All fields cleared");
    };

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Hash Generator
                    </CardTitle>
                    <CardDescription>
                        Generate MD5, SHA-1, and SHA-256 hashes from your text input
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="input-text">Input Text</Label>
                        <Textarea
                            id="input-text"
                            placeholder="Enter text to generate hashes..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={generateHashes}
                            disabled={isGenerating || !inputText.trim()}
                            className="flex-1"
                        >
                            {isGenerating ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Hash className="h-4 w-4 mr-2" />
                            )}
                            Generate Hashes
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            disabled={!inputText && !md5Hash && !sha1Hash && !sha256Hash}
                        >
                            Clear All
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {(md5Hash || sha1Hash || sha256Hash) && (
                <div className="space-y-4">
                    {/* MD5 Hash */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">MD5 Hash</CardTitle>
                            <CardDescription>
                                128-bit hash (32 hexadecimal characters) - Note: Simplified implementation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    value={md5Hash}
                                    readOnly
                                    className="bg-zinc-900 border-zinc-600 font-mono text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(md5Hash, "MD5 hash")}
                                    disabled={!md5Hash}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SHA-1 Hash */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">SHA-1 Hash</CardTitle>
                            <CardDescription>
                                160-bit hash (40 hexadecimal characters)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    value={sha1Hash}
                                    readOnly
                                    className="bg-zinc-900 border-zinc-600 font-mono text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(sha1Hash, "SHA-1 hash")}
                                    disabled={!sha1Hash}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SHA-256 Hash */}
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">SHA-256 Hash</CardTitle>
                            <CardDescription>
                                256-bit hash (64 hexadecimal characters)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    value={sha256Hash}
                                    readOnly
                                    className="bg-zinc-900 border-zinc-600 font-mono text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(sha256Hash, "SHA-256 hash")}
                                    disabled={!sha256Hash}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {inputText && !md5Hash && !sha1Hash && !sha256Hash && (
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardContent className="py-8 text-center">
                        <Hash className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                        <p className="text-zinc-400">
                            {isGenerating ? "Generating hashes..." : "Enter text to see hashes"}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}