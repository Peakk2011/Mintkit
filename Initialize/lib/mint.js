import { createState, AdjustHook, injectCSS, injectHTML, injectTitle, PerformanceTracking } from './MintUtils.js';
import { executeMintAssembly } from '../../mintAssembly/HTMLInterpreter.js';

export const Mint = {
    createState,
    AdjustHook,
    injectCSS,
    injectHTML,
    injectTitle,
    // MintAssembly Plugins that can use html to programming you can remove it
    executeMintAssembly,
    PerformanceTracking
};