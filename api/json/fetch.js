/**
 * Mintkit Fetch API with caching, retry logic, and optimizations
 * @module FetchAPI
 * @author Mint Teams
 * @version 2.0.0
 */

/**
 * @typedef {Object} CacheEntry
 * @property {any} data - The cached data
 * @property {number} timestamp - Timestamp when data was cached
 */

/**
 * @typedef {Object} FetchJSONOptions
 * @property {boolean} [cache=true] - Enable caching
 * @property {number} [cacheTTL=300000] - Cache time-to-live in milliseconds (default: 5 minutes)
 * @property {number} [timeout=10000] - Request timeout in milliseconds (default: 10 seconds)
 * @property {number} [retry=0] - Number of retry attempts
 * @property {number} [retryDelay=1000] - Initial delay between retries in milliseconds
 * @property {HeadersInit} [headers={}] - Additional headers to include
 * @property {RequestMode} [mode] - Request mode (cors, no-cors, same-origin)
 * @property {RequestCredentials} [credentials] - Request credentials (omit, same-origin, include)
 * @property {RequestCache} [requestCache] - Cache mode for the request
 */

/**
 * @typedef {Object} BatchFetchOptions
 * @property {number} [concurrency=5] - Maximum concurrent requests
 * @property {boolean} [stopOnError=false] - Stop all requests if one fails
 * @property {Function} [onProgress] - Progress callback function
 */

/**
 * @typedef {Object} BatchFetchResult
 * @property {any} data - The fetched data
 * @property {string} url - The URL that was fetched
 * @property {Error|null} error - Error if request failed, null otherwise
 * @property {boolean} success - Whether the request succeeded
 */

/**
 * Memory cache for JSON responses
 * @type {Map<string, CacheEntry>}
 * @private
 */
const cache = new Map();

/**
 * Pending requests to prevent duplicate fetches
 * @type {Map<string, Promise<any>>}
 * @private
 */
const pendingRequests = new Map();

/**
 * Fetches and parses JSON with advanced features including caching,
 * request deduplication, retry logic, and timeout handling.
 * 
 * @async
 * @function fetchJSON
 * @param {string} url - The URL to fetch from
 * @param {FetchJSONOptions} [options={}] - Configuration options
 * @returns {Promise<object>} A promise that resolves with the parsed JSON object
 * @throws {Error} Throws if the fetch fails after all retry attempts or times out
 * 
 * @example
 * // Basic usage
 * const data = await fetchJSON('https://api.example.com/data');
 * 
 * @example
 * // With options
 * const data = await fetchJSON('https://api.example.com/data', {
 *   cache: true,
 *   cacheTTL: 600000, // 10 minutes
 *   timeout: 5000,
 *   retry: 3,
 *   headers: {
 *     'Authorization': 'Bearer token123'
 *   }
 * });
 * 
 * @example
 * // With error handling
 * try {
 *   const data = await fetchJSON('/api/users', { retry: 2 });
 *   console.log(data);
 * } catch (error) {
 *   console.error('Failed to fetch:', error.message);
 * }
 */
export const fetchJSON = async (url, options = {}) => {
    const {
        cache: useCache = true,
        cacheTTL = 300000,
        timeout = 10000,
        retry = 0,
        retryDelay = 1000,
        headers = {},
        ...fetchOptions
    } = options;

    // Check cache first
    if (useCache) {
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
            return cached.data;
        }
    }

    // Request deduplication - prevent multiple identical requests
    if (pendingRequests.has(url)) {
        return pendingRequests.get(url);
    }

    const request = (async () => {
        let lastError;

        for (let attempt = 0; attempt <= retry; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...fetchOptions,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Cache the result
                if (useCache) {
                    cache.set(url, {
                        data,
                        timestamp: Date.now()
                    });
                }

                pendingRequests.delete(url);
                return data;

            } catch (error) {
                lastError = error;

                // Don't retry if aborted or not a network error
                if (error.name === 'AbortError' || attempt === retry) {
                    break;
                }

                // Exponential backoff
                await new Promise(resolve =>
                    setTimeout(resolve, retryDelay * Math.pow(2, attempt))
                );
            }
        }

        pendingRequests.delete(url);
        throw lastError;
    })();

    pendingRequests.set(url, request);
    return request;
};

/**
 * Fetches multiple URLs in parallel with concurrency control.
 * Useful for fetching many resources without overwhelming the network.
 * 
 * @async
 * @function batchFetchJSON
 * @param {string[]} urls - Array of URLs to fetch
 * @param {FetchJSONOptions & BatchFetchOptions} [options={}] - Configuration options
 * @returns {Promise<BatchFetchResult[]>} Array of results for each URL
 * 
 * @example
 * const urls = [
 *   'https://api.example.com/users/1',
 *   'https://api.example.com/users/2',
 *   'https://api.example.com/users/3'
 * ];
 * 
 * const results = await batchFetchJSON(urls, {
 *   concurrency: 3,
 *   onProgress: (completed, total) => {
 *     console.log(`Progress: ${completed}/${total}`);
 *   }
 * });
 * 
 * results.forEach(result => {
 *   if (result.success) {
 *     console.log(result.data);
 *   } else {
 *     console.error(result.error);
 *   }
 * });
 */
export const batchFetchJSON = async (urls, options = {}) => {
    const {
        concurrency = 5,
        stopOnError = false,
        onProgress = null,
        ...fetchOptions
    } = options;

    const results = [];
    let completed = 0;

    /**
     * Process a single URL
     * @private
     * @param {string} url - URL to fetch
     * @returns {Promise<BatchFetchResult>}
     */
    const processURL = async (url) => {
        try {
            const data = await fetchJSON(url, fetchOptions);
            completed++;
            if (onProgress) onProgress(completed, urls.length);
            return { url, data, error: null, success: true };
        } catch (error) {
            completed++;
            if (onProgress) onProgress(completed, urls.length);
            if (stopOnError) throw error;
            return { url, data: null, error, success: false };
        }
    };

    // Process URLs with concurrency limit
    for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(processURL));
        results.push(...batchResults);
    }

    return results;
};

/**
 * Preloads a JSON resource and stores it in cache for later use.
 * Useful for preloading data before it's needed.
 * 
 * @async
 * @function preloadJSON
 * @param {string} url - The URL to preload
 * @param {FetchJSONOptions} [options={}] - Configuration options
 * @returns {Promise<void>} Resolves when preload is complete
 * 
 * @example
 * // Preload data on page load
 * window.addEventListener('load', () => {
 *   preloadJSON('/api/initial-data');
 * });
 * 
 * // Later, fetch from cache
 * const data = await fetchJSON('/api/initial-data'); // Returns instantly from cache
 */
export const preloadJSON = async (url, options = {}) => {
    await fetchJSON(url, { ...options, cache: true });
};

/**
 * Clears the cache for a specific URL or all cached entries.
 * 
 * @function clearCache
 * @param {string} [url] - Optional specific URL to clear. If omitted, clears all cache.
 * @returns {boolean} True if cache was cleared, false if URL was not found
 * 
 * @example
 * // Clear specific URL
 * clearCache('/api/users');
 * 
 * @example
 * // Clear all cache
 * clearCache();
 */
export const clearCache = (url) => {
    if (url) {
        return cache.delete(url);
    }
    cache.clear();
    return true;
};

/**
 * Gets the current cache size.
 * 
 * @function getCacheSize
 * @returns {number} Number of cached entries
 * 
 * @example
 * console.log(`Cache has ${getCacheSize()} entries`);
 */
export const getCacheSize = () => cache.size;

/**
 * Checks if a URL is currently cached and not expired.
 * 
 * @function isCached
 * @param {string} url - The URL to check
 * @param {number} [cacheTTL=300000] - Cache TTL to check against
 * @returns {boolean} True if cached and not expired
 * 
 * @example
 * if (isCached('/api/data')) {
 *   console.log('Data is cached!');
 * }
 */
export const isCached = (url, cacheTTL = 300000) => {
    const cached = cache.get(url);
    return cached && Date.now() - cached.timestamp < cacheTTL;
};

/**
 * Fetches with low-level control using XMLHttpRequest.
 * Provides progress events and more granular control.
 * 
 * @async
 * @function fetchJSONWithProgress
 * @param {string} url - The URL to fetch
 * @param {Object} options - Configuration options
 * @param {Function} [options.onProgress] - Progress callback (loaded, total)
 * @param {Function} [options.onUploadProgress] - Upload progress callback
 * @param {number} [options.timeout=10000] - Timeout in milliseconds
 * @param {HeadersInit} [options.headers={}] - Request headers
 * @returns {Promise<object>} Parsed JSON object
 * 
 * @example
 * const data = await fetchJSONWithProgress('/api/large-file', {
 *   onProgress: (loaded, total) => {
 *     const percent = (loaded / total) * 100;
 *     console.log(`Downloaded: ${percent.toFixed(2)}%`);
 *   }
 * });
 */
export const fetchJSONWithProgress = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const {
            onProgress,
            onUploadProgress,
            timeout = 10000,
            headers = {}
        } = options;

        xhr.open('GET', url, true);
        xhr.timeout = timeout;
        xhr.responseType = 'json';

        // Set headers
        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });

        // Download progress
        if (onProgress) {
            xhr.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(e.loaded, e.total);
                }
            });
        }

        // Upload progress
        if (onUploadProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onUploadProgress(e.loaded, e.total);
                }
            });
        }

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });

        xhr.addEventListener('timeout', () => {
            reject(new Error('Request timeout'));
        });

        xhr.send();
    });
};