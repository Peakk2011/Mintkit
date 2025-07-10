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
} from './lib/MintUtils.js';
import { MintAssembly } from './lib/HTMLInterpreter.js';

export { get, include, processIncludes, injectTitle } from '../../mintkit/lib/MintUtils.js';

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