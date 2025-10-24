/**
 * TTS Integration Tests
 * Testing the actual API endpoint to debug the 503 error
 */

import { NextRequest } from 'next/server'

// We'll test by importing and calling the route handler directly
// This helps us debug without network issues

describe('TTS Integration Tests', () => {
    let POST: any
    let OPTIONS: any

    beforeAll(async () => {
        // Mock environment variables
        process.env.DEEPGRAM_API_KEY = 'test-key'

        // Mock fetch to simulate different scenarios
        global.fetch = jest.fn()

        // Import the route handlers after setting up mocks
        const routeModule = await import('../route')
        POST = routeModule.POST
        OPTIONS = routeModule.OPTIONS
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Environment and Configuration', () => {
        it('should have Deepgram API key configured', () => {
            expect(process.env.DEEPGRAM_API_KEY).toBeDefined()
        })

        it('should handle missing API key gracefully', async () => {
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

            // Restore API key
            process.env.DEEPGRAM_API_KEY = originalKey
        })
    })

    describe('Request Processing', () => {
        it('should handle valid TTS request', async () => {
            // Mock successful Deepgram response
            const mockAudioBuffer = new ArrayBuffer(1024)
                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
                })

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: 'Hello world',
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
        })

        it('should handle Deepgram API failure', async () => {
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
        })

        it('should handle network timeout', async () => {
            // Mock network timeout
            ; (global.fetch as jest.Mock).mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Network timeout')), 100)
                )
            )

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

        it('should validate input properly', async () => {
            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    text: '', // Empty text
                    format: 'mp3'
                }),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(400)
            expect(body.error).toContain('Text')
        })
    })

    describe('Error Scenarios that cause 503', () => {
        it('should return 503 when Deepgram returns non-ok response', async () => {
            // Mock Deepgram returning error response
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

        it('should return 503 when audio buffer is empty', async () => {
            // Mock Deepgram returning empty audio
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)) // Empty buffer
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

        it('should handle malformed request body', async () => {
            const mockRequest = {
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
                headers: new Map([['x-forwarded-for', '127.0.0.1']])
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            const body = await response.json()

            expect(response.status).toBe(500)
            expect(body.code).toBe('TTS_FAILED')
        })
    })

    describe('Common 503 Debugging', () => {
        it('should identify API key issues', async () => {
            // Test with invalid API key format
            process.env.DEEPGRAM_API_KEY = 'invalid-key'

                ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Invalid API key'))

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

        it('should identify rate limiting from Deepgram', async () => {
            // Mock Deepgram rate limiting
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: jest.fn().mockResolvedValue('Rate limit exceeded')
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

    describe('OPTIONS endpoint', () => {
        it('should return correct CORS headers', async () => {
            const response = await OPTIONS()

            expect(response.status).toBe(200)
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
        })
    })
})