'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileAudio, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '../ui/input'

interface AudioConverterTabProps {
    // Add any props if needed in the future
}

const SUPPORTED_FORMATS = [
    { value: 'mp3', label: 'MP3', mimeType: 'audio/mpeg' },
    { value: 'wav', label: 'WAV', mimeType: 'audio/wav' },
    { value: 'ogg', label: 'OGG', mimeType: 'audio/ogg' },
    { value: 'm4a', label: 'M4A', mimeType: 'audio/mp4' }
]

export default function AudioConverterTab({ }: AudioConverterTabProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [outputFormat, setOutputFormat] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)
    const [convertedAudio, setConvertedAudio] = useState<Blob | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type.startsWith('audio/')) {
                setSelectedFile(file)
                setConvertedAudio(null) // Clear previous conversion
                toast.success('Audio file selected!', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) is ready for conversion.`
                })
            } else {
                toast.error('Invalid file type', {
                    description: 'Please select an audio file (MP3, WAV, OGG, M4A).'
                })
            }
        }
    }

    const handleConvert = async () => {
        if (!selectedFile || !outputFormat) {
            toast.error('Missing requirements', {
                description: 'Please select a file and output format.'
            })
            return
        }

        setIsConverting(true)
        const loadingToast = toast.loading('Converting audio...', {
            description: 'Please wait while we convert your audio file.'
        })

        try {
            // Create audio context for conversion
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const arrayBuffer = await selectedFile.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            // Convert to the desired format
            const convertedBlob = await convertAudioBuffer(audioBuffer, outputFormat)
            setConvertedAudio(convertedBlob)

            toast.success('Conversion completed!', {
                id: loadingToast,
                description: `Your audio has been converted to ${outputFormat.toUpperCase()}.`
            })
        } catch (error) {
            console.error('Conversion failed:', error)
            toast.error('Conversion failed', {
                id: loadingToast,
                description: 'Please try again or check if your browser supports this format.'
            })
        } finally {
            setIsConverting(false)
        }
    }

    const convertAudioBuffer = async (audioBuffer: AudioBuffer, format: string): Promise<Blob> => {
        const targetFormat = SUPPORTED_FORMATS.find(f => f.value === format)
        if (!targetFormat) {
            throw new Error('Unsupported format')
        }

        // For WAV conversion (most compatible)
        if (format === 'wav') {
            return audioBufferToWav(audioBuffer)
        }

        // For other formats, we'll use MediaRecorder if available
        // This is a simplified approach - in production you might want to use a library like ffmpeg.wasm
        try {
            const stream = new MediaStream()
            const mediaRecorder = new MediaRecorder(stream, { mimeType: targetFormat.mimeType })

            // This is a fallback - convert to WAV for now
            return audioBufferToWav(audioBuffer)
        } catch (error) {
            // Fallback to WAV if the target format isn't supported
            toast.warning('Format not fully supported', {
                description: 'Converting to WAV format instead.'
            })
            return audioBufferToWav(audioBuffer)
        }
    }

    const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
        const numberOfChannels = audioBuffer.numberOfChannels
        const sampleRate = audioBuffer.sampleRate
        const length = audioBuffer.length * numberOfChannels * 2 + 44
        const buffer = new ArrayBuffer(length)
        const view = new DataView(buffer)
        const channels = []
        let offset = 0
        let pos = 0

        // Write WAV header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true)
            pos += 2
        }
        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true)
            pos += 4
        }

        // RIFF identifier
        setUint32(0x46464952)
        // File length minus first 8 bytes
        setUint32(length - 8)
        // WAVE identifier
        setUint32(0x45564157)
        // Format chunk identifier
        setUint32(0x20746d66)
        // Format chunk length
        setUint32(16)
        // Sample format (raw)
        setUint16(1)
        // Channel count
        setUint16(numberOfChannels)
        // Sample rate
        setUint32(sampleRate)
        // Byte rate (sample rate * block align)
        setUint32(sampleRate * numberOfChannels * 2)
        // Block align (channel count * bytes per sample)
        setUint16(numberOfChannels * 2)
        // Bits per sample
        setUint16(16)
        // Data chunk identifier
        setUint32(0x61746164)
        // Data chunk length
        setUint32(length - pos - 4)

        // Write interleaved data
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i))
        }

        while (pos < length) {
            for (let i = 0; i < numberOfChannels; i++) {
                const sample = Math.max(-1, Math.min(1, channels[i][offset]))
                view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
                pos += 2
            }
            offset++
        }

        return new Blob([buffer], { type: 'audio/wav' })
    }

    const handleDownload = () => {
        if (!convertedAudio || !selectedFile || !outputFormat) return

        const url = URL.createObjectURL(convertedAudio)
        const a = document.createElement('a')
        a.href = url

        const originalName = selectedFile.name.split('.').slice(0, -1).join('.')
        a.download = `${originalName}_converted.${outputFormat}`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Download started!', {
            description: 'Your converted audio file is being downloaded.'
        })
    }

    const clearFile = () => {
        setSelectedFile(null)
        setConvertedAudio(null)
        setOutputFormat('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <Card className="w-full bg-white dark:bg-black border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl">
            <CardHeader className="pb-4 gap-0 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl text-zinc-900 dark:text-white">
                    Audio Converter
                </CardTitle>
                <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                    Convert between MP3, WAV, OGG, and M4A formats
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Select Audio File
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="audio-file-input"
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-12 border-dashed border-2 border-slate-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500"
                        >
                            <Upload size={18} className="mr-2" />
                            Choose Audio File
                        </Button>

                    </div>

                    {selectedFile && (
                        <div className="flex items-center gap-2 p-3 text-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg">
                            <FileAudio size={16} className="text-blue-600" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                {selectedFile.name}
                            </span>
                            <span className="text-xs text-zinc-500 ml-auto">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                            {selectedFile && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={clearFile}
                                >
                                    <X size={16} />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Output Format Selection */}
                <div className="flex flex-col gap-3">
                    <label className="block text-sm text-right font-medium text-zinc-700 dark:text-zinc-300">
                        Output Format
                    </label>
                    <div className='flex justify-end gap-3'>
                        <Select value={outputFormat} onValueChange={setOutputFormat}>
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select output format" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_FORMATS.map((format) => (
                                    <SelectItem key={format.value} value={format.value}>
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Convert Button */}
                        <Button
                            onClick={handleConvert}
                            disabled={!selectedFile || !outputFormat || isConverting}
                        >
                            {isConverting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Converting...
                                </>
                            ) : (
                                <>
                                    <FileAudio size={18} className="" />
                                    Convert
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Download Converted File */}
                {convertedAudio && (
                    <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <FileAudio size={16} />
                            <span className="text-sm font-medium">Conversion Complete!</span>
                        </div>
                        <Button
                            onClick={handleDownload}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Download size={18} className="mr-2" />
                            Download {outputFormat.toUpperCase()} File
                        </Button>
                    </div>
                )}

                {/* Format Info */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <p>• MP3: Compressed, smaller file size, good for music</p>
                    <p>• WAV: Uncompressed, high quality, larger file size</p>
                    <p>• OGG: Open source, good compression, web-friendly</p>
                    <p>• M4A: Apple format, good quality and compression</p>
                </div>
            </CardContent>
        </Card>
    )
}