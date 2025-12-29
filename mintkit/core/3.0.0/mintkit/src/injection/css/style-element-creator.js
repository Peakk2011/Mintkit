/**
 * Style element creator with CSP support
 */
export const StyleElementCreator = {
    /**
     * Create style element with attributes
     * @param {string} css - CSS content
     * @param {Object} options - Style options
     * @returns {HTMLStyleElement} Style element
     */
    create(css, options = {}) {
        const {
            nonce = null,
            media = null,
            priority = 'normal',
            hash = null
        } = options;

        const styleEl = document.createElement('style');
        styleEl.textContent = css;

        if (hash) {
            styleEl.setAttribute('data-css-hash', hash);
        }
        
        styleEl.setAttribute('data-injected', 'true');

        if (nonce) {
            styleEl.setAttribute('nonce', nonce);
        }

        if (media) {
            styleEl.setAttribute('media', media);
        }

        if (priority === 'high') {
            styleEl.setAttribute('data-priority', 'high');
        }

        return styleEl;
    },

    /**
     * Inject style element into DOM
     * @param {HTMLStyleElement} styleEl - Style element
     * @param {string} priority - Injection priority
     */
    inject(styleEl, priority = 'normal') {
        const insertPosition = priority === 'high' ? 'afterbegin' : 'beforeend';
        
        requestAnimationFrame(() => {
            document.head.insertAdjacentElement(insertPosition, styleEl);
        });
    },

    /**
     * Create and inject style element
     * @param {string} css - CSS content
     * @param {Object} options - Style options
     * @returns {HTMLStyleElement} Injected style element
     */
    createAndInject(css, options = {}) {
        const styleEl = this.create(css, options);
        this.inject(styleEl, options.priority);
        return styleEl;
    }
};