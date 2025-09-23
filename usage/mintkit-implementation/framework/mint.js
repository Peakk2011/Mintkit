// Copyright © 2025 Mint teams
// Licensed under the MIT License

/**
 * @namespace Mint
 * @description Main Mintkit framework exports.
 */

import {
    injectCSS,
    injectHTML,
    inject,
    injectTitle,
    createState,
    get,
    include,
    processIncludes,
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker,
    getInjectionStats,
    clearInjectionCache,
    pipe,
    compose,
    MintUtils,
    Router,
    navigate,
    Link,
    withRouter
} from './mintkit.js';
import { MintAssembly } from './mintassembly.js';
import './event.js';

// Mintkit

export const Mint = {
    createState,
    injectCSS,
    injectHTML,
    inject,
    injectTitle,
    get,
    include,
    processIncludes,
    MintAssembly,
    Router,
    navigate,
    Link,
    withRouter,
    AdjustHook,
    PerformanceMonitor,
    ReloadPerformanceTracker,
    getInjectionStats,
    clearInjectionCache,
    pipe,
    compose,
    MintUtils,
    init: (fn) => queueMicrotask(fn)
};

export const event = null;