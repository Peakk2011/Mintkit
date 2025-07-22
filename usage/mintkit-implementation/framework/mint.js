import {
    // Core DOM/Content
    injectCSS,
    injectHTML,
    injectTitle,
    createState, // vDom
    // Utility
    get,
    include,
    processIncludes,
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker,
    getInjectionStats,
    clearInjectionCache,
    // Functional Utilities
    pipe,
    compose,
    // General Utilities Object
    MintUtils,
} from './utils.min.js';
import { MintAssembly } from './mintassembly.js';

export const Mint = {
    createState,
    // Injection (main)
    injectCSS,
    injectHTML,
    injectTitle,
    get,
    include,
    processIncludes,
    AdjustHook,
    MintAssembly
};

export const Utility = {
    pipe, // Functional programming
    compose,
    // Performance Monitoring
    PerformanceMonitor,
    ReloadPerformanceTracker,
    getInjectionStats,
    clearInjectionCache,
    // General
    MintUtils,
};

// Direct Named Exports
export * from './utils.min.js';
export { MintAssembly } from './mintassembly.js';