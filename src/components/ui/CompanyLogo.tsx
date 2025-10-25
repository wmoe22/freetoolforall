'use client'

import Image from 'next/image'

const LOGO_DEV_PUBLIC_KEY = process.env.NEXT_PUBLIC_LOGO_DEV_KEY || 'pk_Ff2Q2QZCQoSbmwmtC6enAQ'

interface CompanyLogoProps {
    domain: string
    width?: number
    height?: number
    className?: string
    alt?: string
}

export default function CompanyLogo({
    domain,
    width = 32,
    height = 32,
    className = '',
    alt = 'Company logo'
}: CompanyLogoProps) {
    return (
        <Image
            src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onError={(e) => {
                // Fallback to a generic icon if logo fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
            }}
        />
    )
}