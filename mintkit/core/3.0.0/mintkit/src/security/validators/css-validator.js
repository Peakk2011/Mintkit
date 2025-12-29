/**
 * Check if CSS string contains unsafe patterns
 * @param {string} cssString - CSS string to validate
 * @returns {boolean} True if unsafe patterns detected
 */
export function isUnsafeCSS(cssString) {
    const dangerousPatterns = [
        /expression\s*\(/i,
        /url\s*\(\s*['"]?javascript:/i,
        /@import\s+['"]?javascript:/i,
        /-moz-binding\s*:/i,
        /vbscript\s*:/i,
        /data\s*:\s*text\/html/i,
    ];

    const matchedPattern = dangerousPatterns.find(pattern => pattern.test(cssString));

    if (matchedPattern) {
        console.warn('isUnsafeCSS: The following pattern triggered the security check:', matchedPattern.toString());
        const match = cssString.match(matchedPattern);
        if (match) console.warn('isUnsafeCSS: The matched text was:', `"${match[0]}"`);
        return true;
    }

    return false;
}