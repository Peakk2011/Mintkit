import {
    get,
    include,
    processIncludes,
    injectTitle,
    injectCSS,
    injectHTML,
    createState,
    AdjustHook,
    pipe,
    compose,
    MintUtils,
    PerformanceMonitor,
    ReloadPerformanceTracker
} from './utils.js';
import { MintAssembly } from './mintassembly.js';

export { get, include, processIncludes, injectTitle } from './utils.js';

export const Mint = {
    get,
    include,
    processIncludes,
    injectTitle,
    injectCSS,
    injectHTML,
    createState,
    AdjustHook,
    MintAssembly
};

export const MintUtilsKit = {
    pipe,
    compose,
    MintUtils,
    PerformanceMonitor,
    ReloadPerformanceTracker
};