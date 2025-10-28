import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const cfBotScore = request.headers.get("cf-bot-management-score");
  const realIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  // Set basic headers
  response.headers.set("X-Real-IP", realIp);

  // Skip bot detection for ads and API routes
  if (
    !pathname.startsWith("/ads") &&
    !pathname.startsWith("/api/") &&
    cfBotScore &&
    parseFloat(cfBotScore) < 30
  ) {
    const allowedBots = [
      "googlebot",
      "bingbot",
      "slurp",
      "duckduckbot",
      "adsterra", // Add this
    ];
    const isAllowedBot = allowedBots.some((bot) =>
      userAgent.toLowerCase().includes(bot)
    );
    if (!isAllowedBot) {
      return new NextResponse("Access Denied", { status: 403 });
    }
  }

  // Admin route security
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
  }

  // Simplified CSP for ads
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.adsterra.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.adsterra.com https://api.deepgram.com https://www.google-analytics.com",
    "frame-src 'self' https://*.adsterra.com",
    "worker-src 'self' blob:",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
