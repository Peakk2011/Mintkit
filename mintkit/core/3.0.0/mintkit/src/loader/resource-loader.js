import { CSSLoader } from './css-loader.js';
import { HTMLLoader } from './html-loader.js';

/**
 * Universal resource loader
 * @param {string} url - Resource URL
 * @param {string} [targetSelector] - Target selector for HTML
 * @returns {Promise<void|HTMLElement|string>} Promise resolving to loaded resource
 */
export async function get(url, targetSelector) {
    if (!url || typeof url !== 'string') {
        throw new Error('get: url must be a string');
    }

    const lower = url.toLowerCase();
    
    try {
        if (lower.endsWith('.css')) {
            return await CSSLoader.load(url);
        } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            if (targetSelector) {
                return await HTMLLoader.loadAndInject(url, targetSelector);
            } else {
                return await HTMLLoader.load(url);
            }
        } else {
            throw new Error('get: Only .css, .html, .htm files are supported');
        }
    } catch (error) {
        console.error(`Failed to load resource: ${url}`, error);
        throw error;
    }
}

/**
 * Alias for get
 */
export const include = get;

/**
 * Get resource type from URL
 * @param {string} url - Resource URL
 * @returns {'css'|'html'|'unknown'} Resource type
 */
export function getResourceType(url) {
    const lower = url.toLowerCase();
    if (lower.endsWith('.css')) return 'css';
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
    return 'unknown';
}

/**
 * Check if resource is already loaded
 * @param {string} url - Resource URL
 * @returns {boolean} True if already loaded
 */
export function isAlreadyLoaded(url) {
    const type = getResourceType(url);
    
    if (type === 'css') {
        return !!document.querySelector(`link[href="${url}"]`);
    }
    
    // For HTML, we can't easily determine if it's loaded
    return false;
}