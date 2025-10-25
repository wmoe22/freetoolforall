import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const cfBotScore = request.headers.get("cf-bot-management-score");
  const cfBotVerified = request.headers.get("cf-bot-management-verified-bot");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const realIp =
    cfConnectingIp || request.headers.get("x-forwarded-for") || "unknown";

  // General headers
  response.headers.set("X-Real-IP", realIp);
  response.headers.set("X-Bot-Score", cfBotScore || "unknown");

  // ----- Bot Detection (exclude ad routes) -----
  if (
    !pathname.startsWith("/ads") &&
    cfBotScore &&
    parseFloat(cfBotScore) < 30 &&
    cfBotVerified !== "true"
  ) {
    const allowedBots = [
      "googlebot",
      "bingbot",
      "slurp",
      "duckduckbot",
      "baiduspider",
      "yandexbot",
      "facebookexternalhit",
      "twitterbot",
      "linkedinbot",
      "whatsapp",
      "telegrambot",
    ];
    const isAllowedBot = allowedBots.some((bot) =>
      userAgent.toLowerCase().includes(bot)
    );
    if (!isAllowedBot) {
      console.log(
        `Blocked potential bot: ${userAgent}, Score: ${cfBotScore}, IP: ${realIp}`
      );
      return new NextResponse("Access Denied", { status: 403 });
    }
  }

  // ----- Admin Route Security -----
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
  }

  // ----- API Route CORS -----
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("X-Rate-Limit-IP", realIp);
  }

  // ----- Security Headers (public pages) -----
  if (!pathname.startsWith("/admin")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  }

  // ----- CSP -----
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.highperformanceformat.com https://*.adsterra.com https://comprehensiveimplementationstrode.com",
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://comprehensiveimplementationstrode.com https://*.adsterra.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' https://api.deepgram.com https://www.google-analytics.com https://vitals.vercel-insights.com https://*.adsterra.com",
    "frame-src 'self' https://*.adsterra.com https://comprehensiveimplementationstrode.com",
    "worker-src 'self' blob:",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
