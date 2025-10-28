'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import VoiceModelSelector from '@/components/voice-model-selector'
import { VoiceModel } from '@/types/voice-models'
import { Download, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react'

const ICON_SIZE = 15

interface TextToSpeechTabProps {
    textInput: string
    setTextInput: (text: string) => void
    selectedVoiceModel: VoiceModel | null
    setSelectedVoiceModel: (model: VoiceModel | null) => void
    showVoiceSelector: boolean
    setShowVoiceSelector: (show: boolean) => void
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
    showVoiceSelector,
    setShowVoiceSelector,
    isPlaying,
    speechCompleted,
    handleTextToSpeech,
    handleStopSpeech,
    handleDownloadAudio
}: TextToSpeechTabProps) {
    return (
        <Card className="border-0 bg-white dark:bg-black shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
            <CardHeader className="pb-4  sm:pb-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="min-w-0">
                            <CardTitle className="text-md sm:text-lg lg:text-xl text-zinc-900 dark:text-white">Text to Speech</CardTitle>
                            <CardDescription className="text-zinc-600 dark:text-zinc-400  ">
                                <span className="hidden sm:inline text-xs sm:text-sm ">Natural voice synthesis with customizable AI voice models</span>
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                    >
                        <Settings size={ICON_SIZE} className="mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{showVoiceSelector ? 'Hide Voice Selector' : 'Choose Voice Model'}</span>
                        <span className="sm:hidden">{showVoiceSelector ? 'Hide Voices' : 'Choose Voice'}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6">
                {/* Voice Model Selector */}
                {showVoiceSelector && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6 text-zinc-50 dark:text-zinc-800/50">
                        <VoiceModelSelector
                            onModelSelect={(model) => {
                                setSelectedVoiceModel(model)
                                setShowVoiceSelector(false)
                            }}
                            selectedModel={selectedVoiceModel}
                        />
                    </div>
                )}

                {/* Selected Voice Display */}
                {selectedVoiceModel && !showVoiceSelector && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                                <Volume2 size={16} className="text-white sm:hidden" />
                                <Volume2 size={20} className="text-white hidden sm:block" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base truncate">
                                    {selectedVoiceModel.metadata?.display_name || selectedVoiceModel.name}
                                </p>
                                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 truncate">
                                    {selectedVoiceModel.gender} • {selectedVoiceModel.provider}
                                    <span className="hidden sm:inline"> • {selectedVoiceModel.metadata?.accent}</span>
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVoiceModel(null)}
                            className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-xs sm:text-sm w-full sm:w-auto"
                        >
                            Change Voice
                        </Button>
                    </div>
                )}

                <div className="relative">
                    <Textarea
                        placeholder="Type or paste your text here. The AI will convert it to natural-sounding speech using your selected voice model..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base lg:text-md font-mono  leading-relaxed text-zinc-50 dark:text-zinc-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 p-4 sm:p-6"
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
                    <div className="text-zinc-50 dark:text-zinc-800/50 rounded-lg p-3 sm:p-4 space-y-2">
                        <h4 className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base">Voice Model Details:</h4>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
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
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">Text-to-Speech Tips:</h4>
                    <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
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