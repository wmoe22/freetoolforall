// Request queue and management utilities

import { RequestQueue } from './types';

export class RequestManager {
    private activeRequests = new Map<string, RequestQueue>();
    private maxConcurrentRequests = 3;
    private requestTimeout = 30000; // 30 seconds

    constructor() {
        // Clean up old requests periodically
        setInterval(() => this.cleanupOldRequests(), 60000); // Every minute
    }

    // Check if we can accept new requests
    canAcceptNewRequest(): boolean {
        return this.activeRequests.size < this.maxConcurrentRequests;
    }

    // Generate unique request ID
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add request to queue
    addToQueue(type: 'transcribe' | 'tts'): { id: string; abortController: AbortController } {
        if (!this.canAcceptNewRequest()) {
            throw new Error('Too many concurrent requests. Please wait and try again.');
        }

        const id = this.generateRequestId();
        const abortController = new AbortController();

        this.activeRequests.set(id, {
            id,
            type,
            timestamp: Date.now(),
            abortController,
        });

        return { id, abortController };
    }

    // Remove request from queue
    removeFromQueue(id: string): void {
        this.activeRequests.delete(id);
    }

    // Clean up old requests
    private cleanupOldRequests(): void {
        const now = Date.now();
        const timeout = this.requestTimeout + 10000; // Add 10s buffer

        for (const [id, request] of this.activeRequests.entries()) {
            if (now - request.timestamp > timeout) {
                request.abortController.abort();
                this.activeRequests.delete(id);
                console.warn(`Cleaned up stale request: ${id}`);
            }
        }
    }

    // Get current request status
    getActiveRequests(): { transcribe: number; tts: number; total: number } {
        let transcribe = 0;
        let tts = 0;

        for (const request of this.activeRequests.values()) {
            if (request.type === 'transcribe') transcribe++;
            if (request.type === 'tts') tts++;
        }

        return {
            transcribe,
            tts,
            total: this.activeRequests.size
        };
    }

    // Cancel specific request type
    cancelRequests(type?: 'transcribe' | 'tts', requestId?: string): void {
        if (requestId) {
            const request = this.activeRequests.get(requestId);
            if (request && (!type || request.type === type)) {
                request.abortController.abort();
                this.removeFromQueue(requestId);
            }
        } else {
            // Cancel all requests of specified type (or all if no type specified)
            for (const [id, request] of this.activeRequests.entries()) {
                if (!type || request.type === type) {
                    request.abortController.abort();
                    this.removeFromQueue(id);
                }
            }
        }
    }

    // Cleanup all requests
    cleanup(): void {
        for (const request of this.activeRequests.values()) {
            request.abortController.abort();
        }
        this.activeRequests.clear();
    }
}