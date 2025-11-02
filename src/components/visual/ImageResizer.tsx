'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ImageProcessor } from '@/lib/image-utils'
import { Maximize2, Move, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function ImageResizer() {
    const [resizeFile, setResizeFile] = useState<File | null>(null)
    const [resizeWidth, setResizeWidth] = useState<string>('')
    const [resizeHeight, setResizeHeight] = useState<string>('')
    const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
    const [isResizing, setIsResizing] = useState(false)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 })
    const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragHandle, setDragHandle] = useState<string>('')
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isUpdatingFromDrag, setIsUpdatingFromDrag] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)

    const handleResizeFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setResizeFile(file)

            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)

            try {
                const dimensions = await ImageProcessor.getImageDimensions(file)
                setOriginalDimensions(dimensions)
                setResizeWidth(dimensions.width.toString())
                setResizeHeight(dimensions.height.toString())

                // Set initial preview dimensions (scaled down for display)
                const maxPreviewSize = 400
                const scale = Math.min(maxPreviewSize / dimensions.width, maxPreviewSize / dimensions.height, 1)
                setPreviewDimensions({
                    width: dimensions.width * scale,
                    height: dimensions.height * scale
                })
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

    const handleMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
        e.preventDefault()
        setIsDragging(true)
        setDragHandle(handle)
        setDragStart({ x: e.clientX, y: e.clientY })
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !dragHandle) return

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        let newWidth = previewDimensions.width
        let newHeight = previewDimensions.height

        switch (dragHandle) {
            case 'se': // Southeast corner
                newWidth = Math.max(50, previewDimensions.width + deltaX)
                newHeight = Math.max(50, previewDimensions.height + deltaY)
                break
            case 'sw': // Southwest corner
                newWidth = Math.max(50, previewDimensions.width - deltaX)
                newHeight = Math.max(50, previewDimensions.height + deltaY)
                break
            case 'ne': // Northeast corner
                newWidth = Math.max(50, previewDimensions.width + deltaX)
                newHeight = Math.max(50, previewDimensions.height - deltaY)
                break
            case 'nw': // Northwest corner
                newWidth = Math.max(50, previewDimensions.width - deltaX)
                newHeight = Math.max(50, previewDimensions.height - deltaY)
                break
            case 'e': // East edge
                newWidth = Math.max(50, previewDimensions.width + deltaX)
                break
            case 'w': // West edge
                newWidth = Math.max(50, previewDimensions.width - deltaX)
                break
            case 's': // South edge
                newHeight = Math.max(50, previewDimensions.height + deltaY)
                break
            case 'n': // North edge
                newHeight = Math.max(50, previewDimensions.height - deltaY)
                break
        }

        if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
            const aspectRatio = originalDimensions.width / originalDimensions.height
            if (dragHandle.includes('e') || dragHandle.includes('w')) {
                newHeight = newWidth / aspectRatio
            } else if (dragHandle.includes('n') || dragHandle.includes('s')) {
                newWidth = newHeight * aspectRatio
            } else {
                // Corner handles - maintain aspect ratio based on the larger change
                const widthChange = Math.abs(newWidth - previewDimensions.width)
                const heightChange = Math.abs(newHeight - previewDimensions.height)
                if (widthChange > heightChange) {
                    newHeight = newWidth / aspectRatio
                } else {
                    newWidth = newHeight * aspectRatio
                }
            }
        }

        setPreviewDimensions({ width: newWidth, height: newHeight })

        // Update input values based on preview dimensions
        // Calculate the scale from the original preview size to get actual dimensions
        const maxPreviewSize = 400
        const originalScale = Math.min(maxPreviewSize / originalDimensions.width, maxPreviewSize / originalDimensions.height, 1)
        const actualWidth = Math.round(newWidth / originalScale)
        const actualHeight = Math.round(newHeight / originalScale)

        setIsUpdatingFromDrag(true)
        setResizeWidth(actualWidth.toString())
        setResizeHeight(actualHeight.toString())

        setDragStart({ x: e.clientX, y: e.clientY })
    }, [isDragging, dragHandle, dragStart, previewDimensions, maintainAspectRatio, originalDimensions])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        setDragHandle('')
        // Reset the flag after a short delay to allow the input updates to complete
        setTimeout(() => setIsUpdatingFromDrag(false), 100)
    }, [])

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // Update preview dimensions when input values change (but not during drag operations)
    useEffect(() => {
        if (!isUpdatingFromDrag && originalDimensions.width && originalDimensions.height && resizeWidth && resizeHeight) {
            const maxPreviewSize = 400
            const targetWidth = parseInt(resizeWidth)
            const targetHeight = parseInt(resizeHeight)
            const scale = Math.min(maxPreviewSize / targetWidth, maxPreviewSize / targetHeight, 1)
            setPreviewDimensions({
                width: targetWidth * scale,
                height: targetHeight * scale
            })
        }
    }, [resizeWidth, resizeHeight, originalDimensions, isUpdatingFromDrag])

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview)
            }
        }
    }, [imagePreview])

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
                            {/* Visual Preview with Drag Handles */}
                            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                    <Move size={16} />
                                    Visual Resize Preview
                                </h4>
                                <div className="flex justify-center">
                                    <div
                                        ref={previewRef}
                                        className={`relative inline-block border-2 border-dashed bg-zinc-800/50 transition-colors ${isDragging ? 'border-blue-400' : 'border-zinc-600'
                                            }`}
                                        style={{
                                            width: previewDimensions.width,
                                            height: previewDimensions.height,
                                            minWidth: '50px',
                                            minHeight: '50px',
                                            cursor: isDragging ? 'grabbing' : 'default'
                                        }}
                                    >
                                        {imagePreview && (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                                draggable={false}
                                            />
                                        )}

                                        {/* Corner Handles */}
                                        <div
                                            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'nw')}
                                        />
                                        <div
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'ne')}
                                        />
                                        <div
                                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'sw')}
                                        />
                                        <div
                                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'se')}
                                        />

                                        {/* Edge Handles */}
                                        <div
                                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'n')}
                                        />
                                        <div
                                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 's')}
                                        />
                                        <div
                                            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-w-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'w')}
                                        />
                                        <div
                                            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-e-resize hover:bg-blue-600 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, 'e')}
                                        />

                                        {/* Dimension Display */}
                                        <div className="absolute -bottom-8 left-0 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                                            {resizeWidth} × {resizeHeight}px
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 text-center">
                                    Drag the blue handles to resize visually, or use the inputs below
                                </p>
                            </div>

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
                                            onChange={(e) => {
                                                setIsUpdatingFromDrag(false)
                                                setResizeWidth(e.target.value)
                                            }}
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
                                            onChange={(e) => {
                                                setIsUpdatingFromDrag(false)
                                                setResizeHeight(e.target.value)
                                            }}
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