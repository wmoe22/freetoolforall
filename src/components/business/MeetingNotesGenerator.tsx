'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Mic, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function MeetingNotesGenerator() {
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [meetingText, setMeetingText] = useState('')
    const [meetingTitle, setMeetingTitle] = useState('')
    const [attendees, setAttendees] = useState('')
    const [isProcessingNotes, setIsProcessingNotes] = useState(false)
    const [inputMethod, setInputMethod] = useState<'audio' | 'text'>('audio')

    const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setAudioFile(file)
        }
    }

    const handleGenerateMeetingNotes = async () => {
        if (inputMethod === 'audio' && !audioFile) {
            toast.error('Please select an audio file')
            return
        }
        if (inputMethod === 'text' && !meetingText.trim()) {
            toast.error('Please enter meeting text')
            return
        }

        setIsProcessingNotes(true)
        try {
            let transcript = meetingText

            // If using audio, first transcribe it
            if (inputMethod === 'audio' && audioFile) {
                const formData = new FormData()
                formData.append('audio', audioFile)

                const transcribeResponse = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                })

                if (!transcribeResponse.ok) throw new Error('Failed to transcribe audio')

                const transcribeResult = await transcribeResponse.json()
                transcript = transcribeResult.transcript
            }

            // Generate structured meeting notes
            const response = await fetch('/api/business/generate-meeting-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    meetingTitle,
                    attendees
                })
            })

            if (!response.ok) throw new Error('Failed to generate meeting notes')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `meeting_notes_${meetingTitle.replace(/\s+/g, '_') || 'untitled'}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Meeting notes generated successfully!')
        } catch (error) {
            console.error('Meeting notes generation failed:', error)
            toast.error('Failed to generate meeting notes. Please try again.')
        } finally {
            setIsProcessingNotes(false)
        }
    }

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Meeting Notes Generator</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Convert audio recordings or text into structured meeting notes using AI
                        </p>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                            Input Method
                        </h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                <input
                                    type="radio"
                                    name="inputMethod"
                                    checked={inputMethod === 'audio'}
                                    onChange={() => setInputMethod('audio')}
                                />
                                Audio Recording (Deepgram STT + Gemini AI)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                <input
                                    type="radio"
                                    name="inputMethod"
                                    checked={inputMethod === 'text'}
                                    onChange={() => setInputMethod('text')}
                                />
                                Text Input (Gemini AI)
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Meeting Title
                            </label>
                            <input
                                type="text"
                                value={meetingTitle}
                                onChange={(e) => setMeetingTitle(e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="e.g., Weekly Team Standup"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Attendees
                            </label>
                            <input
                                type="text"
                                value={attendees}
                                onChange={(e) => setAttendees(e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="John, Sarah, Mike"
                            />
                        </div>
                    </div>

                    {inputMethod === 'audio' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Audio Recording
                            </label>
                            <input
                                type="file"
                                onChange={handleAudioFileSelect}
                                accept="audio/*"
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300"
                            />
                            {audioFile && (
                                <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-700">
                                    <Mic size={16} className="text-purple-600" />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                        {audioFile.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Meeting Transcript/Notes
                            </label>
                            <textarea
                                value={meetingText}
                                onChange={(e) => setMeetingText(e.target.value)}
                                rows={6}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="Paste your meeting transcript or raw notes here..."
                            />
                        </div>
                    )}

                    <Button
                        onClick={handleGenerateMeetingNotes}
                        disabled={isProcessingNotes}
                        className="w-full"
                    >
                        {isProcessingNotes ? (
                            <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Processing Meeting Notes...
                            </>
                        ) : (
                            <>
                                <Download size={16} className="mr-2" />
                                Generate Meeting Notes
                            </>
                        )}
                    </Button>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            What you'll get:
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• Executive summary</li>
                            <li>• Key discussion points</li>
                            <li>• Action items with owners</li>
                            <li>• Decisions made</li>
                            <li>• Next steps and follow-ups</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}