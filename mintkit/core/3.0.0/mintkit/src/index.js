/**
 * Mintkit Framework Core
 * Warning if you edit when wrong framework cant be use
 * Copyright © 2025 Mint teams
 * Licensed under the MIT License
 * Updated at: 2025-09-23
 */

import { pipe, compose, clone } from './core/index.js';
import {
    createElement,
    diff,
    createDomNode,
    updateProps,
    isSameNodeType
} from './vdom/index.js';
import {
    createState,
    StateUpdater,
    SubscriberManager,
    UpdateQueue
} from './state/index.js';
import {
    injectCSS,
    injectHTML,
    injectTitle,
    inject
} from './injection/index.js';
import {
    Router,
    navigate,
    Link,
    withRouter
} from './router/index.js';
import {
    get,
    include,
    processIncludes,
    CSSLoader,
    HTMLLoader
} from './loader/index.js';
import {
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker
} from './dev-tools/index.js';
import {
    MintUtils,
    generateId,
    isFunction,
    isObject,
    isArray,
    isString,
    isNumber,
    isBoolean,
    isNullOrUndefined,
    clearInjectionCache,
    getInjectionStats
} from './utils/index.js';
import {
    isUnsafeCSS,
    HTMLValidator,
    sanitizeHTML,
    CSSSanitizer,
    AttributeSanitizer,
    DANGEROUS_PATTERNS,
    containsDangerousPatterns,
    getDangerousPatterns
} from './security/index.js';
import {
    SECURITY_PATTERNS,
    DANGEROUS_TAGS,
    EVENT_ATTRIBUTES
} from './constants/index.js';

// Export core functionality
export { pipe, compose, clone } from './core/index.js';

// Export vdom
export {
    createElement,
    diff,
    createDomNode,
    updateProps,
    isSameNodeType
} from './vdom/index.js';

// Export state management
export {
    createState,
    StateUpdater,
    SubscriberManager,
    UpdateQueue
} from './state/index.js';

// Export injection APIs
export {
    injectCSS,
    injectHTML,
    injectTitle,
    inject
} from './injection/index.js';

// Export router
export {
    Router,
    navigate,
    Link,
    withRouter
} from './router/index.js';

// Export loader utilities
export {
    get,
    include,
    processIncludes,
    CSSLoader,
    HTMLLoader
} from './loader/index.js';

// Export dev tools
export {
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker
} from './dev-tools/index.js';

// Export utilities
export {
    MintUtils,
    generateId,
    isFunction,
    isObject,
    isArray,
    isString,
    isNumber,
    isBoolean,
    isNullOrUndefined,
    clearInjectionCache,
    getInjectionStats
} from './utils/index.js';

// Export security utilities
export {
    isUnsafeCSS,
    HTMLValidator,
    sanitizeHTML,
    CSSSanitizer,
    AttributeSanitizer,
    DANGEROUS_PATTERNS,
    containsDangerousPatterns,
    getDangerousPatterns
} from './security/index.js';

// Export constants
export {
    SECURITY_PATTERNS,
    DANGEROUS_TAGS,
    EVENT_ATTRIBUTES
} from './constants/index.js';

// Re-export commonly used functions for convenience
export const Mint = {
    // Core
    pipe,
    compose,
    clone,

    // VDOM
    createElement,
    diff,
    createDomNode,
    updateProps,
    isSameNodeType,

    // State
    createState,
    StateUpdater,
    SubscriberManager,
    UpdateQueue,

    // Injection
    injectCSS,
    injectHTML,
    injectTitle,
    inject,

    // Router
    Router,
    navigate,
    Link,
    withRouter,

    // Loader
    get,
    include,
    processIncludes,
    CSSLoader,
    HTMLLoader,

    // Dev Tools
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker,

    // Utils
    MintUtils,
    generateId,
    isFunction,
    isObject,
    isArray,
    isString,
    isNumber,
    isBoolean,
    isNullOrUndefined,
    clearInjectionCache,
    getInjectionStats,

    // Security
    isUnsafeCSS,
    HTMLValidator,
    sanitizeHTML,
    CSSSanitizer,
    AttributeSanitizer,
    DANGEROUS_PATTERNS,
    containsDangerousPatterns,
    getDangerousPatterns,

    // Constants
    SECURITY_PATTERNS,
    DANGEROUS_TAGS,
    EVENT_ATTRIBUTES
};

// Global availability (optional)
if (typeof window !== 'undefined') {
    window.Mintkit = Mint;
    window.Mint = Mint; // Shorter alias
}

// Version info
export const VERSION = '3.0.0';
export const BUILD_DATE = '2025-12-29';

console.log(`Mintkit Framework v${VERSION} loaded`);
console.log(`Latest build date: ${BUILD_DATE}`);