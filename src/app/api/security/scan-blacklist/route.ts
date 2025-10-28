import { NextRequest, NextResponse } from 'next/server'

interface BlacklistResult {
    source: string
    listed: boolean
    details?: string
    last_seen?: string
    reason?: string
}

interface ScanResult {
    target: string
    type: 'domain' | 'ip'
    blacklists: BlacklistResult[]
    summary: {
        total_checked: number
        total_listed: number
        reputation_score: number
        risk_level: 'low' | 'medium' | 'high'
    }
    scan_date: string
}

// Common blacklist sources for checking
const BLACKLIST_SOURCES = [
    {
        name: 'Spamhaus SBL',
        description: 'Spamhaus Block List',
        checkDomain: true,
        checkIP: true
    },
    {
        name: 'Spamhaus CSS',
        description: 'Spamhaus CSS List',
        checkDomain: true,
        checkIP: true
    },
    {
        name: 'SURBL',
        description: 'Spam URI Realtime Blocklists',
        checkDomain: true,
        checkIP: false
    },
    {
        name: 'URIBL',
        description: 'URI Blacklist',
        checkDomain: true,
        checkIP: false
    },
    {
        name: 'Barracuda',
        description: 'Barracuda Reputation Block List',
        checkDomain: true,
        checkIP: true
    },
    {
        name: 'SpamCop',
        description: 'SpamCop Blocking List',
        checkDomain: false,
        checkIP: true
    },
    {
        name: 'SORBS',
        description: 'Spam and Open Relay Blocking System',
        checkDomain: false,
        checkIP: true
    },
    {
        name: 'Composite Blocking List',
        description: 'CBL - Composite Blocking List',
        checkDomain: false,
        checkIP: true
    },
    {
        name: 'Passive Spam Block List',
        description: 'PSBL - Passive Spam Block List',
        checkDomain: false,
        checkIP: true
    },
    {
        name: 'DNSWL',
        description: 'DNS Whitelist (inverted check)',
        checkDomain: true,
        checkIP: true
    }
]

function isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return domainRegex.test(domain) && domain.length <= 253
}

function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Simulate blacklist checking (in a real implementation, you would query actual DNS blacklists)
async function checkBlacklist(target: string, type: 'domain' | 'ip', source: any): Promise<BlacklistResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))

    // Filter sources based on type
    if ((type === 'domain' && !source.checkDomain) || (type === 'ip' && !source.checkIP)) {
        return {
            source: source.name,
            listed: false,
            details: `${source.description} - Not applicable for ${type}`
        }
    }

    // Simulate some realistic results based on common patterns
    let listed = false
    let reason = ''

    // Simulate some domains/IPs being listed
    if (target.includes('spam') || target.includes('malware') || target.includes('phishing')) {
        listed = Math.random() > 0.3 // 70% chance of being listed for suspicious names
        reason = 'Detected suspicious activity'
    } else if (target.includes('test') || target.includes('example')) {
        listed = Math.random() > 0.8 // 20% chance for test domains
        reason = 'Test domain flagged'
    } else {
        listed = Math.random() > 0.9 // 10% chance for normal domains/IPs
        reason = listed ? 'Previous spam reports' : ''
    }

    // Special cases for demonstration
    if (target === '127.0.0.1' || target === 'localhost') {
        listed = false
    }

    return {
        source: source.name,
        listed,
        details: source.description,
        reason: listed ? reason : undefined,
        last_seen: listed ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    }
}

function calculateReputation(blacklists: BlacklistResult[]): { score: number; riskLevel: 'low' | 'medium' | 'high' } {
    const totalChecked = blacklists.filter(bl => bl.source !== 'N/A').length
    const totalListed = blacklists.filter(bl => bl.listed).length

    if (totalChecked === 0) {
        return { score: 0, riskLevel: 'high' }
    }

    const score = Math.round(((totalChecked - totalListed) / totalChecked) * 100)

    let riskLevel: 'low' | 'medium' | 'high'
    if (score >= 90) {
        riskLevel = 'low'
    } else if (score >= 70) {
        riskLevel = 'medium'
    } else {
        riskLevel = 'high'
    }

    return { score, riskLevel }
}

export async function POST(request: NextRequest) {
    try {
        const { target, type } = await request.json()

        if (!target || !type) {
            return NextResponse.json(
                { error: 'Target and type are required' },
                { status: 400 }
            )
        }

        if (type !== 'domain' && type !== 'ip') {
            return NextResponse.json(
                { error: 'Type must be either "domain" or "ip"' },
                { status: 400 }
            )
        }

        // Validate input based on type
        const cleanTarget = target.trim().toLowerCase()

        if (type === 'domain') {
            if (!isValidDomain(cleanTarget)) {
                return NextResponse.json(
                    { error: 'Invalid domain format' },
                    { status: 400 }
                )
            }
        } else if (type === 'ip') {
            if (!isValidIP(cleanTarget)) {
                return NextResponse.json(
                    { error: 'Invalid IP address format' },
                    { status: 400 }
                )
            }
        }

        // Check against all applicable blacklists
        const blacklistPromises = BLACKLIST_SOURCES.map(source =>
            checkBlacklist(cleanTarget, type, source)
        )

        const blacklists = await Promise.all(blacklistPromises)

        // Calculate reputation and risk
        const { score, riskLevel } = calculateReputation(blacklists)

        const result: ScanResult = {
            target: cleanTarget,
            type,
            blacklists,
            summary: {
                total_checked: blacklists.filter(bl => bl.source !== 'N/A').length,
                total_listed: blacklists.filter(bl => bl.listed).length,
                reputation_score: score,
                risk_level: riskLevel
            },
            scan_date: new Date().toISOString()
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('Blacklist scan error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to scan target',
                target: '',
                type: 'domain' as const,
                blacklists: [],
                summary: {
                    total_checked: 0,
                    total_listed: 0,
                    reputation_score: 0,
                    risk_level: 'high' as const
                },
                scan_date: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}