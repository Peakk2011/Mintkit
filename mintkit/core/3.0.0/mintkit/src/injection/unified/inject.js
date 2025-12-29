import { injectHTML } from '../html/inject-html.js';
import { injectCSS } from '../css/inject-css.js';

/**
 * Unified injection API for HTML and CSS
 * @param {Object} config - Injection configuration
 */
export function inject({ html: htmlConfig, css: cssConfig }) {
    if (!htmlConfig && !cssConfig) {
        console.warn('Mint.inject: No configuration provided for HTML or CSS.');
        return;
    }

    // HTML injection
    if (htmlConfig) {
        if (htmlConfig.id && htmlConfig.location) {
            let htmlContent = '';
            if (typeof htmlConfig.location === 'function') {
                htmlContent = htmlConfig.location();
            } else {
                htmlContent = htmlConfig.location;
            }
            try {
                injectHTML(htmlConfig.id, htmlContent, htmlConfig.options || {});
            } catch (error) {
                console.error('HTML injection failed:', error);
            }
        }
    }

    // CSS injection
    if (cssConfig) {
        if (cssConfig.location) {
            let cssContent = '';
            if (typeof cssConfig.location === 'function') {
                const locationResult = cssConfig.location();
                if (typeof locationResult === 'object') {
                    cssContent = Object.values(locationResult)
                        .filter(val => typeof val === 'string')
                        .join('\n');
                } else {
                    cssContent = locationResult;
                }
            } else if (typeof cssConfig.location === 'object') {
                cssContent = Object.values(cssConfig.location)
                    .filter(val => typeof val === 'string')
                    .join('\n');
            } else {
                cssContent = cssConfig.location;
            }
            try {
                injectCSS(cssContent, cssConfig.options || {});
            } catch (error) {
                console.error('CSS injection failed:', error);
            }
        }
    }
}