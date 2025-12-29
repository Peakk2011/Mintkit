/**
 * Process injection configuration
 */
export const ConfigProcessor = {
    /**
     * Process HTML configuration
     * @param {Object} htmlConfig - HTML config
     * @returns {Object} Processed config
     */
    processHTMLConfig(htmlConfig) {
        if (!htmlConfig || !htmlConfig.id || !htmlConfig.location) {
            return null;
        }

        let htmlContent = '';
        if (typeof htmlConfig.location === 'function') {
            htmlContent = htmlConfig.location();
        } else {
            htmlContent = htmlConfig.location;
        }

        return {
            targetSelector: htmlConfig.id,
            htmlContent,
            options: htmlConfig.options || {}
        };
    },

    /**
     * Process CSS configuration
     * @param {Object} cssConfig - CSS config
     * @returns {Object} Processed config
     */
    processCSSConfig(cssConfig) {
        if (!cssConfig || !cssConfig.location) {
            return null;
        }

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

        return {
            cssContent,
            options: cssConfig.options || {}
        };
    },

    /**
     * Validate injection configuration
     * @param {Object} config - Injection config
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const errors = [];

        if (config.html) {
            if (!config.html.id) {
                errors.push('HTML config missing id');
            }
            if (!config.html.location) {
                errors.push('HTML config missing location');
            }
        }

        if (config.css && !config.css.location) {
            errors.push('CSS config missing location');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};