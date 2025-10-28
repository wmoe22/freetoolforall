'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FormatLogo from '@/components/ui/FormatLogo'
import { Input } from '@/components/ui/input'
import { DocumentConverter, PDFProcessor } from '@/lib/pdf-utils'
import { ArrowRight, Download, FileText, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function FileConverterTab() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [targetFormat, setTargetFormat] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)

    const supportedFormats = [
        { value: 'pdf', label: 'PDF' },
        { value: 'docx', label: 'Word (DOCX)' },
        { value: 'xlsx', label: 'Excel (XLSX)' },
        { value: 'txt', label: 'Text' },
        { value: 'html', label: 'HTML' },
        { value: 'csv', label: 'CSV' }
    ]

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleConvert = async () => {
        if (!selectedFile || !targetFormat) return

        setIsConverting(true)
        try {
            let convertedBlob: Blob

            // Handle specific conversions
            if (selectedFile.type === 'text/plain' && targetFormat === 'pdf') {
                convertedBlob = await DocumentConverter.textToPDF(selectedFile)
            } else {
                convertedBlob = await PDFProcessor.convertDocument(selectedFile, targetFormat)
            }

            const filename = `${selectedFile.name.split('.')[0]}.${targetFormat}`
            PDFProcessor.downloadBlob(convertedBlob, filename)
            toast.success(`Successfully converted to ${targetFormat.toUpperCase()}`)
        } catch (error) {
            console.error('Conversion failed:', error)
            toast.error('Conversion failed. Please try again.')
        } finally {
            setIsConverting(false)
        }
    }

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || ''
    }

    return (
        <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">File Converter</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Convert between PDF, Word, Excel, and other document formats
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select File
                        </label>
                        <Input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        {selectedFile && (
                            <div className="p-3 bg-zinc-800 border dark:border-zinc-700 dark:text-zinc-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={16} className="text-blue-600" />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {selectedFile.name}
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                                    <div>Type: {getFileExtension(selectedFile.name).toUpperCase()}</div>
                                    <div>Size: {(selectedFile.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Format Selection */}
                    {selectedFile && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Convert to
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {supportedFormats
                                    .filter(format => format.value !== getFileExtension(selectedFile.name))
                                    .map((format) => (
                                        <Button
                                            key={format.value}
                                            onClick={() => setTargetFormat(format.value)}
                                            variant={targetFormat === format.value ? 'default' : 'outline'}
                                            className="h-auto"
                                        >
                                            <div className="flex flex-col items-center gap-1 p-2">
                                                <FormatLogo format={format.value} width={24} height={24} />
                                                <span className="text-xs">{format.label}</span>
                                            </div>
                                        </Button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Convert Button */}
                    {selectedFile && targetFormat && (
                        <div className="flex items-center justify-between p-4 bg-zinc-800 border dark:border-zinc-700 dark:text-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>{getFileExtension(selectedFile.name).toUpperCase()}</span>
                                <ArrowRight size={16} />
                                <span>{targetFormat.toUpperCase()}</span>
                            </div>
                            <Button
                                onClick={handleConvert}
                                disabled={isConverting}
                            >
                                {isConverting ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} className="" />
                                        Convert
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Supported Formats Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            Supported Formats
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-700 dark:text-blue-400 mb-3">
                            {supportedFormats.map((format) => (
                                <div key={format.value} className="flex items-center gap-2">
                                    <FormatLogo format={format.value} width={16} height={16} />
                                    <span>{format.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                            <p className="mb-1">• PDF → Text: Basic text extraction</p>
                            <p className="mb-1">• Text/HTML/CSV: Full content conversion</p>
                            <p>• Word/Excel: Metadata extraction (full conversion requires additional services)</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}