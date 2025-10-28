import { NextRequest, NextResponse } from 'next/server'

interface InspectRequest {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
}

interface ApiResponse {
    url: string
    method: string
    status: number
    statusText: string
    headers: Record<string, string>
    data: any
    size: number
    timestamp: string
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

function parseResponseData(contentType: string, text: string): any {
    const lowerContentType = contentType.toLowerCase()

    // Try to parse JSON
    if (lowerContentType.includes('application/json') || lowerContentType.includes('text/json')) {
        try {
            return JSON.parse(text)
        } catch {
            return text
        }
    }

    // Try to parse XML
    if (lowerContentType.includes('application/xml') || lowerContentType.includes('text/xml')) {
        return text // Return as string for now, could implement XML parsing
    }

    // Handle HTML
    if (lowerContentType.includes('text/html')) {
        return text
    }

    // Handle plain text
    if (lowerContentType.includes('text/plain')) {
        return text
    }

    // Try to parse as JSON anyway for APIs that don't set proper content-type
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url, method, headers = {}, body }: InspectRequest = await request.json()

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            )
        }

        if (!isValidUrl(url)) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            )
        }

        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        if (!validMethods.includes(method.toUpperCase())) {
            return NextResponse.json(
                { error: 'Invalid HTTP method' },
                { status: 400 }
            )
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'API-Response-Inspector/1.0',
                ...headers
            }
        }

        // Add body for methods that support it
        if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
            requestOptions.body = body
        }

        // Make the API request
        const apiResponse = await fetch(url, requestOptions)

        // Extract response headers
        const responseHeaders: Record<string, string> = {}
        apiResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value
        })

        // Get response text
        const responseText = await apiResponse.text()
        const responseSize = new Blob([responseText]).size

        // Parse response data based on content type
        const contentType = responseHeaders['content-type'] || ''
        const parsedData = parseResponseData(contentType, responseText)

        const result: ApiResponse = {
            url,
            method: method.toUpperCase(),
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            headers: responseHeaders,
            data: parsedData,
            size: responseSize,
            timestamp: new Date().toISOString()
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('API inspection error:', error)

        // Handle different types of errors
        let errorMessage = 'Failed to inspect API'
        let statusCode = 500

        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = 'Network error: Unable to reach the API endpoint'
            statusCode = 502
        } else if (error instanceof Error) {
            errorMessage = error.message
        }

        return NextResponse.json(
            {
                error: errorMessage,
                url: '',
                method: 'GET',
                status: 0,
                statusText: 'Error',
                headers: {},
                data: null,
                size: 0,
                timestamp: new Date().toISOString()
            },
            { status: statusCode }
        )
    }
}