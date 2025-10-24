# UptimeRobot Monitoring Setup Guide

## 1. Account Setup

1. Sign up at https://uptimerobot.com (Free tier: 50 monitors, 5-minute intervals)
2. Verify your email address
3. Access the dashboard

## 2. Monitor Configuration

### Primary Website Monitor

```
Monitor Type: HTTP(s)
Friendly Name: SpeechFlow - Main Site
URL: https://your-domain.com
Monitoring Interval: 5 minutes (Free) / 1 minute (Pro)
Monitor Timeout: 30 seconds
```

### API Endpoint Monitors

```
Monitor 1: Voice Models API
- Type: HTTP(s)
- Name: SpeechFlow - Voice Models API
- URL: https://your-domain.com/api/voice-models
- Method: GET
- Expected Status: 200

Monitor 2: Health Check Endpoint
- Type: HTTP(s)
- Name: SpeechFlow - Health Check
- URL: https://your-domain.com/api/health
- Method: GET
- Expected Status: 200
```

### Keyword Monitoring

```
Monitor Type: Keyword
Name: SpeechFlow - Homepage Content
URL: https://your-domain.com
Keyword: "Transform Your Voice"
Keyword Type: Exists
```

## 3. Alert Contacts Setup

### Email Notifications

```
Contact Type: Email
Email: your-email@domain.com
Notification Settings:
- ✅ When monitor goes DOWN
- ✅ When monitor goes UP
- ⚠️ Threshold: Send alert after 2 failed checks
```

### Webhook Integration (Optional)

```
Contact Type: Webhook
URL: https://your-domain.com/api/webhooks/uptime
Method: POST
Custom HTTP Headers:
- Authorization: Bearer your-webhook-secret
```

### Slack Integration

```
Contact Type: Slack
Webhook URL: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
Channel: #alerts
```

## 4. Status Page Setup (Pro Feature)

```
Status Page URL: status.your-domain.com
Title: SpeechFlow Status
Description: Real-time status of SpeechFlow services
Monitors to Display:
- ✅ Main Website
- ✅ Voice Models API
- ✅ Transcription API
```

## 5. Advanced Monitoring Setup

### Create Health Check Endpoint

Create this API route for comprehensive health checks:

```typescript
// /api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connection
    // Check external API availability
    // Check critical services

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        deepgram: "up",
        storage: "up",
      },
      version: process.env.npm_package_version || "1.0.0",
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Service check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### Monitor Configuration Examples

```json
{
  "monitors": [
    {
      "friendly_name": "SpeechFlow Main",
      "url": "https://your-domain.com",
      "type": 1,
      "interval": 300,
      "timeout": 30
    },
    {
      "friendly_name": "API Health Check",
      "url": "https://your-domain.com/api/health",
      "type": 1,
      "interval": 300,
      "timeout": 30
    },
    {
      "friendly_name": "Voice Models API",
      "url": "https://your-domain.com/api/voice-models",
      "type": 1,
      "interval": 600,
      "timeout": 30
    }
  ]
}
```

## 6. Webhook Handler (Optional)

Create a webhook endpoint to receive UptimeRobot alerts:

```typescript
// /api/webhooks/uptime/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if configured
    const signature = request.headers.get("x-uptimerobot-signature");

    // Process the alert
    const { monitorFriendlyName, monitorURL, alertType, alertDetails } = body;

    // Log the incident
    console.log(`UptimeRobot Alert: ${monitorFriendlyName} is ${alertType}`);

    // Send to your logging service (Sentry, etc.)
    if (alertType === "down") {
      // Handle downtime alert
      // Could trigger additional notifications, scaling, etc.
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

## 7. Monitoring Best Practices

### Monitor Intervals

- **Critical services**: 1-2 minutes
- **Main website**: 5 minutes
- **API endpoints**: 5-10 minutes
- **Background services**: 15-30 minutes

### Alert Thresholds

- **Immediate alerts**: After 2 consecutive failures
- **Escalation**: After 5 minutes of downtime
- **Recovery notifications**: When service is restored

### What to Monitor

- ✅ Homepage availability
- ✅ Critical API endpoints
- ✅ Database connectivity
- ✅ External service dependencies
- ✅ SSL certificate expiration
- ✅ Domain expiration

## 8. Integration with CI/CD

Add monitoring checks to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Wait for deployment
  run: sleep 60

- name: Check site availability
  run: |
    curl -f https://your-domain.com/api/health || exit 1

- name: Update UptimeRobot monitors
  run: |
    curl -X POST "https://api.uptimerobot.com/v2/editMonitor" \
      -d "api_key=$UPTIMEROBOT_API_KEY" \
      -d "id=$MONITOR_ID" \
      -d "status=1"
```

## 9. Free Tier Limitations

- 50 monitors maximum
- 5-minute check intervals
- 2 months of logs
- Email alerts only

## 10. Upgrade Considerations

**Pro Plan Benefits:**

- 1-minute intervals
- SMS notifications
- Status pages
- Advanced integrations
- Longer log retention

This setup provides comprehensive monitoring to ensure your SpeechFlow app stays online and performs well!
