'use client'

import AudioConverterTab from '@/components/speech/AudioConverterTab'
import AudioTrimmerTab from '@/components/speech/AudioTrimmerTab'
import SpeechToTextTab from '@/components/speech/SpeechToTextTab'
import SubtitleGeneratorTab from '@/components/speech/SubtitleGeneratorTab'
import TextToSpeechTab from '@/components/speech/TextToSpeechTab'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SpeechService } from '@/lib/speech-service'
import { useStore } from '@/store/useStore'
import { VoiceModel } from '@/types/voice-models'
import { AudioWaveform, FileText, Scissors, Upload, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const ICON_SIZE = 15

interface VoiceHubProps {
    // Props passed from parent component
}

export default function VoiceHub({ }: VoiceHubProps) {
    const {
        transcript,
        isPlaying,
        setTranscript,
        setPlaying
    } = useStore()

    const [speechService] = useState(() => new SpeechService())
    const [textInput, setTextInput] = useState('')
    const [selectedVoiceModel, setSelectedVoiceModel] = useState<VoiceModel | null>(null)
    const [showVoiceSelector, setShowVoiceSelector] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false)

    const handleTextToSpeech = async () => {
        if (!textInput.trim()) return

        try {
            setPlaying(true)
            toast.success('Playing speech...', {
                description: selectedVoiceModel
                    ? `Using ${selectedVoiceModel.metadata?.display_name || selectedVoiceModel.name}`
                    : 'Using default voice'
            })

            if (selectedVoiceModel) {
                await speechService.textToSpeechWithModel(textInput, selectedVoiceModel)
            } else {
                await speechService.textToSpeech(textInput)
            }
        } catch (error) {
            console.error('Failed to play speech:', error)
            toast.error('Speech playback failed', {
                description: 'Please try again or check your audio settings.'
            })
        } finally {
            setPlaying(false)
        }
    }

    const handleStopSpeech = () => {
        speechSynthesis.cancel()
        setPlaying(false)
        toast.info('Speech stopped', {
            description: 'Audio playback has been stopped.'
        })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!', {
            description: 'Text has been copied to your clipboard.'
        })
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'video/webm') {
                setSelectedFile(file)
                toast.success('File selected!', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) is ready for transcription.`
                })
            } else {
                toast.error('Invalid file type', {
                    description: 'Please select an audio file (mp3, wav, m4a, etc.) or video file (mp4, webm).'
                })
            }
        }
    }

    const handleFileTranscription = async () => {
        if (!selectedFile) return

        setIsTranscribing(true)

        const loadingToast = toast.loading('Transcribing audio file...', {
            description: 'Please wait while we process your audio file.'
        })

        try {
            const transcriptResult = await speechService.transcribeFile(selectedFile)
            setTranscript(transcriptResult)

            toast.success('Transcription completed!', {
                id: loadingToast,
                description: 'Your audio has been successfully transcribed.'
            })
        } catch (error) {
            console.error('Failed to transcribe file:', error)

            toast.error('Transcription failed', {
                id: loadingToast,
                description: 'Please check your internet connection and try again.'
            })
        } finally {
            setIsTranscribing(false)
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setTranscript('')
    }

    const handleDownloadAudio = async () => {
        if (!textInput.trim()) return

        const loadingToast = toast.loading('Generating audio file...', {
            description: 'Please wait while we create your audio file.'
        })

        try {
            const audioBlob = await speechService.generateAudioBlob(textInput, selectedVoiceModel)

            const url = URL.createObjectURL(audioBlob)
            const a = document.createElement('a')
            a.href = url

            const isAudio = audioBlob.type.startsWith('audio/')
            const extension = isAudio ? 'wav' : 'txt'
            const filename = `speech-${Date.now()}.${extension}`

            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success(isAudio ? 'Audio downloaded!' : 'Text file downloaded!', {
                id: loadingToast,
                description: isAudio
                    ? 'Your audio file has been saved to your downloads folder.'
                    : 'Audio generation failed, but text content has been saved.'
            })
        } catch (error) {
            console.error('Failed to download audio:', error)
            toast.error('Download failed', {
                id: loadingToast,
                description: 'Please try again or check your internet connection.'
            })
        }
    }

    return (
        <div className="space-y-6">
            <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                <CardContent>
                    <Tabs defaultValue="speech-to-text" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-6" role="tablist" aria-label="Voice tools">
                            <TabsTrigger
                                value="speech-to-text"
                                role="tab"
                                aria-controls="speech-to-text-panel"
                                className="text-xs sm:text-sm py-1 sm:py-1.5"
                            >
                                <Upload size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                                <span className="hidden xs:inline">Speech to Text</span>
                                <span className="xs:hidden">STT</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="text-to-speech"
                                role="tab"
                                aria-controls="text-to-speech-panel"
                                className="text-xs sm:text-sm py-1 sm:py-1.5"
                            >
                                <Volume2 size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                                <span className="hidden xs:inline">Text to Speech</span>
                                <span className="xs:hidden">TTS</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="audio-converter"
                                role="tab"
                                aria-controls="audio-converter-panel"
                                className="text-xs sm:text-sm py-1 sm:py-1.5"
                            >
                                <AudioWaveform size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                                <span className="hidden xs:inline">Audio Converter</span>
                                <span className="xs:hidden">Convert</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="subtitle-generator"
                                role="tab"
                                aria-controls="subtitle-generator-panel"
                                className="text-xs sm:text-sm py-1 sm:py-1.5"
                            >
                                <FileText size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                                <span className="hidden xs:inline">Subtitle Generator</span>
                                <span className="xs:hidden">Subs</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="audio-trimmer"
                                role="tab"
                                aria-controls="audio-trimmer-panel"
                                className="text-xs sm:text-sm py-1 sm:py-1.5"
                            >
                                <Scissors size={ICON_SIZE} className="mr-1 sm:mr-2" aria-hidden="true" />
                                <span className="hidden xs:inline">Audio Trimmer</span>
                                <span className="xs:hidden">Trim</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Speech to Text Tab */}
                        <TabsContent
                            value="speech-to-text"
                            className="mt-0"
                            role="tabpanel"
                            id="speech-to-text-panel"
                            aria-labelledby="speech-to-text-tab"
                        >
                            <SpeechToTextTab
                                selectedFile={selectedFile}
                                isTranscribing={isTranscribing}
                                transcript={transcript}
                                handleFileSelect={handleFileSelect}
                                handleFileTranscription={handleFileTranscription}
                                clearFile={clearFile}
                                copyToClipboard={copyToClipboard}
                                setTranscript={setTranscript}
                                setTextInput={setTextInput}
                            />
                        </TabsContent>

                        {/* Text to Speech Tab */}
                        <TabsContent
                            value="text-to-speech"
                            className="mt-0"
                            role="tabpanel"
                            id="text-to-speech-panel"
                            aria-labelledby="text-to-speech-tab"
                        >
                            <TextToSpeechTab
                                textInput={textInput}
                                setTextInput={setTextInput}
                                selectedVoiceModel={selectedVoiceModel}
                                setSelectedVoiceModel={setSelectedVoiceModel}
                                showVoiceSelector={showVoiceSelector}
                                setShowVoiceSelector={setShowVoiceSelector}
                                isPlaying={isPlaying}
                                handleTextToSpeech={handleTextToSpeech}
                                handleStopSpeech={handleStopSpeech}
                                handleDownloadAudio={handleDownloadAudio}
                            />
                        </TabsContent>

                        {/* Audio Converter Tab */}
                        <TabsContent
                            value="audio-converter"
                            role="tabpanel"
                            id="audio-converter-panel"
                            aria-labelledby="audio-converter-tab"
                        >
                            <AudioConverterTab />
                        </TabsContent>

                        {/* Subtitle Generator Tab */}
                        <TabsContent
                            value="subtitle-generator"
                            className="mt-0"
                            role="tabpanel"
                            id="subtitle-generator-panel"
                            aria-labelledby="subtitle-generator-tab"
                        >
                            <SubtitleGeneratorTab />
                        </TabsContent>

                        {/* Audio Trimmer Tab */}
                        <TabsContent
                            value="audio-trimmer"
                            className="mt-0"
                            role="tabpanel"
                            id="audio-trimmer-panel"
                            aria-labelledby="audio-trimmer-tab"
                        >
                            <AudioTrimmerTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}