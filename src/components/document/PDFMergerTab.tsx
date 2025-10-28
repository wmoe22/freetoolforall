'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { MergeOptions, PDFProcessor } from '@/lib/pdf-utils'
import { Copy, FileText, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function PDFMergerTab() {
    const [mergePdfs, setMergePdfs] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [maintainOrder, setMaintainOrder] = useState<boolean>(true)
    const [addBookmarks, setAddBookmarks] = useState<boolean>(false)

    const handleMergePdfs = async () => {
        if (mergePdfs.length < 2) return
        setIsProcessing(true)
        try {
            const options: MergeOptions = {
                maintainOrder,
                addBookmarks
            }
            const mergedBlob = await PDFProcessor.mergePDFs(mergePdfs, options)
            const filename = `merged_${Date.now()}.pdf`
            PDFProcessor.downloadBlob(mergedBlob, filename)
            toast.success(`Successfully merged ${mergePdfs.length} PDF files!`)
        } catch (error) {
            console.error('Merging failed:', error)
            toast.error('Merging failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleMergeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        setMergePdfs(files)
    }

    return (
        <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Merger</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Combine multiple PDF files into a single document
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Select PDF Files (Multiple)
                        </label>
                        <Input
                            type="file"
                            onChange={handleMergeFileSelect}
                            accept=".pdf"
                            multiple
                        />
                        {mergePdfs.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Selected Files ({mergePdfs.length}):
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {mergePdfs.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:text-slate-800 rounded-lg">
                                            <FileText size={16} className="text-green-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {index + 1}. {file.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {mergePdfs.length >= 2 && (
                        <div className="space-y-3">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                                    Merge Options
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="maintainOrder"
                                            checked={maintainOrder}
                                            onCheckedChange={(checked) => setMaintainOrder(Boolean(checked))}
                                        />
                                        <label
                                            htmlFor="maintainOrder"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300"
                                        >
                                            Maintain original page order
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="addBookmarks"
                                            checked={addBookmarks}
                                            onCheckedChange={(checked) => setAddBookmarks(Boolean(checked))}
                                        />
                                        <label
                                            htmlFor="addBookmarks"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300"
                                        >
                                            Add bookmarks for each file
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleMergePdfs}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        Merging...
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} className="mr-2" />
                                        Merge PDFs
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {mergePdfs.length === 1 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                Please select at least 2 PDF files to merge.
                            </p>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                            Merge Features
                        </h4>
                        <div className="text-xs text-green-700 dark:text-green-400 space-y-1">
                            <p>• Maintain Order: Preserves the original sequence of pages</p>
                            <p>• Add Bookmarks: Creates navigation bookmarks for each merged file</p>
                            <p>• File order matches selection order in the file picker</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}