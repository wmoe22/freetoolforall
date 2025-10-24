import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Sentry from "@sentry/nextjs";
import jsPDF from 'jspdf';
import { NextRequest, NextResponse } from 'next/server';

// Safe Sentry wrapper
function safeSentryCapture(error: any, context?: any) {
    try {
        Sentry.captureException(error, context);
    } catch (sentryError) {
        console.error('Sentry capture failed:', sentryError);
    }
}

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    safeSentryCapture(error);
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `meeting_notes_${ip}`;
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

        if (!genAI) {
            return NextResponse.json(
                { error: 'AI service not available. Please try again later.' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { transcript, meetingTitle, attendees } = body;

        // Validate required fields
        if (!transcript || transcript.trim().length === 0) {
            return NextResponse.json(
                { error: 'Transcript is required' },
                { status: 400 }
            );
        }

        // Generate structured meeting notes using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Please analyze the following meeting transcript and create structured meeting notes. Format the output as a professional document with clear sections.

Meeting Title: ${meetingTitle || 'Meeting'}
Attendees: ${attendees || 'Not specified'}
Date: ${new Date().toLocaleDateString()}

Transcript:
${transcript}

Please structure the meeting notes with the following sections:
1. **Executive Summary** - Brief overview of the meeting
2. **Key Discussion Points** - Main topics discussed with bullet points
3. **Decisions Made** - Clear list of decisions reached
4. **Action Items** - Specific tasks with responsible parties (if mentioned) and deadlines
5. **Next Steps** - Follow-up actions and future meetings
6. **Additional Notes** - Any other relevant information

Make sure to:
- Use clear, professional language
- Extract specific action items with owners when possible
- Identify key decisions and outcomes
- Highlight important deadlines or dates mentioned
- Organize information logically and concisely

If the transcript is unclear or incomplete in some areas, note this appropriately.`;

        const result = await model.generateContent(prompt);
        const meetingNotes = result.response.text();

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Meeting Notes', margin, 30);

        // Meeting details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Meeting: ${meetingTitle || 'Untitled Meeting'}`, margin, 45);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 55);
        if (attendees) {
            doc.text(`Attendees: ${attendees}`, margin, 65);
        }

        // Add separator line
        doc.line(margin, 75, pageWidth - margin, 75);

        // Add content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        // Process the content to handle markdown-style formatting
        const lines = meetingNotes.split('\n');
        let yPosition = 90;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            // Handle headers (lines starting with **)
            if (line.includes('**')) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                const cleanLine = line.replace(/\*\*/g, '');
                doc.text(cleanLine, margin, yPosition);
                yPosition += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
            }
            // Handle bullet points
            else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                const bulletText = line.replace(/^[\s\-•]+/, '');
                if (bulletText.trim()) {
                    const wrappedLines = doc.splitTextToSize(`• ${bulletText}`, maxWidth - 10);
                    wrappedLines.forEach((wrappedLine: string, index: number) => {
                        if (yPosition > pageHeight - margin) {
                            doc.addPage();
                            yPosition = margin;
                        }
                        doc.text(wrappedLine, margin + (index > 0 ? 10 : 0), yPosition);
                        yPosition += 6;
                    });
                }
            }
            // Handle regular text
            else if (line.trim()) {
                const wrappedLines = doc.splitTextToSize(line, maxWidth);
                wrappedLines.forEach((wrappedLine: string) => {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.text(wrappedLine, margin, yPosition);
                    yPosition += 6;
                });
            }
            // Handle empty lines
            else {
                yPosition += 4;
            }
        }

        // Add footer with generation info
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth - margin - 30,
                pageHeight - 10
            );
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                margin,
                pageHeight - 10
            );
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');

        const processingTime = Date.now() - startTime;
        console.log(`Meeting notes generated: ${meetingNotes.length} chars, ${processingTime}ms`);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="meeting_notes_${meetingTitle?.replace(/\s+/g, '_') || 'untitled'}.pdf"`,
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Meeting notes generation error:', error);

        safeSentryCapture(error, {
            tags: {
                endpoint: 'generate-meeting-notes',
                processing_time: processingTime,
            }
        });

        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                return NextResponse.json(
                    { error: 'Request timeout. Please try again.' },
                    { status: 408 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to generate meeting notes. Please try again.' },
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