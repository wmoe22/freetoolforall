'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CompressionOptions, PDFProcessor } from '@/lib/pdf-utils'
import { FileText, RefreshCw, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function PDFCompressorTab() {
    const [compressPdf, setCompressPdf] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [compressionQuality, setCompressionQuality] = useState<'standard' | 'high' | 'maximum'>('standard')

    const handleCompressPdf = async () => {
        if (!compressPdf) return
        setIsProcessing(true)
        try {
            const options: CompressionOptions = { quality: compressionQuality }
            const compressedBlob = await PDFProcessor.compressPDF(compressPdf, options)
            const filename = `${compressPdf.name.split('.')[0]}_compressed.pdf`
            PDFProcessor.downloadBlob(compressedBlob, filename)
            toast.success('PDF compressed successfully!')
        } catch (error) {
            console.error('Compression failed:', error)
            toast.error('Compression failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Compressor</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Reduce PDF file size while maintaining quality
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Select PDF File
                        </label>
                        <Input
                            type="file"
                            onChange={(e) => setCompressPdf(e.target.files?.[0] || null)}
                            accept=".pdf"
                        />
                        {compressPdf && (
                            <div className="flex items-center gap-2 p-2 bg-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-800 rounded-lg">
                                <FileText size={16} className="text-red-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {compressPdf.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {compressPdf && (
                        <div className="space-y-3">
                            <div className="p-3 bg-zinc-800 border dark:border-zinc-700 dark:bg-zinc-900 rounded-lg">
                                <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                                    Compression Options
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="standard"
                                            name="compression"
                                            checked={compressionQuality === 'standard'}
                                            onChange={() => setCompressionQuality('standard')}
                                            className="text-red-600"
                                        />
                                        <label htmlFor="standard" className="text-sm text-slate-700 dark:text-slate-300">
                                            Standard (Recommended)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="high"
                                            name="compression"
                                            checked={compressionQuality === 'high'}
                                            onChange={() => setCompressionQuality('high')}
                                            className="text-red-600"
                                        />
                                        <label htmlFor="high" className="text-sm text-slate-700 dark:text-slate-300">
                                            High Compression
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="maximum"
                                            name="compression"
                                            checked={compressionQuality === 'maximum'}
                                            onChange={() => setCompressionQuality('maximum')}
                                            className="text-red-600"
                                        />
                                        <label htmlFor="maximum" className="text-sm text-slate-700 dark:text-slate-300">
                                            Maximum Compression
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleCompressPdf}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        Compressing...
                                    </>
                                ) : (
                                    <>
                                        <Settings size={16} className="mr-2" />
                                        Compress PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                            Compression Levels
                        </h4>
                        <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
                            <p>• Standard: Balanced compression with good quality retention</p>
                            <p>• High: Smaller file size with slight quality reduction</p>
                            <p>• Maximum: Smallest file size with noticeable quality reduction</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}