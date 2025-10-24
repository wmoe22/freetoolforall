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
global.Request = class MockRequest {
    constructor(input, init) {
        this.url = input
        this.method = init?.method || 'GET'
        this.headers = new Map(Object.entries(init?.headers || {}))
        this.body = init?.body
    }
}

global.Response = class MockResponse {
    constructor(body, init) {
        this.body = body
        this.status = init?.status || 200
        this.statusText = init?.statusText || 'OK'
        this.headers = new Map(Object.entries(init?.headers || {}))
        this.ok = this.status >= 200 && this.status < 300
    }

    async json() {
        return JSON.parse(this.body)
    }

    async text() {
        return this.body
    }

    async arrayBuffer() {
        return new ArrayBuffer(0)
    }
}

global.Headers = Map

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
        this.data.set(key, value)
    }

    get(key) {
        return this.data.get(key)
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