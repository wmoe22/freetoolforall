'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileAudio, Pause, Play, Scissors, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface AudioTrimmerTabProps {
    // Add any props if needed in the future
}

export default function AudioTrimmerTab({ }: AudioTrimmerTabProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [startTime, setStartTime] = useState(0)
    const [endTime, setEndTime] = useState(0)
    const [trimmedAudio, setTrimmedAudio] = useState<Blob | null>(null)
    const [isTrimming, setIsTrimming] = useState(false)

    const audioRef = useRef<HTMLAudioElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => {
            setDuration(audio.duration)
            setEndTime(audio.duration)
        }
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [audioUrl])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type.startsWith('audio/')) {
                setSelectedFile(file)
                const url = URL.createObjectURL(file)
                setAudioUrl(url)
                setTrimmedAudio(null)
                setStartTime(0)
                setEndTime(0)
                toast.success('Audio file loaded!', {
                    description: `${file.name} is ready for trimming.`
                })
            } else {
                toast.error('Invalid file type', {
                    description: 'Please select an audio file (MP3, WAV, M4A, etc.).'
                })
            }
        }
    }

    const togglePlayPause = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play()
            setIsPlaying(true)
        }
    }

    const handleSeek = (time: number) => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = time
        setCurrentTime(time)
    }

    const setStartMarker = () => {
        setStartTime(currentTime)
        toast.info('Start marker set', {
            description: `Start time: ${formatTime(currentTime)}`
        })
    }

    const setEndMarker = () => {
        setEndTime(currentTime)
        toast.info('End marker set', {
            description: `End time: ${formatTime(currentTime)}`
        })
    }

    const handleTrim = async () => {
        if (!selectedFile || !audioUrl || startTime >= endTime) {
            toast.error('Invalid trim selection', {
                description: 'Please set valid start and end markers.'
            })
            return
        }

        setIsTrimming(true)
        const loadingToast = toast.loading('Trimming audio...', {
            description: 'Please wait while we process your audio.'
        })

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const arrayBuffer = await selectedFile.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            const sampleRate = audioBuffer.sampleRate
            const startSample = Math.floor(startTime * sampleRate)
            const endSample = Math.floor(endTime * sampleRate)
            const trimmedLength = endSample - startSample

            // Create new audio buffer with trimmed length
            const trimmedBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                trimmedLength,
                sampleRate
            )

            // Copy the trimmed portion
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel)
                const trimmedChannelData = trimmedBuffer.getChannelData(channel)

                for (let i = 0; i < trimmedLength; i++) {
                    trimmedChannelData[i] = channelData[startSample + i]
                }
            }

            // Convert to WAV blob
            const trimmedBlob = audioBufferToWav(trimmedBuffer)
            setTrimmedAudio(trimmedBlob)

            toast.success('Audio trimmed successfully!', {
                id: loadingToast,
                description: `Trimmed from ${formatTime(startTime)} to ${formatTime(endTime)}`
            })
        } catch (error) {
            console.error('Trimming failed:', error)
            toast.error('Trimming failed', {
                id: loadingToast,
                description: 'Please try again or check your browser compatibility.'
            })
        } finally {
            setIsTrimming(false)
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
        if (!trimmedAudio || !selectedFile) return

        const url = URL.createObjectURL(trimmedAudio)
        const a = document.createElement('a')
        a.href = url

        const originalName = selectedFile.name.split('.').slice(0, -1).join('.')
        a.download = `${originalName}_trimmed.wav`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Download started!', {
            description: 'Your trimmed audio file is being downloaded.'
        })
    }

    const clearFile = () => {
        setSelectedFile(null)
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
        setTrimmedAudio(null)
        setStartTime(0)
        setEndTime(0)
        setCurrentTime(0)
        setDuration(0)
        setIsPlaying(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getProgressPercentage = (time: number): number => {
        return duration > 0 ? (time / duration) * 100 : 0
    }

    return (
        <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl">
            <CardHeader className="pb-4 gap-0 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">
                    Audio Trimmer
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Trim and cut audio files to your desired length
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select Audio File
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="audio-trimmer-input"
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-12 border-dashed border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
                        >
                            <Upload size={18} className="mr-2" />
                            Choose Audio File
                        </Button>
                        {selectedFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFile}
                                className="text-slate-500 hover:text-red-500"
                            >
                                <X size={16} />
                            </Button>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <FileAudio size={16} className="text-blue-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                {selectedFile.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-auto">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        </div>
                    )}
                </div>

                {/* Audio Player */}
                {audioUrl && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <audio ref={audioRef} src={audioUrl} preload="metadata" />

                        {/* Play Controls */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={togglePlayPause}
                                className="w-12 h-12"
                            >
                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </Button>

                            <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Waveform/Progress Bar */}
                        <div className="relative">
                            <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                                {/* Progress bar */}
                                <div
                                    className="h-full bg-blue-500 transition-all duration-100"
                                    style={{ width: `${getProgressPercentage(currentTime)}%` }}
                                />

                                {/* Start marker */}
                                {startTime > 0 && (
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-green-500"
                                        style={{ left: `${getProgressPercentage(startTime)}%` }}
                                    />
                                )}

                                {/* End marker */}
                                {endTime > 0 && endTime < duration && (
                                    <div
                                        className="absolute top-0 bottom-0 w-1 bg-red-500"
                                        style={{ left: `${getProgressPercentage(endTime)}%` }}
                                    />
                                )}

                                {/* Clickable overlay */}
                                <div
                                    className="absolute inset-0 cursor-pointer"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const clickX = e.clientX - rect.left
                                        const percentage = clickX / rect.width
                                        const newTime = percentage * duration
                                        handleSeek(newTime)
                                    }}
                                />
                            </div>

                            {/* Time markers */}
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>0:00</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Trim Controls */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={setStartMarker}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                                Set Start ({formatTime(startTime)})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={setEndMarker}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                                Set End ({formatTime(endTime)})
                            </Button>
                        </div>

                        {/* Trim Button */}
                        <Button
                            onClick={handleTrim}
                            disabled={startTime >= endTime || isTrimming}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isTrimming ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Trimming...
                                </>
                            ) : (
                                <>
                                    <Scissors size={18} className="mr-2" />
                                    Trim Audio ({formatTime(Math.abs(endTime - startTime))})
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Download Trimmed Audio */}
                {trimmedAudio && (
                    <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Scissors size={16} />
                            <span className="text-sm font-medium">Audio Trimmed Successfully!</span>
                        </div>
                        <Button
                            onClick={handleDownload}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Download size={18} className="mr-2" />
                            Download Trimmed Audio
                        </Button>
                    </div>
                )}

                {/* Instructions */}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>• Click on the progress bar to seek to a specific time</p>
                    <p>• Use "Set Start" and "Set End" to mark your trim points</p>
                    <p>• Green line = start marker, Red line = end marker</p>
                    <p>• Trimmed audio will be exported as WAV format</p>
                </div>
            </CardContent>
        </Card>
    )
}