import { matchRoute } from './route-matcher.js';

/**
 * Execute route handlers for current path
 * @param {Array} routeHandlers - Route handlers array
 * @param {string} currentPath - Current URL path
 * @param {Function|null} notFoundHandler - Not found handler
 * @returns {Object} Current parameters
 */
export function executeRouteHandlers(routeHandlers, currentPath, notFoundHandler) {
    let matched = false;
    let currentParams = {};

    for (const handler of routeHandlers) {
        const match = matchRoute(handler.pattern, currentPath);
        if (match) {
            currentParams = match.params;
            handler.callback(match.params);
            matched = true;
            break;
        }
    }

    if (!matched && notFoundHandler) {
        notFoundHandler(currentPath);
    }

    return currentParams;
}