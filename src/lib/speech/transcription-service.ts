// Transcription service functionality

import { AudioCompressor } from '../audio-compressor';
import { RequestManager } from './request-manager';
import { RetryManager } from './retry-utils';

export class TranscriptionService {
    private audioCompressor: AudioCompressor;
    private requestManager: RequestManager;
    private retryManager: RetryManager;
    private requestTimeout = 30000; // 30 seconds

    constructor(
        audioCompressor: AudioCompressor,
        requestManager: RequestManager,
        retryManager: RetryManager
    ) {
        this.audioCompressor = audioCompressor;
        this.requestManager = requestManager;
        this.retryManager = retryManager;
    }

    // Enhanced transcribe audio file with reliability improvements
    async transcribeFile(file: File): Promise<string> {
        // Validate file
        if (!file) {
            throw new Error('No file provided for transcription');
        }

        if (file.size > 25 * 1024 * 1024) { // 25MB limit
            throw new Error('File too large. Maximum size is 25MB.');
        }

        const { id, abortController } = this.requestManager.addToQueue('transcribe');

        try {
            return await this.retryManager.withRetry(async () => {
                // Compress audio file if supported and beneficial
                let fileToUpload = file;
                if (this.audioCompressor.isCompressionSupported() && file.size > 1024 * 1024) { // > 1MB
                    try {
                        const compressionResult = await this.audioCompressor.compressAudio(file);
                        if (compressionResult.compressionRatio < 0.8) { // Only use if >20% reduction
                            fileToUpload = compressionResult.compressedFile;
                            console.log(`Audio compressed: ${(file.size / 1024).toFixed(1)}KB → ${(fileToUpload.size / 1024).toFixed(1)}KB`);
                        }
                    } catch (compressionError) {
                        console.warn('Audio compression failed, using original file:', compressionError);
                    }
                }

                const formData = new FormData();
                formData.append('audio', fileToUpload);

                // Create combined signal with timeout if supported
                const signal = typeof AbortSignal.timeout === 'function' && typeof AbortSignal.any === 'function'
                    ? AbortSignal.any([
                        abortController.signal,
                        AbortSignal.timeout(this.requestTimeout)
                    ])
                    : abortController.signal;

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData,
                    signal
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        throw new Error('Rate limit exceeded. Please wait before trying again.');
                    }
                    if (response.status === 503) {
                        throw new Error('Transcription service temporarily unavailable. Please try again later.');
                    }
                    throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();

                if (!result.transcript) {
                    throw new Error('No transcript received from service');
                }

                return result.transcript;
            });

        } catch (error) {
            console.error('Error transcribing file:', error);

            // Provide user-friendly error messages
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Transcription was cancelled or timed out. Please try again.');
                }
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Network error. Please check your internet connection and try again.');
                }
            }

            throw error;
        } finally {
            this.requestManager.removeFromQueue(id);
        }
    }

    // Cancel transcription request
    cancelTranscription(requestId?: string): void {
        this.requestManager.cancelRequests('transcribe', requestId);
    }
}