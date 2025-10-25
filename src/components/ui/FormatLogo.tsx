'use client'

import Image from 'next/image'

const LOGO_DEV_PUBLIC_KEY = process.env.NEXT_PUBLIC_LOGO_DEV_KEY || 'pk_Ff2Q2QZCQoSbmwmtC6enAQ'

interface FormatLogoProps {
    format: string
    width?: number
    height?: number
    className?: string
}

// Map file formats to company domains for logo.dev
const formatDomainMap: Record<string, string> = {
    pdf: 'adobe.com',
    docx: 'microsoft.com',
    xlsx: 'microsoft.com',
    txt: 'notepad-plus-plus.org',
    html: 'w3.org',
    csv: 'microsoft.com'
}

// Fallback icons for formats that don't have good logos
const formatFallbackMap: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    xlsx: '📊',
    txt: '📃',
    html: '🌐',
    csv: '📋'
}

export default function FormatLogo({
    format,
    width = 24,
    height = 24,
    className = ''
}: FormatLogoProps) {
    const domain = formatDomainMap[format.toLowerCase()]
    const fallbackIcon = formatFallbackMap[format.toLowerCase()] || '📄'

    if (!domain) {
        return (
            <span className={`text-lg ${className}`} style={{ fontSize: `${Math.min(width, height)}px` }}>
                {fallbackIcon}
            </span>
        )
    }

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            <Image
                src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`}
                alt={`${format.toUpperCase()} logo`}
                width={width}
                height={height}
                className="object-contain"
                onError={(e) => {
                    // Replace with fallback emoji if logo fails to load
                    const target = e.target as HTMLImageElement
                    const parent = target.parentElement
                    if (parent) {
                        parent.innerHTML = `<span class="text-lg" style="font-size: ${Math.min(width, height)}px">${fallbackIcon}</span>`
                    }
                }}
            />
        </div>
    )
}