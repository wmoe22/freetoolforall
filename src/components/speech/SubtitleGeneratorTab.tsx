'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Download, FileText, FileVideo, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface SubtitleGeneratorTabProps {
    // Add any props if needed in the future
}

interface SubtitleSegment {
    start: number
    end: number
    text: string
}

const SUBTITLE_FORMATS = [
    { value: 'srt', label: 'SRT (SubRip)', extension: 'srt' },
    { value: 'vtt', label: 'WebVTT', extension: 'vtt' },
    { value: 'ass', label: 'ASS/SSA', extension: 'ass' }
]

export default function SubtitleGeneratorTab({ }: SubtitleGeneratorTabProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [subtitleFormat, setSubtitleFormat] = useState<string>('srt')
    const [isGenerating, setIsGenerating] = useState(false)
    const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([])
    const [subtitleText, setSubtitleText] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const isVideo = file.type.startsWith('video/')
            const isAudio = file.type.startsWith('audio/')

            if (isVideo || isAudio) {
                setSelectedFile(file)
                setSubtitles([])
                setSubtitleText('')
                toast.success('File selected!', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) is ready for subtitle generation.`
                })
            } else {
                toast.error('Invalid file type', {
                    description: 'Please select a video file (MP4, WebM, MOV) or audio file (MP3, WAV, etc.).'
                })
            }
        }
    }

    const handleGenerateSubtitles = async () => {
        if (!selectedFile) {
            toast.error('No file selected', {
                description: 'Please select a video or audio file first.'
            })
            return
        }

        setIsGenerating(true)
        const loadingToast = toast.loading('Generating subtitles...', {
            description: 'Transcribing audio and creating timestamps. This may take a few minutes.'
        })

        try {
            // Create FormData for the API request
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('response_format', 'verbose_json')
            formData.append('timestamp_granularities[]', 'word')

            // Call the transcription API
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            // Process the transcription data into subtitle segments
            const segments = processTranscriptionToSubtitles(data)
            setSubtitles(segments)

            // Generate subtitle text in the selected format
            const subtitleContent = formatSubtitles(segments, subtitleFormat)
            setSubtitleText(subtitleContent)

            toast.success('Subtitles generated!', {
                id: loadingToast,
                description: `Generated ${segments.length} subtitle segments. Ready for download.`
            })
        } catch (error) {
            console.error('Subtitle generation failed:', error)
            toast.error('Subtitle generation failed', {
                id: loadingToast,
                description: 'Please check your internet connection and try again.'
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const processTranscriptionToSubtitles = (transcriptionData: any): SubtitleSegment[] => {
        const segments: SubtitleSegment[] = []

        if (transcriptionData.words && transcriptionData.words.length > 0) {
            // Group words into subtitle segments (roughly 5-10 words per segment)
            const wordsPerSegment = 8
            const words = transcriptionData.words

            for (let i = 0; i < words.length; i += wordsPerSegment) {
                const segmentWords = words.slice(i, i + wordsPerSegment)
                const start = segmentWords[0].start
                const end = segmentWords[segmentWords.length - 1].end
                const text = segmentWords.map((w: any) => w.word).join(' ').trim()

                if (text) {
                    segments.push({ start, end, text })
                }
            }
        } else if (transcriptionData.segments && transcriptionData.segments.length > 0) {
            // Fallback to segments if words are not available
            transcriptionData.segments.forEach((segment: any) => {
                if (segment.text && segment.text.trim()) {
                    segments.push({
                        start: segment.start,
                        end: segment.end,
                        text: segment.text.trim()
                    })
                }
            })
        } else {
            // Fallback: create a single segment with the full text
            const fullText = transcriptionData.text || transcriptionData.transcript || ''
            if (fullText.trim()) {
                segments.push({
                    start: 0,
                    end: 30, // Default 30 seconds
                    text: fullText.trim()
                })
            }
        }

        return segments
    }

    const formatSubtitles = (segments: SubtitleSegment[], format: string): string => {
        switch (format) {
            case 'srt':
                return formatSRT(segments)
            case 'vtt':
                return formatVTT(segments)
            case 'ass':
                return formatASS(segments)
            default:
                return formatSRT(segments)
        }
    }

    const formatSRT = (segments: SubtitleSegment[]): string => {
        return segments.map((segment, index) => {
            const startTime = formatSRTTime(segment.start)
            const endTime = formatSRTTime(segment.end)
            return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
        }).join('\n')
    }

    const formatVTT = (segments: SubtitleSegment[]): string => {
        const header = 'WEBVTT\n\n'
        const content = segments.map((segment, index) => {
            const startTime = formatVTTTime(segment.start)
            const endTime = formatVTTTime(segment.end)
            return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
        }).join('\n')
        return header + content
    }

    const formatASS = (segments: SubtitleSegment[]): string => {
        const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
        const content = segments.map(segment => {
            const startTime = formatASSTime(segment.start)
            const endTime = formatASSTime(segment.end)
            return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${segment.text}`
        }).join('\n')

        return header + content
    }

    const formatSRTTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)
        const ms = Math.floor((seconds % 1) * 1000)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
    }

    const formatVTTTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)
        const ms = Math.floor((seconds % 1) * 1000)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
    }

    const formatASSTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
    }

    const handleDownload = () => {
        if (!subtitleText || !selectedFile) return

        const format = SUBTITLE_FORMATS.find(f => f.value === subtitleFormat)
        if (!format) return

        const blob = new Blob([subtitleText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        const originalName = selectedFile.name.split('.').slice(0, -1).join('.')
        a.download = `${originalName}_subtitles.${format.extension}`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Subtitles downloaded!', {
            description: `Your ${format.label} subtitle file has been saved.`
        })
    }

    const clearFile = () => {
        setSelectedFile(null)
        setSubtitles([])
        setSubtitleText('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl">
            <CardHeader className="pb-4 gap-0 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">
                    AI Subtitle Generator
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Upload video/audio → auto-generate and download subtitles (.srt, .vtt, .ass)
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select Video or Audio File
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="subtitle-file-input"
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-12 border-dashed border-2 border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500"
                        >
                            <Upload size={18} className="mr-2" />
                            Choose Video/Audio File
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
                            <FileVideo size={16} className="text-purple-600" />
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                {selectedFile.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-auto">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        </div>
                    )}
                </div>

                {/* Subtitle Format Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Subtitle Format
                    </label>
                    <Select value={subtitleFormat} onValueChange={setSubtitleFormat}>
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select subtitle format" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUBTITLE_FORMATS.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                    {format.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerateSubtitles}
                    disabled={!selectedFile || isGenerating}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Generating Subtitles...
                        </>
                    ) : (
                        <>
                            <FileText size={18} className="mr-2" />
                            Generate Subtitles
                        </>
                    )}
                </Button>

                {/* Subtitle Preview */}
                {subtitleText && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Generated Subtitles Preview
                        </label>
                        <Textarea
                            value={subtitleText}
                            onChange={(e) => setSubtitleText(e.target.value)}
                            className="min-h-[200px] font-mono text-xs"
                            placeholder="Generated subtitles will appear here..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            You can edit the subtitles above before downloading
                        </p>
                    </div>
                )}

                {/* Download Button */}
                {subtitleText && (
                    <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                            <FileText size={16} />
                            <span className="text-sm font-medium">
                                Subtitles Ready! ({subtitles.length} segments)
                            </span>
                        </div>
                        <Button
                            onClick={handleDownload}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Download size={18} className="mr-2" />
                            Download {SUBTITLE_FORMATS.find(f => f.value === subtitleFormat)?.label} File
                        </Button>
                    </div>
                )}

                {/* Format Info */}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>• SRT: Most compatible format, works with YouTube, VLC, most players</p>
                    <p>• WebVTT: Web standard, great for HTML5 video players</p>
                    <p>• ASS/SSA: Advanced format with styling support, used by anime community</p>
                    <p>• Perfect for YouTubers, educators, podcasters, and content creators</p>
                </div>
            </CardContent>
        </Card>
    )
}