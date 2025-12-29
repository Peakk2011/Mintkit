import { executeRouteHandlers } from './route-executor.js';

/**
 * MintKit Router client-side routing system
 * Singleton pattern that handle routing
 * @namespace Router
 */
export const Router = (() => {
    /**
     * @private {string} currentPath - current URL path
     * @private {Object} currentParams - Parameters from URL
     * @private {Array} routeHandlers - stored route callbacks
     * @private {Function|null} notFoundHandler - Handler for not found routes
     */
    let currentPath = window.location.pathname;
    let currentParams = {};
    let routeHandlers = [];
    let notFoundHandler = null;

    /**
     * Check URL if user pressed back/forward on browser
     * @listens window:popstate
     */
    window.addEventListener('popstate', () => {
        currentPath = window.location.pathname;
        currentParams = executeRouteHandlers(routeHandlers, currentPath, notFoundHandler);
    });

    // Create a public API
    return {
        /**
         * Register route pattern and callback function
         * @param {string} pattern - Route pattern string
         * @param {Function} callback - Function when directly call to route
         * @param {Object} callback.params - Parameters from URL
         * @returns {Router} - Router instance for method chaining
         */
        route(pattern, callback) {
            routeHandlers.push({ pattern, callback });
            return this;
        },

        /**
         * define handler when route not found
         * @param {Function} callback - Function when route not found
         * @param {string} callback.path - Undefined path 
         * @returns {Router} - Router instance for method chaining
         */
        notFound(callback) {
            notFoundHandler = callback;
            return this;
        },

        /**
         * Change route to path
         * @param {string} path - new path that navigate to
         */
        navigate(path) {
            window.history.pushState({}, '', path);
            currentPath = path;
            currentParams = executeRouteHandlers(routeHandlers, currentPath, notFoundHandler);
        },

        /**
         * Get current parameters to URL
         * @returns {Object} - Copy parameters object
         */
        getParams() {
            return { ...currentParams };
        },

        /**
         * Fetch path to current URL
         * @returns {string} - Current URL path
         */
        getPath() {
            return currentPath;
        },

        /**
         * Start routing system
         * @returns {Router} - Router instance for method chaining
         */
        init() {
            currentParams = executeRouteHandlers(routeHandlers, currentPath, notFoundHandler);
            return this;
        }
    };
})();