// Lazy-loaded FAQ Section

import { createLazyComponent } from '@/lib/lazy-loader';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

// Loading fallback component
function FAQSkeleton() {
    return (
        <section className="py-8 sm:py-12 lg:py-16 bg-zinc-800 border border-zinc-700">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="animate-pulse">
                        <div className="h-8 bg-zinc-700 rounded w-64 mx-auto mb-4"></div>
                        <div className="h-4 bg-zinc-700 rounded w-48 mx-auto"></div>
                    </div>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                    <div className="space-y-6 sm:space-y-8 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="border-b border-zinc-700 pb-6 sm:pb-8 last:border-b-0">
                                <div className="h-6 bg-zinc-700 rounded w-3/4 mb-3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-zinc-700 rounded w-full"></div>
                                    <div className="h-4 bg-zinc-700 rounded w-5/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Loader2 size={24} className="animate-spin text-zinc-400 mx-auto" />
                    <p className="text-sm text-zinc-400 mt-2">Loading FAQ...</p>
                </div>
            </div>
        </section>
    );
}

// Create lazy-loaded component
const { component: LazyFAQSection, preload } = createLazyComponent(
    () => import('../seo/FAQSection'),
    {
        preload: true, // Preload since it's likely to be viewed
        retryCount: 2
    }
);

// Wrapper component with Suspense
export default function LazyFAQSectionWrapper() {
    return (
        <Suspense fallback={<FAQSkeleton />}>
            <LazyFAQSection />
        </Suspense>
    );
}

// Export preload function
export { preload as preloadFAQSection };

