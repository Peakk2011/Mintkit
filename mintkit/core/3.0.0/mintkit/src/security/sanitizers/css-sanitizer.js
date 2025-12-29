import { SECURITY_PATTERNS } from '../../constants/security-patterns.js';

/**
 * CSS sanitizer for removing dangerous content
 */
export const CSSSanitizer = {
    /**
     * Sanitize CSS string by removing dangerous patterns
     * @param {string} css - CSS string to sanitize
     * @returns {string} Sanitized CSS
     */
    sanitize(css) {
        if (!css || typeof css !== 'string') {
            return '';
        }

        let sanitized = css;

        // Remove dangerous patterns
        Object.values(SECURITY_PATTERNS).forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        return sanitized;
    },

    /**
     * Sanitize CSS with configurable options
     * @param {string} css - CSS string to sanitize
     * @param {Object} options - Sanitization options
     * @param {boolean} [options.allowExpressions=false] - Allow CSS expressions
     * @param {boolean} [options.allowDataUrls=false] - Allow data URLs
     * @param {boolean} [options.allowImports=true] - Allow @import statements
     * @param {boolean} [options.allowJavaScriptUrls=false] - Allow javascript: URLs
     * @returns {string} Sanitized CSS
     */
    sanitizeWithOptions(css, options = {}) {
        const {
            allowExpressions = false,
            allowDataUrls = false,
            allowImports = true,
            allowJavaScriptUrls = false
        } = options;

        if (!css || typeof css !== 'string') {
            return '';
        }

        let sanitized = css;

        // Handle CSS expressions
        if (!allowExpressions) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.CSS_EXPRESSION, '');
        }

        // Handle data URLs
        if (!allowDataUrls) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.DATA_HTML, '');
            sanitized = sanitized.replace(/url\s*\(\s*['"]?data:/gi, '');
        }

        // Handle imports
        if (!allowImports) {
            sanitized = sanitized.replace(/@import[^;]+;/gi, '');
        }

        // Handle JavaScript URLs
        if (!allowJavaScriptUrls) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.CSS_JAVASCRIPT_URL, '');
            sanitized = sanitized.replace(SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT, '');
        }

        // Always block these dangerous patterns
        sanitized = sanitized
            .replace(SECURITY_PATTERNS.MOZ_BINDING, '')
            .replace(SECURITY_PATTERNS.VBSCRIPT, '');

        return sanitized;
    },

    /**
     * Check if CSS needs sanitization
     * @param {string} css - CSS to check
     * @returns {boolean} True if contains dangerous patterns
     */
    needsSanitization(css) {
        if (!css || typeof css !== 'string') {
            return false;
        }

        const dangerousPatterns = [
            SECURITY_PATTERNS.CSS_EXPRESSION,
            SECURITY_PATTERNS.CSS_JAVASCRIPT_URL,
            SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT,
            SECURITY_PATTERNS.MOZ_BINDING,
            SECURITY_PATTERNS.VBSCRIPT,
            SECURITY_PATTERNS.DATA_HTML
        ];

        return dangerousPatterns.some(pattern => pattern.test(css));
    },

    /**
     * Get list of dangerous patterns found in CSS
     * @param {string} css - CSS to analyze
     * @returns {string[]} List of dangerous pattern names
     */
    analyzeDangerousPatterns(css) {
        if (!css || typeof css !== 'string') {
            return [];
        }

        const patterns = [
            { name: 'CSS Expression', pattern: SECURITY_PATTERNS.CSS_EXPRESSION },
            { name: 'JavaScript URL', pattern: SECURITY_PATTERNS.CSS_JAVASCRIPT_URL },
            { name: 'JavaScript Import', pattern: SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT },
            { name: 'Mozilla Binding', pattern: SECURITY_PATTERNS.MOZ_BINDING },
            { name: 'VBScript', pattern: SECURITY_PATTERNS.VBSCRIPT },
            { name: 'Data HTML', pattern: SECURITY_PATTERNS.DATA_HTML }
        ];

        const foundPatterns = [];

        patterns.forEach(({ name, pattern }) => {
            if (pattern.test(css)) {
                foundPatterns.push(name);
                pattern.lastIndex = 0; // Reset regex
            }
        });

        return foundPatterns;
    },

    /**
     * Sanitize CSS and return safe version
     * @param {string} css - CSS to sanitize
     * @param {Object} options - Sanitization options
     * @returns {{safeCSS: string, wasSanitized: boolean, removedPatterns: string[]}} Sanitization result
     */
    sanitizeAndReport(css, options = {}) {
        const dangerousPatterns = this.analyzeDangerousPatterns(css);
        const safeCSS = this.sanitizeWithOptions(css, options);

        return {
            safeCSS,
            wasSanitized: dangerousPatterns.length > 0,
            removedPatterns: dangerousPatterns,
            originalLength: css.length,
            sanitizedLength: safeCSS.length
        };
    }
};