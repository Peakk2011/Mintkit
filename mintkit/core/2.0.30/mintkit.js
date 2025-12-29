/**
 * Mintkit Framework Core
 * Waring if you edit when wrong framework cant be use
 * Copyright © 2025 Mint teams
 * Licensed under the MIT License
 * Updated at: 2025-09-23
 */

export const pipe = function () {
    const a = arguments;
    const len = a.length;

    for (let i = 0; i < len; i++) {
        if (typeof a[i] !== 'function') {
            throw new TypeError(`pipe: Argument at index ${i} is not a function`);
        }
    }

    return function (x) {
        let result = x;
        for (let i = 0; i < len; i++) {
            try {
                result = a[i](result);
            } catch (error) {
                console.error(`pipe: Error in function at index ${i}:`, error);
                throw error;
            }
        }
        return result;
    };
};

export const compose = function () {
    const a = arguments;
    const len = a.length;

    for (let i = 0; i < len; i++) {
        if (typeof a[i] !== 'function') {
            throw new TypeError(`compose: Argument at index ${i} is not a function`);
        }
    }

    return function (x) {
        let result = x;
        for (let i = len - 1; i >= 0; i--) {
            try {
                result = a[i](result);
            } catch (error) {
                console.error(`compose: Error in function at index ${i}:`, error);
                throw error;
            }
        }
        return result;
    };
};

/**
 * Modern `structuredClone` API
 * @param {any} obj 
 * @returns {any} 
 */
const clone = (() => {
    if (typeof globalThis.structuredClone === 'function') {
        return (obj) => {
            try {
                return globalThis.structuredClone(obj);
            } catch (e) {
                console.warn("structuredClone failed, falling back to custom clone.", e);
                return deepCloneRecursive(obj);
            }
        };
    }

    const deepCloneRecursive = (obj, hash = new WeakMap()) => {
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

    console.warn("Mintkit: `structuredClone` is not available. Using a custom fallback.");
    return deepCloneRecursive;
})();

function createElement(tag, props, ...children) {
    // Input validation
    if (!tag || typeof tag !== 'string') {
        throw new Error('createElement: tag must be a non-empty string');
    }

    const flatChildren = children.flat(Infinity).filter(child =>
        child !== null && child !== undefined && child !== false
    );

    return {
        tag,
        props: props || {},
        children: flatChildren,
        key: props?.key || null // Support for keys
    };
}

function isSameNodeType(a, b) {
    if (!a || !b) return false;

    // Handle text nodes
    if (typeof a === 'string' || typeof a === 'number') {
        return typeof b === 'string' || typeof b === 'number';
    }

    return a.tag === b.tag && a.key === b.key;
}

function updateProps($el, oldProps, newProps) {
    if (!$el || !($el instanceof Element)) {
        console.warn('updateProps: Invalid DOM element');
        return;
    }

    oldProps = oldProps || {};
    newProps = newProps || {};

    Object.keys(oldProps).forEach(key => {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                $el.removeEventListener(eventName, oldProps[key]);
            } else if (key === 'className') {
                $el.className = '';
            } else if (key === 'style' && typeof oldProps[key] === 'object') {
                Object.keys(oldProps[key]).forEach(styleProp => {
                    $el.style[styleProp] = '';
                });
            } else if (key !== 'key') {
                $el.removeAttribute(key);
            }
        }
    });

    Object.keys(newProps).forEach(key => {
        const oldValue = oldProps[key];
        const newValue = newProps[key];

        if (oldValue !== newValue && key !== 'key') {
            if (key.startsWith('on') && typeof newValue === 'function') {
                const eventName = key.slice(2).toLowerCase();
                if (oldValue) {
                    $el.removeEventListener(eventName, oldValue);
                }
                $el.addEventListener(eventName, newValue);
            } else if (key === 'className') {
                $el.className = newValue || '';
            } else if (key === 'style') {
                if (typeof newValue === 'object') {
                    Object.assign($el.style, newValue);
                } else {
                    $el.setAttribute('style', newValue);
                }
            } else if (key === 'value' && ($el.tagName === 'INPUT' || $el.tagName === 'TEXTAREA')) {
                $el.value = newValue;
            } else if (key === 'checked' && $el.tagName === 'INPUT') {
                $el.checked = Boolean(newValue);
            } else {
                $el.setAttribute(key, newValue);
            }
        }
    });
}

function createDomNode(vNode) {
    if (vNode === null || vNode === undefined || vNode === false) {
        return document.createTextNode('');
    }

    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return document.createTextNode(String(vNode));
    }

    if (Array.isArray(vNode)) {
        const fragment = document.createDocumentFragment();
        vNode.forEach(child => {
            fragment.appendChild(createDomNode(child));
        });
        return fragment;
    }

    if (!vNode.tag) {
        console.warn('createDomNode: Invalid vNode', vNode);
        return document.createTextNode('');
    }

    try {
        const $el = document.createElement(vNode.tag);
        updateProps($el, {}, vNode.props);

        if (vNode.children && vNode.children.length > 0) {
            vNode.children.forEach(child => {
                const childNode = createDomNode(child);
                if (childNode) {
                    $el.appendChild(childNode);
                }
            });
        }

        return $el;
    } catch (error) {
        console.error('createDomNode: Error creating element:', error);
        return document.createTextNode(`[Error: ${vNode.tag}]`);
    }
}

function diff($parent, newVNode, oldVNode, index = 0) {
    if (!$parent || !($parent instanceof Element)) {
        console.warn('diff: Invalid parent element');
        return;
    }

    try {
        if (!oldVNode) {
            const newNode = createDomNode(newVNode);
            if (newNode) {
                $parent.appendChild(newNode);
            }
        } else if (!newVNode) {
            const childToRemove = $parent.childNodes[index];
            if (childToRemove) {
                $parent.removeChild(childToRemove);
            }
        } else if (typeof newVNode !== typeof oldVNode ||
            (typeof newVNode === 'string' && newVNode !== oldVNode) ||
            (typeof newVNode === 'number' && newVNode !== oldVNode) ||
            !isSameNodeType(newVNode, oldVNode)) {
            const newNode = createDomNode(newVNode);
            const oldNode = $parent.childNodes[index];
            if (newNode && oldNode) {
                $parent.replaceChild(newNode, oldNode);
            }
        } else if (newVNode.tag) {
            const currentNode = $parent.childNodes[index];
            if (currentNode) {
                updateProps(currentNode, oldVNode.props, newVNode.props);

                const newLen = newVNode.children ? newVNode.children.length : 0;
                const oldLen = oldVNode.children ? oldVNode.children.length : 0;
                const maxLen = Math.max(newLen, oldLen);

                for (let i = 0; i < maxLen; i++) {
                    diff(
                        currentNode,
                        newVNode.children ? newVNode.children[i] : null,
                        oldVNode.children ? oldVNode.children[i] : null,
                        i
                    );
                }
            }
        }
    } catch (error) {
        console.error('diff: Error during diffing:', error);
    }
}

export function createState(v) {
    let s = v;
    let c = [];
    let oldVNode = null;
    let root = null;
    let isUpdating = false;
    let updateQueue = [];

    const flushUpdates = () => {
        if (isUpdating) return;

        isUpdating = true;

        try {
            const currentState = s;
            for (let i = 0, l = c.length; i < l; i++) {
                if (typeof c[i] === 'function') {
                    try {
                        c[i](currentState);
                    } catch (error) {
                        console.error('createState: Error in subscriber:', error);
                    }
                }
            }

            if (root && oldVNode !== null && s && typeof s === 'object' && s.vdom) {
                try {
                    diff(root, s.vdom, oldVNode);
                    oldVNode = clone(s.vdom);
                } catch (error) {
                    console.error('createState: Error during DOM diffing:', error);
                }
            }
        } finally {
            isUpdating = false;

            if (updateQueue.length > 0) {
                const nextUpdate = updateQueue.shift();
                if (nextUpdate) {
                    s = nextUpdate;
                    setTimeout(flushUpdates, 0);
                }
            }
        }
    };

    return {
        get: function () {
            return s;
        },

        set: function (n) {
            const newState = typeof n === "function" ? n(s) : n;

            if (newState === s) return;

            if (isUpdating) {
                updateQueue.push(newState);
                return;
            }

            s = newState;

            setTimeout(flushUpdates, 0);
        },

        subscribe: function (f, mountPoint) {
            if (typeof f === "function") {
                c.push(f);

                return () => {
                    const index = c.indexOf(f);
                    if (index > -1) {
                        c.splice(index, 1);
                    }
                };
            }

            if (mountPoint && mountPoint instanceof HTMLElement) {
                root = mountPoint;
                if (s && typeof s === 'object' && s.vdom) {
                    try {
                        oldVNode = clone(s.vdom);
                        root.innerHTML = '';
                        const domNode = createDomNode(s.vdom);
                        if (domNode) {
                            root.appendChild(domNode);
                        }
                    } catch (error) {
                        console.error('createState: Error mounting initial DOM:', error);
                    }
                }
            }
        },

        createElement: createElement,

        getSubscriberCount: () => c.length,
        hasSubscribers: () => c.length > 0,
        clear: () => {
            c = [];
            oldVNode = null;
            root = null;
            updateQueue = [];
        }
    };
}

function isUnsafeCSS(cssString) {
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

// HTML Sanitization
function sanitizeHTML(html) {
    // Basic sanitization use DOMPurify or similar
    const dangerous = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const onEvents = /\son\w+\s*=\s*["'][^"']*["']/gi;
    const javascript = /javascript\s*:/gi;

    return html
        .replace(dangerous, '')
        .replace(onEvents, '')
        .replace(javascript, '');
}

// FNV-1a hash
function fnv1a(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ("0000000" + (hash >>> 0).toString(16)).substr(-8);
}

// Cache management
const cssCache = new WeakMap();
const hashCache = new Map();

export function injectCSS(cssString, options = {}) {
    const {
        nonce = null,           // Content Security Policy support
        media = null,           // Media queries support
        priority = 'normal',    // Loading priority options | 'normal' | 'high' | 'low' |
        validate = true,        // Security validation = Bool
        onError = console.error // Error handling
    } = options;

    console.log("Argument 1 (expected cssString):", cssString);
    console.log("Argument 2 (expected options):", options);

    if (!cssString || typeof cssString !== 'string') {
        const error = new Error('injectCSS: Invalid CSS string provided');
        onError(error);
        return null;
    }

    if (validate && isUnsafeCSS(cssString)) {
        const error = new Error('injectCSS: Potentially unsafe CSS detected');
        onError(error);
        throw error;
    }

    const hash = fnv1a(cssString + (nonce || '') + (media || ''));

    if (hashCache.has(hash)) {
        return hashCache.get(hash);
    }

    try {
        const styleEl = document.createElement('style');
        styleEl.textContent = cssString;
        styleEl.setAttribute('data-css-hash', hash);
        styleEl.setAttribute('data-injected', 'true');

        if (nonce) {
            styleEl.setAttribute('nonce', nonce);
        }

        if (media) {
            styleEl.setAttribute('media', media);
        }

        const insertPosition = priority === 'high' ? 'afterbegin' : 'beforeend';

        requestAnimationFrame(() => {
            document.head.insertAdjacentElement(insertPosition, styleEl);
        });

        styleEl.removeCSS = () => {
            try {
                if (styleEl.parentNode) {
                    styleEl.parentNode.removeChild(styleEl);
                }
                cssCache.delete(styleEl);
                hashCache.delete(hash);

                styleEl.textContent = '';
                styleEl.removeCSS = null;
            } catch (cleanupError) {
                onError(cleanupError);
            }
        };

        // Store
        cssCache.set(styleEl, hash);
        hashCache.set(hash, styleEl);

        return styleEl;

    } catch (error) {
        onError(new Error(`injectCSS: Failed to inject CSS - ${error.message}`));
        return null;
    }
}

export function injectHTML(targetSelector, htmlContent, options = {}) {
    // Default options
    const {
        sanitize = true,           // Toggle to clean HTML by default
        allowScripts = false,      // Dont accept scripts by default
        allowEvents = false,       // Dont accept event handlers by default
        mode = 'replace',
        onError = console.error,
        validate = true
    } = options;

    /*
        mode: 'sanitize' | 'allowScripts' | 'allowEvents'
        Mint.injectHTML("#app", trustedContent, {
            sanitize: false,     // Disable sanitization
            allowScripts: true,  // Scripts
            allowEvents: true    // Events
        });

        Error Handling:
        // If it has script will be removed
        Mint.injectHTML("#app", "<script>alert('hacked')</script>");
        // Result: script got removed
    */

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
            removeEventHandlers(importedContent); // Call when `allowEvents = false`
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

// Mint.injectHTML helper functions
/*
    function removeEventHandlers(node) {  }             // For injectHTML
    function isNodeSafe(node) {  }                      // For injectHTML
    function insertContent(target, content, mode) { }   // For injectHTML

    Usage:

    export function injectHTML(targetSelector, htmlContent, options = {}) {
    ...
        removeEventHandlers(importedContent);       // Call helper
        isNodeSafe(node);                           // Call helper  
        insertContent(target, cleanFragment, mode); // Call helper
    ...
    }
*/

function removeEventHandlers(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const attributes = node.getAttributeNames();
        for (const attr of attributes) {
            if (attr.startsWith('on') && attr.length > 2) {
                node.removeAttribute(attr);
            }
        }

        for (const child of node.children) {
            removeEventHandlers(child);
        }
    }
}

function isNodeSafe(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return true;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        // Dangerous elements
        const tagName = node.tagName.toLowerCase();
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'base'];

        if (dangerousTags.includes(tagName)) {
            return false;
        }

        // Check dangerous attributes
        const attributes = node.getAttributeNames();
        for (const attr of attributes) {
            if (attr.startsWith('on') && attr.length > 2) {
                return false; // Not secure if it has event handlers
            }
            if (attr === 'href' || attr === 'src') {
                const value = node.getAttribute(attr) || '';
                if (value.toLowerCase().startsWith('javascript:') ||
                    value.toLowerCase().startsWith('data:')) {
                    return false;
                }
            }
        }

        return true;
    }

    return false;
}

function insertContent(target, content, mode) {
    // Safe DOM methods
    switch (mode) {
        case 'append':
            target.appendChild(content);
            break;
        case 'prepend':
            target.insertBefore(content, target.firstChild);
            break;
        case 'replace':
        default:
            while (target.firstChild) {
                target.removeChild(target.firstChild);
            }
            target.appendChild(content);
            break;
    }
}

/**
 * inject API = resolve issues for multiple injectHTML and injectCSS 
 * @param {Function} configFunction - Configuration function that defines HTML and CSS injection settings
 * 
 * @example
 * // Basic usage
 * Mint.inject(() => {
 *     html({
 *         id: '#app',
 *         location() { return '<div>Hello World</div>'; }
 *     });
 *     
 *     css({
 *         location() { 
 *             return {
 *                 base: 'body { margin: 0; }',
 *                 navbar: '.navbar { background: #333; }'
 *             }; 
 *         }
 *     });
 * });
 * 
 * @example
 * // With options
 * Mint.inject(function() {
 *     this.html({
 *         id: '#content',
 *         location: () => myTemplate.render(),
 *         options: {
 *             mode: 'append',
 *             sanitize: true
 *         }
 *     });
 *     
 *     this.css({
 *         location: () => myStyles.compile(),
 *         options: {
 *             priority: 'high',
 *             media: 'screen'
 *         }
 *     });
 * });
 * 
 * @throws {Error} When configFunction is not a function
 * @returns {Object} Configuration object with html and css properties
 * 
 */

/**
 * @param {object} config - The injection configuration object.
 * @param {object} [config.html] - Configuration for HTML injection.
 * @param {string} config.html.id - The CSS selector for the target element (e.g., '#app').
 * @param {Function|string} config.html.location - A function returning the HTML string, or the HTML string directly.
 * @param {object} [config.html.options] - Additional options passed to `injectHTML`.
 *
 * @param {object} [config.css] - Configuration for CSS injection.
 * @param {Function|string|object} config.css.location - A function returning CSS, a CSS string, or an object of CSS strings.
 * @param {object} [config.css.options] - Additional options passed to `injectCSS`.
 *
 * @example
 * // Basic usage with functions for content
 * Mint.inject({
 *   html: {
 *     id: '#app',
 *     location: () => '&lt;div&gt;Hello World&lt;/div&gt;'
 *   },
 *   css: {
 *     location: () => ({
 *       base: 'body { margin: 0; }',
 *       component: '.my-component { color: red; }'
 *     })
 *   }
 * });
 *
 * @example
 * // Usage with options and direct content
 * Mint.inject({
 *   html: {
 *     id: '#content',
 *     location: myTemplate,
 *     options: { mode: 'append', sanitize: false }
 *   },
 *   css: {
 *     location: myStyles,
 *     options: { priority: 'high', media: 'screen' }
 *   }
 * });
 */

export function inject({ html: htmlConfig, css: cssConfig }) {
    if (!htmlConfig && !cssConfig) {
        console.warn('Mint.inject: No configuration provided for HTML or CSS.');
        return;
    }

    // HTML injection
    if (htmlConfig) {
        if (htmlConfig.id && htmlConfig.location) {
            let htmlContent = '';
            if (typeof htmlConfig.location === 'function') {
                htmlContent = htmlConfig.location();
            } else {
                htmlContent = htmlConfig.location;
            }
            try {
                injectHTML(htmlConfig.id, htmlContent, htmlConfig.options || {});
            } catch (error) {
                console.error('HTML injection failed:', error);
            }
        }
    }

    // CSS injection
    if (cssConfig) {
        if (cssConfig.location) {
            let cssContent = '';
            if (typeof cssConfig.location === 'function') {
                const locationResult = cssConfig.location();
                if (typeof locationResult === 'object') {
                    cssContent = Object.values(locationResult)
                        .filter(val => typeof val === 'string')
                        .join('\n');
                } else {
                    cssContent = locationResult;
                }
            } else if (typeof cssConfig.location === 'object') {
                cssContent = Object.values(cssConfig.location)
                    .filter(val => typeof val === 'string')
                    .join('\n');
            } else {
                cssContent = cssConfig.location;
            }
            try {
                injectCSS(cssContent, cssConfig.options || {});
            } catch (error) {
                console.error('CSS injection failed:', error);
            }
        }
    }
}

export function clearInjectionCache() {
    hashCache.clear();
}

// Performance monitoring
export function getInjectionStats() {
    return {
        hashCacheSize: hashCache.size,
        memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        } : 'not available'
    };
}

export function injectTitle(titleHtmlString) {
    if (!titleHtmlString || typeof titleHtmlString !== 'string') {
        console.warn('injectTitle: Invalid title string provided');
        return;
    }

    try {
        let head = document.head;
        if (!head) {
            head = document.createElement('head');
            document.documentElement.appendChild(head);
        }

        const existingTitle = head.querySelector('title');
        if (existingTitle) {
            existingTitle.remove();
        }

        const cleanTitle = titleHtmlString.trim();
        if (!cleanTitle.startsWith('<title>') || !cleanTitle.endsWith('</title>')) {
            console.warn('injectTitle: Title string should be wrapped in <title> tags');
        }

        head.insertAdjacentHTML('beforeend', cleanTitle);

        const titleElement = head.querySelector('title');
        if (titleElement) {
            console.debug('injectTitle: Title updated to:', titleElement.textContent);
        }

    } catch (error) {
        console.error('injectTitle: Error injecting title:', error);
    }
}

/**
 * @param {string} url
 * @param {string} [targetSelector]
 * @returns {Promise<void|HTMLElement>}
 */
export async function get(url, targetSelector) {
    if (!url || typeof url !== 'string') {
        throw new Error('get: url must be a string');
    }
    const lower = url.toLowerCase();
    if (lower.endsWith('.css')) {
        if (document.querySelector(`link[href="${url}"]`)) {
            return;
        }
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve(link);
            link.onerror = (e) => reject(e);
            document.head.appendChild(link);
        });
    } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`get: HTTP ${res.status}`);
        const html = await res.text();
        const selector = targetSelector || 'body';
        const target = document.querySelector(selector);
        if (target) {
            target.insertAdjacentHTML('beforeend', html);
            return target;
        }
        throw new Error(`get: No element matches selector: ${selector}`);
    } else {
        throw new Error('get: Only .css, .html, .htm files are supported');
    }
}

export const include = get;

export async function processIncludes(context = document) {
    const includeRegex = /@include\(['"]([^'"]+)['"]\)/g;
    const walker = document.createTreeWalker(
        context.body || context,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    let node;
    const tasks = [];
    while ((node = walker.nextNode())) {
        let match;
        let text = node.nodeValue;
        let replaced = false;
        while ((match = includeRegex.exec(text))) {
            const file = match[1];
            tasks.push(
                (async () => {
                    if (file.endsWith('.css')) {
                        await get(file);
                    } else if (file.endsWith('.html') || file.endsWith('.htm')) {
                        const res = await fetch(file);
                        if (res.ok) {
                            const html = await res.text();
                            node.nodeValue = node.nodeValue.replace(match[0], html);
                        }
                    }
                })()
            );
            replaced = true;
        }
    }
    await Promise.all(tasks);
}

export const AdjustHook = (options = {}) => {
    const config = {
        interval: options.interval || 1000,
        endpoint: options.endpoint || "/reload",
        onReload: options.onReload || (() => location.reload()),
        onError: options.onError || ((error) => console.warn('AdjustHook: Reload check failed:', error)),
        onMetricsUpdate: options.onMetricsUpdate || null,
        enabled: options.enabled !== false,
        performanceMonitoring: options.performanceMonitoring || false,
        detailedLogging: options.detailedLogging || false,
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 2000,
        healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
        metricsReportInterval: options.metricsReportInterval || 10 // Report every N requests
    };

    if (!config.enabled) {
        console.debug('AdjustHook: Hot reload disabled');
        return { stop: () => { }, getStats: () => ({}), getMetrics: () => ({}) };
    }

    let intervalId = null;
    let healthCheckId = null;
    let isChecking = false;
    let retryCount = 0;
    let startTime = Date.now();

    const metrics = {
        // Request metrics
        requests: {
            total: 0,
            successful: 0,
            failed: 0,
            retries: 0
        },

        // Performance metrics
        performance: {
            totalTime: 0,
            avgResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            lastResponseTime: 0,
            responseTimeHistory: [] // Keep last 50 responses
        },

        // Error metrics
        errors: {
            total: 0,
            consecutive: 0,
            maxConsecutive: 0,
            types: {},
            lastError: null,
            lastErrorTime: null
        },

        // Health metrics
        health: {
            uptime: 0,
            isHealthy: true,
            lastSuccessTime: Date.now(),
            lastFailureTime: null,
            successRate: 100
        },

        server: {
            memoryUsage: 0,
            cpuUsage: 0,
            uptime: 0,
            version: null,
            lastUpdate: null
        }
    };

    const updatePerformanceMetrics = (responseTime) => {
        const perf = metrics.performance;

        perf.totalTime += responseTime;
        perf.lastResponseTime = responseTime;
        perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
        perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
        perf.avgResponseTime = perf.totalTime / metrics.requests.total;

        perf.responseTimeHistory.push(responseTime);
        if (perf.responseTimeHistory.length > 50) {
            perf.responseTimeHistory.shift();
        }
    };

    const updateErrorMetrics = (error) => {
        metrics.errors.total++;
        metrics.errors.consecutive++;
        metrics.errors.maxConsecutive = Math.max(
            metrics.errors.maxConsecutive,
            metrics.errors.consecutive
        );
        metrics.errors.lastError = error.message || error.toString();
        metrics.errors.lastErrorTime = Date.now();

        const errorType = error.name || 'UnknownError';
        metrics.errors.types[errorType] = (metrics.errors.types[errorType] || 0) + 1;

        metrics.health.isHealthy = metrics.errors.consecutive < 5;
        metrics.health.lastFailureTime = Date.now();
    };

    const resetConsecutiveErrors = () => {
        metrics.errors.consecutive = 0;
        metrics.health.isHealthy = true;
        metrics.health.lastSuccessTime = Date.now();
    };

    const updateHealthMetrics = () => {
        metrics.health.uptime = Date.now() - startTime;

        const total = metrics.requests.successful + metrics.requests.failed;
        metrics.health.successRate = total > 0
            ? (metrics.requests.successful / total) * 100
            : 100;
    };

    const getResponseTimePercentile = (percentile) => {
        if (metrics.performance.responseTimeHistory.length === 0) return 0;

        const sorted = [...metrics.performance.responseTimeHistory].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    };

    // Metrics reporting
    const reportMetrics = () => {
        if (!config.performanceMonitoring) return;

        const report = {
            timestamp: new Date().toISOString(),
            uptime: metrics.health.uptime,
            requests: metrics.requests,
            performance: {
                ...metrics.performance,
                p50: getResponseTimePercentile(50),
                p95: getResponseTimePercentile(95),
                p99: getResponseTimePercentile(99)
            },
            errors: metrics.errors,
            health: metrics.health,
            server: metrics.server
        };

        if (config.detailedLogging) {
            console.group('AdjustHook Detailed Metrics');
            console.table({
                'Total Requests': metrics.requests.total,
                'Success Rate': `${metrics.health.successRate.toFixed(2)}%`,
                'Avg Response': `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
                'P95 Response': `${getResponseTimePercentile(95).toFixed(2)}ms`,
                'Consecutive Errors': metrics.errors.consecutive,
                'Health Status': metrics.health.isHealthy ? 'Healthy' : 'Degraded'
            });
            console.groupEnd();
        } else {
            console.log(
                `AdjustHook: ${metrics.requests.total} req, ` +
                `${metrics.health.successRate.toFixed(1)}% success, ` +
                `${metrics.performance.avgResponseTime.toFixed(1)}ms avg, ` +
                `${metrics.errors.consecutive} consecutive errors`
            );
        }

        if (config.onMetricsUpdate) {
            config.onMetricsUpdate(report);
        }
    };

    const performHealthCheck = () => {
        updateHealthMetrics();

        if (config.detailedLogging) {
            console.log(`AdjustHook Health Check: ${metrics.health.isHealthy ? 'Healthy' : 'Degraded'}`);
        }
    };

    // RETRY
    const executeWithRetry = async (fn, maxRetries = config.maxRetries) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }

                metrics.requests.retries++;
                const delay = config.retryDelay * attempt; // Exponential backoff

                if (config.detailedLogging) {
                    console.warn(`AdjustHook: Retry ${attempt}/${maxRetries} in ${delay}ms`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Check reload function
    const checkReload = async () => {
        if (isChecking) return;

        isChecking = true;
        const requestStart = performance.now();

        try {
            await executeWithRetry(async () => {
                metrics.requests.total++;

                const response = await fetch(config.endpoint, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                        'X-AdjustHook-Version': '2.0',
                        'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    },
                    signal: AbortSignal.timeout(5000) // 5s
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const responseTime = performance.now() - requestStart;

                if (data.metrics) {
                    Object.assign(metrics.server, {
                        memoryUsage: data.metrics.memory || 0,
                        cpuUsage: data.metrics.cpu || 0,
                        uptime: data.metrics.uptime || 0,
                        version: data.metrics.version || null,
                        lastUpdate: Date.now()
                    });
                }

                updatePerformanceMetrics(responseTime);
                metrics.requests.successful++;
                resetConsecutiveErrors();

                if (data && data.reload) {
                    console.info(
                        `AdjustHook: Reload triggered by server ` +
                        `(Response: ${responseTime.toFixed(2)}ms, ` +
                        `Memory: ${formatBytes(data.metrics?.memory || 0)})`
                    );
                    config.onReload();
                    return;
                }

                if (metrics.requests.total % config.metricsReportInterval === 0) {
                    reportMetrics();
                }
            });

        } catch (error) {
            metrics.requests.failed++;
            updateErrorMetrics(error);

            // Only log errors in development
            if (config.detailedLogging ||
                location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1') {
                config.onError(error);
            }
        } finally {
            isChecking = false;
            updateHealthMetrics();
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    intervalId = setInterval(checkReload, config.interval);
    healthCheckId = setInterval(performHealthCheck, config.healthCheckInterval);

    console.debug(
        `AdjustHook: Started monitoring ` +
        `(${config.interval}ms interval, ${config.maxRetries} retries, ` +
        `health check every ${config.healthCheckInterval}ms)`
    );

    // Return control object
    return {
        stop: () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            if (healthCheckId) {
                clearInterval(healthCheckId);
                healthCheckId = null;
            }

            console.debug('AdjustHook: Stopped');

            if (config.performanceMonitoring) {
                console.log('AdjustHook Final Report:');
                reportMetrics();
            }
        },

        getStats: () => ({
            requests: metrics.requests.total,
            errors: metrics.errors.total,
            totalTime: metrics.performance.totalTime,
            avgTime: metrics.performance.avgResponseTime,
            lastCheckTime: metrics.performance.lastResponseTime
        }),

        getMetrics: () => ({
            ...metrics,
            summary: {
                uptime: metrics.health.uptime,
                successRate: metrics.health.successRate,
                avgResponseTime: metrics.performance.avgResponseTime,
                p95ResponseTime: getResponseTimePercentile(95),
                healthStatus: metrics.health.isHealthy ? 'healthy' : 'degraded'
            }
        }),

        reportMetrics,
        getLastCheckTime: () => metrics.performance.lastResponseTime,
        isHealthy: () => metrics.health.isHealthy,

        getFormattedMetrics: () => ({
            uptime: formatDuration(metrics.health.uptime),
            successRate: `${metrics.health.successRate.toFixed(2)}%`,
            avgResponse: `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
            memoryUsage: formatBytes(metrics.server.memoryUsage),
            totalRequests: metrics.requests.total.toLocaleString(),
            errorRate: `${((metrics.requests.failed / metrics.requests.total) * 100).toFixed(2)}%`
        })
    };

    // Helper
    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};

export const MintUtils = {
    isElement: (el) => el instanceof Element,
    isTextNode: (node) => node instanceof Text,
    isVNode: (obj) => obj && typeof obj === 'object' && 'tag' in obj,
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    deepEqual: function deepEqual(obj1, obj2) {
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
};

// Performance monitoring utility
export const PerformanceMonitor = {
    timers: new Map(),
    enabled: false,

    start(label) {
        if (!this.enabled) return this;
        this.timers.set(label, performance.now());
        return this;
    },

    end(label) {
        if (!this.enabled) return 0;
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(label);
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    },

    measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    },

    async measureAsync(label, fn) {
        this.start(label);
        const result = await fn();
        this.end(label);
        return result;
    },

    getStats() {
        const stats = {};
        for (const [label, startTime] of this.timers) {
            stats[label] = performance.now() - startTime;
        }
        return stats;
    },

    clear() {
        this.timers.clear();
    },

    enable() {
        this.enabled = true;
        console.log('PerformanceMonitor enabled.');
    },

    disable() {
        this.enabled = false;
    }
};

// Reload performance tracker
export const ReloadPerformanceTracker = {
    history: [],
    maxHistory: 25,
    enabled: false,

    recordReload(duration, fileCount = 0, memoryUsage = 0) {
        if (!this.enabled) return null;
        const entry = {
            timestamp: Date.now(),
            duration,
            fileCount,
            memoryUsage,
            date: new Date().toISOString()
        };

        this.history.push(entry);

        // Keep only the last maxHistory entries
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        console.log(`Reload recorded: ${duration.toFixed(2)}ms, Files: ${fileCount}, Memory: ${memoryUsage} bytes`);
        return entry;
    },

    getStats() {
        if (this.history.length === 0) return null;

        const durations = this.history.map(h => h.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return {
            totalReloads: this.history.length,
            averageTime: avg,
            minTime: min,
            maxTime: max,
            lastReload: this.history[this.history.length - 1]
        };
    },

    logStats() {
        if (!this.enabled) return;
        const stats = this.getStats();
        if (stats) {
            console.log(`Reload Performance Stats:`);
            console.log(`   Total reloads: ${stats.totalReloads}`);
            console.log(`   Average time: ${stats.averageTime.toFixed(2)}ms`);
            console.log(`   Min time: ${stats.minTime.toFixed(2)}ms`);
            console.log(`   Max time: ${stats.maxTime.toFixed(2)}ms`);
            console.log(`   Last reload: ${stats.lastReload.duration.toFixed(2)}ms`);
        }
    },

    clear() {
        this.history = [];
    },

    enable() {
        this.enabled = true;
        console.log('ReloadPerformanceTracker enabled.');
    },

    disable() {
        this.enabled = false;
    }
};

// Routes

/**
 * MintKit Router client-side routing system
 * Singleton pattern that handle routing
 * @namespace Router
 */
export const Router = (() => {
    /**
     * @private {string} currentPath - current URL path
     * @private {Object} currentParams - Parameters from URL
     * @private {Array} routeHandlers - stored route callbacks
     * @private {Function|null} notFoundHandler - Handler for not found routes
     */
    let currentPath = window.location.pathname;
    let currentParams = {};
    let routeHandlers = [];
    let notFoundHandler = null;

    /**
     * Check URL if user pressed back/forward on browser
     * @listens window:popstate
     */
    window.addEventListener('popstate', () => {
        currentPath = window.location.pathname;
        executeRouteHandlers();
    });

    /**
     * Check fuction for URL that match pattern that defind from parameters
     * @private
     * @param {string} pattern - Route pattern ('/user/:id', '/blog/[...slug]')
     * @param {string} path - URL path browser
     * @returns {Object|null} - { params: Object, match: boolean } or null if no match
     * 
     * @example
     * matchRoute('/user/:id', '/user/123') // returns { params: { id: '123' }, match: true }
     * matchRoute('/blog/[...slug]', '/blog/react/2024') // returns { params: { slug: 'react/2024' }, match: true }
     */
    function matchRoute(pattern, path) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length && !pattern.includes('[...')) {
            return null;
        }

        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                // Dynamic parameter
                const paramName = patternParts[i].substring(1);
                params[paramName] = decodeURIComponent(pathParts[i] || '');
            } else if (patternParts[i].startsWith('[...') && patternParts[i].endsWith(']')) {
                // Catch-all parameter
                const paramName = patternParts[i].substring(4, patternParts[i].length - 1);
                params[paramName] = decodeURIComponent(pathParts.slice(i).join('/') || '');
                return { params, match: true };
            } else if (patternParts[i] !== pathParts[i]) {
                // Static part doesn't match
                return null;
            }
        }

        return { params, match: true };
    }

    /**
     * Call callback functions that match current route
     * @private
     */
    function executeRouteHandlers() {
        let matched = false;

        for (const handler of routeHandlers) {
            const match = matchRoute(handler.pattern, currentPath);
            if (match) {
                currentParams = match.params;
                handler.callback(match.params);
                matched = true;
                break;
            }
        }

        if (!matched && notFoundHandler) {
            notFoundHandler(currentPath);
        }
    }

    // Create a public API
    return {
        /**
         * Register route pattern and callback function
         * @param {string} pattern - Route pattern string
         * @param {Function} callback - Function when directly call to route
         * @param {Object} callback.params - Parameters from URL
         * @returns {Router} - Router instance for method chaining
         */
        route(pattern, callback) {
            routeHandlers.push({ pattern, callback });
            return this;
        },

        /**
         * define handler when route not found
         * @param {Function} callback - Function when route not found
         * @param {string} callback.path - Undefinded path 
         * @returns {Router} - Router instance for method chaining
         */
        notFound(callback) {
            notFoundHandler = callback;
            return this;
        },

        /**
         * Chenge route to path
         * @param {string} path - new path that navigate to
         */
        navigate(path) {
            window.history.pushState({}, '', path);
            currentPath = path;
            executeRouteHandlers();
        },

        /**
         * Get current parameters to URL
         * @returns {Object} - Copy parameters object
         */
        getParams() {
            return { ...currentParams };
        },

        /**
         * Fetch path to current URL
         * @returns {string} - Current URL path
         */
        getPath() {
            return currentPath;
        },

        /**
         * Start routing system
         * @returns {Router} - Router instance for method chaining
         */
        init() {
            executeRouteHandlers();
            return this;
        }
    };
})();

/**
 * Programmatic navigation helper function
 * @param {string} path - Path that you want to navigate
 */
export function navigate(path) {
    Router.navigate(path);
}

/**
 * Link component for navigation without page reload
 * @param {Object} props - Component properties
 * @param {string} props.to - Destination path
 * @param {...any} children - Child elements หรือ content
 * @returns {Object} - Virtual DOM element
 */
export function Link(props, ...children) {
    return createElement('a', {
        href: props.to,
        onClick: (e) => {
            e.preventDefault();
            navigate(props.to);
        },
        ...props
    }, ...children);
}

/**
 * Higher-Order Component for components that want to access route information
 * @param {Function} Component - Component function that want to wrap
 * @returns {Function} - Wrapped component router props
 */
export function withRouter(Component) {
    return (props) => {
        const state = createState({
            path: Router.getPath(),
            params: Router.getParams()
        });

        const unsubscribe = Router.route('*', (params) => {
            state.set({
                path: Router.getPath(),
                params: Router.getParams()
            });
        });

        const originalOnUnmount = props.onUnmount;
        props.onUnmount = () => {
            unsubscribe();
            if (originalOnUnmount) originalOnUnmount();
        };

        return Component({ ...props, router: state.get() });
    };
}

/*
    Usage:
    
    import { Mint, Router, navigate, Link } from "./mint.js";
    // Define routes
    Router
        .route('/', () => {
            Mint.injectHTML("#app", `
                <h1>Home Page</h1>
                <p>Welcome to the homepage</p>
            `);
        })
        .route('/about', () => {
            Mint.injectHTML("#app", `
                <h1>About Page</h1>
                <p>This is the about page</p>
            `);
        })
        .route('/user/:id', (params) => {
            Mint.injectHTML("#app", `
                <h1>User Profile</h1>
                <p>User ID: ${params.id}</p>
            `);
        })
        .init();

    // Using navigation
    document.getElementById('home-btn').addEventListener('click', () => {
        navigate('/');
    });

    // Using Link component
    const navigation = Mint.createElement(Mint.Link, { to: '/about' }, 'Go to About');
    Mint.injectHTML("#nav", navigation);

    After that you can use this to create your another page like SPA:

    Router
        .route('/', () => showHomePage())
        .route('/about', () => showAboutPage())
        .route('/user/:id', (params) => showUserProfile(params.id))
        .route('/products/[...category]', (params) => showProducts(params.category));

*/