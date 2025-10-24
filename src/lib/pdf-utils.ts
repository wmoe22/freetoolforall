import { PDFDocument, rgb } from 'pdf-lib'

export interface CompressionOptions {
    quality: 'standard' | 'high' | 'maximum'
}

export interface SplitOptions {
    type: 'range' | 'individual' | 'every'
    ranges?: string // e.g., "1-5,6-10"
    everyN?: number
}

export interface MergeOptions {
    maintainOrder: boolean
    addBookmarks: boolean
}

export class PDFProcessor {
    /**
     * Compress a PDF file
     */
    static async compressPDF(file: File, options: CompressionOptions): Promise<Blob> {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer)

            // Basic compression by removing unnecessary data
            // In a real implementation, you'd use more sophisticated compression
            const pdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: options.quality === 'maximum' ? 50 :
                    options.quality === 'high' ? 100 : 200
            })

            return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
        } catch (error) {
            console.error('PDF compression failed:', error)
            throw new Error('Failed to compress PDF')
        }
    }

    /**
     * Split a PDF file
     */
    static async splitPDF(file: File, options: SplitOptions): Promise<Blob[]> {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer)
            const pageCount = pdfDoc.getPageCount()
            const results: Blob[] = []

            if (options.type === 'individual') {
                // Split into individual pages
                for (let i = 0; i < pageCount; i++) {
                    const newPdf = await PDFDocument.create()
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i])
                    newPdf.addPage(copiedPage)

                    const pdfBytes = await newPdf.save()
                    results.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }))
                }
            } else if (options.type === 'range' && options.ranges) {
                // Split by ranges
                const ranges = this.parseRanges(options.ranges, pageCount)

                for (const range of ranges) {
                    const newPdf = await PDFDocument.create()
                    const pageIndices = Array.from(
                        { length: range.end - range.start + 1 },
                        (_, i) => range.start + i - 1 // Convert to 0-based index
                    )

                    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices)
                    copiedPages.forEach(page => newPdf.addPage(page))

                    const pdfBytes = await newPdf.save()
                    results.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }))
                }
            } else if (options.type === 'every' && options.everyN) {
                // Split every N pages
                for (let i = 0; i < pageCount; i += options.everyN) {
                    const newPdf = await PDFDocument.create()
                    const endIndex = Math.min(i + options.everyN, pageCount)
                    const pageIndices = Array.from(
                        { length: endIndex - i },
                        (_, idx) => i + idx
                    )

                    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices)
                    copiedPages.forEach(page => newPdf.addPage(page))

                    const pdfBytes = await newPdf.save()
                    results.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }))
                }
            }

            return results
        } catch (error) {
            console.error('PDF splitting failed:', error)
            throw new Error('Failed to split PDF')
        }
    }

    /**
     * Merge multiple PDF files
     */
    static async mergePDFs(files: File[], options: MergeOptions): Promise<Blob> {
        try {
            const mergedPdf = await PDFDocument.create()

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                const pageIndices = Array.from({ length: pdf.getPageCount() }, (_, idx) => idx)

                const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)

                if (options.addBookmarks) {
                    // Add a simple bookmark for each file
                    // Note: pdf-lib has limited bookmark support
                    copiedPages.forEach((page, pageIdx) => {
                        if (pageIdx === 0) {
                            // This is a simplified bookmark implementation
                            // In a real app, you'd use a more robust solution
                            page.drawText(`File: ${file.name}`, {
                                x: 50,
                                y: page.getHeight() - 50,
                                size: 8,
                                color: rgb(0.5, 0.5, 0.5),
                            })
                        }
                    })
                }

                copiedPages.forEach(page => mergedPdf.addPage(page))
            }

            const pdfBytes = await mergedPdf.save()
            return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
        } catch (error) {
            console.error('PDF merging failed:', error)
            throw new Error('Failed to merge PDFs')
        }
    }

    /**
     * Convert between document formats using API endpoint
     */
    static async convertDocument(file: File, targetFormat: string): Promise<Blob> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('targetFormat', targetFormat)

            const response = await fetch('/api/convert-document', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Conversion failed' }))
                throw new Error(errorData.error || 'Conversion failed')
            }

            return await response.blob()
        } catch (error) {
            console.error('Document conversion failed:', error)
            if (error instanceof Error) {
                throw error
            }
            throw new Error('Failed to convert document')
        }
    }

    /**
     * Parse range strings like "1-5,7,9-12"
     */
    private static parseRanges(rangeString: string, maxPage: number): Array<{ start: number, end: number }> {
        const ranges: Array<{ start: number, end: number }> = []
        const parts = rangeString.split(',').map(s => s.trim())

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(s => parseInt(s.trim()))
                if (start && end && start <= end && start >= 1 && end <= maxPage) {
                    ranges.push({ start, end })
                }
            } else {
                const page = parseInt(part)
                if (page >= 1 && page <= maxPage) {
                    ranges.push({ start: page, end: page })
                }
            }
        }

        return ranges
    }

    /**
     * Download a blob as a file
     */
    static downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    /**
     * Download multiple blobs as separate files
     */
    static downloadMultipleBlobs(blobs: Blob[], baseFilename: string): void {
        blobs.forEach((blob, index) => {
            const filename = `${baseFilename}_part_${index + 1}.pdf`
            this.downloadBlob(blob, filename)
        })
    }
}
/**
 
* Additional utility functions for document processing
 */
export class DocumentConverter {
    /**
     * Convert text file to PDF
     */
    static async textToPDF(file: File): Promise<Blob> {
        try {
            const text = await file.text()
            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage()
            const { width, height } = page.getSize()

            // Simple text to PDF conversion
            const lines = text.split('\n')
            const fontSize = 12
            const lineHeight = fontSize * 1.2
            let yPosition = height - 50

            for (const line of lines) {
                if (yPosition < 50) {
                    // Add new page if needed
                    const newPage = pdfDoc.addPage()
                    yPosition = newPage.getSize().height - 50
                    newPage.drawText(line, {
                        x: 50,
                        y: yPosition,
                        size: fontSize,
                    })
                } else {
                    page.drawText(line, {
                        x: 50,
                        y: yPosition,
                        size: fontSize,
                    })
                }
                yPosition -= lineHeight
            }

            const pdfBytes = await pdfDoc.save()
            return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
        } catch (error) {
            console.error('Text to PDF conversion failed:', error)
            throw new Error('Failed to convert text to PDF')
        }
    }

    /**
     * Get file info
     */
    static getFileInfo(file: File): {
        name: string
        size: string
        type: string
        lastModified: string
    } {
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes'
            const k = 1024
            const sizes = ['Bytes', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }

        return {
            name: file.name,
            size: formatBytes(file.size),
            type: file.type || 'Unknown',
            lastModified: new Date(file.lastModified).toLocaleDateString()
        }
    }
}