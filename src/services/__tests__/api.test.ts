// Mock API service for testing async operations
interface ApiResponse<T> {
    data: T
    status: number
    message?: string
}

class ApiService {
    private baseUrl: string

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'API request failed')
        }

        return {
            data,
            status: response.status
        }
    }

    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'API request failed')
        }

        return {
            data,
            status: response.status
        }
    }
}

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('ApiService', () => {
    let apiService: ApiService

    beforeEach(() => {
        apiService = new ApiService()
        mockFetch.mockClear()
    })

    describe('get method', () => {
        it('makes successful GET request', async () => {
            const mockData = { id: 1, name: 'Test' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockData,
            } as Response)

            const result = await apiService.get('/users/1')

            expect(mockFetch).toHaveBeenCalledWith('/api/users/1')
            expect(result).toEqual({
                data: mockData,
                status: 200
            })
        })

        it('throws error on failed request', async () => {
            const errorMessage = 'User not found'
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ message: errorMessage }),
            } as Response)

            await expect(apiService.get('/users/999')).rejects.toThrow(errorMessage)
        })
    })

    describe('post method', () => {
        it('makes successful POST request', async () => {
            const requestBody = { name: 'New User', email: 'user@example.com' }
            const responseData = { id: 2, ...requestBody }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => responseData,
            } as Response)

            const result = await apiService.post('/users', requestBody)

            expect(mockFetch).toHaveBeenCalledWith('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })
            expect(result).toEqual({
                data: responseData,
                status: 201
            })
        })

        it('handles validation errors', async () => {
            const errorMessage = 'Email is required'
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ message: errorMessage }),
            } as Response)

            await expect(apiService.post('/users', {})).rejects.toThrow(errorMessage)
        })
    })

    it('uses custom base URL', async () => {
        const customApiService = new ApiService('https://api.example.com')
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({}),
        } as Response)

        await customApiService.get('/test')

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test')
    })
})