# Cloudflare Configuration Guide

## 1. DNS Setup

1. Add your domain to Cloudflare
2. Update nameservers to Cloudflare's
3. Set DNS records:
   - A record: @ → Your server IP (Proxied ✅)
   - CNAME record: www → your-domain.com (Proxied ✅)

## 2. SSL/TLS Configuration

- **SSL/TLS encryption mode**: Full (strict)
- **Always Use HTTPS**: On
- **Minimum TLS Version**: 1.2
- **TLS 1.3**: On
- **Automatic HTTPS Rewrites**: On

## 3. Speed Optimization

### Caching Rules

```
Cache Rule 1: Static Assets
- If URI Path contains: /static/, /_next/static/, /images/, /icons/
- Cache Level: Standard
- Browser TTL: 1 year
- Edge TTL: 1 month

Cache Rule 2: API Routes
- If URI Path starts with: /api/
- Cache Level: Bypass
```

### Page Rules

```
Rule 1: Static Assets Caching
- URL: *your-domain.com/_next/static/*
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year

Rule 2: API Rate Limiting
- URL: *your-domain.com/api/*
- Settings:
  - Security Level: High
  - Cache Level: Bypass
```

## 4. Security Configuration

### Firewall Rules

```
Rule 1: Block Bad Bots
- Expression: (cf.bot_management.score lt 30) and not cf.bot_management.verified_bot
- Action: Block

Rule 2: Rate Limiting
- Expression: http.request.uri.path contains "/api/"
- Action: Rate Limit (100 requests per minute per IP)

Rule 3: Country Blocking (Optional)
- Expression: ip.geoip.country in {"CN" "RU" "KP"}
- Action: Challenge or Block (adjust as needed)
```

### Bot Management

- **Bot Fight Mode**: On (Free tier)
- **Super Bot Fight Mode**: On (Pro tier)
- **Verified Bots**: Allow search engines and social media crawlers

## 5. Performance Settings

### Auto Minify

- ✅ JavaScript
- ✅ CSS
- ✅ HTML

### Brotli Compression

- ✅ Enable

### HTTP/2 & HTTP/3

- ✅ HTTP/2 to Origin
- ✅ HTTP/3 (with QUIC)

### Rocket Loader

- ⚠️ Off (can break React apps)

## 6. Analytics & Monitoring

### Web Analytics

- ✅ Enable Cloudflare Web Analytics
- Add beacon to your site

### Security Events

- Monitor in Security → Events
- Set up notifications for:
  - DDoS attacks
  - High bot traffic
  - Firewall triggers

## 7. Workers (Optional Advanced Setup)

Create a Cloudflare Worker for advanced bot detection:

```javascript
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const botScore = request.cf.botManagement.score;
  const verifiedBot = request.cf.botManagement.verifiedBot;

  // Block suspicious traffic
  if (botScore < 30 && !verifiedBot) {
    return new Response("Access Denied", { status: 403 });
  }

  // Add custom headers
  const response = await fetch(request);
  const newResponse = new Response(response.body, response);

  newResponse.headers.set("X-Bot-Score", botScore);
  newResponse.headers.set("X-Verified-Bot", verifiedBot);

  return newResponse;
}
```

## 8. Environment Variables for Cloudflare

Add these to your deployment:

```env
# Cloudflare Zone ID (for API access)
CLOUDFLARE_ZONE_ID=your_zone_id

# Cloudflare API Token (for purging cache)
CLOUDFLARE_API_TOKEN=your_api_token

# Enable Cloudflare features
NEXT_PUBLIC_CLOUDFLARE_ENABLED=true
```

## 9. Cache Purging Setup

For automatic cache purging on deployments, add to your CI/CD:

```bash
# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## 10. Monitoring & Alerts

Set up notifications for:

- Traffic spikes
- Error rate increases
- DDoS attacks
- SSL certificate expiration

This configuration will provide:

- ✅ CDN acceleration
- ✅ DDoS protection
- ✅ Bot mitigation
- ✅ SSL termination
- ✅ Caching optimization
- ✅ Security monitoring
