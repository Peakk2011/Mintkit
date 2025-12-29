/**
 * Check if object is a virtual node
 * @param {any} obj - Object to check
 * @returns {boolean} True if virtual node
 */
export const isVNode = (obj) => obj && typeof obj === 'object' && 'tag' in obj;