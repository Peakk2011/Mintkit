import { isUnsafeCSS } from '../../security/validators/css-validator.js';
import { fnv1a } from '../cache/hash-generator.js';
import { cssCache, hashCache } from '../cache/index.js';

/**
 * Inject CSS into document with security validation
 * @param {string} cssString - CSS to inject
 * @param {Object} options - Injection options
 * @returns {HTMLStyleElement} Style element or null on error
 */
export function injectCSS(cssString, options = {}) {
    const {
        nonce = null,           // Content Security Policy support
        media = null,           // Media queries support
        priority = 'normal',    // Loading priority options | 'normal' | 'high' | 'low' |
        validate = true,        // Security validation = Bool
        onError = console.error // Error handling
    } = options;

    if (!cssString || typeof cssString !== 'string') {
        const error = new Error('injectCSS: Invalid CSS string provided');
        onError(error);
        return null;
    }

    if (validate && isUnsafeCSS(cssString)) {
        const error = new Error('injectCSS: Potentially unsafe CSS detected');
        onError(error);
        throw error;
    }

    const hash = fnv1a(cssString + (nonce || '') + (media || ''));

    if (hashCache.has(hash)) {
        return hashCache.get(hash);
    }

    try {
        const styleEl = document.createElement('style');
        styleEl.textContent = cssString;
        styleEl.setAttribute('data-css-hash', hash);
        styleEl.setAttribute('data-injected', 'true');

        if (nonce) {
            styleEl.setAttribute('nonce', nonce);
        }

        if (media) {
            styleEl.setAttribute('media', media);
        }

        const insertPosition = priority === 'high' ? 'afterbegin' : 'beforeend';

        requestAnimationFrame(() => {
            document.head.insertAdjacentElement(insertPosition, styleEl);
        });

        styleEl.removeCSS = () => {
            try {
                if (styleEl.parentNode) {
                    styleEl.parentNode.removeChild(styleEl);
                }
                cssCache.delete(styleEl);
                hashCache.delete(hash);

                styleEl.textContent = '';
                styleEl.removeCSS = null;
            } catch (cleanupError) {
                onError(cleanupError);
            }
        };

        // Store
        cssCache.set(styleEl, hash);
        hashCache.set(hash, styleEl);

        return styleEl;

    } catch (error) {
        onError(new Error(`injectCSS: Failed to inject CSS - ${error.message}`));
        return null;
    }
}