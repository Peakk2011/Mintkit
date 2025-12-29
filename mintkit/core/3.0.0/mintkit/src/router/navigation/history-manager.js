/**
 * History API wrapper for navigation
 */
export const HistoryManager = {
    /**
     * Navigate to path
     * @param {string} path - Target path
     */
    push(path) {
        window.history.pushState({}, '', path);
    },

    /**
     * Replace current history entry
     * @param {string} path - Target path
     */
    replace(path) {
        window.history.replaceState({}, '', path);
    },

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    },

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    },

    /**
     * Go to specific history index
     * @param {number} delta - Number of steps
     */
    go(delta) {
        window.history.go(delta);
    }
};