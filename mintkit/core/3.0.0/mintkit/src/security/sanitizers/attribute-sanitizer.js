import { EVENT_ATTRIBUTES } from '../../constants/event-attributes.js';

/**
 * Attribute sanitizer for HTML elements
 */
export const AttributeSanitizer = {
    /**
     * Check if attribute is safe
     * @param {string} name - Attribute name
     * @param {string} value - Attribute value
     * @returns {boolean} True if safe
     */
    isSafeAttribute(name, value) {
        const lowerName = name.toLowerCase();
        const lowerValue = value.toLowerCase();

        // Block event handlers
        if (EVENT_ATTRIBUTES.includes(lowerName)) {
            return false;
        }

        // Block dangerous protocols in href/src
        if ((lowerName === 'href' || lowerName === 'src') && 
            (lowerValue.startsWith('javascript:') || lowerValue.startsWith('data:'))) {
            return false;
        }

        return true;
    },

    /**
     * Sanitize attribute value
     * @param {string} name - Attribute name
     * @param {string} value - Attribute value
     * @returns {string} Sanitized value
     */
    sanitizeAttribute(name, value) {
        const lowerName = name.toLowerCase();
        const lowerValue = value.toLowerCase();

        // Replace dangerous protocols
        if ((lowerName === 'href' || lowerName === 'src') && 
            lowerValue.startsWith('javascript:')) {
            return '#';
        }

        // Remove dangerous attributes
        if (EVENT_ATTRIBUTES.includes(lowerName)) {
            return '';
        }

        return value;
    },

    /**
     * Sanitize all attributes on element
     * @param {Element} element - DOM element
     */
    sanitizeElementAttributes(element) {
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
            if (!this.isSafeAttribute(attr.name, attr.value)) {
                element.removeAttribute(attr.name);
            }
        });
    }
};