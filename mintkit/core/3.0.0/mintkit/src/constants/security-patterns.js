/**
 * Security regex patterns for validation
 */
export const SECURITY_PATTERNS = {
    // HTML dangerous patterns
    SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    EVENT_HANDLERS: /\son\w+\s*=\s*["'][^"']*["']/gi,
    JAVASCRIPT_PROTOCOL: /javascript\s*:/gi,
    DATA_PROTOCOL: /data\s*:/gi,
    
    // CSS dangerous patterns
    CSS_EXPRESSION: /expression\s*\(/i,
    CSS_JAVASCRIPT_URL: /url\s*\(\s*['"]?javascript:/i,
    CSS_IMPORT_JAVASCRIPT: /@import\s+['"]?javascript:/i,
    MOZ_BINDING: /-moz-binding\s*:/i,
    VBSCRIPT: /vbscript\s*:/i,
    DATA_HTML: /data\s*:\s*text\/html/i,
    
    // Attribute patterns
    HREF_JAVASCRIPT: / href=\s*["']javascript:[^"']*["']/gi,
    SRC_JAVASCRIPT: / src=\s*["']javascript:[^"']*["']/gi,
    DATA_ATTR: / data:\s*[^"']*["']/gi
};