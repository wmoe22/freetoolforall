'use client'

import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface CompatibilityStatus {
    speechSynthesis: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
    fetch: boolean;
    fileReader: boolean;
    webAudio: boolean;
}

interface BrowserCompatibilityProps {
    onCompatibilityCheck?: (status: CompatibilityStatus) => void;
    showWarnings?: boolean;
}

export default function BrowserCompatibility({
    onCompatibilityCheck,
    showWarnings = true
}: BrowserCompatibilityProps) {
    const [compatibility, setCompatibility] = useState<CompatibilityStatus | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const checkCompatibility = (): CompatibilityStatus => {
            const status: CompatibilityStatus = {
                speechSynthesis: 'speechSynthesis' in window,
                mediaRecorder: 'MediaRecorder' in window,
                audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
                fetch: 'fetch' in window,
                fileReader: 'FileReader' in window,
                webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            };

            // Additional checks for specific browser quirks
            if (status.speechSynthesis) {
                try {
                    // Test if speech synthesis actually works
                    const testUtterance = new SpeechSynthesisUtterance('');
                    status.speechSynthesis = true;
                } catch (error) {
                    status.speechSynthesis = false;
                }
            }

            if (status.mediaRecorder) {
                try {
                    // Check if we can create a MediaRecorder
                    const stream = new MediaStream();
                    const recorder = new MediaRecorder(stream);
                    status.mediaRecorder = true;
                } catch (error) {
                    status.mediaRecorder = false;
                }
            }

            return status;
        };

        const status = checkCompatibility();
        setCompatibility(status);
        onCompatibilityCheck?.(status);

        // Store in global for speech service to use
        (window as any).speechCompatibility = status;
    }, [onCompatibilityCheck]);

    if (!compatibility) {
        return null;
    }

    const criticalFeatures = ['speechSynthesis', 'fetch', 'fileReader'];
    const hasCriticalIssues = criticalFeatures.some(feature => !compatibility[feature as keyof CompatibilityStatus]);
    const hasWarnings = Object.values(compatibility).some(supported => !supported);

    if (!showWarnings && !hasCriticalIssues) {
        return null;
    }

    const getFeatureName = (key: string): string => {
        const names: Record<string, string> = {
            speechSynthesis: 'Text-to-Speech',
            mediaRecorder: 'Audio Recording',
            audioContext: 'Audio Processing',
            fetch: 'Network Requests',
            fileReader: 'File Upload',
            webAudio: 'Web Audio API',
        };
        return names[key] || key;
    };

    const getFeatureDescription = (key: string): string => {
        const descriptions: Record<string, string> = {
            speechSynthesis: 'Required for browser-based text-to-speech functionality',
            mediaRecorder: 'Needed for recording audio directly in the browser',
            audioContext: 'Used for advanced audio processing and effects',
            fetch: 'Essential for communicating with speech services',
            fileReader: 'Required for uploading and processing audio files',
            webAudio: 'Enables advanced audio manipulation and playback',
        };
        return descriptions[key] || 'Browser feature';
    };

    if (hasCriticalIssues) {
        return (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-3">
                    <XCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                            Browser Compatibility Issues
                        </h3>
                        <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                            Your browser doesn't support some essential features. SpeechFlow may not work properly.
                        </p>

                        <div className="space-y-2">
                            {Object.entries(compatibility).map(([feature, supported]) => {
                                const isCritical = criticalFeatures.includes(feature);
                                if (!supported && isCritical) {
                                    return (
                                        <div key={feature} className="flex items-center space-x-2 text-sm">
                                            <XCircle size={16} className="text-red-500" />
                                            <span className="font-medium text-red-900 dark:text-red-100">
                                                {getFeatureName(feature)}
                                            </span>
                                            <span className="text-red-700 dark:text-red-300">
                                                - {getFeatureDescription(feature)}
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <div className="mt-3 text-sm text-red-800 dark:text-red-200">
                            <p className="font-medium">Recommended browsers:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Chrome 60+ (recommended)</li>
                                <li>Firefox 55+</li>
                                <li>Safari 14+</li>
                                <li>Edge 79+</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (hasWarnings && showWarnings) {
        return (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                    <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                                Some features may be limited
                            </h4>
                            <Button
                                onClick={() => setShowDetails(!showDetails)}
                                variant="link"
                                className="text-yellow-700 dark:text-yellow-300 text-xs h-auto p-0"
                            >
                                {showDetails ? 'Hide details' : 'Show details'}
                            </Button>
                        </div>

                        {showDetails && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(compatibility).map(([feature, supported]) => (
                                    <div key={feature} className="flex items-center space-x-2 text-xs">
                                        {supported ? (
                                            <CheckCircle size={14} className="text-green-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                        <span className={supported ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                            {getFeatureName(feature)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}