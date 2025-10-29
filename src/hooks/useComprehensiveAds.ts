'use client'

import { comprehensiveAds } from '@/lib/comprehensive-ads'
import { useEffect, useRef } from 'react'

interface UseComprehensiveAdsOptions {
    autoLoad?: boolean
    refreshOnMount?: boolean
    injectAds?: boolean
}

export function useComprehensiveAds(options: UseComprehensiveAdsOptions = {}) {
    const {
        autoLoad = true,
        refreshOnMount = false,
        injectAds = false
    } = options

    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current && autoLoad) {
            initialized.current = true

            // Load all comprehensive ads scripts
            comprehensiveAds.loadAllScripts()

            if (refreshOnMount) {
                // Refresh ads after a short delay
                setTimeout(() => {
                    comprehensiveAds.refreshAds()
                }, 1000)
            }

            if (injectAds) {
                // Auto-inject ads into common page locations
                setTimeout(() => {
                    comprehensiveAds.injectAdsIntoPage()
                }, 1500)
            }
        }
    }, [autoLoad, refreshOnMount, injectAds])

    const createAdSlot = (containerId: string, options?: {
        width?: number
        height?: number
        format?: string
        className?: string
    }) => {
        return comprehensiveAds.createAdSlot(containerId, options)
    }

    const refreshAds = () => {
        comprehensiveAds.refreshAds()
    }

    return {
        createAdSlot,
        refreshAds,
        comprehensiveAds
    }
}