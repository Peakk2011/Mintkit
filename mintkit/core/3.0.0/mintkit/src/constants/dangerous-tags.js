/**
 * Dangerous HTML tags that should be blocked by default
 */
export const DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'base',
    'meta',
    'link',
    'style',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option'
];

/**
 * Tags that can be allowed with careful sanitization
 */
export const POTENTIALLY_SAFE_TAGS = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    'strong', 'em', 'b', 'i', 'u', 'br', 'hr'
];