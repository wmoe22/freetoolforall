'use client'

import { useEffect } from 'react'
import AdContainer from './AdContainer'

interface ComprehensiveAdsProps {
    placement?: 'header' | 'sidebar' | 'footer' | 'content' | 'popup'
    showMultiple?: boolean
}

export default function ComprehensiveAds({
    placement = 'content',
    showMultiple = false
}: ComprehensiveAdsProps) {

    useEffect(() => {
        // Ensure all comprehensiveimplementationstrode scripts are loaded
        const loadAdScripts = () => {
            const scripts = [
                '//comprehensiveimplementationstrode.com/2b58113fcb3b44d4d69b7b220984a81f/invoke.js',
                '//comprehensiveimplementationstrode.com/8250dc77e079516ac855643826e93e7d/invoke.js',
                '//comprehensiveimplementationstrode.com/5f5974a83798aa28cd290cbee513c6e2/invoke.js',
                '//comprehensiveimplementationstrode.com/782ab596c62dc6dc9cbd9e788cf492d5/invoke.js',
                '//comprehensiveimplementationstrode.com/d7335c49fed82ef151c040dd10690d7e/invoke.js'
            ]

            scripts.forEach((src, index) => {
                setTimeout(() => {
                    const script = document.createElement('script')
                    script.type = 'text/javascript'
                    script.src = src
                    script.async = true
                    script.setAttribute('data-cfasync', 'false')
                    document.head.appendChild(script)
                }, index * 100) // Stagger loading
            })
        }

        // Load scripts after a short delay to ensure DOM is ready
        const timer = setTimeout(loadAdScripts, 500)
        return () => clearTimeout(timer)
    }, [])

    const getAdConfiguration = () => {
        switch (placement) {
            case 'header':
                return {
                    format: 'leaderboard' as const,
                    width: 970,
                    height: 90,
                    className: 'mx-auto mb-4'
                }
            case 'sidebar':
                return {
                    format: 'skyscraper' as const,
                    width: 160,
                    height: 600,
                    className: 'sticky top-4'
                }
            case 'footer':
                return {
                    format: 'banner' as const,
                    width: 728,
                    height: 90,
                    className: 'mx-auto mt-4'
                }
            case 'popup':
                return {
                    format: 'rectangle' as const,
                    width: 300,
                    height: 250,
                    className: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
                }
            default:
                return {
                    format: 'rectangle' as const,
                    width: 300,
                    height: 250,
                    className: 'mx-auto my-4'
                }
        }
    }

    const adConfig = getAdConfiguration()

    return (
        <div className={`comprehensive-ads-${placement}`}>
            <AdContainer
                adId={`comprehensive-${placement}-1`}
                format={adConfig.format}
                width={adConfig.width}
                height={adConfig.height}
                className={adConfig.className}
            />

            {showMultiple && (
                <>
                    <AdContainer
                        adId={`comprehensive-${placement}-2`}
                        format="rectangle"
                        className="mx-auto my-4"
                    />
                    <AdContainer
                        adId={`comprehensive-${placement}-3`}
                        format="banner"
                        className="mx-auto my-4"
                    />
                </>
            )}

            {/* Additional ad slots for maximum coverage */}
            <div
                className="ad-slot-comprehensive"
                style={{
                    width: '100%',
                    minHeight: '90px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '10px 0'
                }}
            >
                {/* This div will be populated by comprehensiveimplementationstrode scripts */}
            </div>
        </div>
    )
}