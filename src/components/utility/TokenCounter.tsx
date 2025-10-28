"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Hash, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Token counting functions for different models
const countTokens = (text: string, model: string): number => {
    if (!text.trim()) return 0;

    switch (model) {
        case 'gpt-4':
        case 'gpt-4-turbo':
        case 'gpt-3.5-turbo':
            // Rough approximation: 1 token ≈ 4 characters for GPT models
            return Math.ceil(text.length / 4);

        case 'claude-3':
        case 'claude-3-sonnet':
        case 'claude-3-haiku':
            // Claude uses similar tokenization to GPT
            return Math.ceil(text.length / 4);

        case 'llama-2':
        case 'llama-3':
            // LLaMA models have slightly different tokenization
            return Math.ceil(text.length / 3.8);

        case 'gemini-pro':
            // Gemini tokenization
            return Math.ceil(text.length / 4.2);

        default:
            // Default approximation
            return Math.ceil(text.length / 4);
    }
};

const getModelPricing = (model: string) => {
    const pricing: Record<string, { input: number; output: number; unit: string }> = {
        'gpt-4': { input: 0.03, output: 0.06, unit: '1K tokens' },
        'gpt-4-turbo': { input: 0.01, output: 0.03, unit: '1K tokens' },
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002, unit: '1K tokens' },
        'claude-3': { input: 0.015, output: 0.075, unit: '1K tokens' },
        'claude-3-sonnet': { input: 0.003, output: 0.015, unit: '1K tokens' },
        'claude-3-haiku': { input: 0.00025, output: 0.00125, unit: '1K tokens' },
        'llama-2': { input: 0.0002, output: 0.0002, unit: '1K tokens' },
        'llama-3': { input: 0.0003, output: 0.0003, unit: '1K tokens' },
        'gemini-pro': { input: 0.00035, output: 0.00105, unit: '1K tokens' },
    };

    return pricing[model] || { input: 0, output: 0, unit: '1K tokens' };
};

const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'llama-2', label: 'LLaMA 2' },
    { value: 'llama-3', label: 'LLaMA 3' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
];

export default function TokenCounter() {
    const [text, setText] = useState("");
    const [selectedModel, setSelectedModel] = useState("gpt-4");
    const [tokenCount, setTokenCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        const tokens = countTokens(text, selectedModel);
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;

        setTokenCount(tokens);
        setWordCount(words);
        setCharCount(chars);
    }, [text, selectedModel]);

    const clearText = () => {
        setText("");
        toast.success("Text cleared", {
            description: "All content has been removed"
        });
    };

    const copyStats = () => {
        const pricing = getModelPricing(selectedModel);
        const inputCost = (tokenCount / 1000) * pricing.input;
        const outputCost = (tokenCount / 1000) * pricing.output;

        const stats = `Token Count Analysis
Model: ${models.find(m => m.value === selectedModel)?.label}
Tokens: ${tokenCount.toLocaleString()}
Words: ${wordCount.toLocaleString()}
Characters: ${charCount.toLocaleString()}
Estimated Input Cost: $${inputCost.toFixed(6)}
Estimated Output Cost: $${outputCost.toFixed(6)}`;

        navigator.clipboard.writeText(stats);
        toast.success("Stats copied to clipboard!", {
            description: "Token analysis has been copied"
        });
    };

    const pricing = getModelPricing(selectedModel);
    const inputCost = (tokenCount / 1000) * pricing.input;
    const outputCost = (tokenCount / 1000) * pricing.output;

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        LLM Token Counter
                    </CardTitle>
                    <CardDescription>
                        Count tokens and estimate costs for different LLM models
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="model">Select Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {models.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="text">Enter your text</Label>
                            {text && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearText}
                                    className="h-8 px-2"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <Textarea
                            id="text"
                            placeholder="Paste your text here to count tokens..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[200px] bg-zinc-800 border-zinc-700 resize-y"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Token Analysis</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyStats}
                            disabled={!text}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Stats
                        </Button>
                    </div>
                    <CardDescription>
                        Analysis for {models.find(m => m.value === selectedModel)?.label}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-center">
                            <div className="text-2xl font-bold text-blue-400">
                                {tokenCount.toLocaleString()}
                            </div>
                            <div className="text-sm text-zinc-400">Tokens</div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-center">
                            <div className="text-2xl font-bold text-green-400">
                                {wordCount.toLocaleString()}
                            </div>
                            <div className="text-sm text-zinc-400">Words</div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {charCount.toLocaleString()}
                            </div>
                            <div className="text-sm text-zinc-400">Characters</div>
                        </div>
                    </div>

                    {pricing.input > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-zinc-200">Estimated Costs</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-zinc-400">Input Cost</span>
                                        <span className="font-mono text-sm">
                                            ${inputCost.toFixed(6)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        ${pricing.input} per {pricing.unit}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-zinc-400">Output Cost</span>
                                        <span className="font-mono text-sm">
                                            ${outputCost.toFixed(6)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        ${pricing.output} per {pricing.unit}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 text-center">
                                * Costs are estimates based on current pricing and may vary
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}