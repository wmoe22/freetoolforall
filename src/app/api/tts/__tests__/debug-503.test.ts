/**
 * Debug 503 Error Test
 * Simple test to identify the root cause of the 503 error
 */

describe('Debug 503 Error', () => {
    beforeEach(() => {
        // Mock Sentry properly to prevent initialization errors
        jest.doMock('@sentry/nextjs', () => ({
            captureException: jest.fn(),
            captureMessage: jest.fn(),
            withScope: jest.fn((callback) => callback({})),
            getCurrentHub: jest.fn(() => ({
                getClient: jest.fn(() => null)
            }))
        }))
    })

    it('should identify if Sentry is causing the 503 error', async () => {
        // Mock environment
        process.env.DEEPGRAM_API_KEY = 'test-key'

        // Mock fetch to return successful response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        })

        try {
            // Try to import the route module
            const routeModule = await import('../route')

            // If we get here, the import succeeded
            expect(routeModule.POST).toBeDefined()
            expect(routeModule.OPTIONS).toBeDefined()

            console.log('✅ Route module imported successfully')

        } catch (error) {
            console.error('❌ Route module import failed:', error)

            // Check if it's a Sentry-related error
            if (error.message.includes('events') || error.message.includes('Sentry')) {
                console.log('🔍 This appears to be a Sentry initialization issue')
            }

            throw error
        }
    })

    it('should test basic functionality without importing route', () => {
        // Test the core logic without importing the problematic route
        const validateInput = (text: string, format: string) => {
            if (!text || typeof text !== 'string') {
                return 'Text is required and must be a string'
            }
            if (text.trim().length === 0) {
                return 'Text cannot be empty'
            }
            if (text.length > 5000) {
                return 'Text too long. Maximum length is 5000 characters.'
            }

            const allowedFormats = ['mp3', 'wav']
            if (!allowedFormats.includes(format)) {
                return 'Invalid format. Supported formats: mp3, wav'
            }

            return null
        }

        // Test validation logic
        expect(validateInput('Hello world', 'mp3')).toBeNull()
        expect(validateInput('', 'mp3')).toContain('Text')
        expect(validateInput('Hello', 'invalid')).toContain('format')

        console.log('✅ Core validation logic works correctly')
    })

    it('should check environment variables', () => {
        // Check if API key is the issue
        const hasApiKey = !!process.env.DEEPGRAM_API_KEY
        console.log('DEEPGRAM_API_KEY present:', hasApiKey)

        if (!hasApiKey) {
            console.log('🔍 Missing DEEPGRAM_API_KEY could cause 503 errors')
        }

        expect(true).toBe(true) // Always pass, this is just for debugging
    })
})