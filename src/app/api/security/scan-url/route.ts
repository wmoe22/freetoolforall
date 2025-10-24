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

        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { error: 'No URL provided' },
                { status: 400 }
            )
        }

        // Validate URL format
        try {
            new URL(url)
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            )
        }

        // First, try to get existing analysis for the URL
        const urlId = Buffer.from(url).toString('base64').replace(/=/g, '')

        let analysisResult
        try {
            const existingResponse = await fetch(`${VIRUSTOTAL_BASE_URL}/urls/${urlId}`, {
                headers: {
                    'X-Apikey': VIRUSTOTAL_API_KEY,
                },
            })

            if (existingResponse.ok) {
                analysisResult = await existingResponse.json()
            }
        } catch (error) {
            // If no existing analysis, we'll submit a new one
            console.log('No existing analysis found, submitting new scan')
        }

        // If no existing analysis or it's too old, submit new scan
        if (!analysisResult) {
            const submitFormData = new FormData()
            submitFormData.append('url', url)

            const submitResponse = await fetch(`${VIRUSTOTAL_BASE_URL}/urls`, {
                method: 'POST',
                headers: {
                    'X-Apikey': VIRUSTOTAL_API_KEY,
                },
                body: submitFormData,
            })

            if (!submitResponse.ok) {
                const errorData = await submitResponse.json()
                return NextResponse.json(
                    { error: 'Failed to submit URL to VirusTotal', details: errorData },
                    { status: submitResponse.status }
                )
            }

            const submitResult = await submitResponse.json()
            const analysisId = submitResult.data.id

            // Wait for analysis to complete
            await new Promise(resolve => setTimeout(resolve, 3000))

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

            analysisResult = await analysisResponse.json()
        }

        const stats = analysisResult.data.attributes.stats || analysisResult.data.attributes.last_analysis_stats

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
            scan_date: analysisResult.data.attributes.date || analysisResult.data.attributes.last_analysis_date,
            permalink: `https://www.virustotal.com/gui/url/${urlId}`,
            details: {
                stats,
                url_info: {
                    url,
                    reputation: analysisResult.data.attributes.reputation,
                    categories: analysisResult.data.attributes.categories,
                }
            }
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('URL scan error:', error)
        return NextResponse.json(
            { error: 'Internal server error during URL scan' },
            { status: 500 }
        )
    }
}