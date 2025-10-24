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

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `invoice_${ip}`;
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

// Generate Excel-like CSV content
function generateExcelContent(invoiceData: any): string {
    const { invoiceNumber, clientName, clientAddress, companyName, companyAddress, items, dueDate, notes } = invoiceData;

    let csv = '';
    csv += `INVOICE\n`;
    csv += `\n`;
    csv += `Invoice Number:,${invoiceNumber || 'N/A'}\n`;
    csv += `Date:,${new Date().toLocaleDateString()}\n`;
    csv += `Due Date:,${dueDate || 'N/A'}\n`;
    csv += `\n`;
    csv += `From:\n`;
    csv += `${companyName || 'Your Company'}\n`;
    if (companyAddress) {
        csv += `${companyAddress.replace(/\n/g, ' ')}\n`;
    }
    csv += `\n`;
    csv += `To:\n`;
    csv += `${clientName}\n`;
    if (clientAddress) {
        csv += `${clientAddress.replace(/\n/g, ' ')}\n`;
    }
    csv += `\n`;
    csv += `Description,Quantity,Rate,Amount\n`;

    let total = 0;
    items.forEach((item: any) => {
        csv += `"${item.description}",${item.quantity},${item.rate},${item.amount}\n`;
        total += item.amount;
    });

    csv += `\n`;
    csv += `Total:,,,${total.toFixed(2)}\n`;

    if (notes) {
        csv += `\n`;
        csv += `Notes:\n`;
        csv += `"${notes}"\n`;
    }

    return csv;
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

        const body = await request.json();
        const {
            invoiceNumber,
            clientName,
            clientAddress,
            companyName,
            companyAddress,
            items,
            dueDate,
            notes,
            format = 'pdf'
        } = body;

        // Validate required fields
        if (!clientName || !companyName || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: clientName, companyName, items' },
                { status: 400 }
            );
        }

        // Validate items
        for (const item of items) {
            if (!item.description || item.quantity <= 0 || item.rate < 0) {
                return NextResponse.json(
                    { error: 'Invalid item data. All items must have description, positive quantity, and non-negative rate.' },
                    { status: 400 }
                );
            }
        }

        const total = items.reduce((sum: number, item: any) => sum + item.amount, 0);

        if (format === 'excel') {
            // Generate CSV content (Excel-compatible)
            const csvContent = generateExcelContent(body);
            const buffer = Buffer.from(csvContent, 'utf-8');

            const processingTime = Date.now() - startTime;
            console.log(`Invoice (Excel) generated: ${items.length} items, ${processingTime}ms`);

            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="invoice_${invoiceNumber || 'new'}.csv"`,
                    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-Processing-Time': processingTime.toString(),
                }
            });
        }

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', margin, 30);

        // Invoice details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${invoiceNumber || 'N/A'}`, pageWidth - margin - 60, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 60, 40);
        if (dueDate) {
            doc.text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, pageWidth - margin - 60, 50);
        }

        // From section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('From:', margin, 70);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(companyName, margin, 85);
        if (companyAddress) {
            const fromLines = doc.splitTextToSize(companyAddress, 80);
            let yPos = 95;
            fromLines.forEach((line: string) => {
                doc.text(line, margin, yPos);
                yPos += 10;
            });
        }

        // To section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('To:', pageWidth - margin - 80, 70);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(clientName, pageWidth - margin - 80, 85);
        if (clientAddress) {
            const toLines = doc.splitTextToSize(clientAddress, 80);
            let yPos = 95;
            toLines.forEach((line: string) => {
                doc.text(line, pageWidth - margin - 80, yPos);
                yPos += 10;
            });
        }

        // Items table
        let tableY = 140;

        // Table header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', margin, tableY);
        doc.text('Qty', pageWidth - 120, tableY);
        doc.text('Rate', pageWidth - 80, tableY);
        doc.text('Amount', pageWidth - 40, tableY);

        // Header line
        doc.line(margin, tableY + 5, pageWidth - margin, tableY + 5);

        tableY += 15;

        // Table items
        doc.setFont('helvetica', 'normal');
        items.forEach((item: any) => {
            if (tableY > pageHeight - 50) {
                doc.addPage();
                tableY = 30;
            }

            const descLines = doc.splitTextToSize(item.description, 100);
            doc.text(descLines[0], margin, tableY);
            doc.text(item.quantity.toString(), pageWidth - 120, tableY);
            doc.text(`$${item.rate.toFixed(2)}`, pageWidth - 80, tableY);
            doc.text(`$${item.amount.toFixed(2)}`, pageWidth - 40, tableY);

            tableY += 15;
        });

        // Total line
        doc.line(pageWidth - 100, tableY, pageWidth - margin, tableY);
        tableY += 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Total:', pageWidth - 80, tableY);
        doc.text(`$${total.toFixed(2)}`, pageWidth - 40, tableY);

        // Notes
        if (notes) {
            tableY += 30;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Notes:', margin, tableY);
            doc.setFont('helvetica', 'normal');
            tableY += 10;
            const noteLines = doc.splitTextToSize(notes, pageWidth - 2 * margin);
            noteLines.forEach((line: string) => {
                if (tableY > pageHeight - 30) {
                    doc.addPage();
                    tableY = 30;
                }
                doc.text(line, margin, tableY);
                tableY += 10;
            });
        }

        // Footer
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
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');

        const processingTime = Date.now() - startTime;
        console.log(`Invoice (PDF) generated: ${items.length} items, ${processingTime}ms`);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice_${invoiceNumber || 'new'}.pdf"`,
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-Processing-Time': processingTime.toString(),
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Invoice generation error:', error);

        safeSentryCapture(error, {
            tags: {
                endpoint: 'generate-invoice',
                processing_time: processingTime,
            }
        });

        return NextResponse.json(
            { error: 'Failed to generate invoice. Please try again.' },
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