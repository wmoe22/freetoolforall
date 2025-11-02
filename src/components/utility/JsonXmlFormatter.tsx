"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Code2, Copy, FileCode, FileJson } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FormatType = "json" | "xml";

export default function JsonXmlFormatter() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [formatType, setFormatType] = useState<FormatType>("json");
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [error, setError] = useState("");

    const formatJson = (text: string): { formatted: string; valid: boolean; error?: string } => {
        try {
            const parsed = JSON.parse(text);
            const formatted = JSON.stringify(parsed, null, 2);
            return { formatted, valid: true };
        } catch (err) {
            return {
                formatted: "",
                valid: false,
                error: err instanceof Error ? err.message : "Invalid JSON"
            };
        }
    };

    const formatXml = (text: string): { formatted: string; valid: boolean; error?: string } => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            const parserError = xmlDoc.querySelector("parsererror");
            if (parserError) {
                return {
                    formatted: "",
                    valid: false,
                    error: parserError.textContent || "Invalid XML"
                };
            }

            // Format XML with indentation
            const serializer = new XMLSerializer();
            const formatted = formatXmlString(serializer.serializeToString(xmlDoc));

            return { formatted, valid: true };
        } catch (err) {
            return {
                formatted: "",
                valid: false,
                error: err instanceof Error ? err.message : "Invalid XML"
            };
        }
    };

    const formatXmlString = (xml: string): string => {
        let formatted = "";
        let indent = 0;
        const tab = "  ";

        xml.split(/>\s*</).forEach((node) => {
            if (node.match(/^\/\w/)) indent--;
            formatted += tab.repeat(indent) + "<" + node + ">\n";
            if (node.match(/^<?\w[^>]*[^\/]$/)) indent++;
        });

        return formatted.substring(1, formatted.length - 2);
    };

    const handleFormat = () => {
        if (!input.trim()) {
            toast.error("Please enter some content to format");
            return;
        }

        const result = formatType === "json" ? formatJson(input) : formatXml(input);

        if (result.valid) {
            setOutput(result.formatted);
            setIsValid(true);
            setError("");
            toast.success(`Valid ${formatType.toUpperCase()}!`, {
                description: "Content has been formatted"
            });
        } else {
            setOutput("");
            setIsValid(false);
            setError(result.error || "Invalid format");
            toast.error(`Invalid ${formatType.toUpperCase()}`, {
                description: result.error
            });
        }
    };

    const handleMinify = () => {
        if (!input.trim()) {
            toast.error("Please enter some content to minify");
            return;
        }

        if (formatType === "json") {
            const result = formatJson(input);
            if (result.valid) {
                const parsed = JSON.parse(input);
                const minified = JSON.stringify(parsed);
                setOutput(minified);
                setIsValid(true);
                setError("");
                toast.success("JSON minified successfully!");
            } else {
                setIsValid(false);
                setError(result.error || "Invalid JSON");
                toast.error("Invalid JSON", { description: result.error });
            }
        } else {
            const result = formatXml(input);
            if (result.valid) {
                const minified = input.replace(/>\s+</g, "><").trim();
                setOutput(minified);
                setIsValid(true);
                setError("");
                toast.success("XML minified successfully!");
            } else {
                setIsValid(false);
                setError(result.error || "Invalid XML");
                toast.error("Invalid XML", { description: result.error });
            }
        }
    };

    const handleValidate = () => {
        if (!input.trim()) {
            toast.error("Please enter some content to validate");
            return;
        }

        const result = formatType === "json" ? formatJson(input) : formatXml(input);

        setIsValid(result.valid);
        if (result.valid) {
            setError("");
            setOutput("");
            toast.success(`Valid ${formatType.toUpperCase()}!`, {
                description: "Your content is properly formatted"
            });
        } else {
            setError(result.error || "Invalid format");
            setOutput("");
            toast.error(`Invalid ${formatType.toUpperCase()}`, {
                description: result.error
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
        setIsValid(null);
        setError("");
    };

    return (
        <div className="space-y-6">
            <Card className="dark:bg-zinc-800 dark:border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex  items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        JSON/XML Formatter & Validator
                    </CardTitle>
                    <CardDescription>
                        Format, validate, and minify JSON or XML content
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs value={formatType} onValueChange={(v) => setFormatType(v as FormatType)} >
                        <TabsList className="grid w-full grid-cols-2 dark:bg-zinc-900">
                            <TabsTrigger value="json" className="flex items-center gap-2">
                                <FileJson className="h-4 w-4" />
                                JSON
                            </TabsTrigger>
                            <TabsTrigger value="xml" className="flex items-center gap-2">
                                <FileCode className="h-4 w-4" />
                                XML
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="input">Input {formatType.toUpperCase()}</Label>
                            {isValid !== null && (
                                <div className="flex items-center gap-1 text-sm">
                                    {isValid ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-green-500">Valid</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-red-500">Invalid</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <Textarea
                            id="input"
                            placeholder={formatType === "json"
                                ? '{"key": "value", "array": [1, 2, 3]}'
                                : '<root><element>value</element></root>'
                            }
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setIsValid(null);
                                setError("");
                            }}
                            className="min-h-[200px] font-mono text-sm  dark:bg-zinc-900 dark:border-zinc-700"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-950 border border-red-800 text-red-200 text-sm">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Validation Error</p>
                                    <p className="text-xs mt-1 text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleFormat}>
                            Format
                        </Button>
                        <Button onClick={handleMinify} variant="outline">
                            Minify
                        </Button>
                        <Button onClick={handleValidate} variant="outline">
                            Validate
                        </Button>
                        <Button onClick={handleClear} variant="outline">
                            Clear
                        </Button>
                    </div>

                    {output && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="output">Output</Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(output)}
                                    className="h-8"
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                </Button>
                            </div>
                            <Textarea
                                id="output"
                                value={output}
                                readOnly
                                className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-700"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
