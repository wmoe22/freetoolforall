'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PDFProcessor, SplitOptions } from '@/lib/pdf-utils'
import { FileText, RefreshCw, Scissors } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function PDFSplitterTab() {
    const [splitPdf, setSplitPdf] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [splitType, setSplitType] = useState<'range' | 'individual' | 'every'>('range')
    const [splitRanges, setSplitRanges] = useState<string>('')
    const [splitEveryN, setSplitEveryN] = useState<number>(1)

    const handleSplitPdf = async () => {
        if (!splitPdf) return
        setIsProcessing(true)
        try {
            const options: SplitOptions = {
                type: splitType,
                ranges: splitType === 'range' ? splitRanges : undefined,
                everyN: splitType === 'every' ? splitEveryN : undefined
            }
            const splitBlobs = await PDFProcessor.splitPDF(splitPdf, options)
            const baseFilename = splitPdf.name.split('.')[0]
            PDFProcessor.downloadMultipleBlobs(splitBlobs, baseFilename)
            toast.success(`PDF split into ${splitBlobs.length} files!`)
        } catch (error) {
            console.error('Splitting failed:', error)
            toast.error('Splitting failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Splitter</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Split a PDF into multiple files by page ranges
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Select PDF File
                        </label>
                        <Input
                            type="file"
                            onChange={(e) => setSplitPdf(e.target.files?.[0] || null)}
                            accept=".pdf"
                        />
                        {splitPdf && (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:text-slate-800 rounded-lg">
                                <FileText size={16} className="text-orange-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {splitPdf.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {splitPdf && (
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                                    Split Options
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="range"
                                            name="split"
                                            checked={splitType === 'range'}
                                            onChange={() => setSplitType('range')}
                                            className="text-orange-600"
                                        />
                                        <label htmlFor="range" className="text-sm text-slate-700 dark:text-slate-300">
                                            Split by page range
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="individual"
                                            name="split"
                                            checked={splitType === 'individual'}
                                            onChange={() => setSplitType('individual')}
                                            className="text-orange-600"
                                        />
                                        <label htmlFor="individual" className="text-sm text-slate-700 dark:text-slate-300">
                                            Split into individual pages
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="every"
                                            name="split"
                                            checked={splitType === 'every'}
                                            onChange={() => setSplitType('every')}
                                            className="text-orange-600"
                                        />
                                        <label htmlFor="every" className="text-sm text-slate-700 dark:text-slate-300">
                                            Split every N pages
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {splitType === 'range' && (
                                        <Input
                                            type="text"
                                            placeholder="e.g., 1-5, 6-10, 11-15"
                                            value={splitRanges}
                                            onChange={(e) => setSplitRanges(e.target.value)}
                                        />
                                    )}
                                    {splitType === 'every' && (
                                        <Input
                                            type="number"
                                            placeholder="Number of pages per split"
                                            value={splitEveryN}
                                            onChange={(e) => setSplitEveryN(parseInt(e.target.value) || 1)}
                                            min="1"
                                        />
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={handleSplitPdf}
                                disabled={isProcessing || (splitType === 'range' && !splitRanges.trim())}
                                className="w-full disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        Splitting...
                                    </>
                                ) : (
                                    <>
                                        <Scissors size={16} className="mr-2" />
                                        Split PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                            Split Options Guide
                        </h4>
                        <div className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
                            <p>• Page Range: Specify ranges like "1-5, 8-10" to create custom splits</p>
                            <p>• Individual Pages: Creates one file per page</p>
                            <p>• Every N Pages: Splits document into chunks of N pages each</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}