import { SECURITY_PATTERNS } from '../../constants/security-patterns.js';

/**
 * CSS sanitizer for removing dangerous content
 */
export const CSSSanitizer = {
    /**
     * Sanitize CSS string
     * @param {string} css - CSS to sanitize
     * @returns {string} Sanitized CSS
     */
    sanitize(css) {
        let sanitized = String(css);

        // Remove dangerous patterns
        Object.values(SECURITY_PATTERNS).forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        return sanitized;
    },

    /**
     * Sanitize CSS with options
     * @param {string} css - CSS to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized CSS
     */
    sanitizeWithOptions(css, options = {}) {
        const {
            allowExpressions = false,
            allowDataUrls = false,
            allowImports = true
        } = options;

        let sanitized = String(css);

        if (!allowExpressions) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.CSS_EXPRESSION, '');
        }

        if (!allowDataUrls) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.DATA_HTML, '');
        }

        if (!allowImports) {
            sanitized = sanitized.replace(/@import[^;]+;/g, '');
        }

        // Always block these
        sanitized = sanitized
            .replace(SECURITY_PATTERNS.CSS_JAVASCRIPT_URL, '')
            .replace(SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT, '')
            .replace(SECURITY_PATTERNS.MOZ_BINDING, '')
            .replace(SECURITY_PATTERNS.VBSCRIPT, '');

        return sanitized;
    }
};