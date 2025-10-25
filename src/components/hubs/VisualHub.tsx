'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageAnalyzer, ImagePresets, ImageProcessor } from '@/lib/image-utils'
import {
    Download,
    Image,
    Maximize2,
    Palette,
    RefreshCw,
    Scissors,
    Zap
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export default function VisualHub() {
    // Compression State
    const [compressFile, setCompressFile] = useState<File | null>(null)
    const [compressQuality, setCompressQuality] = useState<number>(0.8)
    const [maxWidth, setMaxWidth] = useState<string>('')
    const [maxHeight, setMaxHeight] = useState<string>('')
    const [isCompressing, setIsCompressing] = useState(false)
    const [fileInfo, setFileInfo] = useState<any>(null)

    // Resize State
    const [resizeFile, setResizeFile] = useState<File | null>(null)
    const [resizeWidth, setResizeWidth] = useState<string>('')
    const [resizeHeight, setResizeHeight] = useState<string>('')
    const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
    const [isResizing, setIsResizing] = useState(false)

    // Crop State
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [cropX, setCropX] = useState<string>('0')
    const [cropY, setCropY] = useState<string>('0')
    const [cropWidth, setCropWidth] = useState<string>('')
    const [cropHeight, setCropHeight] = useState<string>('')
    const [isCropping, setIsCropping] = useState(false)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

    // Format Conversion State
    const [convertFile, setConvertFile] = useState<File | null>(null)
    const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
    const [isConverting, setIsConverting] = useState(false)

    // Background Removal State
    const [bgRemoveFile, setBgRemoveFile] = useState<File | null>(null)
    const [isRemovingBg, setIsRemovingBg] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    const supportedFormats = [
        { value: 'jpeg', label: 'JPEG', icon: '🖼️', description: 'Best for photos' },
        { value: 'png', label: 'PNG', icon: '🎨', description: 'Best for graphics with transparency' },
        { value: 'webp', label: 'WebP', icon: '🚀', description: 'Modern format, smaller size' }
    ]

    const handleCompressFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setCompressFile(file)

            // Get file information and apply compression recommendations
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

    const handleResizeFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setResizeFile(file)
            try {
                const dimensions = await ImageProcessor.getImageDimensions(file)
                setResizeWidth(dimensions.width.toString())
                setResizeHeight(dimensions.height.toString())
            } catch (error) {
                console.error('Failed to get image dimensions:', error)
            }
        }
    }

    const handleResize = async () => {
        if (!resizeFile) return

        setIsResizing(true)
        try {
            const options = {
                width: resizeWidth ? parseInt(resizeWidth) : undefined,
                height: resizeHeight ? parseInt(resizeHeight) : undefined,
                maintainAspectRatio
            }

            const resizedBlob = await ImageProcessor.resizeImage(resizeFile, options)
            const filename = `${resizeFile.name.split('.')[0]}_resized.${resizeFile.name.split('.').pop()}`
            ImageProcessor.downloadBlob(resizedBlob, filename)

            toast.success('Image resized successfully!')
        } catch (error) {
            console.error('Resize failed:', error)
            toast.error('Resize failed. Please try again.')
        } finally {
            setIsResizing(false)
        }
    }

    const handleCropFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setCropFile(file)
            const preview = URL.createObjectURL(file)
            setImagePreview(preview)

            try {
                const dimensions = await ImageProcessor.getImageDimensions(file)
                setImageDimensions(dimensions)
                setCropWidth(Math.floor(dimensions.width / 2).toString())
                setCropHeight(Math.floor(dimensions.height / 2).toString())
            } catch (error) {
                console.error('Failed to get image dimensions:', error)
            }
        }
    }

    const handleCrop = async () => {
        if (!cropFile) return

        setIsCropping(true)
        try {
            const options = {
                x: parseInt(cropX),
                y: parseInt(cropY),
                width: parseInt(cropWidth),
                height: parseInt(cropHeight)
            }

            const croppedBlob = await ImageProcessor.cropImage(cropFile, options)
            const filename = `${cropFile.name.split('.')[0]}_cropped.${cropFile.name.split('.').pop()}`
            ImageProcessor.downloadBlob(croppedBlob, filename)

            toast.success('Image cropped successfully!')
        } catch (error) {
            console.error('Crop failed:', error)
            toast.error('Crop failed. Please try again.')
        } finally {
            setIsCropping(false)
        }
    }

    const handleConvertFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setConvertFile(file)
        }
    }

    const handleConvert = async () => {
        if (!convertFile) return

        setIsConverting(true)
        try {
            const convertedBlob = await ImageProcessor.convertFormat(convertFile, targetFormat)
            const filename = `${convertFile.name.split('.')[0]}.${targetFormat}`
            ImageProcessor.downloadBlob(convertedBlob, filename)

            toast.success(`Successfully converted to ${targetFormat.toUpperCase()}`)
        } catch (error) {
            console.error('Conversion failed:', error)
            toast.error('Conversion failed. Please try again.')
        } finally {
            setIsConverting(false)
        }
    }

    const handleBgRemoveFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setBgRemoveFile(file)
        }
    }

    const handleRemoveBackground = async () => {
        if (!bgRemoveFile) return

        setIsRemovingBg(true)
        try {
            const processedBlob = await ImageProcessor.removeBackground(bgRemoveFile)
            const filename = `${bgRemoveFile.name.split('.')[0]}_no_bg.png`
            ImageProcessor.downloadBlob(processedBlob, filename)

            toast.success('Background removed! (Demo effect applied)')
        } catch (error) {
            console.error('Background removal failed:', error)
            toast.error('Background removal failed. Please try again.')
        } finally {
            setIsRemovingBg(false)
        }
    }

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || ''
    }

    return (
        <div className="space-y-6">
            <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
                <CardContent>
                    <Tabs defaultValue="compress" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            <TabsTrigger value="compress" className="flex items-center gap-2">
                                <Zap size={16} />
                                <span className="hidden sm:inline">Compress</span>
                            </TabsTrigger>
                            <TabsTrigger value="resize" className="flex items-center gap-2">
                                <Maximize2 size={16} />
                                <span className="hidden sm:inline">Resize</span>
                            </TabsTrigger>
                            <TabsTrigger value="crop" className="flex items-center gap-2">
                                <Scissors size={16} />
                                <span className="hidden sm:inline">Crop</span>
                            </TabsTrigger>
                            <TabsTrigger value="convert" className="flex items-center gap-2">
                                <RefreshCw size={16} />
                                <span className="hidden sm:inline">Convert</span>
                            </TabsTrigger>
                            <TabsTrigger value="background" className="flex items-center gap-2">
                                <Palette size={16} />
                                <span className="hidden sm:inline">BG Remove</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Image Compression Tab */}
                        <TabsContent value="compress" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Image Compressor</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Reduce image file size while maintaining quality
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select Image
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleCompressFileSelect}
                                        accept="image/*"
                                    />
                                    {compressFile && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <Image size={16} className="text-purple-600" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                                    {compressFile.name} ({ImageProcessor.formatFileSize(compressFile.size)})
                                                </span>
                                            </div>
                                            {fileInfo && (
                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
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
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
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
                                                            className="text-xs"
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
                                                            className="text-xs"
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
                        </TabsContent>

                        {/* Image Resize Tab */}
                        <TabsContent value="resize" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Image Resizer</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Change image dimensions while maintaining quality
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select Image
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleResizeFileSelect}
                                        accept="image/*"
                                    />
                                    {resizeFile && (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <Maximize2 size={16} className="text-blue-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {resizeFile.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {resizeFile && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                                Resize Settings
                                            </h4>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="maintainAspectRatio"
                                                    checked={maintainAspectRatio}
                                                    onCheckedChange={(checked) => setMaintainAspectRatio(Boolean(checked))}
                                                />
                                                <label
                                                    htmlFor="maintainAspectRatio"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Maintain aspect ratio
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm text-blue-700 dark:text-blue-400">
                                                        Width (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={resizeWidth}
                                                        onChange={(e) => setResizeWidth(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-blue-700 dark:text-blue-400">
                                                        Height (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={resizeHeight}
                                                        onChange={(e) => setResizeHeight(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleResize}
                                            disabled={isResizing || (!resizeWidth && !resizeHeight)}
                                            className="w-full"
                                        >
                                            {isResizing ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    Resizing...
                                                </>
                                            ) : (
                                                <>
                                                    <Maximize2 size={16} className="mr-2" />
                                                    Resize Image
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Image Crop Tab */}
                        <TabsContent value="crop" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Image Cropper</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Crop images to specific dimensions and positions
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select Image
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleCropFileSelect}
                                        accept="image/*"
                                    />
                                    {cropFile && (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <Scissors size={16} className="text-orange-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {cropFile.name}
                                                {imageDimensions && (
                                                    <span className="text-slate-500 ml-2">
                                                        ({imageDimensions.width} × {imageDimensions.height})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {cropFile && imagePreview && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-4">
                                            <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300">
                                                Crop Settings
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm text-orange-700 dark:text-orange-400">
                                                        X Position (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={cropX}
                                                        onChange={(e) => setCropX(e.target.value)}
                                                        min="0"
                                                        max={imageDimensions?.width || 0}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-orange-700 dark:text-orange-400">
                                                        Y Position (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={cropY}
                                                        onChange={(e) => setCropY(e.target.value)}
                                                        min="0"
                                                        max={imageDimensions?.height || 0}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-orange-700 dark:text-orange-400">
                                                        Crop Width (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={cropWidth}
                                                        onChange={(e) => setCropWidth(e.target.value)}
                                                        min="1"
                                                        max={imageDimensions?.width || 0}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-orange-700 dark:text-orange-400">
                                                        Crop Height (px)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={cropHeight}
                                                        onChange={(e) => setCropHeight(e.target.value)}
                                                        min="1"
                                                        max={imageDimensions?.height || 0}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-xs text-orange-600 dark:text-orange-400">
                                                Preview: The crop area will be from ({cropX}, {cropY}) with size {cropWidth} × {cropHeight}
                                            </div>
                                        </div>

                                        <div className="max-w-md mx-auto">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-auto border border-slate-300 dark:border-slate-600 rounded-lg"
                                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                            />
                                        </div>

                                        <Button
                                            onClick={handleCrop}
                                            disabled={isCropping || !cropWidth || !cropHeight}
                                            className="w-full"
                                        >
                                            {isCropping ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    Cropping...
                                                </>
                                            ) : (
                                                <>
                                                    <Scissors size={16} className="mr-2" />
                                                    Crop Image
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Format Conversion Tab */}
                        <TabsContent value="convert" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Format Converter</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Convert between JPEG, PNG, and WebP formats
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select Image
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleConvertFileSelect}
                                        accept="image/*"
                                    />
                                    {convertFile && (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <RefreshCw size={16} className="text-green-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {convertFile.name} ({getFileExtension(convertFile.name).toUpperCase()})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {convertFile && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4">
                                            <h4 className="text-sm font-medium text-green-900 dark:text-green-300">
                                                Convert to Format
                                            </h4>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {supportedFormats
                                                    .filter(format => format.value !== getFileExtension(convertFile.name))
                                                    .map((format) => (
                                                        <Button
                                                            key={format.value}
                                                            onClick={() => setTargetFormat(format.value as 'jpeg' | 'png' | 'webp')}
                                                            variant={targetFormat === format.value ? 'default' : 'outline'}
                                                            className="h-auto"
                                                        >
                                                            <div className="flex flex-col items-center gap-2 p-2">
                                                                <span className="text-2xl">{format.icon}</span>
                                                                <span className="font-semibold">{format.label}</span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {format.description}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                    ))}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleConvert}
                                            disabled={isConverting}
                                            className="w-full"
                                        >
                                            {isConverting ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    Converting...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={16} className="mr-2" />
                                                    Convert to {targetFormat.toUpperCase()}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border dark:border-green-500 rounded-lg">
                                    <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                                        Format Guide
                                    </h4>
                                    <div className="space-y-2 text-xs text-green-700 dark:text-green-400">
                                        <div className="flex items-center gap-2">
                                            <span>🖼️</span>
                                            <span><strong>JPEG:</strong> Best for photos, smaller file size, no transparency</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>🎨</span>
                                            <span><strong>PNG:</strong> Best for graphics, supports transparency, larger file size</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>🚀</span>
                                            <span><strong>WebP:</strong> Modern format, excellent compression, supports transparency</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Background Removal Tab */}
                        <TabsContent value="background" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Background Remover</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Remove backgrounds from images using AI processing
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Select Image
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={handleBgRemoveFileSelect}
                                        accept="image/*"
                                    />
                                    {bgRemoveFile && (
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <Palette size={16} className="text-pink-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {bgRemoveFile.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {bgRemoveFile && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-300 mb-2">
                                                AI Background Removal
                                            </h4>
                                            <p className="text-sm text-pink-700 dark:text-pink-400 mb-3">
                                                This feature uses advanced AI to automatically detect and remove backgrounds from your images.
                                            </p>
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                                    <strong>Demo Mode:</strong> Currently showing a simple background removal effect.
                                                    In production, this would integrate with AI services like Gemini Nano for advanced background removal.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleRemoveBackground}
                                            disabled={isRemovingBg}
                                            className="w-full"
                                        >
                                            {isRemovingBg ? (
                                                <>
                                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                                    Removing Background...
                                                </>
                                            ) : (
                                                <>
                                                    <Palette size={16} className="mr-2" />
                                                    Remove Background
                                                </>
                                            )}
                                        </Button>

                                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-300 mb-2">
                                                Tips for Best Results
                                            </h4>
                                            <ul className="text-xs text-pink-700 dark:text-pink-400 space-y-1">
                                                <li>• Use images with clear subject-background contrast</li>
                                                <li>• Avoid busy or complex backgrounds</li>
                                                <li>• Higher resolution images typically work better</li>
                                                <li>• The output will be in PNG format to preserve transparency</li>
                                            </ul>
                                        </div>
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