import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Bot detection using Cloudflare headers
    const cfBotScore = request.headers.get('cf-bot-management-score');
    const cfBotVerified = request.headers.get('cf-bot-management-verified-bot');
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limiting headers
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const realIp = cfConnectingIp || request.headers.get('x-forwarded-for') || 'unknown';

    // Add security headers
    response.headers.set('X-Real-IP', realIp);
    response.headers.set('X-Bot-Score', cfBotScore || 'unknown');

    // Block obvious bots (if not verified by Cloudflare)
    if (cfBotScore && parseFloat(cfBotScore) < 30 && cfBotVerified !== 'true') {
        // Allow search engine bots and verified bots
        const allowedBots = [
            'googlebot',
            'bingbot',
            'slurp',
            'duckduckbot',
            'baiduspider',
            'yandexbot',
            'facebookexternalhit',
            'twitterbot',
            'linkedinbot',
            'whatsapp',
            'telegrambot'
        ];

        const isAllowedBot = allowedBots.some(bot =>
            userAgent.toLowerCase().includes(bot)
        );

        if (!isAllowedBot) {
            console.log(`Blocked potential bot: ${userAgent}, Score: ${cfBotScore}, IP: ${realIp}`);
            return new NextResponse('Access Denied', { status: 403 });
        }
    }

    // Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Add extra security headers for admin routes
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    // API route protection
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Add CORS headers for API routes
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Rate limiting check (basic implementation)
        const rateLimitKey = `rate_limit_${realIp}`;

        // In production, you'd use Redis or similar for rate limiting
        // For now, we'll add headers for Cloudflare to handle
        response.headers.set('X-Rate-Limit-IP', realIp);
    }

    // Security headers for all routes
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

    // CSP header
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "media-src 'self' blob:",
        "connect-src 'self' https://api.deepgram.com https://www.google-analytics.com https://vitals.vercel-insights.com",
        "worker-src 'self' blob:",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};