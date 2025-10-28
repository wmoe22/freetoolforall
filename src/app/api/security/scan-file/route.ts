import { NextRequest, NextResponse } from 'next/server'

const VIRUSTOTAL_API_KEY = process.env.VIRUS_TOTAL_API_KEY
const VIRUSTOTAL_BASE_URL = 'https://www.virustotal.com/api/v3'

export async function POST(request: NextRequest) {
    try {
        if (!VIRUSTOTAL_API_KEY) {
            return NextResponse.json(
                { error: 'VirusTotal API key not configured' },
                { status: 500 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Check file size (VirusTotal has limits)
        const maxSize = 32 * 1024 * 1024 // 32MB for free API
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 32MB.' },
                { status: 400 }
            )
        }

        // Upload file to VirusTotal
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const uploadResponse = await fetch(`${VIRUSTOTAL_BASE_URL}/files`, {
            method: 'POST',
            headers: {
                'X-Apikey': VIRUSTOTAL_API_KEY,
            },
            body: uploadFormData,
        })

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            return NextResponse.json(
                { error: 'Failed to upload file to VirusTotal', details: errorData },
                { status: uploadResponse.status }
            )
        }

        const uploadResult = await uploadResponse.json()
        const analysisId = uploadResult.data.id

        // Wait for analysis to complete (may take longer for full report)
        let analysisComplete = false
        let attempts = 0
        const maxAttempts = 30 // Wait up to 5 minutes
        let analysisResult: any

        while (!analysisComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds between checks

            const analysisResponse = await fetch(`${VIRUSTOTAL_BASE_URL}/analyses/${analysisId}`, {
                headers: {
                    'X-Apikey': VIRUSTOTAL_API_KEY,
                },
            })

            if (!analysisResponse.ok) {
                return NextResponse.json(
                    { error: 'Failed to get analysis results' },
                    { status: analysisResponse.status }
                )
            }

            analysisResult = await analysisResponse.json()

            // Check if analysis is complete
            if (analysisResult.data.attributes.status === 'completed') {
                analysisComplete = true
            }

            attempts++
        }

        if (!analysisComplete) {
            return NextResponse.json(
                { error: 'Analysis timeout. Please try again later.' },
                { status: 408 }
            )
        }

        // Get the file hash from the analysis result
        const fileId = analysisResult.data.links.item.split('/').pop()

        // Fetch detailed file report
        const fileReportResponse = await fetch(`${VIRUSTOTAL_BASE_URL}/files/${fileId}`, {
            headers: {
                'X-Apikey': VIRUSTOTAL_API_KEY,
            },
        })

        if (!fileReportResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to get detailed file report' },
                { status: fileReportResponse.status }
            )
        }

        const fileReport = await fileReportResponse.json()
        const stats = analysisResult.data.attributes.stats
        const scans = fileReport.data.attributes.last_analysis_results

        // Determine status based on results
        let status: 'clean' | 'malicious' | 'suspicious' | 'unknown' = 'unknown'

        if (stats.malicious > 0) {
            status = 'malicious'
        } else if (stats.suspicious > 0) {
            status = 'suspicious'
        } else if (stats.harmless > 0 || stats.undetected > 0) {
            status = 'clean'
        }

        // Process scan results for detailed report
        const scanResults = Object.entries(scans || {}).map(([engine, result]: [string, any]) => ({
            engine,
            category: result.category,
            result: result.result,
            method: result.method,
            engine_name: result.engine_name,
            engine_version: result.engine_version,
            engine_update: result.engine_update
        }))

        // Sort by category (malicious first, then suspicious, etc.)
        const categoryOrder = { 'malicious': 0, 'suspicious': 1, 'undetected': 2, 'harmless': 3, 'timeout': 4, 'confirmed-timeout': 5, 'failure': 6, 'type-unsupported': 7 }
        scanResults.sort((a, b) => (categoryOrder[a.category as keyof typeof categoryOrder] || 99) - (categoryOrder[b.category as keyof typeof categoryOrder] || 99))

        const result = {
            status,
            positives: stats.malicious + stats.suspicious,
            total: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
            scan_date: analysisResult.data.attributes.date,
            permalink: `https://www.virustotal.com/gui/file/${fileId}`,
            file_hash: {
                md5: fileReport.data.attributes.md5,
                sha1: fileReport.data.attributes.sha1,
                sha256: fileReport.data.attributes.sha256
            },
            file_info: {
                name: file.name,
                size: file.size,
                type: file.type,
                magic: fileReport.data.attributes.magic,
                type_description: fileReport.data.attributes.type_description,
                type_tag: fileReport.data.attributes.type_tag
            },
            stats,
            scan_results: scanResults,
            names: fileReport.data.attributes.names || [],
            first_submission_date: fileReport.data.attributes.first_submission_date,
            last_submission_date: fileReport.data.attributes.last_submission_date,
            times_submitted: fileReport.data.attributes.times_submitted,
            reputation: fileReport.data.attributes.reputation || 0
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('File scan error:', error)
        return NextResponse.json(
            { error: 'Internal server error during file scan' },
            { status: 500 }
        )
    }
}