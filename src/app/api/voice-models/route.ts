import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

interface VoiceModel {
    id: string;
    name: string;
    description: string;
    gender: string;
    languages: string[];
    provider: string;
    metadata?: any;
}

// Cache for voice models (in production, use Redis)
let cachedModels: { data: VoiceModel[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `voice_models_${ip}`;
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

// Fallback models if API fails
const getFallbackModels = (): VoiceModel[] => [
    {
        id: "aura-asteria-en",
        name: "Asteria",
        description: "Warm, professional female voice with clear articulation",
        gender: "female",
        languages: ["en-US"],
        provider: "deepgram",
        metadata: {
            display_name: "Asteria",
            accent: "American",
            tags: ["professional", "warm", "clear"],
            use_cases: ["business", "education", "narration"]
        }
    },
    {
        id: "aura-luna-en",
        name: "Luna",
        description: "Friendly, approachable female voice with natural tone",
        gender: "female",
        languages: ["en-US"],
        provider: "deepgram",
        metadata: {
            display_name: "Luna",
            accent: "American",
            tags: ["friendly", "natural", "conversational"],
            use_cases: ["customer service", "casual content", "podcasts"]
        }
    },
    {
        id: "aura-orion-en",
        name: "Orion",
        description: "Professional, trustworthy male voice with authoritative tone",
        gender: "male",
        languages: ["en-US"],
        provider: "deepgram",
        metadata: {
            display_name: "Orion",
            accent: "American",
            tags: ["professional", "authoritative", "trustworthy"],
            use_cases: ["business", "announcements", "training"]
        }
    },
    {
        id: "aura-stella-en",
        name: "Stella",
        description: "Energetic, youthful female voice with vibrant delivery",
        gender: "female",
        languages: ["en-US"],
        provider: "deepgram",
        metadata: {
            display_name: "Stella",
            accent: "American",
            tags: ["energetic", "youthful", "vibrant"],
            use_cases: ["marketing", "entertainment", "social media"]
        }
    },
    {
        id: "aura-zeus-en",
        name: "Zeus",
        description: "Deep, commanding male voice with strong presence",
        gender: "male",
        languages: ["en-US"],
        provider: "deepgram",
        metadata: {
            display_name: "Zeus",
            accent: "American",
            tags: ["deep", "commanding", "strong"],
            use_cases: ["announcements", "dramatic content", "presentations"]
        }
    }
];

async function fetchVoiceModelsFromAPI(): Promise<VoiceModel[]> {
    if (!process.env.DEEPGRAM_API_KEY) {
        console.warn('Deepgram API key not configured, using fallback models');
        return getFallbackModels();
    }

    const response = await fetch('https://api.deepgram.com/v1/models', {
        headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.tts || !Array.isArray(data.tts)) {
        throw new Error('Invalid response format: no TTS models found');
    }

    // Process TTS models
    const voiceModels: VoiceModel[] = data.tts.map((model: any) => {
        // Determine gender from metadata tags
        const tags = model.metadata?.tags || [];
        let gender = 'neutral';

        if (tags.some((tag: string) => ['female', 'woman', 'feminine'].includes(tag.toLowerCase()))) {
            gender = 'female';
        } else if (tags.some((tag: string) => ['male', 'man', 'masculine'].includes(tag.toLowerCase()))) {
            gender = 'male';
        }

        // Generate description from metadata
        let description = `${model.name} voice`;
        if (model.metadata?.tags && model.metadata.tags.length > 0) {
            const adjectives = model.metadata.tags.slice(0, 3).join(', ');
            description = `${adjectives} voice`;
        }
        if (model.metadata?.accent) {
            description += ` with ${model.metadata.accent} accent`;
        }

        return {
            id: model.canonical_name || model.name,
            name: model.name.charAt(0).toUpperCase() + model.name.slice(1),
            description,
            gender,
            languages: model.languages || ['en-US'],
            provider: 'deepgram',
            metadata: {
                ...model.metadata,
                display_name: model.metadata?.display_name || model.name.charAt(0).toUpperCase() + model.name.slice(1)
            }
        };
    });

    return voiceModels;
}

export async function GET(request: NextRequest) {
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

        // Check cache first
        const now = Date.now();
        if (cachedModels && (now - cachedModels.timestamp) < CACHE_DURATION) {
            console.log('Returning cached voice models');
            return NextResponse.json({
                success: true,
                voiceModels: cachedModels.data,
                total: cachedModels.data.length,
                cached: true
            }, {
                headers: {
                    'Cache-Control': 'public, max-age=300', // 5 minutes
                    'X-Cache': 'HIT',
                    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                }
            });
        }

        let voiceModels: VoiceModel[];
        let fallback = false;

        try {
            voiceModels = await fetchVoiceModelsFromAPI();

            // Cache the successful result
            cachedModels = {
                data: voiceModels,
                timestamp: now
            };

        } catch (apiError) {
            console.error("Error fetching voice models from API:", apiError);

            // Log to Sentry
            Sentry.captureException(apiError, {
                tags: {
                    endpoint: 'voice-models',
                    fallback_used: true,
                },
                extra: {
                    processing_time: Date.now() - startTime,
                }
            });

            // Use fallback models
            voiceModels = getFallbackModels();
            fallback = true;

            // Cache fallback models for shorter duration
            cachedModels = {
                data: voiceModels,
                timestamp: now
            };
        }

        const processingTime = Date.now() - startTime;

        console.log(`Voice models fetched: ${voiceModels.length} models, ${processingTime}ms, fallback: ${fallback}`);

        // Prepare usage tracking data
        const usageData = {
            type: 'voice-models' as const,
            service: (fallback ? 'fallback' : 'deepgram') as 'deepgram' | 'fallback',
            metadata: {
                success: true,
                duration: Math.ceil(processingTime / 1000),
                modelsCount: voiceModels.length
            }
        };

        return NextResponse.json({
            success: true,
            voiceModels,
            total: voiceModels.length,
            fallback,
            metadata: {
                processingTime,
                cached: false,
                provider: fallback ? 'fallback' : 'deepgram'
            }
        }, {
            headers: {
                'Cache-Control': fallback ? 'public, max-age=60' : 'public, max-age=300', // Shorter cache for fallback
                'X-Cache': 'MISS',
                'X-Fallback-Used': fallback.toString(),
                'X-Processing-Time': processingTime.toString(),
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Usage-Data': JSON.stringify(usageData),
                'X-Usage-Tracked': 'true',
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error("Unexpected error in voice models endpoint:", error);

        // Capture error in Sentry
        Sentry.captureException(error, {
            tags: {
                endpoint: 'voice-models',
                processing_time: processingTime,
            },
            extra: {
                request_headers: Object.fromEntries(request.headers.entries()),
            }
        });

        // Return fallback models even on unexpected errors
        const fallbackModels = getFallbackModels();

        return NextResponse.json({
            success: true,
            voiceModels: fallbackModels,
            total: fallbackModels.length,
            fallback: true,
            error: 'Service temporarily unavailable, using fallback models'
        }, {
            status: 200, // Return 200 since we have fallback data
            headers: {
                'Cache-Control': 'public, max-age=60',
                'X-Fallback-Used': 'true',
                'X-Processing-Time': processingTime.toString(),
            }
        });
    }
}

// Handle HEAD requests for health checks
export async function HEAD() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Cache-Control': 'public, max-age=300',
        },
    });
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}