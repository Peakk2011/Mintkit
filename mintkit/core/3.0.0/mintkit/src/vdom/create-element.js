/**
 * Create virtual DOM element
 * @param {string} tag - HTML tag name
 * @param {Object} props - Element properties
 * @param {...any} children - Child elements
 * @returns {Object} Virtual DOM node
 */
export function createElement(tag, props, ...children) {
    // Input validation
    if (!tag || typeof tag !== 'string') {
        throw new Error('createElement: tag must be a non-empty string');
    }

    const flatChildren = children.flat(Infinity).filter(child =>
        child !== null && child !== undefined && child !== false
    );

    return {
        tag,
        props: props || {},
        children: flatChildren,
        key: props?.key || null // Support for keys
    };
}