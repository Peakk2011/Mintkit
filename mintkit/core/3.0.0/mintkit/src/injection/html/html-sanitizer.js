import { SECURITY_PATTERNS } from '../../constants/security-patterns.js';
import { DANGEROUS_TAGS } from '../../constants/dangerous-tags.js';

/**
 * Advanced HTML sanitizer
 */
export const HTMLSanitizer = {
    /**
     * Sanitize HTML string with configurable options
     * @param {string} html - HTML to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized HTML
     */
    sanitize(html, options = {}) {
        const {
            allowScripts = false,
            allowEvents = false,
            allowDangerousTags = false
        } = options;

        let sanitized = String(html);

        // Remove script tags if not allowed
        if (!allowScripts) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAG, '');
        }

        // Remove event handlers if not allowed
        if (!allowEvents) {
            sanitized = sanitized.replace(SECURITY_PATTERNS.EVENT_HANDLERS, '');
        }

        // Remove dangerous tags if not allowed
        if (!allowDangerousTags) {
            DANGEROUS_TAGS.forEach(tag => {
                const regex = new RegExp(`<${tag}\\b[^>]*>(.*?)</${tag}>`, 'gi');
                sanitized = sanitized.replace(regex, '');
            });
        }

        // Remove dangerous protocols
        sanitized = sanitized
            .replace(SECURITY_PATTERNS.JAVASCRIPT_PROTOCOL, '')
            .replace(SECURITY_PATTERNS.DATA_PROTOCOL, '')
            .replace(SECURITY_PATTERNS.HREF_JAVASCRIPT, ' href="#"')
            .replace(SECURITY_PATTERNS.SRC_JAVASCRIPT, ' src="#"');

        return sanitized;
    },

    /**
     * Check if HTML contains dangerous content
     * @param {string} html - HTML to check
     * @returns {boolean} True if dangerous content found
     */
    isDangerous(html) {
        return Object.values(SECURITY_PATTERNS).some(pattern => 
            pattern.test(html)
        );
    },

    /**
     * Get list of dangerous patterns found in HTML
     * @param {string} html - HTML to analyze
     * @returns {string[]} List of dangerous patterns found
     */
    analyzeDangerousPatterns(html) {
        const foundPatterns = [];
        
        for (const [name, pattern] of Object.entries(SECURITY_PATTERNS)) {
            if (pattern.test(html)) {
                foundPatterns.push(name);
                // Reset regex lastIndex
                pattern.lastIndex = 0;
            }
        }

        return foundPatterns;
    }
};