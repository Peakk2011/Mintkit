/**
 * Check if a DOM node is safe to inject
 * @param {Node} node - DOM node to check
 * @returns {boolean} True if node is safe
 */
export function isNodeSafe(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return true;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        // Dangerous elements
        const tagName = node.tagName.toLowerCase();
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'base'];

        if (dangerousTags.includes(tagName)) {
            return false;
        }

        // Check dangerous attributes
        const attributes = node.getAttributeNames();
        for (const attr of attributes) {
            if (attr.startsWith('on') && attr.length > 2) {
                return false; // Not secure if it has event handlers
            }
            if (attr === 'href' || attr === 'src') {
                const value = node.getAttribute(attr) || '';
                if (value.toLowerCase().startsWith('javascript:') ||
                    value.toLowerCase().startsWith('data:')) {
                    return false;
                }
            }
        }

        return true;
    }

    return false;
}