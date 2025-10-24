// TTS cache manager for storing and retrieving generated audio

import { StorageManager } from './storage-manager';

interface TTSCacheEntry {
    text: string;
    model: string;
    format: string;
    audioData: string; // Base64 encoded audio
    timestamp: number;
    size: number;
    playCount: number;
    lastPlayed: number;
}

interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    mostUsed: TTSCacheEntry[];
    oldestEntry: number;
}

export class TTSCache {
    private storageManager: StorageManager;
    private cachePrefix = 'tts_cache_';
    private maxCacheSize = 20 * 1024 * 1024; // 20MB max cache
    private maxEntries = 100;
    private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Statistics
    private hits = 0;
    private misses = 0;

    constructor() {
        this.storageManager = new StorageManager();
        this.cleanup();
    }

    // Generate cache key from text, model, and format
    private generateCacheKey(text: string, model: string, format: string): string {
        const normalized = text.toLowerCase().trim();
        const hash = this.simpleHash(normalized + model + format);
        return `${this.cachePrefix}${hash}`;
    }

    // Simple hash function for cache keys
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Check if audio is cached
    async isCached(text: string, model: string, format: string): Promise<boolean> {
        const key = this.generateCacheKey(text, model, format);
        const entry = this.storageManager.getItem<TTSCacheEntry>(key);

        if (!entry) {
            return false;
        }

        // Check if entry is expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.storageManager.removeItem(key);
            return false;
        }

        return true;
    }

    // Store audio in cache
    async cacheAudio(
        text: string,
        model: string,
        format: string,
        audioBlob: Blob
    ): Promise<boolean> {
        try {
            // Check cache size limits
            const stats = await this.getCacheStats();
            if (stats.totalEntries >= this.maxEntries || stats.totalSize >= this.maxCacheSize) {
                await this.evictOldEntries();
            }

            // Convert blob to base64
            const audioData = await this.blobToBase64(audioBlob);

            const entry: TTSCacheEntry = {
                text: text.trim(),
                model,
                format,
                audioData,
                timestamp: Date.now(),
                size: audioBlob.size,
                playCount: 0,
                lastPlayed: 0
            };

            const key = this.generateCacheKey(text, model, format);
            const success = await this.storageManager.setItem(key, entry, {
                compress: true,
                maxAge: this.maxAge
            });

            if (success) {
                console.log(`TTS cached: ${text.substring(0, 50)}... (${(audioBlob.size / 1024).toFixed(1)}KB)`);
            }

            return success;

        } catch (error) {
            console.error('Failed to cache TTS audio:', error);
            return false;
        }
    }

    // Retrieve audio from cache
    async getCachedAudio(text: string, model: string, format: string): Promise<Blob | null> {
        try {
            const key = this.generateCacheKey(text, model, format);
            const entry = this.storageManager.getItem<TTSCacheEntry>(key);

            if (!entry) {
                this.misses++;
                return null;
            }

            // Check if entry is expired
            if (Date.now() - entry.timestamp > this.maxAge) {
                this.storageManager.removeItem(key);
                this.misses++;
                return null;
            }

            // Update usage statistics
            entry.playCount++;
            entry.lastPlayed = Date.now();
            await this.storageManager.setItem(key, entry, { compress: true });

            // Convert base64 back to blob
            const audioBlob = this.base64ToBlob(entry.audioData, this.getMimeType(format));

            this.hits++;
            console.log(`TTS cache hit: ${text.substring(0, 50)}... (${(audioBlob.size / 1024).toFixed(1)}KB)`);

            return audioBlob;

        } catch (error) {
            console.error('Failed to retrieve cached TTS audio:', error);
            this.misses++;
            return null;
        }
    }

    // Convert blob to base64
    private async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Convert base64 to blob
    private base64ToBlob(base64: string, mimeType: string): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Get MIME type for format
    private getMimeType(format: string): string {
        const mimeTypes: Record<string, string> = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg'
        };

        return mimeTypes[format] || 'audio/mpeg';
    }

    // Evict old entries to make space
    private async evictOldEntries(): Promise<void> {
        try {
            const entries: Array<{ key: string; entry: TTSCacheEntry }> = [];

            // Collect all cache entries
            for (const key in localStorage) {
                if (key.startsWith(this.cachePrefix)) {
                    const entry = this.storageManager.getItem<TTSCacheEntry>(key);
                    if (entry) {
                        entries.push({ key, entry });
                    }
                }
            }

            // Sort by last played time and play count (LRU + LFU hybrid)
            entries.sort((a, b) => {
                const scoreA = a.entry.lastPlayed + (a.entry.playCount * 24 * 60 * 60 * 1000);
                const scoreB = b.entry.lastPlayed + (b.entry.playCount * 24 * 60 * 60 * 1000);
                return scoreA - scoreB;
            });

            // Remove oldest/least used entries (25% of cache)
            const toRemove = Math.ceil(entries.length * 0.25);
            for (let i = 0; i < toRemove && i < entries.length; i++) {
                this.storageManager.removeItem(entries[i].key);
            }

            console.log(`Evicted ${toRemove} TTS cache entries`);

        } catch (error) {
            console.error('Failed to evict cache entries:', error);
        }
    }

    // Get cache statistics
    async getCacheStats(): Promise<CacheStats> {
        const entries: TTSCacheEntry[] = [];
        let totalSize = 0;

        try {
            for (const key in localStorage) {
                if (key.startsWith(this.cachePrefix)) {
                    const entry = this.storageManager.getItem<TTSCacheEntry>(key);
                    if (entry) {
                        entries.push(entry);
                        totalSize += entry.size;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to calculate cache stats:', error);
        }

        // Sort by play count for most used
        const mostUsed = entries
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 5);

        const oldestEntry = entries.length > 0
            ? Math.min(...entries.map(e => e.timestamp))
            : Date.now();

        const hitRate = this.hits + this.misses > 0
            ? this.hits / (this.hits + this.misses)
            : 0;

        return {
            totalEntries: entries.length,
            totalSize,
            hitRate,
            mostUsed,
            oldestEntry
        };
    }

    // Preload popular TTS combinations
    async preloadPopular(popularTexts: Array<{ text: string; model: string; format: string }>): Promise<void> {
        console.log(`Preloading ${popularTexts.length} popular TTS combinations...`);

        for (const { text, model, format } of popularTexts) {
            try {
                // Check if already cached
                if (await this.isCached(text, model, format)) {
                    continue;
                }

                // Generate and cache
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, model, format })
                });

                if (response.ok) {
                    const audioBlob = await response.blob();
                    await this.cacheAudio(text, model, format, audioBlob);
                }

            } catch (error) {
                console.warn(`Failed to preload TTS for "${text.substring(0, 30)}...":`, error);
            }
        }
    }

    // Clear expired entries
    cleanup(): void {
        try {
            const now = Date.now();
            const keysToRemove: string[] = [];

            for (const key in localStorage) {
                if (key.startsWith(this.cachePrefix)) {
                    const entry = this.storageManager.getItem<TTSCacheEntry>(key);
                    if (!entry || now - entry.timestamp > this.maxAge) {
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(key => {
                this.storageManager.removeItem(key);
            });

            if (keysToRemove.length > 0) {
                console.log(`Cleaned up ${keysToRemove.length} expired TTS cache entries`);
            }

        } catch (error) {
            console.error('TTS cache cleanup failed:', error);
        }
    }

    // Clear all cache
    clearCache(): void {
        try {
            for (const key in localStorage) {
                if (key.startsWith(this.cachePrefix)) {
                    this.storageManager.removeItem(key);
                }
            }

            this.hits = 0;
            this.misses = 0;

            console.log('TTS cache cleared');
        } catch (error) {
            console.error('Failed to clear TTS cache:', error);
        }
    }

    // Get cache hit rate
    getHitRate(): number {
        return this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;
    }
}