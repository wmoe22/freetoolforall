'use client'

import { Button } from '@/components/ui/button';
import { UsageTracker } from '@/lib/usage-tracker';
import { AlertTriangle, BarChart3, DollarSign, Download, Settings, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UsageStats {
    today: any;
    thisWeek: any[];
    thisMonth: any[];
    allTime: any;
}

interface UsageDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin?: boolean;
}

export default function UsageDashboard({ isOpen, onClose, isAdmin = false }: UsageDashboardProps) {
    const [usageTracker] = useState(() => new UsageTracker());
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [limits, setLimits] = useState<any>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (isOpen) {
            refreshStats();
        }
    }, [isOpen]);

    const refreshStats = () => {
        const usageStats = usageTracker.getUsageStats();
        const limitCheck = usageTracker.checkDailyLimits();

        setStats(usageStats);
        setLimits(limitCheck.limits);
        setWarnings(limitCheck.warnings);
    };

    const formatCurrency = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const exportData = () => {
        const data = usageTracker.exportUsageData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speechflow-usage-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearData = () => {
        if (confirm('Are you sure you want to clear all usage data? This cannot be undone.')) {
            usageTracker.clearUsageData();
            refreshStats();
        }
    };

    if (!isOpen) return null;

    const containerClasses = isAdmin
        ? "bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl w-full"
        : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

    const contentClasses = isAdmin
        ? "w-full"
        : "bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto";

    return (
        <div className={containerClasses}>
            <div className={contentClasses}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 ${isAdmin ? 'border-b border-zinc-700' : 'border-b border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center space-x-3">
                        <BarChart3 size={24} className={isAdmin ? "text-zinc-400" : "text-blue-600"} />
                        <h2 className={`text-xl font-semibold ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                            {isAdmin ? 'Usage & Analytics Dashboard' : 'Usage & Cost Tracking'}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => setShowSettings(!showSettings)}
                            variant="ghost"
                            size="icon"
                        >
                            <Settings size={20} />
                        </Button>
                        {!isAdmin && (
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="icon"
                            >
                                ✕
                            </Button>
                        )}
                    </div>
                </div>

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                    Usage Warnings
                                </h3>
                                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                                    {warnings.map((warning, index) => (
                                        <li key={index}>• {warning}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6">
                    {stats && (
                        <>
                            {/* Today's Usage */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                                    <DollarSign size={20} className="mr-2" />
                                    Today's Usage
                                </h3>

                                <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-6`}>
                                    {/* Speech-to-Text */}
                                    <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4`}>
                                        <h4 className={`font-medium ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'} mb-2`}>Speech-to-Text</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Requests:</span>
                                                <span className="font-medium">{stats.today.transcribe.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>File Size:</span>
                                                <span className="font-medium">{formatFileSize(stats.today.transcribe.totalFileSize)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Est. Cost:</span>
                                                <span className="font-medium text-green-400">${formatCurrency(stats.today.transcribe.estimatedCost)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text-to-Speech */}
                                    <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4`}>
                                        <h4 className={`font-medium ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'} mb-2`}>Text-to-Speech</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Requests:</span>
                                                <span className="font-medium">{stats.today.tts.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Characters:</span>
                                                <span className="font-medium">{stats.today.tts.totalCharacters.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Est. Cost:</span>
                                                <span className="font-medium text-green-400">${formatCurrency(stats.today.tts.estimatedCost)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voice Models (if admin) */}
                                    {isAdmin && (
                                        <div className="bg-zinc-700 border border-zinc-600 rounded-lg p-4">
                                            <h4 className="font-medium text-white mb-2">Voice Models</h4>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-300">Requests:</span>
                                                    <span className="font-medium">{stats.today.voiceModels?.count || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-300">Processing:</span>
                                                    <span className="font-medium">{stats.today.voiceModels?.totalProcessingTime || 0}s</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-300">Est. Cost:</span>
                                                    <span className="font-medium text-green-400">${formatCurrency(stats.today.voiceModels?.estimatedCost || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className={`${isAdmin ? 'bg-zinc-600 border border-zinc-500' : 'bg-blue-50 dark:bg-blue-950/20'} rounded-lg p-4`}>
                                        <h4 className={`font-medium ${isAdmin ? 'text-white' : 'text-blue-900 dark:text-blue-100'} mb-2`}>Total Today</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-200' : 'text-blue-700 dark:text-blue-300'}>All Requests:</span>
                                                <span className="font-medium">{stats.today.totalRequests || (stats.today.transcribe.count + stats.today.tts.count + (stats.today.voiceModels?.count || 0))}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={isAdmin ? 'text-zinc-200' : 'text-blue-700 dark:text-blue-300'}>Est. Cost:</span>
                                                <span className={`font-bold text-lg ${isAdmin ? 'text-green-400' : 'text-blue-900 dark:text-blue-100'}`}>${formatCurrency(stats.today.totalCost)}</span>
                                            </div>
                                            {limits && (
                                                <div className="flex justify-between">
                                                    <span className={isAdmin ? 'text-zinc-200' : 'text-blue-700 dark:text-blue-300'}>Daily Limit:</span>
                                                    <span className="font-medium">${formatCurrency(limits.total.maxCostCents)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* All Tools Usage (Admin Only) */}
                                {isAdmin && (() => {
                                    // Define all available tools
                                    const allTools = [
                                        { id: 'speech-to-text', name: 'Speech to Text', category: 'Voice' },
                                        { id: 'text-to-speech', name: 'Text to Speech', category: 'Voice' },
                                        { id: 'audio-converter', name: 'Audio Converter', category: 'Voice' },
                                        { id: 'subtitle-generator', name: 'Subtitle Generator', category: 'Voice' },
                                        { id: 'audio-trimmer', name: 'Audio Trimmer', category: 'Voice' },
                                        { id: 'file-converter', name: 'File Converter', category: 'Document' },
                                        { id: 'pdf-compress', name: 'PDF Compressor', category: 'Document' },
                                        { id: 'pdf-split', name: 'PDF Splitter', category: 'Document' },
                                        { id: 'pdf-merge', name: 'PDF Merger', category: 'Document' },
                                        { id: 'proposal-generator', name: 'Proposal Generator', category: 'Business' },
                                        { id: 'invoice-generator', name: 'Invoice Generator', category: 'Business' },
                                        { id: 'meeting-notes', name: 'Meeting Notes', category: 'Business' },
                                        { id: 'image-compress', name: 'Image Compressor', category: 'Visual' },
                                        { id: 'image-resize', name: 'Image Resizer', category: 'Visual' },
                                        { id: 'image-crop', name: 'Image Cropper', category: 'Visual' },
                                        { id: 'image-convert', name: 'Image Converter', category: 'Visual' },
                                        { id: 'background-remove', name: 'Background Remover', category: 'Visual' },
                                        { id: 'file-scanner', name: 'File Scanner', category: 'Security' },
                                        { id: 'url-scanner', name: 'URL Scanner', category: 'Security' },
                                        { id: 'url-shortener', name: 'URL Shortener', category: 'Utility' },
                                        { id: 'token-counter', name: 'Token Counter', category: 'Utility' },
                                    ];

                                    // Merge with actual usage data
                                    const toolsWithUsage = allTools.map(tool => {
                                        const usage = stats.today.tools?.[tool.id] || {
                                            count: 0,
                                            totalFileSize: 0,
                                            totalCharacters: 0,
                                            estimatedCost: 0
                                        };
                                        return { ...tool, usage };
                                    });

                                    // Sort by usage count (most used first)
                                    const sortedTools = toolsWithUsage.sort((a, b) => b.usage.count - a.usage.count);

                                    // Group by category
                                    const categories = ['Voice', 'Document', 'Business', 'Visual', 'Security', 'Utility'];

                                    return (
                                        <div className="mt-6">
                                            <h4 className="text-md font-semibold text-white mb-3">All Tools Usage Today</h4>
                                            <div className="space-y-4">
                                                {categories.map(category => {
                                                    const categoryTools = sortedTools.filter(t => t.category === category);
                                                    return (
                                                        <div key={category}>
                                                            <h5 className="text-sm font-medium text-zinc-400 mb-2">{category} Tools</h5>
                                                            <div className="bg-zinc-700 border border-zinc-600 rounded-lg p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                                    {categoryTools.map(tool => (
                                                                        <div
                                                                            key={tool.id}
                                                                            className={`${tool.usage.count > 0 ? 'bg-zinc-600 border-zinc-500' : 'bg-zinc-700 border-zinc-600'} border rounded p-3`}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className={`text-sm font-medium ${tool.usage.count > 0 ? 'text-white' : 'text-zinc-400'}`}>
                                                                                    {tool.name}
                                                                                </span>
                                                                                <span className={`text-xs px-2 py-1 rounded ${tool.usage.count > 0 ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-600 text-zinc-500'}`}>
                                                                                    {tool.usage.count}
                                                                                </span>
                                                                            </div>
                                                                            {tool.usage.count > 0 && (
                                                                                <>
                                                                                    {tool.usage.totalFileSize > 0 && (
                                                                                        <div className="text-xs text-zinc-300">
                                                                                            Size: {formatFileSize(tool.usage.totalFileSize)}
                                                                                        </div>
                                                                                    )}
                                                                                    {tool.usage.totalCharacters > 0 && (
                                                                                        <div className="text-xs text-zinc-300">
                                                                                            Chars: {tool.usage.totalCharacters.toLocaleString()}
                                                                                        </div>
                                                                                    )}
                                                                                    {tool.usage.estimatedCost > 0 && (
                                                                                        <div className="text-xs text-green-400 mt-1">
                                                                                            Cost: ${formatCurrency(tool.usage.estimatedCost)}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Progress Bars */}
                                {limits && (
                                    <div className="space-y-3 mt-6">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className={isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}>Daily Cost Progress</span>
                                                <span className="font-medium">{((stats.today.totalCost / limits.total.maxCostCents) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${stats.today.totalCost >= limits.total.maxCostCents ? 'bg-red-500' :
                                                        stats.today.totalCost >= limits.total.maxCostCents * 0.8 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min((stats.today.totalCost / limits.total.maxCostCents) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Weekly Trend */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
                                    <TrendingUp size={20} className="mr-2" />
                                    7-Day Trend
                                </h3>

                                <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4`}>
                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                        {stats.thisWeek.map((day, index) => (
                                            <div key={index} className="text-center">
                                                <div className={`text-xs ${isAdmin ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'} mb-1`}>
                                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`${isAdmin ? 'bg-zinc-600 border border-zinc-500' : 'bg-white dark:bg-zinc-700'} rounded p-2`}>
                                                    <div className={`text-xs font-medium ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                                        ${formatCurrency(day.totalCost)}
                                                    </div>
                                                    <div className={`text-xs ${isAdmin ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                        {day.transcribe.count + day.tts.count + (day.voiceModels?.count || 0)} req
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`text-sm ${isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'} text-center`}>
                                        Weekly Total: ${formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}
                                    </div>
                                </div>
                            </div>

                            {/* All-Time Stats */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                                    All-Time Statistics
                                </h3>

                                <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                                    <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4 text-center`}>
                                        <div className={`text-2xl font-bold ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                            {stats.allTime.totalRequests.toLocaleString()}
                                        </div>
                                        <div className={`text-sm ${isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}`}>Total Requests</div>
                                    </div>

                                    <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4 text-center`}>
                                        <div className="text-2xl font-bold text-green-400">
                                            ${formatCurrency(stats.allTime.totalCost)}
                                        </div>
                                        <div className={`text-sm ${isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}`}>Total Estimated Cost</div>
                                    </div>

                                    <div className={`${isAdmin ? 'bg-zinc-700 border border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800'} rounded-lg p-4 text-center`}>
                                        <div className={`text-2xl font-bold ${isAdmin ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                            {Math.ceil((Date.now() - new Date(stats.allTime.firstUsage).getTime()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                        <div className={`text-sm ${isAdmin ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}`}>Days Active</div>
                                    </div>

                                    {isAdmin && (
                                        <div className="bg-zinc-700 border border-zinc-600 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {stats.allTime.uniqueUsers || 'N/A'}
                                            </div>
                                            <div className="text-sm text-zinc-300">Unique Users</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button onClick={refreshStats}>
                            <TrendingUp size={16} className="mr-2" />
                            Refresh
                        </Button>

                        <Button onClick={exportData} variant="outline">
                            <Download size={16} className="mr-2" />
                            Export Data
                        </Button>

                        <Button onClick={clearData} variant="destructive">
                            Clear Data
                        </Button>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && limits && (
                        <div className="mt-6 p-4 text-zinc-50 dark:text-zinc-800 rounded-lg">
                            <h4 className="font-medium text-zinc-900 dark:text-white mb-3">Daily Limits</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Max Daily Cost</label>
                                    <div className="text-zinc-900 dark:text-white">{formatCurrency(limits.total.maxCostCents)}</div>
                                </div>
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Max STT Requests</label>
                                    <div className="text-zinc-900 dark:text-white">{limits.transcribe.maxRequests}</div>
                                </div>
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Max TTS Requests</label>
                                    <div className="text-zinc-900 dark:text-white">{limits.tts.maxRequests}</div>
                                </div>
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Max TTS Characters</label>
                                    <div className="text-zinc-900 dark:text-white">{limits.tts.maxCharacters.toLocaleString()}</div>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                                Limits help prevent unexpected charges. Costs are estimates based on Deepgram pricing.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}   