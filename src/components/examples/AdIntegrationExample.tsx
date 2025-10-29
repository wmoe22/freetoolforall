'use client'

import { ComprehensiveAds } from '@/components/ads'
import { useComprehensiveAds } from '@/hooks/useComprehensiveAds'
import { useEffect } from 'react'

export default function AdIntegrationExample() {
    const { createAdSlot, refreshAds } = useComprehensiveAds({
        autoLoad: true,
        refreshOnMount: true,
        injectAds: false // Set to true to auto-inject ads
    })

    useEffect(() => {
        // Create custom ad slots
        setTimeout(() => {
            try {
                createAdSlot('custom-ad-1', {
                    width: 300,
                    height: 250,
                    format: 'rectangle',
                    className: 'my-custom-ad'
                })
            } catch (error) {
                console.log('Ad slot creation failed:', error)
            }
        }, 2000)
    }, [createAdSlot])

    return (
        <div className="ad-integration-example space-y-6">
            <h2 className="text-2xl font-bold text-center">Comprehensive Ads Integration</h2>

            {/* Header Ad */}
            <div className="text-center">
                <h3 className="text-lg mb-2">Header Ad (Leaderboard)</h3>
                <ComprehensiveAds placement="header" />
            </div>

            {/* Content Ads */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg mb-2 text-center">Content Ad (Rectangle)</h3>
                    <ComprehensiveAds placement="content" />
                </div>

                <div>
                    <h3 className="text-lg mb-2 text-center">Multiple Ads</h3>
                    <ComprehensiveAds placement="content" showMultiple={true} />
                </div>
            </div>

            {/* Custom Ad Slot */}
            <div className="text-center">
                <h3 className="text-lg mb-2">Custom Ad Slot</h3>
                <div id="custom-ad-1" className="mx-auto"></div>
            </div>

            {/* Sidebar Ad */}
            <div className="text-center">
                <h3 className="text-lg mb-2">Sidebar Ad (Skyscraper)</h3>
                <ComprehensiveAds placement="sidebar" />
            </div>

            {/* Footer Ad */}
            <div className="text-center">
                <h3 className="text-lg mb-2">Footer Ad (Banner)</h3>
                <ComprehensiveAds placement="footer" />
            </div>

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={refreshAds}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Refresh Ads
                </button>
            </div>
        </div>
    )
}