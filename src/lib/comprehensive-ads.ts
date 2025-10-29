// Comprehensive Implementation Strode Integration Library

declare global {
    interface Window {
        atOptions?: any;
        adsbygoogle?: any[];
        comprehensiveAds?: any;
    }
}

export class ComprehensiveAdsManager {
    private static instance: ComprehensiveAdsManager;
    private scriptsLoaded: Set<string> = new Set();
    private adSlots: Map<string, HTMLElement> = new Map();

    private constructor() { }

    public static getInstance(): ComprehensiveAdsManager {
        if (!ComprehensiveAdsManager.instance) {
            ComprehensiveAdsManager.instance = new ComprehensiveAdsManager();
        }
        return ComprehensiveAdsManager.instance;
    }

    // All known comprehensiveimplementationstrode script URLs
    private readonly scriptUrls = [
        '//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js',
        '//comprehensiveimplementationstrode.com/5f5974a83798aa28cd290cbee513c6e2/invoke.js',
        '//comprehensiveimplementationstrode.com/782ab596c62dc6dc9cbd9e788cf492d5/invoke.js',
        '//comprehensiveimplementationstrode.com/d7335c49fed82ef151c040dd10690d7e/invoke.js',
        '//comprehensiveimplementationstrode.com/invoke.js'
    ];

    public async loadAllScripts(): Promise<void> {
        const promises = this.scriptUrls.map(url => this.loadScript(url));
        await Promise.allSettled(promises);
    }

    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.scriptsLoaded.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.async = true;
            script.setAttribute('data-cfasync', 'false');

            script.onload = () => {
                this.scriptsLoaded.add(src);
                resolve();
            };

            script.onerror = () => {
                console.warn(`Failed to load ad script: ${src}`);
                resolve(); // Don't reject, just continue
            };

            document.head.appendChild(script);
        });
    }

    public createAdSlot(
        containerId: string,
        options: {
            width?: number;
            height?: number;
            format?: string;
            className?: string;
        } = {}
    ): HTMLElement {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID ${containerId} not found`);
        }

        const adSlot = document.createElement('div');
        adSlot.className = `ad-slot comprehensive-ad ${options.className || ''}`;
        adSlot.style.width = `${options.width || 300}px`;
        adSlot.style.height = `${options.height || 250}px`;
        adSlot.style.display = 'block';
        adSlot.style.margin = '10px auto';
        adSlot.style.textAlign = 'center';

        // Add data attributes for ad targeting
        adSlot.setAttribute('data-ad-format', options.format || 'rectangle');
        adSlot.setAttribute('data-ad-source', 'comprehensive');

        container.appendChild(adSlot);
        this.adSlots.set(containerId, adSlot);

        return adSlot;
    }

    public refreshAds(): void {
        // Try to refresh ads if the ad network supports it
        try {
            if (window.atOptions) {
                // Trigger ad refresh
                this.loadAllScripts();
            }
        } catch (error) {
            console.warn('Ad refresh failed:', error);
        }
    }

    public initializeAds(): void {
        // Initialize ads after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadAllScripts();
            });
        } else {
            this.loadAllScripts();
        }
    }

    // Utility method to inject ads into common locations
    public injectAdsIntoPage(): void {
        const locations = [
            { selector: 'header', position: 'afterend' },
            { selector: 'main', position: 'afterbegin' },
            { selector: 'article', position: 'afterend' },
            { selector: 'footer', position: 'beforebegin' }
        ];

        locations.forEach(({ selector, position }) => {
            const element = document.querySelector(selector);
            if (element) {
                const adContainer = document.createElement('div');
                adContainer.className = 'auto-injected-ad';
                adContainer.style.margin = '20px 0';
                adContainer.style.textAlign = 'center';

                const adSlot = document.createElement('div');
                adSlot.className = 'comprehensive-ad-auto';
                adSlot.style.width = '300px';
                adSlot.style.height = '250px';
                adSlot.style.margin = '0 auto';
                adSlot.style.display = 'block';

                adContainer.appendChild(adSlot);

                if (position === 'afterend') {
                    element.parentNode?.insertBefore(adContainer, element.nextSibling);
                } else if (position === 'afterbegin') {
                    element.insertBefore(adContainer, element.firstChild);
                } else if (position === 'beforebegin') {
                    element.parentNode?.insertBefore(adContainer, element);
                }
            }
        });
    }
}

// Export singleton instance
export const comprehensiveAds = ComprehensiveAdsManager.getInstance();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
    comprehensiveAds.initializeAds();
}