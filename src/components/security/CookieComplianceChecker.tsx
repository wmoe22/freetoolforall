'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle, Cookie, Info, Loader2, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'

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

interface ScanResult {
    url: string
    cookies: CookieInfo[]
    compliance: ComplianceCheck
    recommendations: string[]
    scan_date: string
    error?: string
}

export default function CookieComplianceChecker() {
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [urlToScan, setUrlToScan] = useState('')

    const scanWebsite = async () => {
        if (!urlToScan.trim()) return

        setScanning(true)
        setScanResult(null)

        try {
            const response = await fetch('/api/security/scan-cookies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: urlToScan }),
            })

            if (!response.ok) {
                throw new Error('Failed to scan website')
            }

            const result = await response.json()
            setScanResult(result)
        } catch (error) {
            console.error('Cookie scan error:', error)
            setScanResult({
                url: urlToScan,
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
                recommendations: ['Failed to scan website. Please check the URL and try again.'],
                scan_date: new Date().toISOString(),
                error: 'Failed to scan website'
            })
        } finally {
            setScanning(false)
        }
    }

    const getComplianceIcon = (compliant: boolean) => {
        return compliant ?
            <CheckCircle className="h-5 w-5 text-green-500" /> :
            <XCircle className="h-5 w-5 text-red-500" />
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'necessary':
                return 'bg-green-900 text-green-200'
            case 'functional':
                return 'bg-blue-900 text-blue-200'
            case 'analytics':
                return 'bg-yellow-900 text-yellow-200'
            case 'marketing':
                return 'bg-red-900 text-red-200'
            default:
                return 'bg-gray-900 text-gray-200'
        }
    }

    const renderScanResult = (result: ScanResult | null) => {
        if (!result) return null

        return (
            <div className="mt-4 space-y-4">
                {/* Compliance Score Card */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <Cookie className="h-5 w-5" />
                            GDPR Compliance Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center mb-4">
                            <div className={`text-4xl font-bold ${getScoreColor(result.compliance.score)}`}>
                                {result.compliance.score}%
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">
                                {result.compliance.gdprCompliant ? 'GDPR Compliant' : 'Non-Compliant'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                {getComplianceIcon(result.compliance.hasConsentBanner)}
                                <span>Consent Banner</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getComplianceIcon(result.compliance.hasCookiePolicy)}
                                <span>Cookie Policy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getComplianceIcon(result.compliance.hasOptOut)}
                                <span>Opt-out Mechanism</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getComplianceIcon(result.compliance.categorizedCookies)}
                                <span>Categorized Cookies</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cookies Found */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Cookies Detected ({result.cookies.length})</CardTitle>
                        <CardDescription>
                            All cookies found on the website
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result.cookies.length === 0 ? (
                            <p className="text-zinc-400 text-center py-4">No cookies detected</p>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {result.cookies.map((cookie, index) => (
                                    <div key={index} className="p-3 bg-zinc-900 rounded border border-zinc-600">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{cookie.name}</p>
                                                <p className="text-xs text-zinc-400">{cookie.domain}</p>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(cookie.category || 'unknown')}`}>
                                                {cookie.category || 'unknown'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-zinc-400">
                                            <div>
                                                <span className="font-medium">Secure:</span> {cookie.secure ? 'Yes' : 'No'}
                                            </div>
                                            <div>
                                                <span className="font-medium">HttpOnly:</span> {cookie.httpOnly ? 'Yes' : 'No'}
                                            </div>
                                            <div>
                                                <span className="font-medium">SameSite:</span> {cookie.sameSite || 'None'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Expires:</span> {cookie.expires ? new Date(cookie.expires).toLocaleDateString() : 'Session'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.recommendations.map((recommendation, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                        <span>{recommendation}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {result.error && (
                    <Card className="bg-zinc-800 border-red-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-red-400">
                                <XCircle className="h-5 w-5" />
                                Scan Failed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-400 mb-3">
                                <span className="font-medium">Error:</span> {result.error}
                            </p>
                            {result.recommendations.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-zinc-300 mb-2">What you can try:</p>
                                    <ul className="space-y-1 text-sm text-zinc-400">
                                        {result.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-zinc-500">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Cookie className="h-5 w-5" />
                    GDPR Cookie Compliance Checker
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    Analyze a website's cookie implementation for GDPR compliance
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="url-input" className="text-zinc-700 dark:text-zinc-300">Website URL</Label>
                    <Input
                        id="url-input"
                        type="url"
                        placeholder="https://example.com"
                        value={urlToScan}
                        onChange={(e) => setUrlToScan(e.target.value)}
                        className="mt-1 border-zinc-700 bg-zinc-800"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={scanWebsite}
                        disabled={!urlToScan.trim() || scanning}
                        className="flex-1"
                    >
                        {scanning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing Cookies...
                            </>
                        ) : (
                            'Check GDPR Compliance'
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setUrlToScan('https://httpbin.org/cookies/set/test/value')}
                        disabled={scanning}
                        className="px-3"
                        title="Test with a simple endpoint"
                    >
                        Test
                    </Button>
                </div>

                {scanning && (
                    <div className="text-center text-sm text-zinc-400">
                        <p>Analyzing website cookies and compliance features...</p>
                    </div>
                )}

                {renderScanResult(scanResult)}

                {/* GDPR Compliance Tips */}
                <div className="mt-6 space-y-4">
                    <div className="p-4 bg-zinc-900/20 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Shield className="h-4 w-4" />
                            GDPR Compliance Tips
                        </h4>
                        <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                            <li>• Obtain explicit consent before setting non-essential cookies</li>
                            <li>• Provide clear cookie categorization and descriptions</li>
                            <li>• Allow users to withdraw consent easily</li>
                            <li>• Maintain accessible cookie policy and privacy notice</li>
                            <li>• Use secure and HttpOnly flags for sensitive cookies</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-zinc-900/20 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Info className="h-4 w-4" />
                            Scanner Limitations
                        </h4>
                        <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                            <li>• Some websites block automated requests for security</li>
                            <li>• Dynamic cookies set by JavaScript may not be detected</li>
                            <li>• Results are based on initial page load only</li>
                            <li>• Manual inspection may be needed for complete analysis</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}