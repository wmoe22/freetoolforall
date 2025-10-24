'use client'

import { Button } from '@/components/ui/button';
import { UsageTracker } from '@/lib/usage-tracker';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function UsageWarning() {
    const [usageTracker] = useState(() => new UsageTracker());
    const [warnings, setWarnings] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const checkUsage = () => {
            const limitCheck = usageTracker.checkDailyLimits();
            setWarnings(limitCheck.warnings);
            setIsVisible(limitCheck.warnings.length > 0 && !isDismissed);
        };

        // Check immediately
        checkUsage();

        // Check every 30 seconds
        const interval = setInterval(checkUsage, 30000);

        return () => clearInterval(interval);
    }, [usageTracker, isDismissed]);

    // Reset dismissal at midnight
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        const timeout = setTimeout(() => {
            setIsDismissed(false);
        }, timeUntilMidnight);

        return () => clearTimeout(timeout);
    }, []);

    if (!isVisible || warnings.length === 0) {
        return null;
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            Usage Limit Warning
                        </h3>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                            {warnings.map((warning, index) => (
                                <p key={index}>• {warning}</p>
                            ))}
                        </div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                            These limits help prevent unexpected charges. You can continue using the service, but consider monitoring your usage.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsDismissed(true)}
                    variant="ghost"
                    size="icon"
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                    aria-label="Dismiss warning"
                >
                    <X size={16} />
                </Button>
            </div>
        </div>
    );
}