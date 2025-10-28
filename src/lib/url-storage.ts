// Simple in-memory storage for URL shortener
// In production, this would be replaced with a proper database

interface UrlEntry {
    originalUrl: string;
    createdAt: Date;
    clicks: number;
}

class UrlStorage {
    private static instance: UrlStorage;
    private storage = new Map<string, UrlEntry>();

    private constructor() { }

    static getInstance(): UrlStorage {
        if (!UrlStorage.instance) {
            UrlStorage.instance = new UrlStorage();
        }
        return UrlStorage.instance;
    }

    set(shortCode: string, originalUrl: string): void {
        this.storage.set(shortCode, {
            originalUrl,
            createdAt: new Date(),
            clicks: 0,
        });
    }

    get(shortCode: string): string | null {
        const entry = this.storage.get(shortCode);
        if (entry) {
            entry.clicks++;
            return entry.originalUrl;
        }
        return null;
    }

    has(shortCode: string): boolean {
        return this.storage.has(shortCode);
    }

    getStats(shortCode: string): UrlEntry | null {
        return this.storage.get(shortCode) || null;
    }

    getAllUrls(): Map<string, UrlEntry> {
        return new Map(this.storage);
    }
}

export const urlStorage = UrlStorage.getInstance();