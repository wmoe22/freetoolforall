// Service health checking functionality

import { ServiceHealth } from './types';

export class HealthService {
    // Check if service is available
    async checkServiceHealth(): Promise<ServiceHealth> {
        const services = {
            transcription: false,
            tts: false,
            voiceModels: false
        };

        try {
            // Quick health check for each service
            const healthPromises = [
                fetch('/api/health', {
                    signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined
                })
                    .then(r => r.ok)
                    .catch(() => false),

                fetch('/api/voice-models', {
                    method: 'HEAD',
                    signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined
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
}