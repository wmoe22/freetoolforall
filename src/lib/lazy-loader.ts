// Lazy loading utilities for optimizing bundle size

import { ComponentType, lazy, LazyExoticComponent } from 'react';

interface LazyLoadOptions {
    fallback?: ComponentType;
    retryCount?: number;
    retryDelay?: number;
    preload?: boolean;
}

interface LoadableComponent<T = {}> {
    component: LazyExoticComponent<ComponentType<T>>;
    preload: () => Promise<void>;
    isLoaded: () => boolean;
}

class LazyLoader {
    private loadedComponents = new Set<string>();
    private loadingComponents = new Map<string, Promise<any>>();
    private preloadQueue: Array<() => Promise<void>> = [];
    private isPreloading = false;

    // Create a lazy-loaded component with retry logic
    createLazyComponent<T = {}>(
        importFn: () => Promise<{ default: ComponentType<T> }>,
        options: LazyLoadOptions = {}
    ): LoadableComponent<T> {
        const {
            retryCount = 3,
            retryDelay = 1000,
            preload = false
        } = options;

        let componentId = this.generateComponentId();
        let loadPromise: Promise<{ default: ComponentType<T> }> | null = null;

        const retryableImport = async (): Promise<{ default: ComponentType<T> }> => {
            let lastError: Error;

            for (let attempt = 0; attempt <= retryCount; attempt++) {
                try {
                    // Check if already loading
                    if (this.loadingComponents.has(componentId)) {
                        return await this.loadingComponents.get(componentId);
                    }

                    // Start loading
                    const promise = importFn();
                    this.loadingComponents.set(componentId, promise);

                    const result = await promise;

                    // Mark as loaded
                    this.loadedComponents.add(componentId);
                    this.loadingComponents.delete(componentId);

                    console.log(`Lazy component loaded: ${componentId}`);
                    return result;

                } catch (error) {
                    lastError = error as Error;
                    this.loadingComponents.delete(componentId);

                    console.warn(`Lazy load attempt ${attempt + 1} failed:`, error);

                    if (attempt < retryCount) {
                        await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
                    }
                }
            }

            throw new Error(`Failed to load component after ${retryCount + 1} attempts: ${lastError!.message}`);
        };

        const component = lazy(retryableImport);

        const preloadFn = async (): Promise<void> => {
            if (this.loadedComponents.has(componentId)) {
                return;
            }

            try {
                if (!loadPromise) {
                    loadPromise = retryableImport();
                }
                await loadPromise;
            } catch (error) {
                console.error('Preload failed:', error);
                loadPromise = null;
            }
        };

        const isLoadedFn = (): boolean => {
            return this.loadedComponents.has(componentId);
        };

        // Add to preload queue if requested
        if (preload) {
            this.addToPreloadQueue(preloadFn);
        }

        return {
            component,
            preload: preloadFn,
            isLoaded: isLoadedFn
        };
    }

    // Generate unique component ID
    private generateComponentId(): string {
        return `lazy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Delay utility
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Add component to preload queue
    private addToPreloadQueue(preloadFn: () => Promise<void>): void {
        this.preloadQueue.push(preloadFn);

        // Start preloading if not already in progress
        if (!this.isPreloading) {
            this.startPreloading();
        }
    }

    // Start preloading components in queue
    private async startPreloading(): Promise<void> {
        if (this.isPreloading || this.preloadQueue.length === 0) {
            return;
        }

        this.isPreloading = true;
        console.log(`Starting preload of ${this.preloadQueue.length} components`);

        // Wait for page to be idle before preloading
        await this.waitForIdle();

        while (this.preloadQueue.length > 0) {
            const preloadFn = this.preloadQueue.shift();
            if (preloadFn) {
                try {
                    await preloadFn();
                    // Small delay between preloads to avoid blocking
                    await this.delay(100);
                } catch (error) {
                    console.warn('Preload failed:', error);
                }
            }
        }

        this.isPreloading = false;
        console.log('Preloading completed');
    }

    // Wait for page to be idle
    private async waitForIdle(): Promise<void> {
        return new Promise(resolve => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => resolve(), { timeout: 5000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(resolve, 1000);
            }
        });
    }

    // Preload component on interaction (hover, focus, etc.)
    createInteractionPreloader(preloadFn: () => Promise<void>) {
        let hasPreloaded = false;

        const preload = () => {
            if (!hasPreloaded) {
                hasPreloaded = true;
                preloadFn().catch(error => {
                    console.warn('Interaction preload failed:', error);
                    hasPreloaded = false; // Allow retry
                });
            }
        };

        return {
            onMouseEnter: preload,
            onFocus: preload,
            onTouchStart: preload
        };
    }

    // Preload component when it enters viewport
    createViewportPreloader(preloadFn: () => Promise<void>) {
        let hasPreloaded = false;
        let observer: IntersectionObserver | null = null;

        const createObserver = (element: Element) => {
            if (hasPreloaded || !('IntersectionObserver' in window)) {
                return;
            }

            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !hasPreloaded) {
                            hasPreloaded = true;
                            preloadFn().catch(error => {
                                console.warn('Viewport preload failed:', error);
                                hasPreloaded = false;
                            });
                            observer?.disconnect();
                        }
                    });
                },
                { rootMargin: '50px' } // Start loading 50px before entering viewport
            );

            observer.observe(element);
        };

        const cleanup = () => {
            observer?.disconnect();
        };

        return { createObserver, cleanup };
    }

    // Get loading statistics
    getStats(): {
        totalComponents: number;
        loadedComponents: number;
        loadingComponents: number;
        queuedComponents: number;
    } {
        return {
            totalComponents: this.loadedComponents.size + this.loadingComponents.size + this.preloadQueue.length,
            loadedComponents: this.loadedComponents.size,
            loadingComponents: this.loadingComponents.size,
            queuedComponents: this.preloadQueue.length
        };
    }

    // Clear all loading state
    reset(): void {
        this.loadedComponents.clear();
        this.loadingComponents.clear();
        this.preloadQueue.length = 0;
        this.isPreloading = false;
    }
}

// Create singleton instance
export const lazyLoader = new LazyLoader();

// Convenience function for creating lazy components
export function createLazyComponent<T = {}>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options?: LazyLoadOptions
): LoadableComponent<T> {
    return lazyLoader.createLazyComponent(importFn, options);
}

// HOC for adding lazy loading to components
export function withLazyLoading<T extends {}>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options?: LazyLoadOptions
) {
    return lazyLoader.createLazyComponent(importFn, options);
}

// Preload critical components
export async function preloadCriticalComponents(): Promise<void> {
    const criticalImports = [
        // Add your critical component imports here
        () => import('../components/speech/TextToSpeechTab'),
        () => import('../components/speech/SpeechToTextTab'),
    ];

    const preloadPromises = criticalImports.map(importFn =>
        importFn().catch(error => {
            console.warn('Critical component preload failed:', error);
        })
    );

    await Promise.allSettled(preloadPromises);
    console.log('Critical components preloaded');
}