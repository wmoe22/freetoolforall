/**
 * TTS Route Tests - Fixed Version
 * Testing the TTS route with proper Sentry mocking
 */

// Mock Sentry BEFORE importing the route
jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    withScope: jest.fn((callback) => callback({})),
    getCurrentHub: jest.fn(() => ({
        getClient: jest.fn(() => null)
    }))
}))

import { NextRequest } from 'next/server'

describe('TTS Route - Fixed Tests', () => {
    let POST: any
    let OPTIONS: any

    beforeAll(async () => {
        // Set up environment
        process.env.DEEPGRAM_API_KEY = 'test-deepgram-key'

        // Mock fetch globally
        global.fetch = jest.fn()

        // Import route handlers after mocking
        const routeModule = await import('../route')
        POST = routeModule.POST
        OPTIONS = routeModule.OPTIONS
    })

    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    describe('Successful TTS Generation', () => {
        it('should generate TTS successfully with valid input', async () => {
            // Mock successful Deepgram response
            const mockAudioBuffer = new ArrayBuffer(2048)
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
                })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world, this is a test.',
                    model: 'aura-asteria-en',
                    format: 'mp3'
                }),
                headers: new Map([
                    ['x-forwarded-for', '127.0.0.1']
                ])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const responseBuffer = await response.arrayBuffer()

            expect(response.status).toBe(200)
            expect(responseBuffer).toEqual(mockAudioBuffer)
            expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
            expect(response.headers.get('X-Service-Used')).toBe('deepgram')
            expect(response.headers.get('X-Text-Length')).toBe('27')
        })

        it('should handle WAV format correctly', async () => {
            const mockAudioBuffer = new ArrayBuffer(1024)
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
                })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Test WAV format',
                    format: 'wav'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe('audio/wav')

            // Check that the correct URL was called
            const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
            expect(fetchCall[0]).toContain('container=wav')
            expect(fetchCall[0]).toContain('encoding=wav')
        })
    })

    describe('Input Validation Errors', () => {
        it('should return 400 for missing text', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400)
            expect(body.error).toBe('Text is required and must be a string')
        })

        it('should return 400 for empty text', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: '   ',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400)
            expect(body.error).toBe('Text cannot be empty')
        })

        it('should return 400 for text too long', async () => {
            const longText = 'a'.repeat(5001)
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: longText,
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400)
            expect(body.error).toBe('Text too long. Maximum length is 5000 characters.')
        })

        it('should return 400 for invalid format', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'invalid'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400)
            expect(body.error).toBe('Invalid format. Supported formats: mp3, wav')
        })
    })

    describe('503 Error Scenarios', () => {
        it('should return 503 when Deepgram API key is missing', async () => {
            // Temporarily remove API key
            const originalKey = process.env.DEEPGRAM_API_KEY
            delete process.env.DEEPGRAM_API_KEY

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(503)
            expect(body.code).toBe('SERVICE_NOT_CONFIGURED')
            expect(body.error).toContain('not configured')

            // Restore API key
            process.env.DEEPGRAM_API_KEY = originalKey
        })

        it('should return 503 when Deepgram API fails', async () => {
            // Mock Deepgram API failure
            ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Deepgram API error'))

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(503)
            expect(body.code).toBe('TTS_SERVICE_UNAVAILABLE')
            expect(body.error).toContain('temporarily unavailable')
        })

        it('should return 503 when Deepgram returns non-ok response', async () => {
            // Mock Deepgram returning error
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: jest.fn().mockResolvedValue('Unauthorized')
            })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(503)
            expect(body.code).toBe('TTS_SERVICE_UNAVAILABLE')
        })
    })

    describe('Rate Limiting', () => {
        it('should enforce rate limiting', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '192.168.1.100']]) // Use different IP
            } as unknown as NextRequest

                // Mock successful responses
                ; (global.fetch as jest.Mock).mockResolvedValue({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
                })

            // Make requests up to the limit (20)
            const responses = []
            for (let i = 0; i < 21; i++) {
                responses.push(await POST(mockRequest))
            }

            // Check that at least one request was rate limited
            const rateLimitedResponses = responses.filter(r => r.status === 429)
            expect(rateLimitedResponses.length).toBeGreaterThan(0)

            if (rateLimitedResponses.length > 0) {
                const body = await rateLimitedResponses[0].json()
                expect(body.error).toContain('Rate limit exceeded')
            }
        })
    })

    describe('OPTIONS endpoint', () => {
        it('should return correct CORS headers', async () => {
            const response = await OPTIONS()

            expect(response.status).toBe(200)
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
            expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
        })
    })

    describe('Error Handling', () => {
        it('should handle malformed JSON', async () => {
            const mockRequest = {
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body.code).toBe('TTS_FAILED')
        })

        it('should handle empty audio buffer', async () => {
            // Mock Deepgram returning empty buffer
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0))
            })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body.code).toBe('TTS_FAILED')
        })
    })
})