'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, FileText, Link, Loader2, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'

interface ScanResult {
    status: 'clean' | 'malicious' | 'suspicious' | 'unknown'
    positives: number
    total: number
    scan_date: string
    permalink?: string
    details?: any
}

export default function SecurityHub() {
    const [fileScanning, setFileScanning] = useState(false)
    const [urlScanning, setUrlScanning] = useState(false)
    const [fileScanResult, setFileScanResult] = useState<ScanResult | null>(null)
    const [urlScanResult, setUrlScanResult] = useState<ScanResult | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [urlToScan, setUrlToScan] = useState('')

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setFileScanResult(null)
        }
    }

    const scanFile = async () => {
        if (!selectedFile) return

        setFileScanning(true)
        setFileScanResult(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch('/api/security/scan-file', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to scan file')
            }

            const result = await response.json()
            setFileScanResult(result)
        } catch (error) {
            console.error('File scan error:', error)
            setFileScanResult({
                status: 'unknown',
                positives: 0,
                total: 0,
                scan_date: new Date().toISOString(),
                details: { error: 'Failed to scan file' }
            })
        } finally {
            setFileScanning(false)
        }
    }

    const scanUrl = async () => {
        if (!urlToScan.trim()) return

        setUrlScanning(true)
        setUrlScanResult(null)

        try {
            const response = await fetch('/api/security/scan-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: urlToScan }),
            })

            if (!response.ok) {
                throw new Error('Failed to scan URL')
            }

            const result = await response.json()
            setUrlScanResult(result)
        } catch (error) {
            console.error('URL scan error:', error)
            setUrlScanResult({
                status: 'unknown',
                positives: 0,
                total: 0,
                scan_date: new Date().toISOString(),
                details: { error: 'Failed to scan URL' }
            })
        } finally {
            setUrlScanning(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'clean':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'malicious':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'suspicious':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            default:
                return <AlertTriangle className="h-5 w-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'clean':
                return 'text-green-600 dark:text-green-400'
            case 'malicious':
                return 'text-red-600 dark:text-red-400'
            case 'suspicious':
                return 'text-yellow-600 dark:text-yellow-400'
            default:
                return 'text-gray-600 dark:text-gray-400'
        }
    }

    const renderScanResult = (result: ScanResult | null, type: 'file' | 'url') => {
        if (!result) return null

        return (
            <div className={`mt-4 p-4 rounded-lg border ${result.status === 'clean'
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : result.status === 'malicious'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : result.status === 'suspicious'
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.status)}
                    <span className={`font-semibold capitalize ${getStatusColor(result.status)}`}>
                        {result.status}
                    </span>
                </div>

                <div className="text-sm space-y-1">
                    <p>
                        <span className="font-medium">Detection:</span> {result.positives}/{result.total} engines flagged this {type}
                    </p>
                    <p>
                        <span className="font-medium">Scan Date:</span> {new Date(result.scan_date).toLocaleString()}
                    </p>
                    {result.permalink && (
                        <p>
                            <span className="font-medium">Report:</span>{' '}
                            <a
                                href={result.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                View full report
                            </a>
                        </p>
                    )}
                    {result.details?.error && (
                        <p className="text-red-600 dark:text-red-400">
                            <span className="font-medium">Error:</span> {result.details.error}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Tabs defaultValue="file-scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file-scanner" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Scanner
                </TabsTrigger>
                <TabsTrigger value="url-scanner" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    URL Scanner
                </TabsTrigger>
            </TabsList>

            <TabsContent value="file-scanner" className="space-y-6">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            File Scanner
                        </CardTitle>
                        <CardDescription>
                            Upload a file to scan for viruses and malware
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="file-upload">Select File</Label>
                            <Input
                                id="file-upload"
                                type="file"
                                onChange={handleFileUpload}
                                className="mt-1"
                                accept="*/*"
                            />
                            {selectedFile && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={scanFile}
                            disabled={!selectedFile || fileScanning}
                            className="w-full"
                        >
                            {fileScanning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                'Scan File'
                            )}
                        </Button>

                        {renderScanResult(fileScanResult, 'file')}

                        {/* File Safety Tips */}
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                File Safety Tips
                            </h4>
                            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                                <li>• Always scan files from unknown sources</li>
                                <li>• Be cautious with executable files (.exe, .bat, .scr)</li>
                                <li>• Keep your antivirus software updated</li>
                                <li>• Avoid opening suspicious email attachments</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="url-scanner" className="space-y-6">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link className="h-5 w-5" />
                            URL Scanner
                        </CardTitle>
                        <CardDescription>
                            Enter a URL to check for malicious content and threats
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="url-input">URL to Scan</Label>
                            <Input
                                id="url-input"
                                type="url"
                                placeholder="https://example.com"
                                value={urlToScan}
                                onChange={(e) => setUrlToScan(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <Button
                            onClick={scanUrl}
                            disabled={!urlToScan.trim() || urlScanning}
                            className="w-full"
                        >
                            {urlScanning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                'Scan URL'
                            )}
                        </Button>

                        {renderScanResult(urlScanResult, 'url')}

                        {/* URL Safety Tips */}
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                URL Safety Tips
                            </h4>
                            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                                <li>• Check URLs before clicking suspicious links</li>
                                <li>• Look for HTTPS encryption on sensitive sites</li>
                                <li>• Be wary of shortened URLs from unknown sources</li>
                                <li>• Verify website authenticity before entering credentials</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}