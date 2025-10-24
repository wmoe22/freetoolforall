// Audio compression utilities for optimizing file sizes before API calls

interface CompressionOptions {
    quality: number; // 0.1 to 1.0
    maxSizeKB: number;
    format: 'mp3' | 'webm' | 'ogg';
}

interface CompressionResult {
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    format: string;
}

export class AudioCompressor {
    private audioContext: AudioContext | null = null;

    constructor() {
        this.initializeAudioContext();
    }

    private async initializeAudioContext(): Promise<void> {
        try {
            if ('AudioContext' in window || 'webkitAudioContext' in window) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        } catch (error) {
            console.warn('AudioContext not available:', error);
        }
    }

    // Check if compression is supported
    isCompressionSupported(): boolean {
        return !!(this.audioContext && 'MediaRecorder' in window);
    }

    // Get optimal compression settings based on file size
    getOptimalSettings(fileSizeKB: number): CompressionOptions {
        if (fileSizeKB < 500) {
            // Small files - minimal compression
            return {
                quality: 0.9,
                maxSizeKB: 400,
                format: 'webm'
            };
        } else if (fileSizeKB < 2000) {
            // Medium files - moderate compression
            return {
                quality: 0.7,
                maxSizeKB: 1000,
                format: 'webm'
            };
        } else {
            // Large files - aggressive compression
            return {
                quality: 0.5,
                maxSizeKB: 1500,
                format: 'webm'
            };
        }
    }

    // Compress audio file
    async compressAudio(
        file: File,
        options?: Partial<CompressionOptions>
    ): Promise<CompressionResult> {
        const originalSize = file.size;
        const fileSizeKB = originalSize / 1024;

        // Get optimal settings if not provided
        const defaultSettings = this.getOptimalSettings(fileSizeKB);
        const settings: CompressionOptions = { ...defaultSettings, ...options };

        try {
            // If file is already small enough, return as-is
            if (originalSize <= settings.maxSizeKB * 1024) {
                return {
                    compressedFile: file,
                    originalSize,
                    compressedSize: originalSize,
                    compressionRatio: 1,
                    format: file.type
                };
            }

            // Check if we can compress this file type
            if (!this.canCompressFormat(file.type)) {
                console.warn(`Cannot compress ${file.type}, returning original file`);
                return {
                    compressedFile: file,
                    originalSize,
                    compressedSize: originalSize,
                    compressionRatio: 1,
                    format: file.type
                };
            }

            // Perform compression
            const compressedFile = await this.performCompression(file, settings);
            const compressedSize = compressedFile.size;
            const compressionRatio = compressedSize / originalSize;

            console.log(`Audio compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${(compressionRatio * 100).toFixed(1)}%)`);

            return {
                compressedFile,
                originalSize,
                compressedSize,
                compressionRatio,
                format: compressedFile.type
            };

        } catch (error) {
            console.error('Audio compression failed:', error);

            // Return original file if compression fails
            return {
                compressedFile: file,
                originalSize,
                compressedSize: originalSize,
                compressionRatio: 1,
                format: file.type
            };
        }
    }

    // Check if we can compress this format
    private canCompressFormat(mimeType: string): boolean {
        const compressibleFormats = [
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/flac',
            'audio/x-flac',
            'audio/aiff',
            'audio/x-aiff'
        ];

        return compressibleFormats.some(format => mimeType.includes(format));
    }

    // Perform the actual compression
    private async performCompression(
        file: File,
        settings: CompressionOptions
    ): Promise<File> {
        return new Promise((resolve, reject) => {
            try {
                // Create audio element to load the file
                const audio = new Audio();
                const url = URL.createObjectURL(file);

                audio.onloadedmetadata = async () => {
                    try {
                        URL.revokeObjectURL(url);

                        // Create MediaRecorder for compression
                        const stream = await this.createAudioStream(audio, settings);
                        const mediaRecorder = new MediaRecorder(stream, {
                            mimeType: this.getMimeType(settings.format),
                            audioBitsPerSecond: this.getBitrate(settings.quality)
                        });

                        const chunks: Blob[] = [];

                        mediaRecorder.ondataavailable = (event) => {
                            if (event.data.size > 0) {
                                chunks.push(event.data);
                            }
                        };

                        mediaRecorder.onstop = () => {
                            const compressedBlob = new Blob(chunks, {
                                type: this.getMimeType(settings.format)
                            });

                            const compressedFile = new File(
                                [compressedBlob],
                                this.getCompressedFileName(file.name, settings.format),
                                { type: compressedBlob.type }
                            );

                            resolve(compressedFile);
                        };

                        mediaRecorder.onerror = (error) => {
                            reject(new Error(`MediaRecorder error: ${error}`));
                        };

                        // Start recording
                        mediaRecorder.start();

                        // Play audio to record compressed version
                        audio.play();

                        // Stop recording when audio ends
                        audio.onended = () => {
                            mediaRecorder.stop();
                            stream.getTracks().forEach(track => track.stop());
                        };

                    } catch (error) {
                        URL.revokeObjectURL(url);
                        reject(error);
                    }
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load audio file'));
                };

                audio.src = url;
            } catch (error) {
                reject(error);
            }
        });
    }

    // Create audio stream for compression
    private async createAudioStream(
        audio: HTMLAudioElement,
        settings: CompressionOptions
    ): Promise<MediaStream> {
        if (!this.audioContext) {
            throw new Error('AudioContext not available');
        }

        // Create audio source from the audio element
        const source = this.audioContext.createMediaElementSource(audio);

        // Create destination for capturing audio
        const destination = this.audioContext.createMediaStreamDestination();

        // Connect source to destination
        source.connect(destination);

        return destination.stream;
    }

    // Get MIME type for format
    private getMimeType(format: string): string {
        const mimeTypes: Record<string, string> = {
            'mp3': 'audio/mpeg',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg'
        };

        return mimeTypes[format] || 'audio/webm';
    }

    // Get bitrate based on quality
    private getBitrate(quality: number): number {
        // Quality 0.1 = 32kbps, Quality 1.0 = 128kbps
        return Math.round(32000 + (quality * 96000));
    }

    // Generate compressed filename
    private getCompressedFileName(originalName: string, format: string): string {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        return `${nameWithoutExt}_compressed.${format}`;
    }

    // Batch compress multiple files
    async compressMultiple(
        files: File[],
        options?: Partial<CompressionOptions>
    ): Promise<CompressionResult[]> {
        const results: CompressionResult[] = [];

        for (const file of files) {
            try {
                const result = await this.compressAudio(file, options);
                results.push(result);
            } catch (error) {
                console.error(`Failed to compress ${file.name}:`, error);
                // Add original file as fallback
                results.push({
                    compressedFile: file,
                    originalSize: file.size,
                    compressedSize: file.size,
                    compressionRatio: 1,
                    format: file.type
                });
            }
        }

        return results;
    }

    // Get compression statistics
    getCompressionStats(results: CompressionResult[]): {
        totalOriginalSize: number;
        totalCompressedSize: number;
        averageCompressionRatio: number;
        totalSavings: number;
    } {
        const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
        const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
        const totalSavings = totalOriginalSize - totalCompressedSize;

        return {
            totalOriginalSize,
            totalCompressedSize,
            averageCompressionRatio,
            totalSavings
        };
    }

    // Cleanup resources
    cleanup(): void {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(error => {
                console.warn('Failed to close AudioContext:', error);
            });
        }
    }
}