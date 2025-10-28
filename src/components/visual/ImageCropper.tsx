'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ImageProcessor } from '@/lib/image-utils'
import { RefreshCw, Scissors } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ImageCropper() {
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [cropX, setCropX] = useState<string>('0')
    const [cropY, setCropY] = useState<string>('0')
    const [cropWidth, setCropWidth] = useState<string>('')
    const [cropHeight, setCropHeight] = useState<string>('')
    const [isCropping, setIsCropping] = useState(false)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

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

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Image Cropper</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Crop images to specific dimensions and positions
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Image
                        </label>
                        <Input
                            type="file"
                            onChange={handleCropFileSelect}
                            accept="image/*"
                            className="border-zinc-700 bg-zinc-800"
                        />
                        {cropFile && (
                            <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                <Scissors size={16} className="text-orange-600" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {cropFile.name}
                                    {imageDimensions && (
                                        <span className="text-zinc-500 ml-2">
                                            ({imageDimensions.width} × {imageDimensions.height})
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {cropFile && imagePreview && (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-zinc-700 space-y-4">
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
                                            className="border-zinc-700 bg-zinc-800"
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
                                            className="border-zinc-700 bg-zinc-800"
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
                                            className="border-zinc-700 bg-zinc-800"
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
                                            className="border-zinc-700 bg-zinc-800"
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
                                    className="w-full h-auto border border-zinc-700 rounded-lg"
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
            </CardContent>
        </Card>
    )
}