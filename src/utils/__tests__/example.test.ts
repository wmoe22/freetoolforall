// Example utility functions and their tests
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // Additional check for consecutive dots
    if (email.includes('..')) return false
    return emailRegex.test(email)
}

describe('Utility Functions', () => {
    describe('formatDuration', () => {
        it('formats seconds correctly', () => {
            expect(formatDuration(30)).toBe('30s')
            expect(formatDuration(0)).toBe('0s')
            expect(formatDuration(59)).toBe('59s')
        })

        it('formats minutes and seconds correctly', () => {
            expect(formatDuration(60)).toBe('1m 0s')
            expect(formatDuration(90)).toBe('1m 30s')
            expect(formatDuration(125)).toBe('2m 5s')
        })
    })

    describe('validateEmail', () => {
        it('validates correct email addresses', () => {
            expect(validateEmail('test@example.com')).toBe(true)
            expect(validateEmail('user.name@domain.co.uk')).toBe(true)
            expect(validateEmail('user+tag@example.org')).toBe(true)
        })

        it('rejects invalid email addresses', () => {
            expect(validateEmail('invalid-email')).toBe(false)
            expect(validateEmail('test@')).toBe(false)
            expect(validateEmail('@example.com')).toBe(false)
            expect(validateEmail('test..test@example.com')).toBe(false)
        })
    })
})