/**
 * Retry handler with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Promise with result
 */
export async function executeWithRetry(fn, maxRetries = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            const delay = baseDelay * attempt; // Exponential backoff
            console.warn(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}