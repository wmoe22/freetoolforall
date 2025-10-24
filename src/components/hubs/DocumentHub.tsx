'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompressionOptions, DocumentConverter, MergeOptions, PDFProcessor, SplitOptions } from '@/lib/pdf-utils'
import { ArrowRight, Copy, Download, FileText, RefreshCw, Scissors, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DocumentHub() {
    // File Converter State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [targetFormat, setTargetFormat] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)

    // PDF Tools State
    const [compressPdf, setCompressPdf] = useState<File | null>(null)
    const [splitPdf, setSplitPdf] = useState<File | null>(null)
    const [mergePdfs, setMergePdfs] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // PDF Options State
    const [compressionQuality, setCompressionQuality] = useState<'standard' | 'high' | 'maximum'>('standard')
    const [splitType, setSplitType] = useState<'range' | 'individual' | 'every'>('range')
    const [splitRanges, setSplitRanges] = useState<string>('')
    const [splitEveryN, setSplitEveryN] = useState<number>(1)
    const [maintainOrder, setMaintainOrder] = useState<boolean>(true)
    const [addBookmarks, setAddBookmarks] = useState<boolean>(false)

    const supportedFormats = [
        { value: 'pdf', label: 'PDF', icon: '📄' },
        { value: 'docx', label: 'Word (DOCX)', icon: '📝' },
        { value: 'xlsx', label: 'Excel (XLSX)', icon: '📊' },
        { value: 'txt', label: 'Text', icon: '📃' },
        { value: 'html', label: 'HTML', icon: '🌐' },
        { value: 'csv', label: 'CSV', icon: '📋' }
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

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || ''
    }

    return (
        <div className="space-y-6">
            <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-blue-600" />
                        Document Hub
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                        Document processing and analysis tools
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="converter" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="converter" className="flex items-center gap-2">
                                <RefreshCw size={16} />
                                <span className="hidden sm:inline">Converter</span>
                            </TabsTrigger>
                            <TabsTrigger value="compress" className="flex items-center gap-2">
                                <Settings size={16} />
                                <span className="hidden sm:inline">Compress</span>
                            </TabsTrigger>
                            <TabsTrigger value="split" className="flex items-center gap-2">
                                <Scissors size={16} />
                                <span className="hidden sm:inline">Split</span>
                            </TabsTrigger>
                            <TabsTrigger value="merge" className="flex items-center gap-2">
                                <Copy size={16} />
                                <span className="hidden sm:inline">Merge</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* File Converter Tab */}
                        <TabsContent value="converter" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">File Converter</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Convert between PDF, Word, Excel, and other document formats
                                    </p>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select File
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    />
                                    {selectedFile && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText size={16} className="text-blue-600" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {selectedFile.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                                <div>Type: {getFileExtension(selectedFile.name).toUpperCase()}</div>
                                                <div>Size: {(selectedFile.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Target Format Selection */}
                                {selectedFile && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                                            <span className="text-lg">{format.icon}</span>
                                                            <span>{format.label}</span>
                                                        </div>
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Convert Button */}
                                {selectedFile && targetFormat && (
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span>{getFileExtension(selectedFile.name).toUpperCase()}</span>
                                            <ArrowRight size={16} />
                                            <span>{targetFormat.toUpperCase()}</span>
                                        </div>
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isConverting}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {isConverting ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    Converting...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={16} className="mr-2" />
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
                                            <div key={format.value} className="flex items-center gap-1">
                                                <span>{format.icon}</span>
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
                        </TabsContent>

                        {/* Compress PDF Tab */}
                        <TabsContent value="compress" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Compress PDF</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <FileText size={16} className="text-red-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {compressPdf.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {compressPdf && (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                                                Compression Options
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        type="radio"
                                                        id="standard"
                                                        name="compression"
                                                        checked={compressionQuality === 'standard'}
                                                        onChange={() => setCompressionQuality('standard')}
                                                    />
                                                    <label htmlFor="standard">Standard (Recommended)</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        type="radio"
                                                        id="high"
                                                        name="compression"
                                                        checked={compressionQuality === 'high'}
                                                        onChange={() => setCompressionQuality('high')}
                                                    />
                                                    <label htmlFor="high">High Compression</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        type="radio"
                                                        id="maximum"
                                                        name="compression"
                                                        checked={compressionQuality === 'maximum'}
                                                        onChange={() => setCompressionQuality('maximum')}
                                                    />
                                                    <label htmlFor="maximum">Maximum Compression</label>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleCompressPdf}
                                            disabled={isProcessing}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white"
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
                            </div>
                        </TabsContent>

                        {/* Split PDF Tab */}
                        <TabsContent value="split" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Split PDF</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
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
                                                    <Input
                                                        type="radio"
                                                        id="range"
                                                        name="split"
                                                        checked={splitType === 'range'}
                                                        onChange={() => setSplitType('range')}
                                                    />
                                                    <label htmlFor="range">Split by page range</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        type="radio"
                                                        id="individual"
                                                        name="split"
                                                        checked={splitType === 'individual'}
                                                        onChange={() => setSplitType('individual')}
                                                    />
                                                    <label htmlFor="individual">Split into individual pages</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        type="radio"
                                                        id="every"
                                                        name="split"
                                                        checked={splitType === 'every'}
                                                        onChange={() => setSplitType('every')}
                                                    />
                                                    <label htmlFor="every">Split every N pages</label>
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
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
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
                            </div>
                        </TabsContent>

                        {/* Merge PDF Tab */}
                        <TabsContent value="merge" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Merge PDFs</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
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
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        Add bookmarks for each file
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleMergePdfs}
                                            disabled={isProcessing}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
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
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}