import { hashCache } from '../../injection/cache/index.js';

/**
 * Get injection statistics
 * @returns {Object} Injection stats
 */
export function getInjectionStats() {
    return {
        hashCacheSize: hashCache.size,
        memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        } : 'not available'
    };
}