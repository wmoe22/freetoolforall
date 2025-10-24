import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const startTime = Date.now();

        // Basic health checks
        const healthChecks = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
            services: {} as Record<string, string>,
            responseTime: '',
        };

        // Check external services
        try {
            // Check if we can reach Deepgram (if API key is configured)
            if (process.env.DEEPGRAM_API_KEY) {
                const deepgramResponse = await fetch('https://api.deepgram.com/v1/projects', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
                    },
                    signal: AbortSignal.timeout(5000), // 5 second timeout
                });

                healthChecks.services.deepgram = deepgramResponse.ok ? 'up' : 'down';
            } else {
                healthChecks.services.deepgram = 'not_configured';
            }
        } catch (error) {
            healthChecks.services.deepgram = 'down';
        }

        // Check database connection (if using Supabase)
        try {
            if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
                const supabaseResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
                    method: 'HEAD',
                    headers: {
                        'apikey': process.env.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                    },
                    signal: AbortSignal.timeout(5000),
                });

                healthChecks.services.database = supabaseResponse.ok ? 'up' : 'down';
            } else {
                healthChecks.services.database = 'not_configured';
            }
        } catch (error) {
            healthChecks.services.database = 'down';
        }

        // Check Redis connection (if using Upstash)
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                const redisResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                    },
                    signal: AbortSignal.timeout(5000),
                });

                healthChecks.services.redis = redisResponse.ok ? 'up' : 'down';
            } else {
                healthChecks.services.redis = 'not_configured';
            }
        } catch (error) {
            healthChecks.services.redis = 'down';
        }

        // Calculate response time
        const responseTime = Date.now() - startTime;
        healthChecks.responseTime = `${responseTime}ms`;

        // Determine overall status
        const serviceStatuses = Object.values(healthChecks.services);
        const hasDownServices = serviceStatuses.some(status => status === 'down');

        if (hasDownServices) {
            healthChecks.status = 'degraded';
        }

        // Return appropriate status code
        const statusCode = healthChecks.status === 'healthy' ? 200 :
            healthChecks.status === 'degraded' ? 207 : 503;

        return NextResponse.json(healthChecks, {
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}