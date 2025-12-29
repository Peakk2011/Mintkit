/**
 * Deep equality check for objects and arrays
 * @param {any} obj1 - First object
 * @param {any} obj2 - Second object
 * @returns {boolean} True if deeply equal
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
        return obj1 === obj2;
    }

    if (obj1.constructor !== obj2.constructor) return false;

    if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
            if (!deepEqual(obj1[i], obj2[i])) return false;
        }
        return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (!Object.prototype.hasOwnProperty.call(obj2, key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}