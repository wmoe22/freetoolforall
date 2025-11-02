'use client'

import SimpleVoiceSelector from '@/components/simple-voice-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { VoiceModel } from '@/types/voice-models'
import { Download, RotateCcw, Volume2, VolumeX } from 'lucide-react'

const ICON_SIZE = 15

interface TextToSpeechTabProps {
    textInput: string
    setTextInput: (text: string) => void
    selectedVoiceModel: VoiceModel | null
    setSelectedVoiceModel: (model: VoiceModel | null) => void
    isPlaying: boolean
    speechCompleted: boolean
    handleTextToSpeech: () => void
    handleStopSpeech: () => void
    handleDownloadAudio: () => void
}

export default function TextToSpeechTab({
    textInput,
    setTextInput,
    selectedVoiceModel,
    setSelectedVoiceModel,
    isPlaying,
    speechCompleted,
    handleTextToSpeech,
    handleStopSpeech,
    handleDownloadAudio
}: TextToSpeechTabProps) {
    return (
        <Card className="border border-zinc-700 bg-zinc-800 shadow-xl shadow-zinc-950/20">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="min-w-0">
                            <CardTitle className="text-md sm:text-lg lg:text-xl text-white">Text to Speech</CardTitle>
                            <CardDescription className="text-zinc-400">
                                <span className="hidden sm:inline text-xs sm:text-sm">Natural voice synthesis with customizable AI voice models</span>
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6">
                {/* Voice Model Selector */}
                <SimpleVoiceSelector
                    onModelSelect={setSelectedVoiceModel}
                    selectedModel={selectedVoiceModel}
                />

                <div className="relative">
                    <Textarea
                        placeholder="Type or paste your text here. The AI will convert it to natural-sounding speech using your selected voice model..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base lg:text-md font-mono leading-relaxed text-zinc-200 bg-zinc-800 border-zinc-700 focus:border-blue-500 p-4 sm:p-6"
                    />
                    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs sm:text-sm text-zinc-400">
                        {textInput.length} characters
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                        onClick={isPlaying ? handleStopSpeech : handleTextToSpeech}
                        disabled={!textInput.trim()}
                    >
                        {isPlaying ? (
                            <>
                                <VolumeX size={20} className="mr-2 sm:mr-3 lg:mr-4" />
                                <span className="hidden sm:inline">Stop Speaking</span>
                                <span className="sm:hidden">Stop</span>
                            </>
                        ) : (
                            <>
                                <Volume2 size={20} className="mr-2 sm:mr-3 lg:mr-4" />
                                <span className="hidden lg:inline">
                                    {selectedVoiceModel
                                        ? `Speak with ${selectedVoiceModel.metadata?.display_name || selectedVoiceModel.name}`
                                        : 'Generate Speech'
                                    }
                                </span>
                                <span className="lg:hidden">
                                    {selectedVoiceModel ? 'Speak' : 'Generate Speech'}
                                </span>
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={() => setTextInput('')}
                        disabled={isPlaying}
                    >
                        <RotateCcw size={20} className="sm:mr-2" />
                        <span className="hidden sm:inline">Clear</span>
                    </Button>

                    {textInput.trim() && speechCompleted && (
                        <Button
                            onClick={handleDownloadAudio}
                            disabled={isPlaying}
                        >
                            <Download size={ICON_SIZE} className="mr-2" />
                            Download Audio
                        </Button>
                    )}
                </div>

                {/* Audio Actions */}


                {/* Voice Model Quick Info */}
                {selectedVoiceModel && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 sm:p-4 space-y-2">
                        <h4 className="font-medium text-white text-sm sm:text-base">Voice Model Details:</h4>
                        <div className="text-xs sm:text-sm text-zinc-400 space-y-1">
                            <p><strong>Description:</strong> {selectedVoiceModel.description}</p>
                            {selectedVoiceModel.metadata?.tags && (
                                <p><strong>Characteristics:</strong> {selectedVoiceModel.metadata.tags.slice(0, 4).join(', ')}</p>
                            )}
                            {selectedVoiceModel.metadata?.use_cases && (
                                <p className="hidden sm:block"><strong>Best for:</strong> {selectedVoiceModel.metadata.use_cases.join(', ')}</p>
                            )}
                            {selectedVoiceModel.languages && (
                                <p className="hidden sm:block"><strong>Languages:</strong> {selectedVoiceModel.languages.join(', ')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* TTS Tips */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Text-to-Speech Tips:</h4>
                    <ul className="text-xs sm:text-sm text-zinc-400 space-y-1">
                        <li>• Choose a voice model that matches your content type</li>
                        <li>• Use punctuation for natural pauses and intonation</li>
                        <li className="hidden sm:list-item">• Shorter sentences often sound more natural</li>
                        <li className="hidden sm:list-item">• Download audio files to save and share your speech</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}