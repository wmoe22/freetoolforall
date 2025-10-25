// Browser compatibility checks and utilities

import { BrowserCompatibility } from './types';

export class BrowserCompatibilityChecker {
    private compatibility: BrowserCompatibility | null = null;

    // Check browser compatibility
    checkBrowserCompatibility(): BrowserCompatibility {
        // Skip compatibility check on server side
        if (typeof window === 'undefined') {
            return {
                speechSynthesis: false,
                mediaRecorder: false,
                audioContext: false,
                fetch: false,
                fileReader: false,
            };
        }

        if (this.compatibility) {
            return this.compatibility;
        }

        this.compatibility = {
            speechSynthesis: 'speechSynthesis' in window,
            mediaRecorder: 'MediaRecorder' in window,
            audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
            fetch: 'fetch' in window,
            fileReader: 'FileReader' in window,
        };

        // Store compatibility info for UI to use
        (window as any).speechCompatibility = this.compatibility;

        // Log warnings for missing features
        Object.entries(this.compatibility).forEach(([feature, supported]) => {
            if (!supported) {
                console.warn(`Browser feature not supported: ${feature}`);
            }
        });

        return this.compatibility;
    }

    // Get cached compatibility info
    getCompatibility(): BrowserCompatibility | null {
        return this.compatibility;
    }

    // Check specific feature
    isFeatureSupported(feature: keyof BrowserCompatibility): boolean {
        const compatibility = this.checkBrowserCompatibility();
        return compatibility[feature];
    }
}