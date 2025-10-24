// Usage tracking service for monitoring API costs and usage

interface UsageRecord {
    id: string;
    timestamp: number;
    type: 'transcribe' | 'tts' | 'voice-models';
    service: 'deepgram' | 'fallback' | 'browser';
    metadata: {
        fileSize?: number;
        textLength?: number;
        duration?: number;
        model?: string;
        format?: string;
        success: boolean;
        error?: string;
    };
    estimatedCost: number; // in USD cents
}

interface DailyUsage {
    date: string; // YYYY-MM-DD
    transcribe: {
        count: number;
        totalFileSize: number;
        totalDuration: number;
        estimatedCost: number;
    };
    tts: {
        count: number;
        totalCharacters: number;
        estimatedCost: number;
    };
    voiceModels: {
        count: number;
        estimatedCost: number;
    };
    totalCost: number;
}

interface UsageStats {
    today: DailyUsage;
    thisWeek: DailyUsage[];
    thisMonth: DailyUsage[];
    allTime: {
        totalRequests: number;
        totalCost: number;
        firstUsage: string;
    };
}

// Cost estimates (in USD cents) - based on Deepgram pricing
const COST_ESTIMATES = {
    transcribe: {
        perMinute: 0.43, // $0.0043 per minute
        perMB: 0.2, // Rough estimate based on file size
    },
    tts: {
        perCharacter: 0.002, // $0.00002 per character
        per1000Chars: 2, // $0.02 per 1000 characters
    },
    voiceModels: {
        perRequest: 0, // Usually free
    }
};

// Daily limits to prevent surprise bills
const DAILY_LIMITS = {
    transcribe: {
        maxRequests: 100,
        maxCostCents: 500, // $5.00
        maxFileSize: 500 * 1024 * 1024, // 500MB
    },
    tts: {
        maxRequests: 200,
        maxCostCents: 300, // $3.00
        maxCharacters: 150000, // ~150k characters
    },
    total: {
        maxCostCents: 1000, // $10.00 per day
    }
};

export class UsageTracker {
    private storageKey = 'speechflow_usage';
    private dailyStatsKey = 'speechflow_daily_stats';
    private limitsKey = 'speechflow_limits';

    constructor() {
        // Only initialize on client side
        if (typeof window !== 'undefined') {
            this.initializeStorage();
            this.cleanupOldData();
        }
    }

    // Initialize storage with default values
    private initializeStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            if (!localStorage.getItem(this.storageKey)) {
                localStorage.setItem(this.storageKey, JSON.stringify([]));
            }
            if (!localStorage.getItem(this.dailyStatsKey)) {
                localStorage.setItem(this.dailyStatsKey, JSON.stringify({}));
            }
            if (!localStorage.getItem(this.limitsKey)) {
                localStorage.setItem(this.limitsKey, JSON.stringify(DAILY_LIMITS));
            }
        } catch (error) {
            console.warn('Failed to initialize usage tracking storage:', error);
        }
    }

    // Clean up data older than 30 days
    private cleanupOldData(): void {
        try {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const records = this.getUsageRecords();
            const filteredRecords = records.filter(record => record.timestamp > thirtyDaysAgo);

            if (filteredRecords.length !== records.length) {
                localStorage.setItem(this.storageKey, JSON.stringify(filteredRecords));
                console.log(`Cleaned up ${records.length - filteredRecords.length} old usage records`);
            }
        } catch (error) {
            console.warn('Failed to cleanup old usage data:', error);
        }
    }

    // Get all usage records
    private getUsageRecords(): UsageRecord[] {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Failed to read usage records:', error);
            return [];
        }
    }

    // Save usage records
    private saveUsageRecords(records: UsageRecord[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(records));
        } catch (error) {
            console.error('Failed to save usage records:', error);
        }
    }

    // Calculate estimated cost for transcription
    private calculateTranscribeCost(fileSize: number, duration?: number): number {
        if (duration) {
            return Math.ceil(duration / 60) * COST_ESTIMATES.transcribe.perMinute;
        }
        // Estimate based on file size (rough approximation)
        const estimatedMinutes = (fileSize / (1024 * 1024)) * 2; // ~2 minutes per MB
        return Math.ceil(estimatedMinutes) * COST_ESTIMATES.transcribe.perMinute;
    }

    // Calculate estimated cost for TTS
    private calculateTTSCost(textLength: number): number {
        return Math.ceil(textLength / 1000) * COST_ESTIMATES.tts.per1000Chars;
    }

    // Track a usage event
    trackUsage(
        type: 'transcribe' | 'tts' | 'voice-models',
        service: 'deepgram' | 'fallback' | 'browser',
        metadata: UsageRecord['metadata']
    ): string {
        const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let estimatedCost = 0;

        // Calculate estimated cost
        switch (type) {
            case 'transcribe':
                if (metadata.fileSize) {
                    estimatedCost = this.calculateTranscribeCost(metadata.fileSize, metadata.duration);
                }
                break;
            case 'tts':
                if (metadata.textLength) {
                    estimatedCost = this.calculateTTSCost(metadata.textLength);
                }
                break;
            case 'voice-models':
                estimatedCost = COST_ESTIMATES.voiceModels.perRequest;
                break;
        }

        const record: UsageRecord = {
            id,
            timestamp: Date.now(),
            type,
            service,
            metadata,
            estimatedCost
        };

        try {
            const records = this.getUsageRecords();
            records.push(record);
            this.saveUsageRecords(records);

            // Update daily stats
            this.updateDailyStats(record);

            console.log(`Usage tracked: ${type} - $${(estimatedCost / 100).toFixed(4)}`);

            return id;
        } catch (error) {
            console.error('Failed to track usage:', error);
            return id;
        }
    }

    // Update daily statistics
    private updateDailyStats(record: UsageRecord): void {
        try {
            const today = new Date().toISOString().split('T')[0];
            const dailyStatsData = localStorage.getItem(this.dailyStatsKey);
            const dailyStats = dailyStatsData ? JSON.parse(dailyStatsData) : {};

            if (!dailyStats[today]) {
                dailyStats[today] = {
                    date: today,
                    transcribe: { count: 0, totalFileSize: 0, totalDuration: 0, estimatedCost: 0 },
                    tts: { count: 0, totalCharacters: 0, estimatedCost: 0 },
                    voiceModels: { count: 0, estimatedCost: 0 },
                    totalCost: 0
                };
            }

            const todayStats = dailyStats[today];

            // Update stats based on record type
            switch (record.type) {
                case 'transcribe':
                    todayStats.transcribe.count++;
                    todayStats.transcribe.totalFileSize += record.metadata.fileSize || 0;
                    todayStats.transcribe.totalDuration += record.metadata.duration || 0;
                    todayStats.transcribe.estimatedCost += record.estimatedCost;
                    break;
                case 'tts':
                    todayStats.tts.count++;
                    todayStats.tts.totalCharacters += record.metadata.textLength || 0;
                    todayStats.tts.estimatedCost += record.estimatedCost;
                    break;
                case 'voice-models':
                    todayStats.voiceModels.count++;
                    todayStats.voiceModels.estimatedCost += record.estimatedCost;
                    break;
            }

            todayStats.totalCost =
                todayStats.transcribe.estimatedCost +
                todayStats.tts.estimatedCost +
                todayStats.voiceModels.estimatedCost;

            localStorage.setItem(this.dailyStatsKey, JSON.stringify(dailyStats));
        } catch (error) {
            console.error('Failed to update daily stats:', error);
        }
    }

    // Check if usage is within daily limits
    checkDailyLimits(): {
        withinLimits: boolean;
        warnings: string[];
        limits: typeof DAILY_LIMITS;
        current: DailyUsage;
    } {
        const today = this.getTodayUsage();
        const limits = this.getDailyLimits();
        const warnings: string[] = [];
        let withinLimits = true;

        // Check transcription limits
        if (today.transcribe.count >= limits.transcribe.maxRequests) {
            warnings.push(`Daily transcription limit reached (${limits.transcribe.maxRequests} requests)`);
            withinLimits = false;
        } else if (today.transcribe.count >= limits.transcribe.maxRequests * 0.8) {
            warnings.push(`Approaching daily transcription limit (${today.transcribe.count}/${limits.transcribe.maxRequests})`);
        }

        if (today.transcribe.estimatedCost >= limits.transcribe.maxCostCents) {
            warnings.push(`Daily transcription cost limit reached ($${(limits.transcribe.maxCostCents / 100).toFixed(2)})`);
            withinLimits = false;
        }

        // Check TTS limits
        if (today.tts.count >= limits.tts.maxRequests) {
            warnings.push(`Daily TTS limit reached (${limits.tts.maxRequests} requests)`);
            withinLimits = false;
        } else if (today.tts.count >= limits.tts.maxRequests * 0.8) {
            warnings.push(`Approaching daily TTS limit (${today.tts.count}/${limits.tts.maxRequests})`);
        }

        if (today.tts.estimatedCost >= limits.tts.maxCostCents) {
            warnings.push(`Daily TTS cost limit reached ($${(limits.tts.maxCostCents / 100).toFixed(2)})`);
            withinLimits = false;
        }

        // Check total cost limit
        if (today.totalCost >= limits.total.maxCostCents) {
            warnings.push(`Daily total cost limit reached ($${(limits.total.maxCostCents / 100).toFixed(2)})`);
            withinLimits = false;
        } else if (today.totalCost >= limits.total.maxCostCents * 0.8) {
            warnings.push(`Approaching daily cost limit ($${(today.totalCost / 100).toFixed(2)}/$${(limits.total.maxCostCents / 100).toFixed(2)})`);
        }

        return { withinLimits, warnings, limits, current: today };
    }

    // Get today's usage
    getTodayUsage(): DailyUsage {
        try {
            const today = new Date().toISOString().split('T')[0];
            const dailyStatsData = localStorage.getItem(this.dailyStatsKey);
            const dailyStats = dailyStatsData ? JSON.parse(dailyStatsData) : {};

            return dailyStats[today] || {
                date: today,
                transcribe: { count: 0, totalFileSize: 0, totalDuration: 0, estimatedCost: 0 },
                tts: { count: 0, totalCharacters: 0, estimatedCost: 0 },
                voiceModels: { count: 0, estimatedCost: 0 },
                totalCost: 0
            };
        } catch (error) {
            console.error('Failed to get today usage:', error);
            const today = new Date().toISOString().split('T')[0];
            return {
                date: today,
                transcribe: { count: 0, totalFileSize: 0, totalDuration: 0, estimatedCost: 0 },
                tts: { count: 0, totalCharacters: 0, estimatedCost: 0 },
                voiceModels: { count: 0, estimatedCost: 0 },
                totalCost: 0
            };
        }
    }

    // Get usage statistics
    getUsageStats(): UsageStats {
        const records = this.getUsageRecords();
        const today = this.getTodayUsage();

        // Calculate weekly stats (last 7 days)
        const weeklyStats: DailyUsage[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            try {
                const dailyStatsData = localStorage.getItem(this.dailyStatsKey);
                const dailyStats = dailyStatsData ? JSON.parse(dailyStatsData) : {};
                weeklyStats.push(dailyStats[dateStr] || {
                    date: dateStr,
                    transcribe: { count: 0, totalFileSize: 0, totalDuration: 0, estimatedCost: 0 },
                    tts: { count: 0, totalCharacters: 0, estimatedCost: 0 },
                    voiceModels: { count: 0, estimatedCost: 0 },
                    totalCost: 0
                });
            } catch (error) {
                console.error('Failed to get weekly stats:', error);
            }
        }

        // Calculate monthly stats (last 30 days)
        const monthlyStats: DailyUsage[] = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            try {
                const dailyStatsData = localStorage.getItem(this.dailyStatsKey);
                const dailyStats = dailyStatsData ? JSON.parse(dailyStatsData) : {};
                monthlyStats.push(dailyStats[dateStr] || {
                    date: dateStr,
                    transcribe: { count: 0, totalFileSize: 0, totalDuration: 0, estimatedCost: 0 },
                    tts: { count: 0, totalCharacters: 0, estimatedCost: 0 },
                    voiceModels: { count: 0, estimatedCost: 0 },
                    totalCost: 0
                });
            } catch (error) {
                console.error('Failed to get monthly stats:', error);
            }
        }

        // Calculate all-time stats
        const totalRequests = records.length;
        const totalCost = records.reduce((sum, record) => sum + record.estimatedCost, 0);
        const firstUsage = records.length > 0 ? new Date(records[0].timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        return {
            today,
            thisWeek: weeklyStats,
            thisMonth: monthlyStats,
            allTime: {
                totalRequests,
                totalCost,
                firstUsage
            }
        };
    }

    // Get daily limits
    getDailyLimits(): typeof DAILY_LIMITS {
        try {
            const limitsData = localStorage.getItem(this.limitsKey);
            return limitsData ? JSON.parse(limitsData) : DAILY_LIMITS;
        } catch (error) {
            console.error('Failed to get daily limits:', error);
            return DAILY_LIMITS;
        }
    }

    // Update daily limits
    updateDailyLimits(newLimits: Partial<typeof DAILY_LIMITS>): void {
        try {
            const currentLimits = this.getDailyLimits();
            const updatedLimits = { ...currentLimits, ...newLimits };
            localStorage.setItem(this.limitsKey, JSON.stringify(updatedLimits));
        } catch (error) {
            console.error('Failed to update daily limits:', error);
        }
    }

    // Export usage data
    exportUsageData(): string {
        try {
            const records = this.getUsageRecords();
            const stats = this.getUsageStats();
            const limits = this.getDailyLimits();

            return JSON.stringify({
                exportDate: new Date().toISOString(),
                records,
                stats,
                limits
            }, null, 2);
        } catch (error) {
            console.error('Failed to export usage data:', error);
            return '{}';
        }
    }

    // Clear all usage data
    clearUsageData(): void {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.dailyStatsKey);
            localStorage.removeItem(this.limitsKey);
            this.initializeStorage();
            console.log('Usage data cleared');
        } catch (error) {
            console.error('Failed to clear usage data:', error);
        }
    }
}