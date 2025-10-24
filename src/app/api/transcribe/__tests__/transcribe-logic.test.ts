/**
 * Transcribe Logic Tests
 * Testing the core transcription functionality without Next.js dependencies
 */

// Mock Deepgram SDK
const mockTranscribeFile = jest.fn()
const mockCreateClient = jest.fn(() => ({
    listen: {
        prerecorded: {
            transcribeFile: mockTranscribeFile
        }
    }
}))

jest.mock('@deepgram/sdk', () => ({
    createClient: mockCreateClient
}))

// Mock Sentry
const mockCaptureException = jest.fn()
jest.mock('@sentry/nextjs', () => ({
    captureException: mockCaptureException,
}))

// Rate limiting logic (extracted from route)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const key = `transcribe_${ip}`
    const current = rateLimitMap.get(key)

    if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 }
    }

    current.count++
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count }
}

// File validation logic (extracted from route)
function validateAudioFile(file: { name: string; type: string; size: number }) {
    const errors: string[] = []

    if (!file) {
        errors.push('Audio file is required')
        return errors
    }

    // Check file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
        errors.push('File too large. Maximum size is 25MB.')
    }

    // Check file type
    const allowedTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a',
        'audio/flac', 'audio/ogg', 'video/mp4', 'video/webm'
    ]

    const hasValidType = allowedTypes.includes(file.type)
    const hasValidExtension = file.name.match(/\.(mp3|wav|m4a|flac|ogg|mp4|webm)$/i)

    if (!hasValidType && !hasValidExtension) {
        errors.push('Unsupported file type. Please use MP3, WAV, M4A, FLAC, OGG, MP4, or WebM.')
    }

    return errors
}

// Deepgram transcription logic (extracted from route)
async function transcribeWithDeepgram(buffer: Buffer, deepgramClient: any) {
    if (!deepgramClient) {
        throw new Error('Deepgram client not available')
    }

    const { result } = await deepgramClient.listen.prerecorded.transcribeFile(buffer, {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        paragraphs: true,
        punctuate: true,
        diarize: false,
        utterances: false,
    })

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    if (!transcript || transcript.trim().length === 0) {
        throw new Error('Empty transcript received from Deepgram')
    }

    return { transcript, confidence }
}

// Fallback transcription (extracted from route)
async function fallbackTranscription(buffer: Buffer): Promise<{ transcript: string; confidence: number }> {
    return {
        transcript: "Transcription service temporarily unavailable. Please try again later.",
        confidence: 0
    }
}

describe('Transcribe Logic', () => {
    beforeEach(() => {
        mockTranscribeFile.mockClear()
        mockCreateClient.mockClear()
        mockCaptureException.mockClear()
        rateLimitMap.clear()
        process.env.DEEPGRAM_API_KEY = 'test-api-key'
    })

    describe('Rate Limiting', () => {
        it('allows requests within limit', () => {
            const result = checkRateLimit('127.0.0.1')
            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(9)
        })

        it('blocks requests exceeding limit', () => {
            const ip = '127.0.0.1'

            // Make 10 requests (at the limit)
            for (let i = 0; i < 10; i++) {
                checkRateLimit(ip)
            }

            // 11th request should be blocked
            const result = checkRateLimit(ip)
            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('resets after time window', () => {
            const ip = '127.0.0.1'

            // Exhaust the limit
            for (let i = 0; i < 10; i++) {
                checkRateLimit(ip)
            }

            // Manually reset the time (simulate time passing)
            rateLimitMap.set(`transcribe_${ip}`, { count: 10, resetTime: Date.now() - 1000 })

            const result = checkRateLimit(ip)
            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(9)
        })
    })

    describe('File Validation', () => {
        it('validates correct audio file', () => {
            const file = { name: 'test.mp3', type: 'audio/mpeg', size: 1024 * 1024 }
            const errors = validateAudioFile(file)
            expect(errors).toHaveLength(0)
        })

        it('rejects missing file', () => {
            const errors = validateAudioFile(null as any)
            expect(errors).toContain('Audio file is required')
        })

        it('rejects file too large', () => {
            const file = { name: 'large.mp3', type: 'audio/mpeg', size: 26 * 1024 * 1024 }
            const errors = validateAudioFile(file)
            expect(errors).toContain('File too large. Maximum size is 25MB.')
        })

        it('rejects unsupported file type', () => {
            const file = { name: 'test.txt', type: 'text/plain', size: 1024 }
            const errors = validateAudioFile(file)
            expect(errors).toContain('Unsupported file type. Please use MP3, WAV, M4A, FLAC, OGG, MP4, or WebM.')
        })

        it('accepts files by extension when type is wrong', () => {
            const file = { name: 'test.mp3', type: 'application/octet-stream', size: 1024 }
            const errors = validateAudioFile(file)
            expect(errors).toHaveLength(0)
        })

        it('accepts all supported formats', () => {
            const supportedFormats = [
                { name: 'test.mp3', type: 'audio/mpeg' },
                { name: 'test.wav', type: 'audio/wav' },
                { name: 'test.m4a', type: 'audio/m4a' },
                { name: 'test.flac', type: 'audio/flac' },
                { name: 'test.ogg', type: 'audio/ogg' },
                { name: 'test.mp4', type: 'video/mp4' },
                { name: 'test.webm', type: 'video/webm' }
            ]

            supportedFormats.forEach(format => {
                const file = { ...format, size: 1024 }
                const errors = validateAudioFile(file)
                expect(errors).toHaveLength(0)
            })
        })
    })

    describe('Deepgram Transcription', () => {
        it('successfully transcribes audio', async () => {
            const mockResult = {
                result: {
                    results: {
                        channels: [{
                            alternatives: [{
                                transcript: 'Hello world test',
                                confidence: 0.95
                            }]
                        }]
                    }
                }
            }

            mockTranscribeFile.mockResolvedValueOnce(mockResult)
            const mockClient = mockCreateClient()
            const buffer = Buffer.from('fake audio data')

            const result = await transcribeWithDeepgram(buffer, mockClient)

            expect(result.transcript).toBe('Hello world test')
            expect(result.confidence).toBe(0.95)
            expect(mockTranscribeFile).toHaveBeenCalledWith(buffer, {
                model: 'nova-2',
                language: 'en-US',
                smart_format: true,
                paragraphs: true,
                punctuate: true,
                diarize: false,
                utterances: false,
            })
        })

        it('throws error for empty transcript', async () => {
            const mockResult = {
                result: {
                    results: {
                        channels: [{
                            alternatives: [{
                                transcript: '',
                                confidence: 0
                            }]
                        }]
                    }
                }
            }

            mockTranscribeFile.mockResolvedValueOnce(mockResult)
            const mockClient = mockCreateClient()
            const buffer = Buffer.from('fake audio data')

            await expect(transcribeWithDeepgram(buffer, mockClient)).rejects.toThrow('Empty transcript received from Deepgram')
        })

        it('throws error when client is not available', async () => {
            const buffer = Buffer.from('fake audio data')

            await expect(transcribeWithDeepgram(buffer, null)).rejects.toThrow('Deepgram client not available')
        })

        it('handles malformed response', async () => {
            const mockResult = { result: null }

            mockTranscribeFile.mockResolvedValueOnce(mockResult)
            const mockClient = mockCreateClient()
            const buffer = Buffer.from('fake audio data')

            await expect(transcribeWithDeepgram(buffer, mockClient)).rejects.toThrow('Empty transcript received from Deepgram')
        })

        it('handles API errors', async () => {
            mockTranscribeFile.mockRejectedValueOnce(new Error('Deepgram API error'))
            const mockClient = mockCreateClient()
            const buffer = Buffer.from('fake audio data')

            await expect(transcribeWithDeepgram(buffer, mockClient)).rejects.toThrow('Deepgram API error')
        })
    })

    describe('Fallback Transcription', () => {
        it('returns fallback message', async () => {
            const buffer = Buffer.from('fake audio data')
            const result = await fallbackTranscription(buffer)

            expect(result.transcript).toContain('temporarily unavailable')
            expect(result.confidence).toBe(0)
        })
    })
})