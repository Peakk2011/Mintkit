/**
 * Pipe function - composes functions from left to right
 * @param {...Function} functions - Functions to pipe
 * @returns {Function} Composed function
 */
export const pipe = function () {
    const a = arguments;
    const len = a.length;

    for (let i = 0; i < len; i++) {
        if (typeof a[i] !== 'function') {
            throw new TypeError(`pipe: Argument at index ${i} is not a function`);
        }
    }

    return function (x) {
        let result = x;
        for (let i = 0; i < len; i++) {
            try {
                result = a[i](result);
            } catch (error) {
                console.error(`pipe: Error in function at index ${i}:`, error);
                throw error;
            }
        }
        return result;
    };
};