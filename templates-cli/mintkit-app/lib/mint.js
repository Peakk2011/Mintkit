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
} from './MintUtils.js';
import { MintAssembly } from './HTMLInterpreter.js';

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
export * from './MintUtils.js';
export { MintAssembly } from './HTMLInterpreter.js';