'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ImageProcessor } from '@/lib/image-utils'
import { Palette, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function BackgroundRemover() {
    const [bgRemoveFile, setBgRemoveFile] = useState<File | null>(null)
    const [isRemovingBg, setIsRemovingBg] = useState(false)

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

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Background Remover</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Remove backgrounds from images using AI processing
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Select Image
                        </label>
                        <Input
                            type="file"
                            onChange={handleBgRemoveFileSelect}
                            accept="image/*"
                            className="border-zinc-700 bg-zinc-800"
                        />
                        {bgRemoveFile && (
                            <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                <Palette size={16} className="text-pink-600" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {bgRemoveFile.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {bgRemoveFile && (
                        <div className="space-y-4">
                            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-zinc-700">
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

                            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-zinc-700">
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
            </CardContent>
        </Card>
    )
}