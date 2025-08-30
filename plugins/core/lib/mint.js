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
    // Routing exports
    Router,
    navigate,
    Link,
    withRouter
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
    // AdjustHook, if you using Mintkit liveserver you can uncomment this line
    MintAssembly,
    // Routing
    Router,
    navigate,
    Link
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
    // Routing utilities
    withRouter
};

// Direct Named Exports
export * from './MintUtils.js';
export { MintAssembly } from './HTMLInterpreter.js';

// Export routing functions directly
export { Router, navigate, Link, withRouter };