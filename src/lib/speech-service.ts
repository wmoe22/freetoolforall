// Main speech service orchestrator
import { AudioCompressor } from './audio-compressor';
import { TTSCache } from './tts-cache';
import { UsageTracker } from './usage-tracker';

// Import modular services
import { BrowserCompatibilityChecker } from './speech/browser-compatibility';
import { HealthService } from './speech/health-service';
import { RequestManager } from './speech/request-manager';
import { RetryManager } from './speech/retry-utils';
import { TranscriptionService } from './speech/transcription-service';
import { TTSService } from './speech/tts-service';
import { VoiceModelsService } from './speech/voice-models-service';

// Import types
import { ActiveRequests, DailyLimits, ServiceHealth } from './speech/types';

export class SpeechService {
    private usageTracker: UsageTracker;
    private audioCompressor: AudioCompressor;
    private ttsCache: TTSCache;

    // Modular services
    private requestManager: RequestManager;
    private compatibilityChecker: BrowserCompatibilityChecker;
    private retryManager: RetryManager;
    private transcriptionService: TranscriptionService;
    private ttsService: TTSService;
    private voiceModelsService: VoiceModelsService;
    private healthService: HealthService;

    constructor() {
        // Initialize core services
        this.usageTracker = new UsageTracker();
        this.audioCompressor = new AudioCompressor();
        this.ttsCache = new TTSCache();

        // Initialize modular services
        this.requestManager = new RequestManager();
        this.compatibilityChecker = new BrowserCompatibilityChecker();
        this.retryManager = new RetryManager();

        this.transcriptionService = new TranscriptionService(
            this.audioCompressor,
            this.requestManager,
            this.retryManager
        );

        this.ttsService = new TTSService(
            this.ttsCache,
            this.requestManager,
            this.retryManager,
            this.compatibilityChecker
        );

        this.voiceModelsService = new VoiceModelsService(this.retryManager);
        this.healthService = new HealthService();

        // Check browser compatibility on initialization
        this.compatibilityChecker.checkBrowserCompatibility();
    }

    // Transcription methods
    async transcribeFile(file: File): Promise<string> {
        const result = await this.transcriptionService.transcribeFile(file);
        this.trackUsage('transcribe', 'deepgram', { fileSize: file.size });
        return result;
    }

    cancelTranscription(requestId?: string): void {
        this.transcriptionService.cancelTranscription(requestId);
    }

    // Text-to-Speech methods
    async textToSpeech(text: string): Promise<void> {
        await this.ttsService.textToSpeech(text);
        this.trackUsage('tts', 'browser', { textLength: text.length });
    }

    async textToSpeechWithModel(text: string, model: any): Promise<void> {
        await this.ttsService.textToSpeechWithModel(text, model);
        this.trackUsage('tts', 'deepgram', { textLength: text.length, model: model?.id });
    }

    stopSpeech(): void {
        this.ttsService.stopSpeech();
    }

    cancelTTS(requestId?: string): void {
        this.ttsService.cancelTTS(requestId);
    }

    async preloadAudio(text: string, model?: any): Promise<void> {
        return this.ttsService.preloadAudio(text, model);
    }

    async generateAudioBlob(text: string, model?: any): Promise<Blob> {
        const blob = await this.ttsService.generateAudioBlob(text, model);
        this.trackUsage('tts', 'deepgram', { textLength: text.length, model: model?.id, download: true });
        return blob;
    }

    // Voice models methods
    async getVoiceModels() {
        return this.voiceModelsService.getVoiceModels();
    }

    // Status and health methods
    getActiveRequests(): ActiveRequests {
        return this.requestManager.getActiveRequests();
    }

    async checkServiceHealth(): Promise<ServiceHealth> {
        return this.healthService.checkServiceHealth();
    }

    // Usage tracking methods
    private trackUsage(
        type: 'transcribe' | 'tts' | 'voice-models',
        service: 'deepgram' | 'fallback' | 'browser',
        metadata?: any
    ): void {
        this.usageTracker.trackUsage(type, service, metadata);
    }

    getUsageTracker(): UsageTracker {
        return this.usageTracker;
    }

    checkDailyLimits(): DailyLimits {
        return this.usageTracker.checkDailyLimits();
    }

    // Cache and optimization methods
    getTTSCache(): TTSCache {
        return this.ttsCache;
    }

    getAudioCompressor(): AudioCompressor {
        return this.audioCompressor;
    }

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

    // Cleanup method
    cleanup(): void {
        this.requestManager.cleanup();
        this.ttsService.stopSpeech();
        this.audioCompressor.cleanup();
    }
}