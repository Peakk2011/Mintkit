import {
    get,
    include,
    processIncludes,
    injectTitle,
    injectCSS,
    injectHTML,
    pipe,
    compose,
    createState,
    MintUtils,
    PerformanceMonitor,
    ReloadPerformanceTracker,
    AdjustHook
} from './MintUtils.js';
import { MintAssembly } from './HTMLInterpreter.js';

export { get, include, processIncludes, injectTitle } from './MintUtils.js';

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