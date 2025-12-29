import { hashCache } from '../../injection/cache/index.js';

/**
 * Clear injection cache
 */
export function clearInjectionCache() {
    hashCache.clear();
}