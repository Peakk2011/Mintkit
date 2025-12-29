/**
 * Compose function - composes functions from right to left
 * @param {...Function} functions - Functions to compose
 * @returns {Function} Composed function
 */
export const compose = function () {
    const a = arguments;
    const len = a.length;

    for (let i = 0; i < len; i++) {
        if (typeof a[i] !== 'function') {
            throw new TypeError(`compose: Argument at index ${i} is not a function`);
        }
    }

    return function (x) {
        let result = x;
        for (let i = len - 1; i >= 0; i--) {
            try {
                result = a[i](result);
            } catch (error) {
                console.error(`compose: Error in function at index ${i}:`, error);
                throw error;
            }
        }
        return result;
    };
};