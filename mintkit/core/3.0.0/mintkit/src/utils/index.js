import { isElement, isTextNode, isVNode } from './dom/index.js';
import { debounce, throttle, throttleLeading } from './functional/index.js';
import { deepEqual } from './comparison/deep-equal.js';
import { formatBytes, formatDuration } from './formatting/index.js';
import { getInjectionStats, clearInjectionCache } from './stats/index.js';

export const MintUtils = {
    // DOM utilities
    isElement,
    isTextNode,
    isVNode,

    // Functional utilities
    debounce,
    throttle,
    throttleLeading,

    // Comparison utilities
    deepEqual,

    // Formatting utilities
    formatBytes,
    formatDuration,

    // Stats utilities
    getInjectionStats,
    clearInjectionCache,

    // Additional utilities
    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },

    /**
     * Check if value is function
     * @param {any} value - Value to check
     * @returns {boolean} True if function
     */
    isFunction: (value) => {
        return typeof value === 'function';
    },

    /**
     * Check if value is object
     * @param {any} value - Value to check
     * @returns {boolean} True if object
     */
    isObject: (value) => {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

    /**
     * Check if value is array
     * @param {any} value - Value to check
     * @returns {boolean} True if array
     */
    isArray: (value) => {
        return Array.isArray(value);
    },

    /**
     * Check if value is string
     * @param {any} value - Value to check
     * @returns {boolean} True if string
     */
    isString: (value) => {
        return typeof value === 'string';
    },

    /**
     * Check if value is number
     * @param {any} value - Value to check
     * @returns {boolean} True if number
     */
    isNumber: (value) => {
        return typeof value === 'number' && !isNaN(value);
    },

    /**
     * Check if value is boolean
     * @param {any} value - Value to check
     * @returns {boolean} True if boolean
     */
    isBoolean: (value) => {
        return typeof value === 'boolean';
    },

    /**
     * Check if value is null or undefined
     * @param {any} value - Value to check
     * @returns {boolean} True if null or undefined
     */
    isNullOrUndefined: (value) => {
        return value === null || value === undefined;
    }
};

// Export individual utilities as well
export { isElement, isTextNode, isVNode } from './dom/index.js';
export { debounce, throttle, throttleLeading } from './functional/index.js';
export { deepEqual } from './comparison/index.js';
export { formatBytes, formatDuration } from './formatting/index.js';
export { getInjectionStats, clearInjectionCache } from './stats/index.js';

// Export additional utility functions
export const generateId = () => Math.random().toString(36).substr(2, 9);
export const isFunction = (value) => typeof value === 'function';
export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isArray = (value) => Array.isArray(value);
export const isString = (value) => typeof value === 'string';
export const isNumber = (value) => typeof value === 'number' && !isNaN(value);
export const isBoolean = (value) => typeof value === 'boolean';
export const isNullOrUndefined = (value) => value === null || value === undefined;