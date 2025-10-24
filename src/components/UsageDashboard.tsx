'use client'

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
}

export default function UsageDashboard({ isOpen, onClose }: UsageDashboardProps) {
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                        <BarChart3 size={24} className="text-blue-600" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Usage & Cost Tracking
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            ✕
                        </button>
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
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                                    <DollarSign size={20} className="mr-2" />
                                    Today's Usage
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Transcription */}
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Speech-to-Text</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Requests:</span>
                                                <span className="font-medium">{stats.today.transcribe.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">File Size:</span>
                                                <span className="font-medium">{formatFileSize(stats.today.transcribe.totalFileSize)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Est. Cost:</span>
                                                <span className="font-medium text-green-600">{formatCurrency(stats.today.transcribe.estimatedCost)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TTS */}
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Text-to-Speech</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Requests:</span>
                                                <span className="font-medium">{stats.today.tts.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Characters:</span>
                                                <span className="font-medium">{stats.today.tts.totalCharacters.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Est. Cost:</span>
                                                <span className="font-medium text-green-600">{formatCurrency(stats.today.tts.estimatedCost)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Total Today</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-blue-700 dark:text-blue-300">All Requests:</span>
                                                <span className="font-medium">{stats.today.transcribe.count + stats.today.tts.count + stats.today.voiceModels.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-700 dark:text-blue-300">Est. Cost:</span>
                                                <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">{formatCurrency(stats.today.totalCost)}</span>
                                            </div>
                                            {limits && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 dark:text-blue-300">Daily Limit:</span>
                                                    <span className="font-medium">{formatCurrency(limits.total.maxCostCents)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bars */}
                                {limits && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-600 dark:text-slate-400">Daily Cost Progress</span>
                                                <span className="font-medium">{((stats.today.totalCost / limits.total.maxCostCents) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
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
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                                    <TrendingUp size={20} className="mr-2" />
                                    7-Day Trend
                                </h3>

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                        {stats.thisWeek.map((day, index) => (
                                            <div key={index} className="text-center">
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className="bg-white dark:bg-slate-700 rounded p-2">
                                                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                                                        {formatCurrency(day.totalCost)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {day.transcribe.count + day.tts.count} req
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                        Weekly Total: {formatCurrency(stats.thisWeek.reduce((sum, day) => sum + day.totalCost, 0))}
                                    </div>
                                </div>
                            </div>

                            {/* All-Time Stats */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    All-Time Statistics
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {stats.allTime.totalRequests.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Requests</div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(stats.allTime.totalCost)}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Estimated Cost</div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {Math.ceil((Date.now() - new Date(stats.allTime.firstUsage).getTime()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Days Using SpeechFlow</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={refreshStats}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <TrendingUp size={16} />
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={exportData}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download size={16} />
                            <span>Export Data</span>
                        </button>

                        <button
                            onClick={clearData}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <span>Clear Data</span>
                        </button>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && limits && (
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Daily Limits</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Max Daily Cost</label>
                                    <div className="text-slate-900 dark:text-white">{formatCurrency(limits.total.maxCostCents)}</div>
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Max STT Requests</label>
                                    <div className="text-slate-900 dark:text-white">{limits.transcribe.maxRequests}</div>
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Max TTS Requests</label>
                                    <div className="text-slate-900 dark:text-white">{limits.tts.maxRequests}</div>
                                </div>
                                <div>
                                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Max TTS Characters</label>
                                    <div className="text-slate-900 dark:text-white">{limits.tts.maxCharacters.toLocaleString()}</div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                Limits help prevent unexpected charges. Costs are estimates based on Deepgram pricing.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}