/**
 * Generate FNV-1a hash for strings
 * @param {string} str - Input string
 * @returns {string} Hexadecimal hash
 */
export function fnv1a(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ("0000000" + (hash >>> 0).toString(16)).substr(-8);
}