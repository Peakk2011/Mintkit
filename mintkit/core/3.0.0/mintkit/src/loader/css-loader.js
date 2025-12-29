/**
 * CSS file loader
 */
export const CSSLoader = {
    /**
     * Load CSS file
     * @param {string} url - CSS file URL
     * @returns {Promise<HTMLLinkElement>} Promise resolving to link element
     */
    load(url) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${url}"]`)) {
                console.debug(`CSS file already loaded: ${url}`);
                resolve(document.querySelector(`link[href="${url}"]`));
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.setAttribute('data-loaded-by', 'mintkit-loader');

            link.onload = () => {
                console.debug(`CSS file loaded: ${url}`);
                resolve(link);
            };

            link.onerror = (error) => {
                console.error(`Failed to load CSS file: ${url}`, error);
                reject(new Error(`Failed to load CSS: ${url}`));
            };

            document.head.appendChild(link);
        });
    },

    /**
     * Load multiple CSS files
     * @param {string[]} urls - Array of CSS file URLs
     * @returns {Promise<HTMLLinkElement[]>} Promise resolving to array of link elements
     */
    loadMultiple(urls) {
        return Promise.all(urls.map(url => this.load(url)));
    },

    /**
     * Unload CSS file
     * @param {string} url - CSS file URL
     * @returns {boolean} True if successfully removed
     */
    unload(url) {
        const link = document.querySelector(`link[href="${url}"]`);
        if (link && link.parentNode) {
            link.parentNode.removeChild(link);
            console.debug(`CSS file unloaded: ${url}`);
            return true;
        }
        return false;
    }
};