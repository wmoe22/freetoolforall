'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle, FileText, Loader2, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'

interface ScanResult {
    status: 'clean' | 'malicious' | 'suspicious' | 'unknown'
    positives: number
    total: number
    scan_date: string
    permalink?: string
    file_hash?: {
        md5: string
        sha1: string
        sha256: string
    }
    file_info?: {
        name: string
        size: number
        type: string
        magic?: string
        type_description?: string
        type_tag?: string
    }
    stats?: {
        harmless: number
        malicious: number
        suspicious: number
        undetected: number
        timeout: number
    }
    scan_results?: Array<{
        engine: string
        category: string
        result: string | null
        method: string
        engine_name: string
        engine_version: string
        engine_update: string
    }>
    names?: string[]
    first_submission_date?: number
    last_submission_date?: number
    times_submitted?: number
    reputation?: number
    details?: any
}

export default function FileScanner() {
    const [fileScanning, setFileScanning] = useState(false)
    const [fileScanResult, setFileScanResult] = useState<ScanResult | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

    const renderScanResult = (result: ScanResult | null) => {
        if (!result) return null

        return (
            <div className="mt-4 space-y-4">
                {/* Main Status Card */}
                <Card className={`border-zinc-700 ${result.status === 'clean'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : result.status === 'malicious'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : result.status === 'suspicious'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20'
                            : 'bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            {getStatusIcon(result.status)}
                            <span className={`text-xl font-semibold capitalize ${getStatusColor(result.status)}`}>
                                {result.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium">Detection Rate</p>
                                <p>{result.positives}/{result.total} engines flagged this file</p>
                            </div>
                            <div>
                                <p className="font-medium">Scan Date</p>
                                <p>{new Date(result.scan_date).toLocaleString()}</p>
                            </div>
                            {result.reputation !== undefined && (
                                <div>
                                    <p className="font-medium">Reputation</p>
                                    <p className={result.reputation >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {result.reputation}
                                    </p>
                                </div>
                            )}
                            {result.times_submitted && (
                                <div>
                                    <p className="font-medium">Times Submitted</p>
                                    <p>{result.times_submitted}</p>
                                </div>
                            )}
                        </div>

                        {result.permalink && (
                            <div className="mt-4">
                                <a
                                    href={result.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    View Full VirusTotal Report
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* File Information */}
                {result.file_info && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">File Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="font-medium">Name</p>
                                    <p className="break-all">{result.file_info.name}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Size</p>
                                    <p>{(result.file_info.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div>
                                    <p className="font-medium">Type</p>
                                    <p>{result.file_info.type_description || result.file_info.type}</p>
                                </div>
                                {result.file_info.magic && (
                                    <div>
                                        <p className="font-medium">Magic</p>
                                        <p>{result.file_info.magic}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* File Hashes */}
                {result.file_hash && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">File Hashes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium">MD5</p>
                                <p className="font-mono text-xs break-all bg-zinc-900 p-2 rounded">{result.file_hash.md5}</p>
                            </div>
                            <div>
                                <p className="font-medium">SHA1</p>
                                <p className="font-mono text-xs break-all bg-zinc-900 p-2 rounded">{result.file_hash.sha1}</p>
                            </div>
                            <div>
                                <p className="font-medium">SHA256</p>
                                <p className="font-mono text-xs break-all bg-zinc-900 p-2 rounded">{result.file_hash.sha256}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Detection Statistics */}
                {result.stats && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Detection Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-500">{result.stats.malicious}</p>
                                    <p className="text-xs">Malicious</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-500">{result.stats.suspicious}</p>
                                    <p className="text-xs">Suspicious</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-500">{result.stats.harmless}</p>
                                    <p className="text-xs">Harmless</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-500">{result.stats.undetected}</p>
                                    <p className="text-xs">Undetected</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-400">{result.stats.timeout}</p>
                                    <p className="text-xs">Timeout</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Scan Results */}
                {result.scan_results && result.scan_results.length > 0 && (
                    <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Detailed Scan Results</CardTitle>
                            <CardDescription>
                                Results from {result.scan_results.length} antivirus engines
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {result.scan_results.map((scan, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-600">
                                        <div className="flex-1">
                                            <p className="font-medium">{scan.engine_name}</p>
                                            <p className="text-xs text-zinc-400">
                                                Version: {scan.engine_version} | Updated: {new Date(scan.engine_update).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${scan.category === 'malicious' ? 'bg-red-900 text-red-200' :
                                                scan.category === 'suspicious' ? 'bg-yellow-900 text-yellow-200' :
                                                    scan.category === 'harmless' ? 'bg-green-900 text-green-200' :
                                                        'bg-gray-900 text-gray-200'
                                                }`}>
                                                {scan.category}
                                            </div>
                                            {scan.result && scan.result !== 'null' && (
                                                <p className="text-xs text-zinc-400 mt-1">{scan.result}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {result.details?.error && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="pt-6">
                            <p className="text-red-600 dark:text-red-400">
                                <span className="font-medium">Error:</span> {result.details.error}
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
                    <FileText className="h-5 w-5" />
                    File Scanner
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    Upload a file to scan for viruses and malware
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="file-upload" className="text-zinc-700 dark:text-zinc-300">Select File</Label>
                    <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        className="mt-1 border-zinc-700 bg-zinc-800"
                        accept="*/*"
                    />
                    {selectedFile && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
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
                            Performing Full Scan...
                        </>
                    ) : (
                        'Start Full Security Scan'
                    )}
                </Button>

                {fileScanning && (
                    <div className="text-center text-sm text-zinc-400">
                        <p>This may take several minutes for a comprehensive analysis...</p>
                    </div>
                )}

                {renderScanResult(fileScanResult)}

                {/* File Safety Tips */}
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-lg border border-zinc-700">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
                        <Shield className="h-4 w-4" />
                        File Safety Tips
                    </h4>
                    <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        <li>• Always scan files from unknown sources</li>
                        <li>• Be cautious with executable files (.exe, .bat, .scr)</li>
                        <li>• Keep your antivirus software updated</li>
                        <li>• Avoid opening suspicious email attachments</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}