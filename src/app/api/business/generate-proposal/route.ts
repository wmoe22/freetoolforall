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
    const key = `proposal_${ip}`;
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
        const {
            clientName,
            projectTitle,
            projectDescription,
            budget,
            timeline,
            companyName,
            contactPerson
        } = body;

        // Validate required fields
        if (!clientName || !projectTitle || !projectDescription) {
            return NextResponse.json(
                { error: 'Missing required fields: clientName, projectTitle, projectDescription' },
                { status: 400 }
            );
        }

        // Generate proposal content using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate a professional business proposal with the following details:

Client: ${clientName}
Project Title: ${projectTitle}
Project Description: ${projectDescription}
Budget: ${budget || 'To be discussed'}
Timeline: ${timeline || 'To be determined'}
Company: ${companyName || 'Our Company'}
Contact Person: ${contactPerson || 'Project Manager'}

Please create a comprehensive proposal that includes:
1. Executive Summary
2. Project Overview
3. Scope of Work
4. Deliverables
5. Timeline and Milestones
6. Investment and Payment Terms
7. Why Choose Us
8. Next Steps

Format the response as a structured document with clear sections and professional language. Make it persuasive and tailored to the client's needs.`;

        const result = await model.generateContent(prompt);
        const proposalContent = result.response.text();

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Business Proposal', margin, 30);

        // Add subtitle
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`For: ${clientName}`, margin, 45);
        doc.text(`Project: ${projectTitle}`, margin, 55);

        // Add date
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 70);

        // Add content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        // Split content into lines and add to PDF
        const lines = doc.splitTextToSize(proposalContent, maxWidth);
        let yPosition = 85;

        for (let i = 0; i < lines.length; i++) {
            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(lines[i], margin, yPosition);
            yPosition += 6;
        }

        // Add footer
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
            if (companyName) {
                doc.text(companyName, margin, pageHeight - 10);
            }
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');

        const processingTime = Date.now() - startTime;
        console.log(`Proposal generated: ${proposalContent.length} chars, ${processingTime}ms`);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="proposal_${clientName.replace(/\s+/g, '_')}.pdf"`,
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Proposal generation error:', error);

        safeSentryCapture(error, {
            tags: {
                endpoint: 'generate-proposal',
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
            { error: 'Failed to generate proposal. Please try again.' },
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