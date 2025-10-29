'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AdTestComponent() {
    const [adBlockerDetected, setAdBlockerDetected] = useState<boolean | null>(null)
    const [scriptLoadTest, setScriptLoadTest] = useState<boolean | null>(null)
    const [frameTest, setFrameTest] = useState<boolean | null>(null)

    useEffect(() => {
        // Test 1: Ad blocker detection
        const testAdBlocker = () => {
            const testAd = document.createElement('div')
            testAd.innerHTML = '&nbsp;'
            testAd.className = 'adsbox'
            testAd.style.position = 'absolute'
            testAd.style.left = '-10000px'
            document.body.appendChild(testAd)

            setTimeout(() => {
                const isBlocked = testAd.offsetHeight === 0
                setAdBlockerDetected(isBlocked)
                document.body.removeChild(testAd)
            }, 100)
        }

        // Test 2: External script loading
        const testScriptLoading = () => {
            const script = document.createElement('script')
            script.src = 'https://www.googletagmanager.com/gtag/js?id=test'
            script.onload = () => setScriptLoadTest(true)
            script.onerror = () => setScriptLoadTest(false)
            document.head.appendChild(script)
        }

        // Test 3: Frame loading capability
        const testFrameLoading = () => {
            try {
                const frame = document.createElement('iframe')
                frame.src = 'about:blank'
                frame.style.display = 'none'
                document.body.appendChild(frame)
                setTimeout(() => {
                    setFrameTest(true)
                    document.body.removeChild(frame)
                }, 100)
            } catch (error) {
                setFrameTest(false)
            }
        }

        testAdBlocker()
        testScriptLoading()
        testFrameLoading()
    }, [])

    const getStatusIcon = (status: boolean | null) => {
        if (status === null) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
        return status ?
            <CheckCircle className="h-5 w-5 text-green-500" /> :
            <XCircle className="h-5 w-5 text-red-500" />
    }

    const getStatusText = (status: boolean | null, passText: string, failText: string) => {
        if (status === null) return 'Testing...'
        return status ? passText : failText
    }

    return (
        <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Ad Compatibility Test
                </CardTitle>
                <CardDescription>
                    Check if your website configuration allows ads to load properly
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-600">
                        {getStatusIcon(!adBlockerDetected)}
                        <div>
                            <p className="font-medium">Ad Blocker Detection</p>
                            <p className="text-sm text-zinc-400">
                                {getStatusText(!adBlockerDetected, 'No ad blocker detected', 'Ad blocker detected')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-600">
                        {getStatusIcon(scriptLoadTest)}
                        <div>
                            <p className="font-medium">External Script Loading</p>
                            <p className="text-sm text-zinc-400">
                                {getStatusText(scriptLoadTest, 'External scripts can load', 'External scripts blocked')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded border border-zinc-600">
                        {getStatusIcon(frameTest)}
                        <div>
                            <p className="font-medium">Frame/Iframe Support</p>
                            <p className="text-sm text-zinc-400">
                                {getStatusText(frameTest, 'Frames can be created', 'Frame creation blocked')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-zinc-900/20 rounded-lg border border-zinc-700">
                    <h4 className="font-semibold mb-2 text-zinc-900 dark:text-white">
                        Ad-Friendly Configuration Status
                    </h4>
                    <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Content Security Policy (CSP) disabled
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            X-Frame-Options header disabled
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            External script loading allowed
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Iframe embedding allowed
                        </li>
                    </ul>
                </div>

                {adBlockerDetected && (
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-700">
                        <p className="text-red-400 text-sm">
                            <strong>Note:</strong> An ad blocker is detected. This may prevent ads from displaying even with proper configuration.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}