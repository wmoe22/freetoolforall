import { act, renderHook } from '@testing-library/react'

// Custom hook for localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            return initialValue
        }
    })

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.error('Error saving to localStorage:', error)
        }
    }

    return [storedValue, setValue] as const
}

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Import useState after mocking
import { useState } from 'react'

describe('useLocalStorage', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear()
        localStorageMock.setItem.mockClear()
    })

    it('returns initial value when localStorage is empty', () => {
        localStorageMock.getItem.mockReturnValue(null)

        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

        expect(result.current[0]).toBe('initial')
        expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
    })

    it('returns stored value from localStorage', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))

        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

        expect(result.current[0]).toBe('stored-value')
    })

    it('updates localStorage when value changes', () => {
        localStorageMock.getItem.mockReturnValue(null)

        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

        act(() => {
            result.current[1]('new-value')
        })

        expect(result.current[0]).toBe('new-value')
        expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
    })

    it('handles JSON parse errors gracefully', () => {
        localStorageMock.getItem.mockReturnValue('invalid-json')

        const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

        expect(result.current[0]).toBe('fallback')
    })
})