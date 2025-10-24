export interface ImageCompressionOptions {
    quality: number // 0.1 to 1.0
    maxWidth?: number
    maxHeight?: number
    format?: 'jpeg' | 'png' | 'webp'
}

export interface ImageCropOptions {
    x: number
    y: number
    width: number
    height: number
}

export interface ImageResizeOptions {
    width?: number
    height?: number
    maintainAspectRatio?: boolean
}

export class ImageProcessor {
    static async compressImage(file: File, options: ImageCompressionOptions): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                try {
                    let { width, height } = img

                    // Apply max dimensions if specified
                    if (options.maxWidth && width > options.maxWidth) {
                        height = (height * options.maxWidth) / width
                        width = options.maxWidth
                    }

                    if (options.maxHeight && height > options.maxHeight) {
                        width = (width * options.maxHeight) / height
                        height = options.maxHeight
                    }

                    canvas.width = width
                    canvas.height = height

                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height)

                        const outputFormat = options.format ? `image/${options.format}` : file.type
                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob)
                                } else {
                                    reject(new Error('Failed to compress image'))
                                }
                            },
                            outputFormat,
                            options.quality
                        )
                    } else {
                        reject(new Error('Failed to get canvas context'))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    static async resizeImage(file: File, options: ImageResizeOptions): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                try {
                    let { width: newWidth, height: newHeight } = options
                    const { width: originalWidth, height: originalHeight } = img

                    if (options.maintainAspectRatio !== false) {
                        const aspectRatio = originalWidth / originalHeight

                        if (newWidth && !newHeight) {
                            newHeight = newWidth / aspectRatio
                        } else if (newHeight && !newWidth) {
                            newWidth = newHeight * aspectRatio
                        } else if (newWidth && newHeight) {
                            // Use the smaller scaling factor to maintain aspect ratio
                            const scaleX = newWidth / originalWidth
                            const scaleY = newHeight / originalHeight
                            const scale = Math.min(scaleX, scaleY)

                            newWidth = originalWidth * scale
                            newHeight = originalHeight * scale
                        }
                    }

                    canvas.width = newWidth || originalWidth
                    canvas.height = newHeight || originalHeight

                    if (ctx) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob)
                                } else {
                                    reject(new Error('Failed to resize image'))
                                }
                            },
                            file.type,
                            0.9
                        )
                    } else {
                        reject(new Error('Failed to get canvas context'))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    static async cropImage(file: File, cropOptions: ImageCropOptions): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                try {
                    const { x, y, width, height } = cropOptions

                    canvas.width = width
                    canvas.height = height

                    if (ctx) {
                        ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob)
                                } else {
                                    reject(new Error('Failed to crop image'))
                                }
                            },
                            file.type,
                            0.9
                        )
                    } else {
                        reject(new Error('Failed to get canvas context'))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    static async convertFormat(file: File, targetFormat: 'jpeg' | 'png' | 'webp'): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                try {
                    canvas.width = img.width
                    canvas.height = img.height

                    if (ctx) {
                        // For JPEG conversion, fill with white background
                        if (targetFormat === 'jpeg') {
                            ctx.fillStyle = '#FFFFFF'
                            ctx.fillRect(0, 0, canvas.width, canvas.height)
                        }

                        ctx.drawImage(img, 0, 0)

                        const quality = targetFormat === 'jpeg' ? 0.9 : 1.0
                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob)
                                } else {
                                    reject(new Error('Failed to convert image format'))
                                }
                            },
                            `image/${targetFormat}`,
                            quality
                        )
                    } else {
                        reject(new Error('Failed to get canvas context'))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    static async removeBackground(file: File): Promise<Blob> {
        // This is a placeholder for background removal
        // In a real implementation, you would integrate with an AI service
        // For now, we'll return the original image with a note
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                try {
                    canvas.width = img.width
                    canvas.height = img.height

                    if (ctx) {
                        // Create a simple edge detection effect as a placeholder
                        ctx.drawImage(img, 0, 0)

                        // Apply a simple filter effect
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        const data = imageData.data

                        // Simple background removal simulation (this is just a demo effect)
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i]
                            const g = data[i + 1]
                            const b = data[i + 2]

                            // Simple white background removal
                            if (r > 240 && g > 240 && b > 240) {
                                data[i + 3] = 0 // Make transparent
                            }
                        }

                        ctx.putImageData(imageData, 0, 0)

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(blob)
                                } else {
                                    reject(new Error('Failed to remove background'))
                                }
                            },
                            'image/png', // Always use PNG for transparency
                            1.0
                        )
                    } else {
                        reject(new Error('Failed to get canvas context'))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    static downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                resolve({ width: img.width, height: img.height })
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }
}

// Additional utility functions for enhanced image processing
export class ImageAnalyzer {
    static async getImageInfo(file: File): Promise<{
        name: string
        size: string
        type: string
        dimensions: { width: number; height: number }
        aspectRatio: string
    }> {
        const dimensions = await ImageProcessor.getImageDimensions(file)
        const aspectRatio = (dimensions.width / dimensions.height).toFixed(2)

        return {
            name: file.name,
            size: ImageProcessor.formatFileSize(file.size),
            type: file.type,
            dimensions,
            aspectRatio: `${aspectRatio}:1`
        }
    }

    static getCompressionRecommendation(file: File): {
        recommendedQuality: number
        recommendedMaxWidth?: number
        reason: string
    } {
        const sizeInMB = file.size / (1024 * 1024)

        if (sizeInMB > 10) {
            return {
                recommendedQuality: 0.6,
                recommendedMaxWidth: 1920,
                reason: 'Large file detected - aggressive compression recommended'
            }
        } else if (sizeInMB > 5) {
            return {
                recommendedQuality: 0.7,
                recommendedMaxWidth: 2560,
                reason: 'Medium file size - moderate compression recommended'
            }
        } else {
            return {
                recommendedQuality: 0.8,
                reason: 'File size is reasonable - light compression recommended'
            }
        }
    }
}

// Preset configurations for common use cases
export const ImagePresets = {
    web: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp' as const
    },
    thumbnail: {
        quality: 0.7,
        maxWidth: 300,
        maxHeight: 300,
        format: 'jpeg' as const
    },
    social: {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 630,
        format: 'jpeg' as const
    },
    print: {
        quality: 0.95,
        format: 'png' as const
    }
}