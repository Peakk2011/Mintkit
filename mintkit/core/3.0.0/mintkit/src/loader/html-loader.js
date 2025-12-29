/**
 * HTML file loader
 */
export const HTMLLoader = {
    /**
     * Load HTML file
     * @param {string} url - HTML file URL
     * @returns {Promise<string>} Promise resolving to HTML content
     */
    async load(url) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            console.debug(`HTML file loaded: ${url} (${html.length} bytes)`);
            return html;
        } catch (error) {
            console.error(`Failed to load HTML file: ${url}`, error);
            throw error;
        }
    },

    /**
     * Load HTML and inject into DOM
     * @param {string} url - HTML file URL
     * @param {string} targetSelector - CSS selector for target element
     * @param {Object} options - Injection options
     * @returns {Promise<Element>} Promise resolving to target element
     */
    async loadAndInject(url, targetSelector = 'body', options = {}) {
        try {
            const html = await this.load(url);
            const target = document.querySelector(targetSelector);
            
            if (!target) {
                throw new Error(`Target element not found: ${targetSelector}`);
            }

            const { mode = 'append', ...injectOptions } = options;
            
            if (mode === 'replace') {
                target.innerHTML = html;
            } else if (mode === 'append') {
                target.insertAdjacentHTML('beforeend', html);
            } else if (mode === 'prepend') {
                target.insertAdjacentHTML('afterbegin', html);
            } else {
                throw new Error(`Invalid injection mode: ${mode}`);
            }

            console.debug(`HTML injected into: ${targetSelector}`);
            return target;
        } catch (error) {
            console.error(`Failed to inject HTML from ${url}`, error);
            throw error;
        }
    },

    /**
     * Load multiple HTML files
     * @param {string[]} urls - Array of HTML file URLs
     * @returns {Promise<string[]>} Promise resolving to array of HTML contents
     */
    loadMultiple(urls) {
        return Promise.all(urls.map(url => this.load(url)));
    }
};