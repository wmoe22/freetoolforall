// Lazy-loaded Usage Dashboard with loading fallback

import { createLazyComponent } from '@/lib/lazy-loader';
import { BarChart3, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

// Loading fallback component
function UsageDashboardSkeleton() {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:text-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                        <BarChart3 size={24} className="text-blue-600" />
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                            Usage & Cost Tracking
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Loader2 size={20} className="animate-spin text-zinc-500" />
                    </div>
                </div>

                <div className="p-6">
                    <div className="animate-pulse space-y-6">
                        {/* Loading skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="text-zinc-200 dark:text-zinc-700 rounded-lg h-24"></div>
                            ))}
                        </div>

                        <div className="text-zinc-200 dark:text-zinc-700 rounded-lg h-32"></div>

                        <div className="grid grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="text-zinc-200 dark:text-zinc-700 rounded h-16"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Create lazy-loaded component
const { component: LazyUsageDashboard, preload } = createLazyComponent(
    () => import('../UsageDashboard'),
    {
        preload: false, // Don't preload by default
        retryCount: 3
    }
);

// Wrapper component with Suspense
interface LazyUsageDashboardWrapperProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LazyUsageDashboardWrapper({ isOpen, onClose }: LazyUsageDashboardWrapperProps) {
    if (!isOpen) return null;

    return (
        <Suspense fallback={<UsageDashboardSkeleton />}>
            <LazyUsageDashboard isOpen={isOpen} onClose={onClose} />
        </Suspense>
    );
}

// Admin version without modal overlay
export function AdminUsageDashboard() {
    return (
        <Suspense fallback={<UsageDashboardSkeleton />}>
            <LazyUsageDashboard isOpen={true} onClose={() => { }} />
        </Suspense>
    );
}

// Export preload function for manual preloading
export { preload as preloadUsageDashboard };

