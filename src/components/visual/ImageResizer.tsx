'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ImageProcessor } from '@/lib/image-utils'
import { Maximize2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ImageResizer() {
    const [resizeFile, setResizeFile] = useState<File | null>(null)
    const [resizeWidth, setResizeWidth] = useState<string>('')
    const [resizeHeight, setResizeHeight] = useState<string>('')
    const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
    const [isResizing, setIsResizing] = useState(false)

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

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Image Resizer</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Change image dimensions while maintaining quality
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Image
                        </label>
                        <Input
                            type="file"
                            onChange={handleResizeFileSelect}
                            accept="image/*"
                            className="border-zinc-700 bg-zinc-800"
                        />
                        {resizeFile && (
                            <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                <Maximize2 size={16} className="text-blue-600" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {resizeFile.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {resizeFile && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-zinc-700 space-y-4">
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
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-700 dark:text-blue-400"
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
                                            className="border-zinc-700 bg-zinc-800"
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
                                            className="border-zinc-700 bg-zinc-800"
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
            </CardContent>
        </Card>
    )
}