import { createState, AdjustHook, injectCSS, injectHTML, injectTitle } from './MintUtils.js';
import { MintAssembly } from './HTMLInterpreter.js';

export const Mint = {
    createState,
    AdjustHook,
    injectCSS,
    injectHTML,
    injectTitle,
    // MintAssembly Plugins that can use html to programming you can remove it
    MintAssembly
};