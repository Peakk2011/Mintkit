/**
 * `structuredClone` API wrapper
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const structuredCloneAPI = (obj) => {
    try {
        return globalThis.structuredClone(obj);
    } catch (e) {
        throw e; // Let deep-clone handle it
    }
};