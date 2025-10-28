'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ImageAnalyzer, ImagePresets, ImageProcessor } from '@/lib/image-utils'
import { Image, RefreshCw, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ImageCompressor() {
    const [compressFile, setCompressFile] = useState<File | null>(null)
    const [compressQuality, setCompressQuality] = useState<number>(0.8)
    const [maxWidth, setMaxWidth] = useState<string>('')
    const [maxHeight, setMaxHeight] = useState<string>('')
    const [isCompressing, setIsCompressing] = useState(false)
    const [fileInfo, setFileInfo] = useState<any>(null)

    const handleCompressFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setCompressFile(file)

            try {
                const info = await ImageAnalyzer.getImageInfo(file)
                setFileInfo(info)

                const recommendation = ImageAnalyzer.getCompressionRecommendation(file)
                setCompressQuality(recommendation.recommendedQuality)
                if (recommendation.recommendedMaxWidth) {
                    setMaxWidth(recommendation.recommendedMaxWidth.toString())
                }
                toast.info(recommendation.reason)
            } catch (error) {
                console.error('Failed to get file info:', error)
            }
        }
    }

    const handleCompress = async () => {
        if (!compressFile) return

        setIsCompressing(true)
        try {
            const options = {
                quality: compressQuality,
                maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
                maxHeight: maxHeight ? parseInt(maxHeight) : undefined
            }

            const compressedBlob = await ImageProcessor.compressImage(compressFile, options)
            const originalSize = ImageProcessor.formatFileSize(compressFile.size)
            const compressedSize = ImageProcessor.formatFileSize(compressedBlob.size)
            const reduction = Math.round((1 - compressedBlob.size / compressFile.size) * 100)

            const filename = `${compressFile.name.split('.')[0]}_compressed.${compressFile.name.split('.').pop()}`
            ImageProcessor.downloadBlob(compressedBlob, filename)

            toast.success(`Image compressed! ${originalSize} → ${compressedSize} (${reduction}% reduction)`)
        } catch (error) {
            console.error('Compression failed:', error)
            toast.error('Compression failed. Please try again.')
        } finally {
            setIsCompressing(false)
        }
    }

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Image Compressor</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Reduce image file size while maintaining quality
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Image
                        </label>
                        <Input
                            type="file"
                            onChange={handleCompressFileSelect}
                            accept="image/*"
                            className="border-zinc-700 bg-zinc-800"
                        />
                        {compressFile && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                    <Image size={16} className="text-purple-600" />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                        {compressFile.name} ({ImageProcessor.formatFileSize(compressFile.size)})
                                    </span>
                                </div>
                                {fileInfo && (
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-zinc-700">
                                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                                            Image Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-purple-700 dark:text-purple-400">
                                            <div>Dimensions: {fileInfo.dimensions.width} × {fileInfo.dimensions.height}</div>
                                            <div>Aspect Ratio: {fileInfo.aspectRatio}</div>
                                            <div>Format: {fileInfo.type}</div>
                                            <div>Size: {fileInfo.size}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {compressFile && (
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-zinc-700 space-y-4">
                                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300">
                                    Compression Settings
                                </h4>

                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm text-purple-700 dark:text-purple-400">
                                            Quick Presets
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                onClick={() => {
                                                    setCompressQuality(ImagePresets.web.quality)
                                                    setMaxWidth(ImagePresets.web.maxWidth?.toString() || '')
                                                    setMaxHeight(ImagePresets.web.maxHeight?.toString() || '')
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs border-zinc-700"
                                            >
                                                Web Optimized
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setCompressQuality(ImagePresets.thumbnail.quality)
                                                    setMaxWidth(ImagePresets.thumbnail.maxWidth?.toString() || '')
                                                    setMaxHeight(ImagePresets.thumbnail.maxHeight?.toString() || '')
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs border-zinc-700"
                                            >
                                                Thumbnail
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-purple-700 dark:text-purple-400">
                                            Quality: {Math.round(compressQuality * 100)}%
                                        </label>
                                        <Input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={compressQuality}
                                            onChange={(e) => setCompressQuality(parseFloat(e.target.value))}
                                            className="border-zinc-700 bg-zinc-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-purple-700 dark:text-purple-400">
                                            Max Width (px)
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="Optional"
                                            value={maxWidth}
                                            onChange={(e) => setMaxWidth(e.target.value)}
                                            className="border-zinc-700 bg-zinc-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-purple-700 dark:text-purple-400">
                                            Max Height (px)
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="Optional"
                                            value={maxHeight}
                                            onChange={(e) => setMaxHeight(e.target.value)}
                                            className="border-zinc-700 bg-zinc-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCompress}
                                disabled={isCompressing}
                                className="w-full"
                            >
                                {isCompressing ? (
                                    <>
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                        Compressing...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={16} className="mr-2" />
                                        Compress Image
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}