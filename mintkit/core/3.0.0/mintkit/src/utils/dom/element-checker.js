/**
 * Check if value is a DOM element
 * @param {any} el - Value to check
 * @returns {boolean} True if DOM element
 */
export const isElement = (el) => el instanceof Element;

/**
 * Check if value is a text node
 * @param {any} node - Value to check
 * @returns {boolean} True if text node
 */
export const isTextNode = (node) => node instanceof Text;