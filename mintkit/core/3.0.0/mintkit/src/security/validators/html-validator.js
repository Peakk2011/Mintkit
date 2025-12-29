import { SECURITY_PATTERNS } from '../../constants/security-patterns.js';
import { DANGEROUS_TAGS } from '../../constants/dangerous-tags.js';

/**
 * HTML validation utilities
 */
export const HTMLValidator = {
    /**
     * Validate HTML for security
     * @param {string} html - HTML to validate
     * @returns {boolean} True if safe
     */
    validate(html) {
        // Check for dangerous patterns
        const hasDangerousPattern = Object.values(SECURITY_PATTERNS).some(pattern => 
            pattern.test(html)
        );

        if (hasDangerousPattern) {
            return false;
        }

        // Check for dangerous tags
        const hasDangerousTag = DANGEROUS_TAGS.some(tag => {
            const regex = new RegExp(`<${tag}\\b`, 'i');
            return regex.test(html);
        });

        return !hasDangerousTag;
    },

    /**
     * Get HTML validation errors
     * @param {string} html - HTML to check
     * @returns {string[]} List of validation errors
     */
    getValidationErrors(html) {
        const errors = [];

        // Check dangerous patterns
        for (const [name, pattern] of Object.entries(SECURITY_PATTERNS)) {
            if (pattern.test(html)) {
                errors.push(`Dangerous pattern: ${name}`);
                pattern.lastIndex = 0; // Reset regex
            }
        }

        // Check dangerous tags
        DANGEROUS_TAGS.forEach(tag => {
            const regex = new RegExp(`<${tag}\\b`, 'i');
            if (regex.test(html)) {
                errors.push(`Dangerous tag: ${tag}`);
            }
        });

        return errors;
    }
};