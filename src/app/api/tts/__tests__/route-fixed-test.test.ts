/**
 * Test for the Fixed TTS Route
 * Verifying that the fixes resolve the 503 errors
 */

// Mock Sentry BEFORE importing
jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
}))

import { NextRequest } from 'next/server'

describe('Fixed TTS Route', () => {
    let POST: any
    let OPTIONS: any

    beforeAll(async () => {
        // Set environment
        process.env.DEEPGRAM_API_KEY = 'test-key'

        // Mock fetch
        global.fetch = jest.fn()

        // Import the FIXED route
        const routeModule = await import('../route-fixed')
        POST = routeModule.POST
        OPTIONS = routeModule.OPTIONS
    })

    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    describe('Success Cases', () => {
        it('should return 200 with audio data for valid request', async () => {
            // Mock successful Deepgram response
            const mockAudioBuffer = new ArrayBuffer(2048)
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
                })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world test',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const responseBuffer = await response.arrayBuffer()

            expect(response.status).toBe(200)
            expect(responseBuffer).toEqual(mockAudioBuffer)
            expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
            expect(response.headers.get('X-Service-Used')).toBe('deepgram')
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
                    text: 'Test WAV',
                    format: 'wav'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe('audio/wav')
        })
    })

    describe('Validation Errors (Should return 400, not 503)', () => {
        it('should return 400 for missing text', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({ format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400) // NOT 503!
            expect(body.error).toBe('Text is required and must be a string')
        })

        it('should return 400 for empty text', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: '   ', format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400) // NOT 503!
            expect(body.error).toBe('Text cannot be empty')
        })

        it('should return 400 for invalid format', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: 'Hello', format: 'invalid' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400) // NOT 503!
            expect(body.error).toBe('Invalid format. Supported formats: mp3, wav')
        })
    })

    describe('Service Errors (Should return 503)', () => {
        it('should return 503 when API key is missing', async () => {
            const originalKey = process.env.DEEPGRAM_API_KEY
            delete process.env.DEEPGRAM_API_KEY

            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: 'Hello', format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(503)
            expect(body.code).toBe('SERVICE_NOT_CONFIGURED')

            process.env.DEEPGRAM_API_KEY = originalKey
        })

        it('should return 503 when Deepgram fails and fallback fails', async () => {
            ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Deepgram error'))

            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: 'Hello', format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(503)
            expect(body.code).toBe('TTS_SERVICE_UNAVAILABLE')
        })
    })

    describe('Rate Limiting (Should return 429)', () => {
        it('should return 429 when rate limit exceeded', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: 'Hello', format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '192.168.1.200']])
            } as unknown as NextRequest

                // Mock successful responses for rate limiting test
                ; (global.fetch as jest.Mock).mockResolvedValue({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
                })

            // Make 21 requests (exceeding limit of 20)
            const responses = []
            for (let i = 0; i < 21; i++) {
                responses.push(await POST(mockRequest))
            }

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
        })
    })

    describe('Error Handling', () => {
        it('should return 500 for malformed JSON', async () => {
            const mockRequest = {
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body.code).toBe('TTS_FAILED')
        })

        it('should return 500 for empty audio buffer', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0))
            })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({ text: 'Hello', format: 'mp3' }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body.code).toBe('TTS_FAILED')
        })
    })
})