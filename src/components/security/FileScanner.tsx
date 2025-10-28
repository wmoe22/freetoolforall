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
            <div className={`mt-4 p-4 rounded-lg border border-zinc-700 ${result.status === 'clean'
                ? 'bg-green-50 dark:bg-green-900/20'
                : result.status === 'malicious'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : result.status === 'suspicious'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'bg-gray-50 dark:bg-gray-900/20'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.status)}
                    <span className={`font-semibold capitalize ${getStatusColor(result.status)}`}>
                        {result.status}
                    </span>
                </div>

                <div className="text-sm space-y-1">
                    <p>
                        <span className="font-medium">Detection:</span> {result.positives}/{result.total} engines flagged this file
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
                            Scanning...
                        </>
                    ) : (
                        'Scan File'
                    )}
                </Button>

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