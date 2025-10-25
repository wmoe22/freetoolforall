// Text-to-Speech service functionality

import { TTSCache } from '../tts-cache';
import { BrowserCompatibilityChecker } from './browser-compatibility';
import { RequestManager } from './request-manager';
import { RetryManager } from './retry-utils';

export class TTSService {
    private ttsCache: TTSCache;
    private requestManager: RequestManager;
    private retryManager: RetryManager;
    private compatibilityChecker: BrowserCompatibilityChecker;
    private requestTimeout = 30000; // 30 seconds

    constructor(
        ttsCache: TTSCache,
        requestManager: RequestManager,
        retryManager: RetryManager,
        compatibilityChecker: BrowserCompatibilityChecker
    ) {
        this.ttsCache = ttsCache;
        this.requestManager = requestManager;
        this.retryManager = retryManager;
        this.compatibilityChecker = compatibilityChecker;
    }

    // Enhanced text to speech with browser API fallback
    async textToSpeech(text: string): Promise<void> {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for speech synthesis');
        }

        if (text.length > 5000) {
            throw new Error('Text too long. Maximum length is 5000 characters.');
        }

        // Check browser compatibility
        if (!this.compatibilityChecker.isFeatureSupported('speechSynthesis')) {
            throw new Error('Speech synthesis not supported in this browser');
        }

        return new Promise((resolve, reject) => {
            try {
                // Cancel any existing speech
                speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);

                // Enhanced settings
                utterance.rate = 0.9;
                utterance.volume = 1.0;
                utterance.pitch = 1.0;
                utterance.lang = 'en-US';

                // Handle browser-specific issues
                let hasStarted = false;
                let timeout: NodeJS.Timeout;

                const cleanup = () => {
                    if (timeout) clearTimeout(timeout);
                };

                utterance.onstart = () => {
                    hasStarted = true;
                    console.log('Speech synthesis started');
                };

                utterance.onend = () => {
                    cleanup();
                    console.log('Speech synthesis completed');
                    resolve();
                };

                utterance.onerror = (event) => {
                    cleanup();
                    console.error('Speech synthesis error:', event);
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                // Timeout fallback for browsers that don't fire events properly
                timeout = setTimeout(() => {
                    if (!hasStarted) {
                        speechSynthesis.cancel();
                        reject(new Error('Speech synthesis timeout - browser may not support this feature'));
                    }
                }, 1000);

                speechSynthesis.speak(utterance);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Enhanced text to speech with voice model and fallbacks
    async textToSpeechWithModel(text: string, model: any): Promise<void> {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for speech synthesis');
        }

        if (text.length > 5000) {
            throw new Error('Text too long. Maximum length is 5000 characters.');
        }

        const { id, abortController } = this.requestManager.addToQueue('tts');

        try {
            return await this.retryManager.withRetry(async () => {
                try {
                    // Check cache first
                    const modelId = model?.id || 'default';
                    const cachedAudio = await this.ttsCache.getCachedAudio(text, modelId, 'mp3');

                    if (cachedAudio) {
                        console.log('Using cached TTS audio');
                        return this.playAudioBlob(cachedAudio, abortController);
                    }

                    // Try Deepgram TTS API first
                    const response = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            model: model?.id || 'default'
                        }),
                        signal: abortController.signal
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();

                        if (audioBlob.size === 0) {
                            throw new Error('Received empty audio response');
                        }

                        // Cache the audio for future use
                        this.ttsCache.cacheAudio(text, modelId, 'wav', audioBlob).catch(error => {
                            console.warn('Failed to cache TTS audio:', error);
                        });

                        return this.playAudioBlob(audioBlob, abortController);
                    } else {
                        if (response.status === 429) {
                            throw new Error('Rate limit exceeded for TTS service');
                        }
                        if (response.status === 503) {
                            throw new Error('TTS service temporarily unavailable');
                        }
                        throw new Error(`TTS API failed: ${response.status}`);
                    }

                } catch (apiError) {
                    console.error('TTS API failed:', apiError);
                    console.warn('Falling back to browser TTS due to API failure');

                    // Fallback to browser TTS
                    if (abortController.signal.aborted) {
                        throw new Error('Request was cancelled');
                    }

                    return this.textToSpeech(text);
                }
            });

        } catch (error) {
            console.error('Error with TTS:', error);

            // Provide user-friendly error messages
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Speech synthesis was cancelled or timed out');
                }
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Network error. Falling back to browser speech synthesis');
                }
            }

            throw error;
        } finally {
            this.requestManager.removeFromQueue(id);
        }
    }

    // Helper method to play audio blob
    private playAudioBlob(audioBlob: Blob, abortController: AbortController): Promise<void> {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise<void>((resolve, reject) => {
            const cleanup = () => {
                URL.revokeObjectURL(audioUrl);
            };

            audio.onended = () => {
                cleanup();
                resolve();
            };

            audio.onerror = () => {
                cleanup();
                reject(new Error('Audio playback failed'));
            };

            audio.onloadstart = () => {
                console.log('Audio loading started');
            };

            // Handle abort signal
            abortController.signal.addEventListener('abort', () => {
                audio.pause();
                cleanup();
                reject(new Error('Audio playback was cancelled'));
            });

            audio.play().catch(error => {
                cleanup();
                reject(new Error(`Audio play failed: ${error.message}`));
            });
        });
    }

    // Generate audio blob for download
    async generateAudioBlob(text: string, model?: any): Promise<Blob> {
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for audio generation');
        }

        if (text.length > 5000) {
            throw new Error('Text too long for audio generation. Maximum length is 5000 characters.');
        }

        const { id, abortController } = this.requestManager.addToQueue('tts');

        try {
            return await this.retryManager.withRetry(async () => {
                // Check cache first
                const modelId = model?.id || 'default';
                const cachedAudio = await this.ttsCache.getCachedAudio(text, modelId, 'wav');

                if (cachedAudio) {
                    console.log('Using cached TTS audio for download');
                    return cachedAudio;
                }

                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        model: model?.id || 'default'
                    }),
                    signal: abortController.signal
                });

                if (response.ok) {
                    const blob = await response.blob();

                    if (blob.size === 0) {
                        throw new Error('Received empty audio file');
                    }

                    // Cache the audio for future use
                    this.ttsCache.cacheAudio(text, modelId, 'wav', blob).catch(error => {
                        console.warn('Failed to cache TTS audio for download:', error);
                    });

                    return blob;
                } else {
                    if (response.status === 429) {
                        throw new Error('Rate limit exceeded for audio generation');
                    }
                    throw new Error(`Audio generation failed: ${response.status}`);
                }
            });

        } catch (error) {
            console.error('Error generating audio blob:', error);

            // Fallback: create a text file with the content
            const textContent = `Text-to-Speech Content:\n\n${text}\n\nNote: Audio generation failed. This is a text fallback.\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return new Blob([textContent], { type: 'text/plain' });
        } finally {
            this.requestManager.removeFromQueue(id);
        }
    }

    // Stop current speech synthesis
    stopSpeech(): void {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }

    // Cancel TTS request
    cancelTTS(requestId?: string): void {
        // Stop browser speech synthesis
        this.stopSpeech();
        this.requestManager.cancelRequests('tts', requestId);
    }

    // Preload audio (placeholder for compatibility)
    async preloadAudio(text: string, model?: any): Promise<void> {
        // This is a placeholder for the preload functionality
        return Promise.resolve();
    }
}