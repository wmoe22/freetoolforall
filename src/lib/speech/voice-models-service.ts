// Voice models service functionality

import { RetryManager } from './retry-utils';

export class VoiceModelsService {
    private retryManager: RetryManager;

    constructor(retryManager: RetryManager) {
        this.retryManager = retryManager;
    }

    // Enhanced get available voice models with caching
    async getVoiceModels() {
        // Check cache first
        const cacheKey = 'voice_models_cache';
        const cacheExpiry = 'voice_models_cache_expiry';
        const cacheTime = 5 * 60 * 1000; // 5 minutes

        try {
            const cached = localStorage.getItem(cacheKey);
            const expiry = localStorage.getItem(cacheExpiry);

            if (cached && expiry && Date.now() < parseInt(expiry)) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('Cache read failed:', error);
        }

        try {
            return await this.retryManager.withRetry(async () => {
                const response = await fetch('/api/voice-models', {
                    signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
                });

                if (!response.ok) {
                    if (response.status === 503) {
                        throw new Error('Voice models service temporarily unavailable');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const voiceModels = result.voiceModels || [];

                // Cache the result
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(voiceModels));
                    localStorage.setItem(cacheExpiry, (Date.now() + cacheTime).toString());
                } catch (error) {
                    console.warn('Cache write failed:', error);
                }

                return voiceModels;
            });

        } catch (error) {
            console.error('Error fetching voice models:', error);
            // Return empty array as fallback
            return [];
        }
    }
}