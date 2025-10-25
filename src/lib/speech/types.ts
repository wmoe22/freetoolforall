// Types and interfaces for speech services

export interface RequestQueue {
    id: string;
    type: 'transcribe' | 'tts';
    timestamp: number;
    abortController: AbortController;
}

export interface ServiceHealth {
    available: boolean;
    services: Record<string, boolean>;
}

export interface ActiveRequests {
    transcribe: number;
    tts: number;
    total: number;
}

export interface BrowserCompatibility {
    speechSynthesis: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
    fetch: boolean;
    fileReader: boolean;
}

export interface DailyLimits {
    withinLimits: boolean;
    warnings: string[];
}