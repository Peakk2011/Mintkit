/**
 * Sanitize HTML string by removing dangerous content
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
    // Basic sanitization use DOMPurify or similar
    const dangerous = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const onEvents = /\son\w+\s*=\s*["'][^"']*["']/gi;
    const javascript = /javascript\s*:/gi;

    return html
        .replace(dangerous, '')
        .replace(onEvents, '')
        .replace(javascript, '');
}