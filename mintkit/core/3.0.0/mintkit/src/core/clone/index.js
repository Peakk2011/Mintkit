import { structuredCloneAPI } from './structured-clone.js';
import { deepCloneRecursive } from './deep-clone.js';

/**
 * Modern `structuredClone` API with fallback
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const clone = (() => {
    if (typeof globalThis.structuredClone === 'function') {
        return (obj) => {
            try {
                return structuredCloneAPI(obj);
            } catch (e) {
                return deepCloneRecursive(obj);
            }
        };
    }

    console.warn("Mintkit: `structuredClone` is not available. Using a custom fallback.");
    return deepCloneRecursive;
})();