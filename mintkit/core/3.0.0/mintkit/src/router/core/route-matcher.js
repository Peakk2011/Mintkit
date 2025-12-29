/**
 * Match route pattern against path
 * @param {string} pattern - Route pattern
 * @param {string} path - URL path
 * @returns {Object|null} Match result or null
 */
export function matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length && !pattern.includes('[...')) {
        return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            // Dynamic parameter
            const paramName = patternParts[i].substring(1);
            params[paramName] = decodeURIComponent(pathParts[i] || '');
        } else if (patternParts[i].startsWith('[...') && patternParts[i].endsWith(']')) {
            // Catch-all parameter
            const paramName = patternParts[i].substring(4, patternParts[i].length - 1);
            params[paramName] = decodeURIComponent(pathParts.slice(i).join('/') || '');
            return { params, match: true };
        } else if (patternParts[i] !== pathParts[i]) {
            // Static part doesn't match
            return null;
        }
    }

    return { params, match: true };
}