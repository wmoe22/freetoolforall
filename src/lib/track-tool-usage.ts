// Utility for tracking tool usage across the application
import { UsageTracker } from './usage-tracker';

// Initialize usage tracker
const usageTracker = new UsageTracker();

/**
 * Track usage for any tool in the application
 * 
 * @example
 * // Track speech-to-text usage
 * trackToolUsage('speech-to-text', {
 *   fileSize: 1024000,
 *   duration: 60,
 *   success: true
 * });
 * 
 * @example
 * // Track image compression
 * trackToolUsage('image-compress', {
 *   fileSize: 2048000,
 *   success: true
 * });
 * 
 * @example
 * // Track PDF operations
 * trackToolUsage('pdf-merge', {
 *   fileSize: 5120000,
 *   success: true
 * });
 */
export function trackToolUsage(
    toolType: string,
    metadata: {
        fileSize?: number;
        textLength?: number;
        duration?: number;
        model?: string;
        format?: string;
        success: boolean;
        error?: string;
    }
): string {
    // Determine service type based on tool
    let service: 'deepgram' | 'fallback' | 'browser' | 'client' | 'api' = 'client';

    if (toolType === 'speech-to-text' || toolType === 'transcribe') {
        service = 'deepgram';
    } else if (toolType === 'text-to-speech' || toolType === 'tts') {
        service = 'deepgram';
    } else if (toolType.includes('pdf') || toolType.includes('image') || toolType.includes('audio')) {
        service = 'client'; // Client-side processing
    }

    return usageTracker.trackUsage(toolType as any, service, metadata);
}

export { usageTracker };
