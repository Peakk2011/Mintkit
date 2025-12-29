/**
 * Recursive deep clone fallback implementation
 * @param {any} obj - Object to clone
 * @param {WeakMap} hash - WeakMap for circular reference tracking
 * @returns {any} Cloned object
 */
export const deepCloneRecursive = (obj, hash = new WeakMap()) => {
    if (Object(obj) !== obj || obj instanceof Function) {
        return obj;
    }
    if (hash.has(obj)) {
        return hash.get(obj);
    }

    try {
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
        if (obj instanceof Map) {
            const mapClone = new Map();
            hash.set(obj, mapClone);
            obj.forEach((value, key) => mapClone.set(deepCloneRecursive(key, hash), deepCloneRecursive(value, hash)));
            return mapClone;
        }
        if (obj instanceof Set) {
            const setClone = new Set();
            hash.set(obj, setClone);
            obj.forEach(value => setClone.add(deepCloneRecursive(value, hash)));
            return setClone;
        }
    } catch (e) {
        console.error("Could not clone a specific object type, returning as is.", e);
        return obj;
    }

    const result = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));
    hash.set(obj, result);
    for (const key of Reflect.ownKeys(obj)) {
        result[key] = deepCloneRecursive(obj[key], hash);
    }
    return result;
};