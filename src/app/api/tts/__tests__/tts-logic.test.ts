/**
 * TTS Logic Tests
 * Testing the core TTS functionality without Next.js dependencies
 */

// Mock Sentry
const mockCaptureException = jest.fn()
jest.mock('@sentry/nextjs', () => ({
    captureException: mockCaptureException,
}))

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Rate limiting logic (extracted from route)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const key = `tts_${ip}`
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

// TTS validation logic (extracted from route)
function validateTTSInput(text: string, format: string) {
    const errors: string[] = []

    if (!text || typeof text !== 'string') {
        errors.push('Text is required and must be a string')
    } else if (text.trim().length === 0) {
        errors.push('Text cannot be empty')
    } else if (text.length > 5000) {
        errors.push('Text too long. Maximum length is 5000 characters.')
    }

    const allowedFormats = ['mp3', 'wav']
    if (!allowedFormats.includes(format)) {
        errors.push('Invalid format. Supported formats: mp3, wav')
    }

    return errors
}

// Deepgram TTS function (extracted from route)
async function deepgramTTS(text: string, model: string = 'aura-asteria-en', format: string = 'mp3'): Promise<Response> {
    if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error('Deepgram API key not configured')
    }

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}&encoding=${format}&container=${format === 'wav' ? 'wav' : 'mp3'}&sample_rate=24000&bit_rate=128000`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Deepgram TTS failed: ${response.status} - ${errorText}`)
    }

    return response
}

describe('TTS Logic', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        mockCaptureException.mockClear()
        rateLimitMap.clear()
        process.env.DEEPGRAM_API_KEY = 'test-api-key'
    })

    describe('Rate Limiting', () => {
        it('allows requests within limit', () => {
            const result = checkRateLimit('127.0.0.1')
            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(19)
        })

        it('blocks requests exceeding limit', () => {
            const ip = '127.0.0.1'

            // Make 20 requests (at the limit)
            for (let i = 0; i < 20; i++) {
                checkRateLimit(ip)
            }

            // 21st request should be blocked
            const result = checkRateLimit(ip)
            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('resets after time window', () => {
            const ip = '127.0.0.1'

            // Exhaust the limit
            for (let i = 0; i < 20; i++) {
                checkRateLimit(ip)
            }

            // Manually reset the time (simulate time passing)
            rateLimitMap.set(`tts_${ip}`, { count: 20, resetTime: Date.now() - 1000 })

            const result = checkRateLimit(ip)
            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(19)
        })

        it('tracks different IPs separately', () => {
            const result1 = checkRateLimit('127.0.0.1')
            const result2 = checkRateLimit('192.168.1.1')

            expect(result1.allowed).toBe(true)
            expect(result2.allowed).toBe(true)
            expect(result1.remaining).toBe(19)
            expect(result2.remaining).toBe(19)
        })
    })

    describe('Input Validation', () => {
        it('validates correct input', () => {
            const errors = validateTTSInput('Hello world', 'mp3')
            expect(errors).toHaveLength(0)
        })

        it('rejects empty text', () => {
            const errors = validateTTSInput('   ', 'mp3')
            expect(errors).toContain('Text cannot be empty')
        })

        it('rejects missing text', () => {
            const errors = validateTTSInput('', 'mp3')
            expect(errors).toContain('Text is required and must be a string')
        })

        it('rejects non-string text', () => {
            const errors = validateTTSInput(null as any, 'mp3')
            expect(errors).toContain('Text is required and must be a string')
        })

        it('rejects text too long', () => {
            const longText = 'a'.repeat(5001)
            const errors = validateTTSInput(longText, 'mp3')
            expect(errors).toContain('Text too long. Maximum length is 5000 characters.')
        })

        it('rejects invalid format', () => {
            const errors = validateTTSInput('Hello world', 'invalid')
            expect(errors).toContain('Invalid format. Supported formats: mp3, wav')
        })

        it('accepts valid formats', () => {
            expect(validateTTSInput('Hello', 'mp3')).toHaveLength(0)
            expect(validateTTSInput('Hello', 'wav')).toHaveLength(0)
        })
    })

    describe('Deepgram TTS', () => {
        it('makes correct API call for MP3', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
                text: jest.fn()
            }
            mockFetch.mockResolvedValueOnce(mockResponse as any)

            await deepgramTTS('Hello world', 'aura-asteria-en', 'mp3')

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('https://api.deepgram.com/v1/speak'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Authorization': 'Token test-api-key',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: 'Hello world' })
                })
            )

            const url = mockFetch.mock.calls[0][0] as string
            expect(url).toContain('model=aura-asteria-en')
            expect(url).toContain('encoding=mp3')
            expect(url).toContain('container=mp3')
        })

        it('makes correct API call for WAV', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
                text: jest.fn()
            }
            mockFetch.mockResolvedValueOnce(mockResponse as any)

            await deepgramTTS('Hello world', 'aura-asteria-en', 'wav')

            const url = mockFetch.mock.calls[0][0] as string
            expect(url).toContain('encoding=wav')
            expect(url).toContain('container=wav')
        })

        it('throws error when API key is missing', async () => {
            delete process.env.DEEPGRAM_API_KEY

            await expect(deepgramTTS('Hello world')).rejects.toThrow('Deepgram API key not configured')
        })

        it('throws error on API failure', async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                text: jest.fn().mockResolvedValue('Bad request')
            }
            mockFetch.mockResolvedValueOnce(mockResponse as any)

            await expect(deepgramTTS('Hello world')).rejects.toThrow('Deepgram TTS failed: 400 - Bad request')
        })

        it('handles network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'))

            await expect(deepgramTTS('Hello world')).rejects.toThrow('Network error')
        })
    })
})