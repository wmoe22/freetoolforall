import { NextRequest, NextResponse } from 'next/server'

interface CookieInfo {
    name: string
    domain: string
    path: string
    value: string
    httpOnly: boolean
    secure: boolean
    sameSite: string
    expires?: string
    maxAge?: number
    category?: 'necessary' | 'functional' | 'analytics' | 'marketing' | 'unknown'
}

interface ComplianceCheck {
    hasConsentBanner: boolean
    hasCookiePolicy: boolean
    hasOptOut: boolean
    categorizedCookies: boolean
    hasNecessaryCookiesOnly: boolean
    gdprCompliant: boolean
    score: number
}

// Common cookie patterns for categorization
const COOKIE_PATTERNS = {
    necessary: ['PHPSESSID', 'JSESSIONID', 'ASP.NET_SessionId', 'connect.sid', 'csrftoken', 'XSRF-TOKEN'],
    functional: ['lang', 'language', 'currency', 'timezone', 'theme', 'preferences'],
    analytics: ['_ga', '_gid', '_gat', '_gtag', '_utm', 'mixpanel', 'amplitude', 'hotjar'],
    marketing: ['_fbp', '_fbc', 'fr', 'tr', 'ads', 'doubleclick', 'adsystem', 'marketing']
}

// GDPR compliance indicators
const GDPR_INDICATORS = {
    consentBanner: [
        'cookie consent', 'accept cookies', 'cookie banner', 'gdpr', 'privacy consent',
        'cookie notice', 'we use cookies', 'this website uses cookies'
    ],
    cookiePolicy: [
        'cookie policy', 'privacy policy', 'cookies', 'data protection', 'privacy notice'
    ],
    optOut: [
        'reject', 'decline', 'opt out', 'cookie settings', 'manage cookies', 'customize'
    ]
}

function categorizeCookie(cookieName: string): 'necessary' | 'functional' | 'analytics' | 'marketing' | 'unknown' {
    const name = cookieName.toLowerCase()

    for (const [category, patterns] of Object.entries(COOKIE_PATTERNS)) {
        if (patterns.some(pattern => name.includes(pattern.toLowerCase()))) {
            return category as 'necessary' | 'functional' | 'analytics' | 'marketing'
        }
    }

    return 'unknown'
}

function checkGDPRCompliance(html: string, cookies: CookieInfo[]): ComplianceCheck {
    const htmlLower = html.toLowerCase()

    // Check for consent banner
    const hasConsentBanner = GDPR_INDICATORS.consentBanner.some(indicator =>
        htmlLower.includes(indicator)
    )

    // Check for cookie policy
    const hasCookiePolicy = GDPR_INDICATORS.cookiePolicy.some(indicator =>
        htmlLower.includes(indicator)
    )

    // Check for opt-out mechanism
    const hasOptOut = GDPR_INDICATORS.optOut.some(indicator =>
        htmlLower.includes(indicator)
    )

    // Check if cookies are categorized (basic heuristic)
    const categorizedCookies = cookies.some(cookie => cookie.category !== 'unknown')

    // Check if only necessary cookies are set without consent
    const hasNecessaryCookiesOnly = cookies.every(cookie =>
        cookie.category === 'necessary' || cookie.category === 'unknown'
    )

    // Calculate compliance score
    let score = 0
    if (hasConsentBanner) score += 30
    if (hasCookiePolicy) score += 25
    if (hasOptOut) score += 25
    if (categorizedCookies) score += 10
    if (hasNecessaryCookiesOnly) score += 10

    const gdprCompliant = score >= 80 && hasConsentBanner && hasCookiePolicy && hasOptOut

    return {
        hasConsentBanner,
        hasCookiePolicy,
        hasOptOut,
        categorizedCookies,
        hasNecessaryCookiesOnly,
        gdprCompliant,
        score
    }
}

function generateRecommendations(compliance: ComplianceCheck, cookies: CookieInfo[]): string[] {
    const recommendations: string[] = []

    if (!compliance.hasConsentBanner) {
        recommendations.push('Add a clear cookie consent banner that appears before cookies are set')
    }

    if (!compliance.hasCookiePolicy) {
        recommendations.push('Create and link to a comprehensive cookie policy explaining all cookies used')
    }

    if (!compliance.hasOptOut) {
        recommendations.push('Provide users with options to reject or customize cookie preferences')
    }

    if (!compliance.categorizedCookies) {
        recommendations.push('Categorize cookies (necessary, functional, analytics, marketing) for transparency')
    }

    // Check for insecure cookies
    const insecureCookies = cookies.filter(cookie => !cookie.secure && cookie.name.toLowerCase().includes('session'))
    if (insecureCookies.length > 0) {
        recommendations.push('Set the Secure flag on session and authentication cookies')
    }

    // Check for missing HttpOnly
    const missingHttpOnly = cookies.filter(cookie => !cookie.httpOnly && cookie.category === 'necessary')
    if (missingHttpOnly.length > 0) {
        recommendations.push('Set HttpOnly flag on session cookies to prevent XSS attacks')
    }

    // Check for marketing cookies without consent
    const marketingCookies = cookies.filter(cookie => cookie.category === 'marketing')
    if (marketingCookies.length > 0 && !compliance.hasConsentBanner) {
        recommendations.push('Marketing cookies should only be set after explicit user consent')
    }

    if (recommendations.length === 0) {
        recommendations.push('Great! Your website appears to be GDPR compliant.')
    }

    return recommendations
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            )
        }

        // Validate URL
        let targetUrl: URL
        try {
            targetUrl = new URL(url)
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            )
        }

        // Try to fetch the website with multiple strategies
        let response: Response
        let html: string

        try {
            // First attempt: Full browser-like headers
            response = await fetch(targetUrl.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0'
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            })
        } catch (firstError) {
            // Second attempt: Minimal headers
            try {
                response = await fetch(targetUrl.toString(), {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; CookieScanner/1.0)',
                        'Accept': 'text/html,*/*'
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(8000)
                })
            } catch (secondError) {
                // Third attempt: No custom headers
                response = await fetch(targetUrl.toString(), {
                    redirect: 'follow',
                    signal: AbortSignal.timeout(5000)
                })
            }
        }

        if (!response.ok) {
            // Handle specific HTTP errors more gracefully
            if (response.status === 403) {
                throw new Error(`Access denied (403). The website may be blocking automated requests.`)
            } else if (response.status === 404) {
                throw new Error(`Website not found (404). Please check the URL.`)
            } else if (response.status === 429) {
                throw new Error(`Rate limited (429). Please try again later.`)
            } else if (response.status >= 500) {
                throw new Error(`Server error (${response.status}). The website may be temporarily unavailable.`)
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
        }

        html = await response.text()

        // Extract cookies from Set-Cookie headers
        const cookies: CookieInfo[] = []
        const setCookieHeaders = response.headers.getSetCookie?.() || []

        setCookieHeaders.forEach(cookieHeader => {
            const parts = cookieHeader.split(';').map(part => part.trim())
            const [nameValue] = parts
            const [name, value] = nameValue.split('=')

            if (name && value) {
                const cookie: CookieInfo = {
                    name: name.trim(),
                    domain: targetUrl.hostname,
                    path: '/',
                    value: value.trim(),
                    httpOnly: parts.some(part => part.toLowerCase() === 'httponly'),
                    secure: parts.some(part => part.toLowerCase() === 'secure'),
                    sameSite: parts.find(part => part.toLowerCase().startsWith('samesite='))?.split('=')[1] || 'Lax'
                }

                // Extract expires
                const expiresMatch = parts.find(part => part.toLowerCase().startsWith('expires='))
                if (expiresMatch) {
                    cookie.expires = expiresMatch.split('=')[1]
                }

                // Extract max-age
                const maxAgeMatch = parts.find(part => part.toLowerCase().startsWith('max-age='))
                if (maxAgeMatch) {
                    cookie.maxAge = parseInt(maxAgeMatch.split('=')[1])
                }

                // Categorize cookie
                cookie.category = categorizeCookie(cookie.name)

                cookies.push(cookie)
            }
        })

        // Also check for common cookies mentioned in HTML/JS
        const commonCookieNames = [
            '_ga', '_gid', '_gat', '_gtag', '_fbp', '_fbc', 'PHPSESSID', 'JSESSIONID'
        ]

        commonCookieNames.forEach(cookieName => {
            if (html.includes(cookieName) && !cookies.some(c => c.name === cookieName)) {
                cookies.push({
                    name: cookieName,
                    domain: targetUrl.hostname,
                    path: '/',
                    value: 'detected-in-html',
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                    category: categorizeCookie(cookieName)
                })
            }
        })

        // Check GDPR compliance
        const compliance = checkGDPRCompliance(html, cookies)

        // Generate recommendations
        const recommendations = generateRecommendations(compliance, cookies)

        return NextResponse.json({
            url: targetUrl.toString(),
            cookies,
            compliance,
            recommendations,
            scan_date: new Date().toISOString()
        })

    } catch (error) {
        console.error('Cookie scan error:', error)

        // Provide more specific error messages and recommendations
        let errorMessage = 'Failed to scan website'
        let recommendations = ['Failed to scan website. Please check the URL and try again.']

        if (error instanceof Error) {
            errorMessage = error.message

            if (error.message.includes('403') || error.message.includes('Access denied')) {
                recommendations = [
                    'The website is blocking automated requests. This is common for security reasons.',
                    'Try visiting the website manually to check its cookie implementation.',
                    'Some websites require specific headers or authentication to access.',
                    'Consider using browser developer tools to inspect cookies directly.'
                ]
            } else if (error.message.includes('404')) {
                recommendations = [
                    'The URL appears to be incorrect or the website is not accessible.',
                    'Please verify the URL is correct and the website is online.',
                    'Make sure to include the protocol (http:// or https://).'
                ]
            } else if (error.message.includes('429')) {
                recommendations = [
                    'The website is rate limiting requests.',
                    'Please wait a few minutes before trying again.',
                    'Consider checking the website manually in the meantime.'
                ]
            } else if (error.message.includes('timeout')) {
                recommendations = [
                    'The website took too long to respond.',
                    'The website may be slow or temporarily unavailable.',
                    'Try again in a few minutes.'
                ]
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                url: '',
                cookies: [],
                compliance: {
                    hasConsentBanner: false,
                    hasCookiePolicy: false,
                    hasOptOut: false,
                    categorizedCookies: false,
                    hasNecessaryCookiesOnly: false,
                    gdprCompliant: false,
                    score: 0
                },
                recommendations,
                scan_date: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}