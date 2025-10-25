import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '/',
            query: {},
            asPath: '/',
            push: jest.fn(),
            pop: jest.fn(),
            reload: jest.fn(),
            back: jest.fn(),
            prefetch: jest.fn().mockResolvedValue(undefined),
            beforePopState: jest.fn(),
            events: {
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn(),
            },
        }
    },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock Web APIs for Node.js environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Headers
global.Headers = class MockHeaders extends Map {
    constructor(init) {
        super()
        if (init) {
            if (Array.isArray(init)) {
                init.forEach(([key, value]) => this.set(key, value))
            } else if (typeof init === 'object') {
                Object.entries(init).forEach(([key, value]) => this.set(key, value))
            }
        }
    }

    get(name) {
        return super.get(name.toLowerCase())
    }

    set(name, value) {
        return super.set(name.toLowerCase(), value)
    }

    has(name) {
        return super.has(name.toLowerCase())
    }

    delete(name) {
        return super.delete(name.toLowerCase())
    }
}

// Mock Request
global.Request = class MockRequest {
    constructor(input, init = {}) {
        this.url = input
        this.method = init.method || 'GET'
        this.headers = new global.Headers(init.headers)
        this.body = init.body
        this._bodyUsed = false
    }

    get bodyUsed() {
        return this._bodyUsed
    }

    async json() {
        this._bodyUsed = true
        return JSON.parse(this.body)
    }

    async text() {
        this._bodyUsed = true
        return this.body
    }

    async formData() {
        this._bodyUsed = true
        return new FormData()
    }

    async arrayBuffer() {
        this._bodyUsed = true
        return new ArrayBuffer(0)
    }

    clone() {
        return new MockRequest(this.url, {
            method: this.method,
            headers: this.headers,
            body: this.body
        })
    }
}

// Mock Response
global.Response = class MockResponse {
    constructor(body, init = {}) {
        this.body = body
        this.status = init.status || 200
        this.statusText = init.statusText || 'OK'
        this.headers = new global.Headers(init.headers)
        this.ok = this.status >= 200 && this.status < 300
        this.url = ''
        this.type = 'basic'
        this.redirected = false
        this._bodyUsed = false
    }

    get bodyUsed() {
        return this._bodyUsed
    }

    async json() {
        this._bodyUsed = true
        if (typeof this.body === 'string') {
            return JSON.parse(this.body)
        }
        return this.body
    }

    async text() {
        this._bodyUsed = true
        if (typeof this.body === 'string') {
            return this.body
        }
        return JSON.stringify(this.body)
    }

    async arrayBuffer() {
        this._bodyUsed = true
        if (this.body instanceof ArrayBuffer) {
            return this.body
        }
        const text = await this.text()
        return new TextEncoder().encode(text).buffer
    }

    clone() {
        return new MockResponse(this.body, {
            status: this.status,
            statusText: this.statusText,
            headers: this.headers
        })
    }

    static json(data, init = {}) {
        return new MockResponse(JSON.stringify(data), {
            ...init,
            headers: {
                'content-type': 'application/json',
                ...init.headers
            }
        })
    }
}

// Mock AbortSignal
global.AbortSignal = {
    timeout: jest.fn(() => ({
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }))
}

// Mock FormData
global.FormData = class MockFormData {
    constructor() {
        this.data = new Map()
    }

    append(key, value) {
        if (this.data.has(key)) {
            const existing = this.data.get(key)
            if (Array.isArray(existing)) {
                existing.push(value)
            } else {
                this.data.set(key, [existing, value])
            }
        } else {
            this.data.set(key, value)
        }
    }

    get(key) {
        const value = this.data.get(key)
        return Array.isArray(value) ? value[0] : value
    }

    getAll(key) {
        const value = this.data.get(key)
        return Array.isArray(value) ? value : value ? [value] : []
    }

    has(key) {
        return this.data.has(key)
    }

    set(key, value) {
        this.data.set(key, value)
    }

    delete(key) {
        this.data.delete(key)
    }

    entries() {
        return this.data.entries()
    }

    keys() {
        return this.data.keys()
    }

    values() {
        return this.data.values()
    }

    forEach(callback) {
        this.data.forEach(callback)
    }
}

// Mock File
global.File = class MockFile {
    constructor(chunks, filename, options = {}) {
        this.name = filename
        this.type = options.type || ''
        this.size = chunks.reduce((acc, chunk) => acc + (chunk.byteLength || chunk.length || 0), 0)
        this.chunks = chunks
    }

    async arrayBuffer() {
        return this.chunks[0] || new ArrayBuffer(this.size)
    }
}