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

        // Wait a moment for initial analysis
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Get analysis results
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

        const analysisResult = await analysisResponse.json()
        const stats = analysisResult.data.attributes.stats

        // Determine status based on results
        let status: 'clean' | 'malicious' | 'suspicious' | 'unknown' = 'unknown'

        if (stats.malicious > 0) {
            status = 'malicious'
        } else if (stats.suspicious > 0) {
            status = 'suspicious'
        } else if (stats.harmless > 0 || stats.undetected > 0) {
            status = 'clean'
        }

        const result = {
            status,
            positives: stats.malicious + stats.suspicious,
            total: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
            scan_date: analysisResult.data.attributes.date,
            permalink: `https://www.virustotal.com/gui/file-analysis/${analysisId}`,
            details: {
                stats,
                file_info: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                }
            }
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