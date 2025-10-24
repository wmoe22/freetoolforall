// Enhanced speech service with reliability improvements
import { AudioCompressor } from './audio-compressor';
import { TTSCache } from './tts-cache';
import { UsageTracker } from './usage-tracker';

interface RequestQueue {
    id: string;
    type: 'transcribe' | 'tts';
    timestamp: number;
    abortController: AbortController;
}

export class SpeechService {
    private usageTracker: UsageTracker;
    private audioCompressor: AudioCompressor;
    private ttsCache: TTSCache;
    private activeRequests = new Map<string, RequestQueue>();
    private maxConcurrentRequests = 3;
    private requestTimeout = 30000; // 30 seconds
    private retryAttempts = 2;
    private retryDelay = 1000; // 1 second

    constructor() {
        // Initialize services
        this.usageTracker = new UsageTracker();
        this.audioCompressor = new AudioCompressor();
        this.ttsCache = new TTSCache();

        // Check browser compatibility on initialization
        this.checkBrowserCompatibility();

        // Clean up old requests periodically
        setInterval(() => this.cleanupOldRequests(), 60000); // Every minute
    }

    // Browser compatibility checks
    private checkBrowserCompatibility(): void {
        // Skip compatibility check on server side
        if (typeof window === 'undefined') {
            return;
        }

        const compatibility = {
            speechSynthesis: 'speechSynthesis' in window,
            mediaRecorder: 'MediaRecorder' in window,
            audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
            fetch: 'fetch' in window,
            fileReader: 'FileReader' in window,
        };

        // Store compatibility info for UI to use
        if (typeof window !== 'undefined') {
            (window as any).speechCompatibility = compatibility;

            // Log warnings for missing features
            Object.entries(compatibility).forEach(([feature, supported]) => {
                if (!supported) {
                    console.warn(`Browser feature not supported: ${feature}`);
                }
            });
        }
    }

    // Check if we can accept new requests
    private canAcceptNewRequest(): boolean {
        return this.activeRequests.size < this.maxConcurrentRequests;
    }

    // Generate unique request ID
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add request to queue
    private addToQueue(type: 'transcribe' | 'tts'): { id: string; abortController: AbortController } {
        if (!this.canAcceptNewRequest()) {
            throw new Error('Too many concurrent requests. Please wait and try again.');
        }

        const id = this.generateRequestId();
        const abortController = new AbortController();

        this.activeRequests.set(id, {
            id,
            type,
            timestamp: Date.now(),
            abortController,
        });

        return { id, abortController };
    }

    // Remove request from queue
    private removeFromQueue(id: string): void {
        this.activeRequests.delete(id);
    }

    // Clean up old requests
    private cleanupOldRequests(): void {
        const now = Date.now();
        const timeout = this.requestTimeout + 10000; // Add 10s buffer

        for (const [id, request] of this.activeRequests.entries()) {
            if (now - request.timestamp > timeout) {
                request.abortController.abort();
                this.activeRequests.delete(id);
                console.warn(`Cleaned up stale request: ${id}`);
            }
        }
    }

    // Retry wrapper with exponential backoff
    private async withRetry<T>(
        operation: () => Promise<T>,
        attempts: number = this.retryAttempts
    ): Promise<T> {
        let lastError: Error;

        for (let i = 0; i <= attempts; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry on certain errors
                if (error instanceof Error) {
                    if (error.name === 'AbortError' ||
                        error.message.includes('Too many concurrent') ||
                        error.message.includes('Network request failed')) {
                        throw error;
                    }
                }

                if (i < attempts) {
                    const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
                    console.warn(`Request failed, retrying in ${delay}ms (attempt ${i + 1}/${attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError!;
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

        const { id, abortController } = this.addToQueue('transcribe');

        try {
            return await this.withRetry(async () => {
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

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData,
                    signal: abortController.signal,
                    // Add timeout using AbortSignal.timeout (if supported)
                    ...(AbortSignal.timeout && {
                        signal: AbortSignal.any([
                            abortController.signal,
                            AbortSignal.timeout(this.requestTimeout)
                        ])
                    })
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

                // Track usage from response
                this.trackUsageFromResponse(response);

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
            this.removeFromQueue(id);
        }
    }

    // Cancel transcription request
    cancelTranscription(requestId?: string): void {
        if (requestId) {
            const request = this.activeRequests.get(requestId);
            if (request && request.type === 'transcribe') {
                request.abortController.abort();
                this.removeFromQueue(requestId);
            }
        } else {
            // Cancel all transcription requests
            for (const [id, request] of this.activeRequests.entries()) {
                if (request.type === 'transcribe') {
                    request.abortController.abort();
                    this.removeFromQueue(id);
                }
            }
        }
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
        if (!('speechSynthesis' in window)) {
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

                // Set up event handlers
                utterance.onend = () => {
                    console.log('Speech synthesis completed');
                    resolve();
                };

                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                utterance.onstart = () => {
                    console.log('Speech synthesis started');
                };

                // Handle browser-specific issues
                let hasStarted = false;
                utterance.onstart = () => {
                    hasStarted = true;
                };

                // Timeout fallback for browsers that don't fire events properly
                const timeout = setTimeout(() => {
                    if (!hasStarted) {
                        speechSynthesis.cancel();
                        reject(new Error('Speech synthesis timeout - browser may not support this feature'));
                    }
                }, 1000);

                utterance.onend = () => {
                    clearTimeout(timeout);
                    resolve();
                };

                utterance.onerror = (event) => {
                    clearTimeout(timeout);
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                speechSynthesis.speak(utterance);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Stop current speech synthesis
    stopSpeech(): void {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
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

        const { id, abortController } = this.addToQueue('tts');

        try {
            return await this.withRetry(async () => {
                try {
                    // Check cache first
                    const modelId = model?.id || 'default';
                    const cachedAudio = await this.ttsCache.getCachedAudio(text, modelId, 'mp3');

                    if (cachedAudio) {
                        console.log('Using cached TTS audio');
                        const audioUrl = URL.createObjectURL(cachedAudio);
                        const audio = new Audio(audioUrl);

                        return new Promise<void>((resolve, reject) => {
                            const cleanup = () => {
                                URL.revokeObjectURL(audioUrl);
                            };

                            audio.onended = () => {
                                cleanup();
                                resolve();
                            };

                            audio.onerror = (event) => {
                                cleanup();
                                reject(new Error('Cached audio playback failed'));
                            };

                            audio.play().catch(error => {
                                cleanup();
                                reject(new Error(`Cached audio play failed: ${error.message}`));
                            });
                        });
                    }

                    // Try Deepgram TTS API first
                    const response = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            model: model?.id || 'default'
                            // No format parameter needed - TTS route only supports MP3 now
                        }),
                        signal: abortController.signal,
                        // Add timeout
                        ...(AbortSignal.timeout && {
                            signal: AbortSignal.any([
                                abortController.signal,
                                AbortSignal.timeout(this.requestTimeout)
                            ])
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();

                        if (audioBlob.size === 0) {
                            throw new Error('Received empty audio response');
                        }

                        // Track usage from response
                        this.trackUsageFromResponse(response);

                        // Cache the audio for future use
                        this.ttsCache.cacheAudio(text, modelId, 'wav', audioBlob).catch(error => {
                            console.warn('Failed to cache TTS audio:', error);
                        });

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

                            audio.onerror = (event) => {
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
                    console.error('TTS API failed with detailed error:', {
                        error: apiError,
                        message: apiError instanceof Error ? apiError.message : 'Unknown error',
                        stack: apiError instanceof Error ? apiError.stack : undefined
                    });
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
            this.removeFromQueue(id);
        }
    }

    // Cancel TTS request
    cancelTTS(requestId?: string): void {
        // Stop browser speech synthesis
        this.stopSpeech();

        if (requestId) {
            const request = this.activeRequests.get(requestId);
            if (request && request.type === 'tts') {
                request.abortController.abort();
                this.removeFromQueue(requestId);
            }
        } else {
            // Cancel all TTS requests
            for (const [id, request] of this.activeRequests.entries()) {
                if (request.type === 'tts') {
                    request.abortController.abort();
                    this.removeFromQueue(id);
                }
            }
        }
    }

    // Preload audio (placeholder for compatibility)
    async preloadAudio(text: string, model?: any): Promise<void> {
        // This is a placeholder for the preload functionality
        // In a real implementation, you might cache audio files
        return Promise.resolve()
    }

    // Enhanced get available voice models with caching
    async getVoiceModels() {
        // Check cache first
        const cacheKey = 'voice_models_cache';
        const cacheExpiry = 'voice_models_cache_expiry';
        const cacheTime = 5 * 60 * 1000; // 5 minutes

        try {
            const cached = localStorage.getItem(cacheKey);
            const expiry = localStorage.getItem(cacheExpiry);

            if (cached && expiry && Date.now() < parseInt(expiry)) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('Cache read failed:', error);
        }

        try {
            return await this.withRetry(async () => {
                const response = await fetch('/api/voice-models', {
                    signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
                });

                if (!response.ok) {
                    if (response.status === 503) {
                        throw new Error('Voice models service temporarily unavailable');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const voiceModels = result.voiceModels || [];

                // Track usage from response
                this.trackUsageFromResponse(response);

                // Cache the result
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(voiceModels));
                    localStorage.setItem(cacheExpiry, (Date.now() + cacheTime).toString());
                } catch (error) {
                    console.warn('Cache write failed:', error);
                }

                return voiceModels;
            });

        } catch (error) {
            console.error('Error fetching voice models:', error);

            // Return empty array as fallback
            return [];
        }
    }

    // Enhanced generate audio blob for download
    async generateAudioBlob(text: string, model?: any): Promise<Blob> {
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for audio generation');
        }

        if (text.length > 5000) {
            throw new Error('Text too long for audio generation. Maximum length is 5000 characters.');
        }

        const { id, abortController } = this.addToQueue('tts');

        try {
            return await this.withRetry(async () => {
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
                        // No format parameter needed - TTS route only supports MP3 now
                    }),
                    signal: abortController.signal,
                    ...(AbortSignal.timeout && {
                        signal: AbortSignal.any([
                            abortController.signal,
                            AbortSignal.timeout(this.requestTimeout)
                        ])
                    })
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
            this.removeFromQueue(id);
        }
    }

    // Get current request status
    getActiveRequests(): { transcribe: number; tts: number; total: number } {
        let transcribe = 0;
        let tts = 0;

        for (const request of this.activeRequests.values()) {
            if (request.type === 'transcribe') transcribe++;
            if (request.type === 'tts') tts++;
        }

        return {
            transcribe,
            tts,
            total: this.activeRequests.size
        };
    }

    // Check if service is available
    async checkServiceHealth(): Promise<{ available: boolean; services: Record<string, boolean> }> {
        const services = {
            transcription: false,
            tts: false,
            voiceModels: false
        };

        try {
            // Quick health check for each service
            const healthPromises = [
                fetch('/api/health', { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined })
                    .then(r => r.ok)
                    .catch(() => false),

                fetch('/api/voice-models', {
                    method: 'HEAD',
                    signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
                })
                    .then(r => r.ok)
                    .catch(() => false)
            ];

            const [healthOk, voiceModelsOk] = await Promise.all(healthPromises);

            services.transcription = healthOk;
            services.tts = healthOk;
            services.voiceModels = voiceModelsOk;

        } catch (error) {
            console.warn('Service health check failed:', error);
        }

        const available = Object.values(services).some(Boolean);

        return { available, services };
    }

    // Cleanup method
    // Track usage from API response headers
    private trackUsageFromResponse(response: Response): void {
        try {
            const usageData = response.headers.get('X-Usage-Data');
            if (usageData) {
                const data = JSON.parse(usageData);
                this.usageTracker.trackUsage(data.type, data.service, data.metadata);
            }
        } catch (error) {
            console.warn('Failed to track usage from response:', error);
        }
    }

    // Get usage tracker instance
    getUsageTracker(): UsageTracker {
        return this.usageTracker;
    }

    // Get TTS cache instance
    getTTSCache(): TTSCache {
        return this.ttsCache;
    }

    // Get audio compressor instance
    getAudioCompressor(): AudioCompressor {
        return this.audioCompressor;
    }

    // Check if within daily limits
    checkDailyLimits(): { withinLimits: boolean; warnings: string[] } {
        return this.usageTracker.checkDailyLimits();
    }

    // Preload popular TTS combinations
    async preloadPopularTTS(): Promise<void> {
        const popularTexts = [
            { text: "Hello, how are you?", model: "aura-asteria-en", format: "wav" },
            { text: "Thank you for using SpeechFlow.", model: "aura-luna-en", format: "wav" },
            { text: "Welcome to our service.", model: "aura-orion-en", format: "wav" },
            { text: "Please try again later.", model: "aura-asteria-en", format: "wav" },
            { text: "Your request has been processed.", model: "aura-luna-en", format: "wav" }
        ];

        await this.ttsCache.preloadPopular(popularTexts);
    }

    cleanup(): void {
        // Cancel all active requests
        for (const request of this.activeRequests.values()) {
            request.abortController.abort();
        }
        this.activeRequests.clear();

        // Stop any ongoing speech
        this.stopSpeech();

        // Cleanup audio compressor
        this.audioCompressor.cleanup();
    }
}