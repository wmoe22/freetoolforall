import { createClient } from "@deepgram/sdk";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';

// Safe Sentry wrapper
function safeSentryCapture(error: any, context?: any) {
    try {
        Sentry.captureException(error, context);
    } catch (sentryError) {
        console.error('Sentry capture failed:', sentryError);
    }
}

// Helper function to create JSON responses
function createJsonResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

// Rate limiting function
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `tts_${ip}`;
    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    current.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

// Fallback TTS using a simple service or return error
async function fallbackTTS(text: string, format: string = 'mp3'): Promise<Response> {
    // In a real implementation, you could use:
    // - OpenAI TTS API
    // - Google Text-to-Speech
    // - Azure Speech Services
    // - AWS Polly
    // - ElevenLabs API

    console.log('TTS fallback service not implemented');
    throw new Error('TTS service temporarily unavailable');
}

// Initialize Deepgram client
let deepgram: any = null;
try {
    if (process.env.DEEPGRAM_API_KEY) {
        deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    }
} catch (error) {
    console.error('Failed to initialize Deepgram client:', error);
    safeSentryCapture(error);
}

// Deepgram TTS implementation using SDK - WAV only
async function deepgramTTS(text: string, model: string = 'aura-asteria-en'): Promise<ArrayBuffer> {
    if (!deepgram) {
        throw new Error('Deepgram client not configured');
    }

    try {
        // Use the Deepgram SDK for TTS - WAV format only
        const response = await deepgram.speak.request(
            { text },
            {
                model,
                encoding: 'linear16',
                container: 'wav'
            }
        );

        // Get the audio buffer from the response
        const stream = await response.getStream();
        if (!stream) {
            throw new Error('No audio stream received from Deepgram');
        }

        // Convert stream to ArrayBuffer
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // Combine chunks into single ArrayBuffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result.buffer;
    } catch (error: any) {
        console.error('Deepgram SDK TTS error:', error);
        throw new Error(`Deepgram TTS failed: ${error.message}`);
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return createJsonResponse(
                {
                    error: 'Rate limit exceeded. Please wait before trying again.',
                    retryAfter: 60
                },
                429,
                {
                    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString(),
                    'Retry-After': '60'
                }
            );
        }

        // Parse request body with timeout
        const body = await Promise.race([
            request.json(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request parsing timeout')), 5000)
            )
        ]);

        const { text, model = 'aura-asteria-en' } = body;
        const format = 'wav'; // Only support WAV

        // Validate input
        if (!text || typeof text !== 'string') {
            return createJsonResponse(
                { error: 'Text is required and must be a string' },
                400
            );
        }

        if (text.trim().length === 0) {
            return createJsonResponse(
                { error: 'Text cannot be empty' },
                400
            );
        }

        if (text.length > 5000) {
            return createJsonResponse(
                { error: 'Text too long. Maximum length is 5000 characters.' },
                400
            );
        }

        let audioResponse: Response;
        let service = 'unknown';

        // Try Deepgram first
        let audioBuffer: ArrayBuffer;
        try {
            audioBuffer = await deepgramTTS(text, model);
            service = 'deepgram';
        } catch (deepgramError) {
            console.error('Deepgram TTS failed:', deepgramError);

            // Log to Sentry
            safeSentryCapture(deepgramError, {
                tags: {
                    service: 'deepgram',
                    text_length: text.length,
                    model,
                    format,
                },
                extra: {
                    processing_time: Date.now() - startTime,
                }
            });

            // Try fallback service
            try {
                const fallbackResponse = await fallbackTTS(text, 'wav');
                audioBuffer = await fallbackResponse.arrayBuffer();
                service = 'fallback';
            } catch (fallbackError) {
                console.error('Fallback TTS failed:', fallbackError);

                return createJsonResponse(
                    {
                        error: 'Text-to-speech service temporarily unavailable. Please try again later.',
                        code: 'TTS_SERVICE_UNAVAILABLE'
                    },
                    503
                );
            }
        }

        // Check audio buffer

        if (audioBuffer.byteLength === 0) {
            throw new Error('Received empty audio response');
        }

        const processingTime = Date.now() - startTime;

        // Log successful TTS
        console.log(`TTS completed: ${text.length} chars, ${audioBuffer.byteLength} bytes, ${processingTime}ms, service: ${service}`);

        // Prepare usage tracking data
        const usageData = {
            type: 'tts' as const,
            service: service as 'deepgram' | 'fallback',
            metadata: {
                textLength: text.length,
                duration: Math.ceil(processingTime / 1000),
                model,
                format,
                success: true
            }
        };

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
                'X-Service-Used': service,
                'X-Text-Length': text.length.toString(),
                'X-Usage-Data': JSON.stringify(usageData),
                'X-Usage-Tracked': 'true',
            },
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('TTS error:', error);

        // Capture error in Sentry
        safeSentryCapture(error, {
            tags: {
                endpoint: 'tts',
                processing_time: processingTime,
            },
            extra: {
                request_headers: Object.fromEntries(request.headers.entries()),
            }
        });

        // Return appropriate error response
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                return createJsonResponse(
                    {
                        error: 'Request timeout. Please try with shorter text or try again later.',
                        code: 'TIMEOUT'
                    },
                    408
                );
            }

            if (error.message.includes('Rate limit')) {
                return createJsonResponse(
                    {
                        error: 'Too many requests. Please wait before trying again.',
                        code: 'RATE_LIMIT'
                    },
                    429
                );
            }

            if (error.message.includes('not configured')) {
                return createJsonResponse(
                    {
                        error: 'TTS service not configured. Please contact support.',
                        code: 'SERVICE_NOT_CONFIGURED'
                    },
                    503
                );
            }
        }

        return createJsonResponse(
            {
                error: 'Text-to-speech generation failed. Please try again.',
                code: 'TTS_FAILED'
            },
            500
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}