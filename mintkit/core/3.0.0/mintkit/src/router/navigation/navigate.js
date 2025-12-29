/**
 * Programmatic navigation helper function
 * @param {string} path - Path that you want to navigate
 */
export function navigate(path) {
    window.history.pushState({}, '', path);
    // Router will handle the rest via popstate event
}