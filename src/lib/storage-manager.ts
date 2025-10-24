// Enhanced localStorage manager with quota handling and compression

interface StorageItem {
    data: any;
    timestamp: number;
    size: number;
    compressed?: boolean;
}

interface StorageQuota {
    used: number;
    available: number;
    total: number;
}

export class StorageManager {
    private readonly maxSize = 50 * 1024 * 1024; // 50MB max storage
    private readonly compressionThreshold = 1024; // Compress items > 1KB
    private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    constructor() {
        // Only run cleanup on client side
        if (typeof window !== 'undefined') {
            this.cleanup();
        }
    }

    // Get storage quota information
    async getStorageQuota(): Promise<StorageQuota> {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage || 0,
                    available: (estimate.quota || 0) - (estimate.usage || 0),
                    total: estimate.quota || 0
                };
            }
        } catch (error) {
            console.warn('Storage quota estimation failed:', error);
        }

        // Fallback: estimate based on localStorage usage
        const used = this.getLocalStorageSize();
        return {
            used,
            available: this.maxSize - used,
            total: this.maxSize
        };
    }

    // Calculate localStorage usage
    private getLocalStorageSize(): number {
        let total = 0;
        try {
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (error) {
            console.warn('Failed to calculate localStorage size:', error);
        }
        return total;
    }

    // Compress data using simple string compression
    private compress(data: string): string {
        try {
            // Simple run-length encoding for repetitive data
            return data.replace(/(.)\1{2,}/g, (match, char) => {
                return `${char}*${match.length}`;
            });
        } catch (error) {
            console.warn('Compression failed:', error);
            return data;
        }
    }

    // Decompress data
    private decompress(data: string): string {
        try {
            return data.replace(/(.)\*(\d+)/g, (match, char, count) => {
                return char.repeat(parseInt(count));
            });
        } catch (error) {
            console.warn('Decompression failed:', error);
            return data;
        }
    }

    // Set item with automatic compression and quota management
    async setItem(key: string, value: any, options: { compress?: boolean; maxAge?: number } = {}): Promise<boolean> {
        // Skip on server side
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            const shouldCompress = options.compress !== false && serialized.length > this.compressionThreshold;

            const processedData = shouldCompress ? this.compress(serialized) : serialized;
            const item: StorageItem = {
                data: processedData,
                timestamp: Date.now(),
                size: processedData.length,
                compressed: shouldCompress
            };

            const itemString = JSON.stringify(item);

            // Check if we have enough space
            const quota = await this.getStorageQuota();
            if (itemString.length > quota.available) {
                console.warn(`Storage quota exceeded. Needed: ${itemString.length}, Available: ${quota.available}`);

                // Try to free up space
                const freed = await this.freeUpSpace(itemString.length);
                if (!freed) {
                    throw new Error('Storage quota exceeded and cleanup failed');
                }
            }

            localStorage.setItem(key, itemString);
            return true;

        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded:', error);

                // Emergency cleanup
                await this.emergencyCleanup();

                // Try one more time with minimal data
                try {
                    const minimalItem: StorageItem = {
                        data: JSON.stringify(value),
                        timestamp: Date.now(),
                        size: JSON.stringify(value).length,
                        compressed: false
                    };
                    localStorage.setItem(key, JSON.stringify(minimalItem));
                    return true;
                } catch (retryError) {
                    console.error('Failed to store item even after cleanup:', retryError);
                    return false;
                }
            }

            console.error('Failed to store item:', error);
            return false;
        }
    }

    // Get item with automatic decompression
    getItem<T = any>(key: string): T | null {
        // Skip on server side
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const itemString = localStorage.getItem(key);
            if (!itemString) return null;

            const item: StorageItem = JSON.parse(itemString);

            // Check if item is expired
            const maxAge = this.maxAge;
            if (Date.now() - item.timestamp > maxAge) {
                localStorage.removeItem(key);
                return null;
            }

            const data = item.compressed ? this.decompress(item.data) : item.data;
            return JSON.parse(data);

        } catch (error) {
            console.warn(`Failed to retrieve item ${key}:`, error);
            // Remove corrupted item
            try {
                localStorage.removeItem(key);
            } catch (removeError) {
                console.warn('Failed to remove corrupted item:', removeError);
            }
            return null;
        }
    }

    // Remove item
    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove item ${key}:`, error);
        }
    }

    // Free up space by removing old items
    private async freeUpSpace(neededBytes: number): Promise<boolean> {
        try {
            const items: Array<{ key: string; item: StorageItem }> = [];

            // Collect all items with timestamps
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    try {
                        const itemString = localStorage.getItem(key);
                        if (itemString) {
                            const item: StorageItem = JSON.parse(itemString);
                            items.push({ key, item });
                        }
                    } catch (error) {
                        // Remove corrupted items
                        localStorage.removeItem(key);
                    }
                }
            }

            // Sort by timestamp (oldest first)
            items.sort((a, b) => a.item.timestamp - b.item.timestamp);

            let freedBytes = 0;
            for (const { key, item } of items) {
                if (freedBytes >= neededBytes) break;

                localStorage.removeItem(key);
                freedBytes += item.size + key.length;
                console.log(`Freed ${item.size} bytes by removing ${key}`);
            }

            return freedBytes >= neededBytes;

        } catch (error) {
            console.error('Failed to free up space:', error);
            return false;
        }
    }

    // Emergency cleanup - remove all non-essential items
    private async emergencyCleanup(): Promise<void> {
        try {
            const essentialKeys = [
                'speechflow_usage',
                'speechflow_daily_stats',
                'speechflow_limits'
            ];

            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key) && !essentialKeys.includes(key)) {
                    localStorage.removeItem(key);
                }
            }

            console.log('Emergency cleanup completed');
        } catch (error) {
            console.error('Emergency cleanup failed:', error);
        }
    }

    // Regular cleanup of expired items
    cleanup(): void {
        try {
            const now = Date.now();
            const keysToRemove: string[] = [];

            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    try {
                        const itemString = localStorage.getItem(key);
                        if (itemString) {
                            const item: StorageItem = JSON.parse(itemString);
                            if (now - item.timestamp > this.maxAge) {
                                keysToRemove.push(key);
                            }
                        }
                    } catch (error) {
                        // Remove corrupted items
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.warn(`Failed to remove expired item ${key}:`, error);
                }
            });

            if (keysToRemove.length > 0) {
                console.log(`Cleaned up ${keysToRemove.length} expired items`);
            }

        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    // Get storage statistics
    async getStorageStats(): Promise<{
        quota: StorageQuota;
        itemCount: number;
        oldestItem: number;
        largestItem: { key: string; size: number };
    }> {
        const quota = await this.getStorageQuota();
        let itemCount = 0;
        let oldestTimestamp = Date.now();
        let largestItem = { key: '', size: 0 };

        try {
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    itemCount++;
                    const itemString = localStorage.getItem(key);
                    if (itemString) {
                        try {
                            const item: StorageItem = JSON.parse(itemString);
                            if (item.timestamp < oldestTimestamp) {
                                oldestTimestamp = item.timestamp;
                            }
                            if (item.size > largestItem.size) {
                                largestItem = { key, size: item.size };
                            }
                        } catch (error) {
                            // Count corrupted items
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to calculate storage stats:', error);
        }

        return {
            quota,
            itemCount,
            oldestItem: oldestTimestamp,
            largestItem
        };
    }

    // Clear all storage
    clear(): void {
        try {
            localStorage.clear();
            console.log('Storage cleared');
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }
}