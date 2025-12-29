import { removeEventHandlers } from './event-handler-remover.js';
import { isNodeSafe } from './node-safety-checker.js';
import { insertContent } from './content-inserter.js';

/**
 * Inject HTML content into DOM with security features
 * @param {string} targetSelector - CSS selector for target element
 * @param {string} htmlContent - HTML content to inject
 * @param {Object} options - Injection options
 * @returns {Element} Target element or null on error
 */
export function injectHTML(targetSelector, htmlContent, options = {}) {
    // Default options
    const {
        sanitize = true,           // Toggle to clean HTML by default
        allowScripts = false,      // Don't accept scripts by default
        allowEvents = false,       // Don't accept event handlers by default
        mode = 'replace',
        onError = console.error,
        validate = true
    } = options;

    if (!targetSelector || typeof targetSelector !== 'string' || targetSelector.trim() === '') {
        const error = new Error('injectHTML: targetSelector must be a non-empty string');
        onError(error);
        throw error;
    }

    if (htmlContent === null || htmlContent === undefined) {
        htmlContent = '';
    }

    try {
        const target = document.querySelector(targetSelector);
        if (!target) {
            throw new Error(`injectHTML: No element matches selector: ${targetSelector}`);
        }

        // SECURITY SANITIZATION
        let processedHTML = String(htmlContent);

        processedHTML = processedHTML
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/ on\w+=\s*["'][^"']*["']/gi, '')
            .replace(/ href=\s*["']javascript:[^"']*["']/gi, ' href="#"')
            .replace(/ src=\s*["']javascript:[^"']*["']/gi, ' src="#"')
            .replace(/ data:\s*[^"']*["']/gi, '');

        if (!allowScripts && processedHTML.includes('<script')) {
            processedHTML = processedHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }

        // HTML PARSING
        const parser = new DOMParser();

        const doc = parser.parseFromString(`<template>${processedHTML}</template>`, 'text/html');

        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error(`injectHTML: HTML parsing failed - ${parseError.textContent}`);
        }

        const template = doc.querySelector('template');
        if (!template) {
            throw new Error('injectHTML: Template parsing failed');
        }

        const fragment = document.createDocumentFragment();
        const importedContent = document.importNode(template.content, true);

        if (!allowEvents) {
            removeEventHandlers(importedContent);
        }

        // SAFE INSERTION
        const cleanFragment = document.createDocumentFragment();

        while (importedContent.firstChild) {
            const node = importedContent.firstChild;

            if (isNodeSafe(node)) {
                cleanFragment.appendChild(node.cloneNode(true));
            }
            importedContent.removeChild(node);
        }

        insertContent(target, cleanFragment, mode);

        return target;

    } catch (error) {
        const enhancedError = new Error(`injectHTML: ${error.message}`);
        onError(enhancedError);
        throw enhancedError;
    }
}