'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ImageProcessor } from '@/lib/image-utils'
import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function FormatConverter() {
    const [convertFile, setConvertFile] = useState<File | null>(null)
    const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
    const [isConverting, setIsConverting] = useState(false)

    const supportedFormats = [
        { value: 'jpeg', label: 'JPEG', icon: '🖼️', description: 'Best for photos' },
        { value: 'png', label: 'PNG', icon: '🎨', description: 'Best for graphics with transparency' },
        { value: 'webp', label: 'WebP', icon: '🚀', description: 'Modern format, smaller size' }
    ]

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

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || ''
    }

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Format Converter</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Convert between JPEG, PNG, and WebP formats
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Image
                        </label>
                        <Input
                            type="file"
                            onChange={handleConvertFileSelect}
                            accept="image/*"
                            className="border-zinc-700 bg-zinc-800"
                        />
                        {convertFile && (
                            <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                <RefreshCw size={16} className="text-green-600" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {convertFile.name} ({getFileExtension(convertFile.name).toUpperCase()})
                                </span>
                            </div>
                        )}
                    </div>

                    {convertFile && (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-zinc-700 space-y-4">
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
                                                className="h-auto border-zinc-700"
                                            >
                                                <div className="flex flex-col items-center gap-2 p-2">
                                                    <span className="text-2xl">{format.icon}</span>
                                                    <span className="font-semibold">{format.label}</span>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
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

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-zinc-700 rounded-lg">
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
            </CardContent>
        </Card>
    )
}