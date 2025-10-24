import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';

interface UptimeRobotWebhook {
    monitorID: string;
    monitorFriendlyName: string;
    monitorURL: string;
    alertType: 'up' | 'down';
    alertTypeFriendlyName: string;
    alertDetails: string;
    alertDateTime: string;
    alertDuration?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verify webhook signature if configured
        const signature = request.headers.get('x-uptimerobot-signature');
        const webhookSecret = process.env.UPTIMEROBOT_WEBHOOK_SECRET;

        if (webhookSecret && signature) {
            // Implement signature verification here if needed
            // const expectedSignature = crypto.createHmac('sha256', webhookSecret)
            //   .update(body)
            //   .digest('hex');
        }

        const body: UptimeRobotWebhook = await request.json();

        const {
            monitorID,
            monitorFriendlyName,
            monitorURL,
            alertType,
            alertTypeFriendlyName,
            alertDetails,
            alertDateTime,
            alertDuration
        } = body;

        // Log the incident
        const logMessage = `UptimeRobot Alert: ${monitorFriendlyName} (${monitorURL}) is ${alertTypeFriendlyName}`;
        console.log(logMessage, {
            monitorID,
            alertType,
            alertDetails,
            alertDateTime,
            alertDuration
        });

        // Handle different alert types
        if (alertType === 'down') {
            // Service is down - send to Sentry as an error
            Sentry.captureException(new Error(`Service Down: ${monitorFriendlyName}`), {
                tags: {
                    monitor_id: monitorID,
                    monitor_name: monitorFriendlyName,
                    alert_type: alertType,
                },
                extra: {
                    monitor_url: monitorURL,
                    alert_details: alertDetails,
                    alert_datetime: alertDateTime,
                },
                level: 'error',
            });

            // You could also trigger additional actions here:
            // - Send Slack notification
            // - Trigger auto-scaling
            // - Start backup services
            // - Send SMS to on-call engineer

        } else if (alertType === 'up') {
            // Service is back up - log as info
            Sentry.addBreadcrumb({
                message: `Service Restored: ${monitorFriendlyName}`,
                category: 'uptime',
                level: 'info',
                data: {
                    monitor_id: monitorID,
                    monitor_url: monitorURL,
                    downtime_duration: alertDuration,
                },
            });

            // Send recovery notification
            console.log(`✅ Service restored: ${monitorFriendlyName} after ${alertDuration || 'unknown duration'}`);
        }

        // Store incident in database (optional)
        try {
            // If you have a database, you could store incidents:
            // await storeIncident({
            //   monitor_id: monitorID,
            //   monitor_name: monitorFriendlyName,
            //   monitor_url: monitorURL,
            //   alert_type: alertType,
            //   alert_details: alertDetails,
            //   alert_datetime: new Date(alertDateTime),
            //   duration: alertDuration,
            // });
        } catch (dbError) {
            console.error('Failed to store incident in database:', dbError);
        }

        // Send response back to UptimeRobot
        return NextResponse.json({
            received: true,
            timestamp: new Date().toISOString(),
            monitor: monitorFriendlyName,
            status: alertType,
        });

    } catch (error) {
        console.error('Webhook processing failed:', error);

        // Report webhook processing errors to Sentry
        Sentry.captureException(error, {
            tags: {
                webhook_type: 'uptimerobot',
            },
            extra: {
                request_headers: Object.fromEntries(request.headers.entries()),
            },
        });

        return NextResponse.json(
            {
                error: 'Webhook processing failed',
                timestamp: new Date().toISOString(),
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
            'Access-Control-Allow-Headers': 'Content-Type, x-uptimerobot-signature',
        },
    });
}

// Reject other methods
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}