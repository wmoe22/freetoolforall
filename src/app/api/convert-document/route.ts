import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// Safe Sentry wrapper
function safeSentryCapture(error: any, context?: any) {
    try {
        Sentry.captureException(error, context);
    } catch (sentryError) {
        console.error('Sentry capture failed:', sentryError);
    }
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `convert_${ip}`;
    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
    }

    current.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

// Basic text extraction from PDF
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    try {
        const pdfDoc = await PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPageCount();

        // This is a basic implementation
        // For better text extraction, you'd use libraries like pdf-parse or pdf2pic
        let extractedText = `Document: PDF with ${pageCount} pages\n\n`;
        extractedText += `Note: This is a basic PDF text extraction. The actual text content extraction requires additional libraries.\n`;
        extractedText += `For better text extraction, consider using dedicated PDF parsing services.\n\n`;
        extractedText += `Pages: ${pageCount}\n`;
        extractedText += `Extracted on: ${new Date().toISOString()}\n`;

        return extractedText;
    } catch (error) {
        throw new Error('Failed to extract text from PDF');
    }
}

// Convert text to different formats
function convertTextToFormat(text: string, targetFormat: string, originalFilename: string): { blob: Blob; mimeType: string } {
    switch (targetFormat.toLowerCase()) {
        case 'txt':
            return {
                blob: new Blob([text], { type: 'text/plain' }),
                mimeType: 'text/plain'
            };

        case 'html':
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Converted from ${originalFilename}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Document Conversion</h1>
        <p>Converted from: ${originalFilename}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="content">${text.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
            return {
                blob: new Blob([htmlContent], { type: 'text/html' }),
                mimeType: 'text/html'
            };

        case 'csv':
            // Convert text to basic CSV format
            const csvContent = `"Content","Value"\n"Original File","${originalFilename}"\n"Conversion Date","${new Date().toISOString()}"\n"Text Content","${text.replace(/"/g, '""')}"`;
            return {
                blob: new Blob([csvContent], { type: 'text/csv' }),
                mimeType: 'text/csv'
            };

        default:
            throw new Error(`Target format ${targetFormat} not supported`);
    }
}

// Basic document format detection
function getDocumentType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (file.type === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (file.type === 'text/plain' || extension === 'txt') return 'txt';
    if (file.type === 'text/html' || extension === 'html') return 'html';
    if (file.type === 'text/csv' || extension === 'csv') return 'csv';
    if (file.type.includes('word') || extension === 'docx' || extension === 'doc') return 'word';
    if (file.type.includes('excel') || extension === 'xlsx' || extension === 'xls') return 'excel';

    return 'unknown';
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please wait before trying again.',
                    retryAfter: 60
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString(),
                        'Retry-After': '60'
                    }
                }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const targetFormat = formData.get('targetFormat') as string;

        if (!file || !targetFormat) {
            return NextResponse.json(
                { error: 'File and target format are required' },
                { status: 400 }
            );
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 413 }
            );
        }

        const sourceType = getDocumentType(file);
        const buffer = await file.arrayBuffer();

        let textContent = '';

        // Extract text based on source type
        switch (sourceType) {
            case 'pdf':
                textContent = await extractTextFromPDF(buffer);
                break;

            case 'txt':
            case 'html':
            case 'csv':
                textContent = new TextDecoder().decode(buffer);
                break;

            case 'word':
            case 'excel':
                // For Word/Excel files, provide a placeholder
                textContent = `Document: ${file.name}\n`;
                textContent += `Type: ${sourceType.toUpperCase()}\n`;
                textContent += `Size: ${(file.size / 1024).toFixed(2)} KB\n\n`;
                textContent += `Note: Full content extraction for ${sourceType.toUpperCase()} files requires additional processing.\n`;
                textContent += `This is a basic conversion. For complete document conversion, consider using:\n`;
                textContent += `- LibreOffice API\n`;
                textContent += `- Pandoc\n`;
                textContent += `- Cloud conversion services\n\n`;
                textContent += `Converted on: ${new Date().toISOString()}\n`;
                break;

            default:
                return NextResponse.json(
                    { error: `Unsupported source format: ${file.type}` },
                    { status: 400 }
                );
        }

        // Convert to target format
        const { blob, mimeType } = convertTextToFormat(textContent, targetFormat, file.name);

        const processingTime = Date.now() - startTime;
        console.log(`Document converted: ${file.name} (${sourceType}) -> ${targetFormat}, ${processingTime}ms`);

        const filename = `${file.name.split('.')[0]}_converted.${targetFormat}`;

        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Document conversion error:', error);

        safeSentryCapture(error, {
            tags: {
                endpoint: 'convert-document',
                processing_time: processingTime,
            }
        });

        if (error instanceof Error) {
            if (error.message.includes('not supported')) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Document conversion failed. Please try again.' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}