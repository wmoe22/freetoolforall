# Infrastructure Setup Guide

## ✅ Completed Infrastructure Components

### 1. Sentry Error Monitoring

- **Client-side error tracking** with session replay
- **Server-side error monitoring** with performance profiling
- **Edge runtime support** for comprehensive coverage
- **Custom error boundary** with user-friendly fallbacks
- **Automatic error filtering** to reduce noise
- **Performance monitoring** with transaction tracing

### 2. Cloudflare CDN & Security

- **Bot detection middleware** with score-based filtering
- **Rate limiting protection** for API endpoints
- **Security headers** (CSP, XSS protection, etc.)
- **CORS handling** for API routes
- **IP-based monitoring** and logging
- **Verified bot allowlist** for search engines

### 3. UptimeRobot Monitoring

- **Health check endpoint** (`/api/health`) with service status
- **Webhook integration** for real-time alerts
- **Multi-service monitoring** (Deepgram, Supabase, Redis)
- **Performance metrics** (response time, memory usage)
- **Automatic incident logging** to Sentry

## 🚀 Quick Setup Instructions

### Step 1: Sentry Setup

1. Create account at https://sentry.io
2. Create new project (Next.js)
3. Copy DSN and add to environment variables:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

### Step 2: Cloudflare Setup

1. Add domain to Cloudflare
2. Configure DNS (A record pointing to your server)
3. Enable proxy (orange cloud)
4. Configure security settings (see cloudflare-config.md)
5. Add environment variables:

```env
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token
```

### Step 3: UptimeRobot Setup

1. Create account at https://uptimerobot.com
2. Add monitors for:
   - Main site: `https://your-domain.com`
   - Health check: `https://your-domain.com/api/health`
   - API endpoints: `https://your-domain.com/api/voice-models`
3. Configure webhook: `https://your-domain.com/api/webhooks/uptime`
4. Add environment variables:

```env
UPTIMEROBOT_API_KEY=your-api-key
UPTIMEROBOT_WEBHOOK_SECRET=your-webhook-secret
```

## 📊 Monitoring Dashboard

### Health Check Endpoint

- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with service status
- **Monitors**: Deepgram, Supabase, Redis connectivity

### Key Metrics Tracked

- ✅ Service availability (uptime %)
- ✅ Response times
- ✅ Error rates
- ✅ Memory usage
- ✅ External service health
- ✅ Bot detection events

## 🔧 Configuration Files

### Sentry Configuration

- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side monitoring
- `sentry.edge.config.ts` - Edge runtime support
- `src/instrumentation.ts` - Next.js integration

### Security Middleware

- `src/middleware.ts` - Bot detection and security headers
- Rate limiting and CORS handling
- IP tracking and logging

### API Endpoints

- `/api/health` - Comprehensive health checks
- `/api/webhooks/uptime` - UptimeRobot webhook handler

## 🚨 Alert Configuration

### Sentry Alerts

- **Error rate threshold**: >5% in 5 minutes
- **Performance degradation**: >2s average response time
- **New error types**: Immediate notification
- **High memory usage**: >80% for 10 minutes

### UptimeRobot Alerts

- **Downtime**: After 2 consecutive failed checks
- **Response time**: >5 seconds
- **Keyword monitoring**: Missing critical content
- **SSL expiration**: 30 days before expiry

### Cloudflare Alerts

- **DDoS attacks**: Automatic mitigation + notification
- **High bot traffic**: >1000 requests/minute
- **Security events**: Firewall triggers
- **Cache hit ratio**: <80% for 1 hour

## 📈 Performance Optimization

### Caching Strategy

- **Static assets**: 1 year browser cache, 1 month edge cache
- **API responses**: No cache (dynamic content)
- **HTML pages**: 5 minutes edge cache with stale-while-revalidate

### Security Measures

- **Bot score filtering**: Block scores <30 (unless verified)
- **Rate limiting**: 100 requests/minute per IP for APIs
- **Security headers**: CSP, XSS protection, frame options
- **HTTPS enforcement**: Automatic redirects

### Monitoring Coverage

- **Frontend errors**: JavaScript exceptions, network failures
- **Backend errors**: API failures, database issues
- **Infrastructure**: Server health, external dependencies
- **User experience**: Core Web Vitals, performance metrics

## 🔍 Troubleshooting

### Common Issues

1. **High error rates**: Check Sentry dashboard for patterns
2. **Slow response times**: Monitor health check endpoint
3. **Bot attacks**: Review Cloudflare security events
4. **Service downtime**: Check UptimeRobot alerts and logs

### Debug Commands

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test webhook
curl -X POST https://your-domain.com/api/webhooks/uptime \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"purge_everything":true}'
```

## 💰 Cost Optimization

### Free Tier Usage

- **Sentry**: 5,000 errors/month, 10,000 performance units
- **Cloudflare**: Unlimited bandwidth, basic DDoS protection
- **UptimeRobot**: 50 monitors, 5-minute intervals

### Upgrade Triggers

- **Sentry Pro**: >5K errors/month or need advanced features
- **Cloudflare Pro**: Need advanced security or analytics
- **UptimeRobot Pro**: Need 1-minute intervals or SMS alerts

This infrastructure setup provides enterprise-grade monitoring, security, and performance optimization for your SpeechFlow application!
