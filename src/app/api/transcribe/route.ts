import { createClient } from '@deepgram/sdk';
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
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

// Initialize Deepgram client with error handling
let deepgram: any = null;
try {
    if (process.env.DEEPGRAM_API_KEY) {
        deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    }
} catch (error) {
    console.error('Failed to initialize Deepgram client:', error);
    safeSentryCapture(error);
}

// Rate limiting function
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `transcribe_${ip}`;
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

// Fallback transcription service (placeholder for alternative services)
async function fallbackTranscription(buffer: Buffer): Promise<{ transcript: string; confidence: number }> {
    // In a real implementation, you could use:
    // - OpenAI Whisper API
    // - Google Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe

    console.log('Using fallback transcription service');

    // For now, return a placeholder response
    return {
        transcript: "Transcription service temporarily unavailable. Please try again later.",
        confidence: 0
    };
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
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please wait before trying again.',
                    retryAfter: 60
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString(),
                        'Retry-After': '60'
                    }
                }
            );
        }

        // Parse form data with timeout
        const formData = await Promise.race([
            request.formData(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Form data parsing timeout')), 10000)
            )
        ]);

        const audioFile = formData.get('audio') as File;

        // Validate audio file
        if (!audioFile) {
            return NextResponse.json(
                { error: 'Audio file is required' },
                { status: 400 }
            );
        }

        // Check file size (25MB limit)
        if (audioFile.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 25MB.' },
                { status: 413 }
            );
        }

        // Check file type
        const allowedTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a',
            'audio/flac', 'audio/ogg', 'video/mp4', 'video/webm'
        ];

        if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|m4a|flac|ogg|mp4|webm)$/i)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Please use MP3, WAV, M4A, FLAC, OGG, MP4, or WebM.' },
                { status: 400 }
            );
        }

        // Convert to buffer with timeout
        const buffer = Buffer.from(await Promise.race([
            audioFile.arrayBuffer(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('File processing timeout')), 15000)
            )
        ]));

        let transcript = '';
        let confidence = 0;
        let service = 'unknown';

        // Try Deepgram first
        if (deepgram) {
            try {
                const { result } = await Promise.race([
                    deepgram.listen.prerecorded.transcribeFile(buffer, {
                        model: 'nova-2',
                        language: 'en-US',
                        smart_format: true,
                        paragraphs: true,
                        punctuate: true,
                        diarize: false, // Disable speaker detection for faster processing
                        utterances: false, // Disable utterance detection for faster processing
                    }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Deepgram API timeout')), 30000)
                    )
                ]);

                transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
                confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
                service = 'deepgram';

                // Validate transcript
                if (!transcript || transcript.trim().length === 0) {
                    throw new Error('Empty transcript received from Deepgram');
                }

            } catch (deepgramError) {
                console.error('Deepgram transcription failed:', deepgramError);

                // Log to Sentry with context
                Sentry.captureException(deepgramError, {
                    tags: {
                        service: 'deepgram',
                        file_size: audioFile.size,
                        file_type: audioFile.type,
                    },
                    extra: {
                        file_name: audioFile.name,
                        processing_time: Date.now() - startTime,
                    }
                });

                // Try fallback service
                try {
                    const fallbackResult = await fallbackTranscription(buffer);
                    transcript = fallbackResult.transcript;
                    confidence = fallbackResult.confidence;
                    service = 'fallback';
                } catch (fallbackError) {
                    console.error('Fallback transcription failed:', fallbackError);
                    throw new Error('All transcription services failed');
                }
            }
        } else {
            // No Deepgram client available, use fallback
            try {
                const fallbackResult = await fallbackTranscription(buffer);
                transcript = fallbackResult.transcript;
                confidence = fallbackResult.confidence;
                service = 'fallback';
            } catch (fallbackError) {
                console.error('Fallback transcription failed:', fallbackError);
                throw new Error('Transcription service not available');
            }
        }

        const processingTime = Date.now() - startTime;

        // Log successful transcription
        console.log(`Transcription completed: ${transcript.length} chars, ${processingTime}ms, service: ${service}`);

        const response = NextResponse.json({
            success: true,
            transcript,
            confidence,
            metadata: {
                service,
                processingTime,
                fileSize: audioFile.size,
                fileName: audioFile.name
            }
        }, {
            headers: {
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
                'X-Service-Used': service,
                'X-Usage-Tracked': 'true'
            }
        });

        // Add usage tracking data to response for client-side tracking
        const usageData = {
            type: 'transcribe' as const,
            service: service as 'deepgram' | 'fallback',
            metadata: {
                fileSize: audioFile.size,
                duration: Math.ceil(processingTime / 1000), // Rough estimate in seconds
                success: true
            }
        };

        // Add usage tracking header for client
        response.headers.set('X-Usage-Data', JSON.stringify(usageData));

        return response;

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Transcription error:', error);

        // Capture error in Sentry
        Sentry.captureException(error, {
            tags: {
                endpoint: 'transcribe',
                processing_time: processingTime,
            },
            extra: {
                request_headers: Object.fromEntries(request.headers.entries()),
            }
        });

        // Return appropriate error response
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                return NextResponse.json(
                    {
                        error: 'Request timeout. Please try with a smaller file or try again later.',
                        code: 'TIMEOUT'
                    },
                    { status: 408 }
                );
            }

            if (error.message.includes('Rate limit')) {
                return NextResponse.json(
                    {
                        error: 'Too many requests. Please wait before trying again.',
                        code: 'RATE_LIMIT'
                    },
                    { status: 429 }
                );
            }

            if (error.message.includes('not available')) {
                return NextResponse.json(
                    {
                        error: 'Transcription service temporarily unavailable. Please try again later.',
                        code: 'SERVICE_UNAVAILABLE'
                    },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            {
                error: 'Transcription failed. Please try again.',
                code: 'TRANSCRIPTION_FAILED'
            },
            { status: 500 }
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