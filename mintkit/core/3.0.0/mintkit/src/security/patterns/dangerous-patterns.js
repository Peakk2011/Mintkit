/**
 * Dangerous patterns for security validation
 */
export const DANGEROUS_PATTERNS = {
    // Injection patterns
    SQL_INJECTION: /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
    XSS_SCRIPT: /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi,
    XSS_EVENT: /on\w+\s*=\s*["'][^"']*["']/gi,
    
    // Command injection
    COMMAND_INJECTION: /(;|\||&|\$\(|\`)/g,
    
    // Path traversal
    PATH_TRAVERSAL: /(\.\.\/|\.\.\\|~\/)/g,
    
    // File inclusion
    FILE_INCLUSION: /(\.\/|\.\.\/)[a-z0-9_\-\.\/]+/gi
};

/**
 * Check if string contains dangerous patterns
 * @param {string} input - String to check
 * @returns {boolean} True if dangerous patterns found
 */
export function containsDangerousPatterns(input) {
    return Object.values(DANGEROUS_PATTERNS).some(pattern => 
        pattern.test(input)
    );
}

/**
 * Get list of dangerous patterns found
 * @param {string} input - String to analyze
 * @returns {string[]} List of pattern names found
 */
export function getDangerousPatterns(input) {
    const foundPatterns = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
        if (pattern.test(input)) {
            foundPatterns.push(name);
            pattern.lastIndex = 0; // Reset regex
        }
    }

    return foundPatterns;
}