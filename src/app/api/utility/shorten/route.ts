import { urlStorage } from "@/lib/url-storage";
import { NextRequest, NextResponse } from "next/server";

function generateShortCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        // Validate URL
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        if (!isValidUrl(url)) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Generate unique short code
        let shortCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            shortCode = generateShortCode();
            attempts++;
        } while (urlStorage.has(shortCode) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            return NextResponse.json(
                { error: 'Failed to generate unique short code' },
                { status: 500 }
            );
        }

        // Store in database
        urlStorage.set(shortCode, url);

        // Get the base URL from the request
        const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
        const shortUrl = `${baseUrl}/s/${shortCode}`;

        return NextResponse.json({
            shortCode,
            shortUrl,
            originalUrl: url,
        });

    } catch (error) {
        console.error('Error in shorten API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}