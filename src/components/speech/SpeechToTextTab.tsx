'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, FileAudio, Loader2, RotateCcw, Upload } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const ICON_SIZE = 15

interface SpeechToTextTabProps {
    selectedFile: File | null
    isTranscribing: boolean
    transcript: string
    handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    handleFileTranscription: () => void
    clearFile: () => void
    copyToClipboard: (text: string) => void
    setTranscript: (text: string) => void
    setTextInput: (text: string) => void
}

export default function SpeechToTextTab({
    selectedFile,
    isTranscribing,
    transcript,
    handleFileSelect,
    handleFileTranscription,
    clearFile,
    copyToClipboard,
    setTranscript,
    setTextInput
}: SpeechToTextTabProps) {
    return (
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                    <div className="min-w-0">
                        <CardTitle className="text-md sm:text-lg lg:text-xl text-slate-900 dark:text-white">Speech to Text</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 text-sm sm:text-base lg:text-md">
                            <span className="hidden sm:inline">Upload audio files for accurate transcription</span>
                            <span className="sm:hidden">Upload audio for transcription</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6">
                {/* File Upload Area */}
                <div className="relative">
                    <Input
                        type="file"
                        id="audio-upload"
                        accept="audio/*,video/mp4,video/webm"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isTranscribing}
                    />
                    <Label
                        htmlFor="audio-upload"
                        className={`flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${selectedFile
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                            } ${isTranscribing ? 'pointer-events-none opacity-60 animate-pulse' : ''}`}
                    >
                        {selectedFile ? (
                            <div className="text-center px-4">
                                <FileAudio size={32} className="text-blue-500 mx-auto mb-2 sm:hidden" />
                                <FileAudio size={48} className="text-blue-500 mx-auto mb-2 hidden sm:block" />
                                <p className="text-sm sm:text-lg font-medium text-blue-700 dark:text-blue-300 truncate max-w-full">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    <span className="hidden sm:inline"> • {selectedFile.type}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="text-center px-4">
                                <Upload size={20} className="text-slate-400 mx-auto mb-2 sm:hidden" />
                                <Upload size={24} className="text-slate-400 mx-auto mb-2 hidden sm:block" />
                                <p className="text-sm sm:text-lg font-medium text-slate-700 dark:text-slate-300">
                                    <span className="hidden sm:inline">Drop your audio file here or click to browse</span>
                                    <span className="sm:hidden">Tap to select audio file</span>
                                </p>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    <span className="hidden sm:inline">Supports MP3, WAV, M4A, MP4, WebM and more</span>
                                    <span className="sm:hidden">MP3, WAV, M4A, MP4, WebM</span>
                                </p>
                            </div>
                        )}
                    </Label>
                </div>

                {/* Action Buttons */}
                {selectedFile && (
                    <div className="flex flex-col sm:flex-row justify-center  gap-3 sm:gap-4">
                        <Button
                            onClick={handleFileTranscription}
                            disabled={isTranscribing || !!transcript}
                        >
                            {isTranscribing ? (
                                <>
                                    <Loader2 size={15} className="mr-2 sm:mr-3 lg:mr-4 animate-spin" />
                                    <span className="hidden sm:inline">Processing Audio...</span>
                                    <span className="sm:hidden">Processing...</span>
                                </>
                            ) : transcript ? (
                                <>
                                    <FileAudio size={15} className="mr-2 sm:mr-3 lg:mr-4" />
                                    <span className="hidden sm:inline">Already Transcribed</span>
                                    <span className="sm:hidden">Transcribed</span>
                                </>
                            ) : (
                                <>
                                    <FileAudio size={15} className="mr-2 sm:mr-3 lg:mr-4" />
                                    <span className="hidden sm:inline">Transcribe Audio</span>
                                    <span className="sm:hidden">Transcribe</span>
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={clearFile}
                            disabled={isTranscribing}
                        >
                            <RotateCcw size={20} className="sm:mr-2" />
                            <span className="hidden sm:inline">Clear</span>
                        </Button>
                    </div>
                )}



                {/* Transcript Display */}
                <div className="relative">
                    <div className="min-h-[150px] sm:min-h-[200px] p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">Transcript</p>
                            {transcript && (
                                <Button
                                    size="sm"
                                    variant={"outline"}
                                    onClick={() => copyToClipboard(transcript)}
                                >
                                    <Copy size={ICON_SIZE} className="mr-1 sm:mr-2" />
                                    Copy
                                </Button>
                            )}
                        </div>
                        <p className="text-slate-900 dark:text-white leading-relaxed text-sm sm:text-base lg:text-md">
                            {transcript || (
                                <>
                                    <span className="hidden sm:inline">Upload an audio file and click "Transcribe Audio" to see the transcript here...</span>
                                    <span className="sm:hidden">Upload audio file to see transcript here...</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Action Buttons for Transcript */}
                {transcript && (
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                        <Button
                            onClick={() => setTranscript('')}
                        >
                            <RotateCcw size={ICON_SIZE} className="mr-2" />
                            <span className="hidden sm:inline">Clear Transcript</span>
                            <span className="sm:hidden">Clear</span>
                        </Button>
                    </div>
                )}

                {/* Upload Tips */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">Upload Tips:</h4>
                    <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Supported formats: MP3, WAV, M4A, FLAC, MP4, WebM, and more</li>
                        <li>• Maximum file size: 25MB for optimal processing</li>
                        <li className="hidden sm:list-item">• Clear audio quality improves transcription accuracy</li>
                        <li className="hidden sm:list-item">• Processing time depends on file length and complexity</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}