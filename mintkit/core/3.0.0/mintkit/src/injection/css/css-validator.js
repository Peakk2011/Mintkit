import { SECURITY_PATTERNS } from '../../constants/security-patterns.js';

/**
 * CSS validation utilities
 */
export const CSSValidator = {
    /**
     * Validate CSS string for security
     * @param {string} css - CSS to validate
     * @returns {boolean} True if safe
     */
    validate(css) {
        const dangerousPatterns = [
            SECURITY_PATTERNS.CSS_EXPRESSION,
            SECURITY_PATTERNS.CSS_JAVASCRIPT_URL,
            SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT,
            SECURITY_PATTERNS.MOZ_BINDING,
            SECURITY_PATTERNS.VBSCRIPT,
            SECURITY_PATTERNS.DATA_HTML
        ];

        return !dangerousPatterns.some(pattern => pattern.test(css));
    },

    /**
     * Get validation errors
     * @param {string} css - CSS to check
     * @returns {string[]} List of validation errors
     */
    getValidationErrors(css) {
        const errors = [];
        const patterns = [
            { pattern: SECURITY_PATTERNS.CSS_EXPRESSION, name: 'CSS expression' },
            { pattern: SECURITY_PATTERNS.CSS_JAVASCRIPT_URL, name: 'JavaScript URL' },
            { pattern: SECURITY_PATTERNS.CSS_IMPORT_JAVASCRIPT, name: 'JavaScript import' },
            { pattern: SECURITY_PATTERNS.MOZ_BINDING, name: 'Mozilla binding' },
            { pattern: SECURITY_PATTERNS.VBSCRIPT, name: 'VBScript' },
            { pattern: SECURITY_PATTERNS.DATA_HTML, name: 'Data HTML' }
        ];

        patterns.forEach(({ pattern, name }) => {
            if (pattern.test(css)) {
                errors.push(name);
                pattern.lastIndex = 0; // Reset regex
            }
        });

        return errors;
    }
};