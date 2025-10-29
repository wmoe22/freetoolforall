'use client'

import { useEffect, useRef } from 'react'

interface AdContainerProps {
    adId?: string
    className?: string
    style?: React.CSSProperties
    width?: number | string
    height?: number | string
    format?: 'banner' | 'rectangle' | 'leaderboard' | 'skyscraper' | 'square'
}

export default function AdContainer({
    adId,
    className = '',
    style = {},
    width,
    height,
    format = 'banner'
}: AdContainerProps) {
    const adRef = useRef<HTMLDivElement>(null)

    // Default dimensions based on format
    const getDefaultDimensions = () => {
        switch (format) {
            case 'banner':
                return { width: 728, height: 90 }
            case 'rectangle':
                return { width: 300, height: 250 }
            case 'leaderboard':
                return { width: 970, height: 90 }
            case 'skyscraper':
                return { width: 160, height: 600 }
            case 'square':
                return { width: 250, height: 250 }
            default:
                return { width: 300, height: 250 }
        }
    }

    const defaultDimensions = getDefaultDimensions()
    const finalWidth = width || defaultDimensions.width
    const finalHeight = height || defaultDimensions.height

    useEffect(() => {
        // Initialize ads when component mounts
        if (typeof window !== 'undefined' && adRef.current) {
            // Try to trigger ad loading
            try {
                // Check if comprehensiveimplementationstrode scripts are loaded
                if ((window as any).atOptions) {
                    // Trigger ad refresh/load
                    const script = document.createElement('script')
                    script.type = 'text/javascript'
                    script.src = '//comprehensiveimplementationstrode.com/invoke.js'
                    script.async = true
                    script.setAttribute('data-cfasync', 'false')
                    adRef.current.appendChild(script)
                }
            } catch (error) {
                console.log('Ad loading error:', error)
            }
        }
    }, [adId])

    return (
        <div
            ref={adRef}
            className={`ad-container ${className}`}
            style={{
                width: finalWidth,
                height: finalHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                borderRadius: '4px',
                overflow: 'hidden',
                ...style
            }}
            data-ad-format={format}
            data-ad-id={adId}
        >
            {/* Ad content will be injected here by the ad scripts */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    minWidth: finalWidth,
                    minHeight: finalHeight
                }}
                id={adId ? `ad-${adId}` : undefined}
            />
        </div>
    )
}