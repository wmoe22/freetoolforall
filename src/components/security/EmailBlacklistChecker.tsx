'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, Globe, Info, Loader2, Mail, Server, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'

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
    error?: string
}

export default function EmailBlacklistChecker() {
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [inputValue, setInputValue] = useState('')
    const [activeTab, setActiveTab] = useState('domain')

    const scanTarget = async () => {
        if (!inputValue.trim()) return

        setScanning(true)
        setScanResult(null)

        try {
            const response = await fetch('/api/security/scan-blacklist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target: inputValue.trim(),
                    type: activeTab
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to scan target')
            }

            const result = await response.json()
            setScanResult(result)
        } catch (error) {
            console.error('Blacklist scan error:', error)
            setScanResult({
                target: inputValue.trim(),
                type: activeTab as 'domain' | 'ip',
                blacklists: [],
                summary: {
                    total_checked: 0,
                    total_listed: 0,
                    reputation_score: 0,
                    risk_level: 'high'
                },
                scan_date: new Date().toISOString(),
                error: 'Failed to scan target. Please check the input and try again.'
            })
        } finally {
            setScanning(false)
        }
    }

    const getStatusIcon = (listed: boolean) => {
        return listed ?
            <XCircle className="h-4 w-4 text-red-500" /> :
            <CheckCircle className="h-4 w-4 text-green-500" />
    }

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'low':
                return 'text-green-600 dark:text-green-400'
            case 'medium':
                return 'text-yellow-600 dark:text-yellow-400'
            case 'high':
                return 'text-red-600 dark:text-red-400'
            default:
                return 'text-gray-600 dark:text-gray-400'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const renderScanResult = (result: ScanResult | null) => {
        if (!result) return null

        return (
            <div className="mt-4 space-y-4">
                {/* Summary Card */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            {result.type === 'domain' ? <Globe className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                            Blacklist Scan Results
                        </CardTitle>
                        <CardDescription>
                            Scanned {result.target} ({result.type})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{result.summary.total_checked}</div>
                                <p className="text-sm text-zinc-400">Lists Checked</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${result.summary.total_listed > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {result.summary.total_listed}
                                </div>
                                <p className="text-sm text-zinc-400">Blacklisted</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(result.summary.reputation_score)}`}>
                                    {result.summary.reputation_score}%
                                </div>
                                <p className="text-sm text-zinc-400">Reputation</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold capitalize ${getRiskColor(result.summary.risk_level)}`}>
                                    {result.summary.risk_level}
                                </div>
                                <p className="text-sm text-zinc-400">Risk Level</p>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-zinc-400">
                                Scanned on {new Date(result.scan_date).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Results */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Blacklist Details</CardTitle>
                        <CardDescription>
                            Results from {result.blacklists.length} blacklist sources
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result.blacklists.length === 0 ? (
                            <p className="text-zinc-400 text-center py-4">No blacklist data available</p>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {result.blacklists.map((blacklist, index) => (
                                    <div key={index} className={`p-3 rounded border ${blacklist.listed
                                            ? 'bg-red-900/20 border-red-800'
                                            : 'bg-zinc-900 border-zinc-600'
                                        }`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getStatusIcon(blacklist.listed)}
                                                    <p className="font-medium">{blacklist.source}</p>
                                                </div>
                                                {blacklist.details && (
                                                    <p className="text-sm text-zinc-400">{blacklist.details}</p>
                                                )}
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${blacklist.listed
                                                    ? 'bg-red-900 text-red-200'
                                                    : 'bg-green-900 text-green-200'
                                                }`}>
                                                {blacklist.listed ? 'Listed' : 'Clean'}
                                            </div>
                                        </div>

                                        {blacklist.reason && (
                                            <div className="text-sm">
                                                <span className="font-medium text-red-400">Reason:</span> {blacklist.reason}
                                            </div>
                                        )}

                                        {blacklist.last_seen && (
                                            <div className="text-xs text-zinc-500 mt-1">
                                                Last seen: {new Date(blacklist.last_seen).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recommendations */}
                {result.summary.total_listed > 0 && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    <span>Contact the blacklist providers to request delisting</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    <span>Review and improve email sending practices</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    <span>Implement proper SPF, DKIM, and DMARC records</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    <span>Monitor email reputation regularly</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {result.error && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="pt-6">
                            <p className="text-red-600 dark:text-red-400">
                                <span className="font-medium">Error:</span> {result.error}
                            </p>
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
                    <Mail className="h-5 w-5" />
                    Email Blacklist Checker
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    Check if a domain or IP address is listed on email blacklists
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-700">
                        <TabsTrigger value="domain" className="data-[state=active]:bg-zinc-700">
                            <Globe className="h-4 w-4 mr-2" />
                            Domain
                        </TabsTrigger>
                        <TabsTrigger value="ip" className="data-[state=active]:bg-zinc-700">
                            <Server className="h-4 w-4 mr-2" />
                            IP Address
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="domain" className="space-y-4">
                        <div>
                            <Label htmlFor="domain-input" className="text-zinc-700 dark:text-zinc-300">Domain Name</Label>
                            <Input
                                id="domain-input"
                                type="text"
                                placeholder="example.com"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="mt-1 border-zinc-700 bg-zinc-800"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="ip" className="space-y-4">
                        <div>
                            <Label htmlFor="ip-input" className="text-zinc-700 dark:text-zinc-300">IP Address</Label>
                            <Input
                                id="ip-input"
                                type="text"
                                placeholder="192.168.1.1"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="mt-1 border-zinc-700 bg-zinc-800"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <Button
                    onClick={scanTarget}
                    disabled={!inputValue.trim() || scanning}
                    className="w-full"
                >
                    {scanning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking Blacklists...
                        </>
                    ) : (
                        `Check ${activeTab === 'domain' ? 'Domain' : 'IP'} Reputation`
                    )}
                </Button>

                {scanning && (
                    <div className="text-center text-sm text-zinc-400">
                        <p>Checking against multiple blacklist databases...</p>
                    </div>
                )}

                {renderScanResult(scanResult)}

                {/* Email Reputation Tips */}
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-lg border border-zinc-700">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
                        <Shield className="h-4 w-4" />
                        Email Reputation Tips
                    </h4>
                    <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        <li>• Maintain good sending practices and avoid spam complaints</li>
                        <li>• Set up proper SPF, DKIM, and DMARC authentication</li>
                        <li>• Monitor your domain and IP reputation regularly</li>
                        <li>• Use dedicated IPs for high-volume email sending</li>
                        <li>• Implement proper list hygiene and unsubscribe processes</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}