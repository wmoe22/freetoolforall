// Retry utilities with exponential backoff

export class RetryManager {
    private retryAttempts = 2;
    private retryDelay = 1000; // 1 second

    constructor(retryAttempts = 2, retryDelay = 1000) {
        this.retryAttempts = retryAttempts;
        this.retryDelay = retryDelay;
    }

    // Retry wrapper with exponential backoff
    async withRetry<T>(
        operation: () => Promise<T>,
        attempts: number = this.retryAttempts
    ): Promise<T> {
        let lastError: Error;

        for (let i = 0; i <= attempts; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry on certain errors
                if (error instanceof Error) {
                    if (error.name === 'AbortError' ||
                        error.message.includes('Too many concurrent') ||
                        error.message.includes('Network request failed')) {
                        throw error;
                    }
                }

                if (i < attempts) {
                    const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
                    console.warn(`Request failed, retrying in ${delay}ms (attempt ${i + 1}/${attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError!;
    }
}