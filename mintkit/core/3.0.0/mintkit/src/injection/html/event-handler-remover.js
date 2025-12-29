/**
 * Remove event handlers from DOM nodes
 * @param {Node} node - DOM node to process
 */
export function removeEventHandlers(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const attributes = node.getAttributeNames();
        for (const attr of attributes) {
            if (attr.startsWith('on') && attr.length > 2) {
                node.removeAttribute(attr);
            }
        }

        for (const child of node.children) {
            removeEventHandlers(child);
        }
    }
}