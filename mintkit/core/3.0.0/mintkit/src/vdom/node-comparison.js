/**
 * Check if two virtual nodes are of the same type
 * @param {Object} a - First virtual node
 * @param {Object} b - Second virtual node
 * @returns {boolean} True if same node type
 */
export function isSameNodeType(a, b) {
    if (!a || !b) return false;

    // Handle text nodes
    if (typeof a === 'string' || typeof a === 'number') {
        return typeof b === 'string' || typeof b === 'number';
    }

    return a.tag === b.tag && a.key === b.key;
}