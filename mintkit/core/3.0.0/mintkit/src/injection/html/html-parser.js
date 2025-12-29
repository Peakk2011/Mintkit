/**
 * HTML parsing utilities
 */
export const HTMLParser = {
    /**
     * Parse HTML string to DocumentFragment
     * @param {string} html - HTML string
     * @returns {DocumentFragment} Parsed document fragment
     * @throws {Error} If parsing fails
     */
    parseToFragment(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<template>${html}</template>`, 'text/html');

        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error(`HTML parsing failed: ${parseError.textContent}`);
        }

        const template = doc.querySelector('template');
        if (!template) {
            throw new Error('Template parsing failed');
        }

        return document.importNode(template.content, true);
    },

    /**
     * Parse HTML string and validate
     * @param {string} html - HTML string
     * @param {boolean} sanitize - Enable sanitization
     * @returns {DocumentFragment} Validated document fragment
     */
    parseAndValidate(html, sanitize = true) {
        let processedHTML = String(html);

        if (sanitize) {
            processedHTML = this.sanitizeHTML(processedHTML);
        }

        return this.parseToFragment(processedHTML);
    },

    /**
     * Basic HTML sanitization
     * @param {string} html - HTML string
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/ on\w+=\s*["'][^"']*["']/gi, '')
            .replace(/ href=\s*["']javascript:[^"']*["']/gi, ' href="#"')
            .replace(/ src=\s*["']javascript:[^"']*["']/gi, ' src="#"')
            .replace(/ data:\s*[^"']*["']/gi, '');
    }
};