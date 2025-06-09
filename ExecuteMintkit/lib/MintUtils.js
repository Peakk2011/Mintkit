// Enhanced functional utilities with better performance
export const pipe = function () {
    const a = arguments;
    const len = a.length;
    
    // Validate all arguments are functions
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
    
    // Validate all arguments are functions
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

// Enhanced Virtual DOM utilities
function createElement(tag, props, ...children) {
    // Input validation
    if (!tag || typeof tag !== 'string') {
        throw new Error('createElement: tag must be a non-empty string');
    }
    
    // Flatten children and filter out null/undefined values
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
    
    // Handle element nodes with key support
    return a.tag === b.tag && a.key === b.key;
}

function updateProps($el, oldProps, newProps) {
    if (!$el || !($el instanceof Element)) {
        console.warn('updateProps: Invalid DOM element');
        return;
    }
    
    oldProps = oldProps || {};
    newProps = newProps || {};

    // Remove old props that are not in new props
    Object.keys(oldProps).forEach(key => {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                // Remove event listener
                const eventName = key.slice(2).toLowerCase();
                $el.removeEventListener(eventName, oldProps[key]);
            } else if (key === 'className') {
                $el.className = '';
            } else if (key === 'style' && typeof oldProps[key] === 'object') {
                // Clear style object
                Object.keys(oldProps[key]).forEach(styleProp => {
                    $el.style[styleProp] = '';
                });
            } else if (key !== 'key') {
                $el.removeAttribute(key);
            }
        }
    });

    // Set new props
    Object.keys(newProps).forEach(key => {
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        
        if (oldValue !== newValue && key !== 'key') {
            if (key.startsWith('on') && typeof newValue === 'function') {
                // Handle event listeners properly
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
            // Add new node
            const newNode = createDomNode(newVNode);
            if (newNode) {
                $parent.appendChild(newNode);
            }
        } else if (!newVNode) {
            // Remove old node
            const childToRemove = $parent.childNodes[index];
            if (childToRemove) {
                $parent.removeChild(childToRemove);
            }
        } else if (typeof newVNode !== typeof oldVNode ||
            (typeof newVNode === 'string' && newVNode !== oldVNode) ||
            (typeof newVNode === 'number' && newVNode !== oldVNode) ||
            !isSameNodeType(newVNode, oldVNode)) {
            // Replace node
            const newNode = createDomNode(newVNode);
            const oldNode = $parent.childNodes[index];
            if (newNode && oldNode) {
                $parent.replaceChild(newNode, oldNode);
            }
        } else if (newVNode.tag) {
            // Update existing node
            const currentNode = $parent.childNodes[index];
            if (currentNode) {
                updateProps(currentNode, oldVNode.props, newVNode.props);
                
                // Diff children
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

// Enhanced state management with better performance and features
export function createState(v) {
    let s = v;
    let c = [];
    let oldVNode = null;
    let root = null;
    let isUpdating = false;
    let updateQueue = [];
    
    // Batch updates to prevent rapid re-renders
    const flushUpdates = () => {
        if (isUpdating) return;
        
        isUpdating = true;
        
        // Process all queued updates
        try {
            // Notify all subscribers
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
            
            // Handle automatic DOM updates
            if (root && oldVNode !== null && s && typeof s === 'object' && s.vdom) {
                try {
                    diff(root, s.vdom, oldVNode);
                    oldVNode = structuredClone ? structuredClone(s.vdom) : JSON.parse(JSON.stringify(s.vdom));
                } catch (error) {
                    console.error('createState: Error during DOM diffing:', error);
                }
            }
        } finally {
            isUpdating = false;
            
            // Process any updates that were queued during this update
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
            
            // Prevent unnecessary updates
            if (newState === s) return;
            
            if (isUpdating) {
                // Queue the update if we're currently updating
                updateQueue.push(newState);
                return;
            }
            
            s = newState;
            
            // Schedule update on next tick to batch multiple synchronous updates
            setTimeout(flushUpdates, 0);
        },
        
        subscribe: function (f, mountPoint) {
            if (typeof f === "function") {
                c.push(f);
                
                // Return unsubscribe function
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
                        oldVNode = structuredClone ? structuredClone(s.vdom) : JSON.parse(JSON.stringify(s.vdom));
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
        
        // Enhanced createElement with validation
        createElement: createElement,
        
        // Add utility methods
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

// Enhanced CSS injection with duplicate prevention
export function injectCSS(cssString) {
    if (!cssString || typeof cssString !== 'string') {
        console.warn('injectCSS: Invalid CSS string provided');
        return null;
    }
    
    try {
        // Create hash to prevent duplicate injection
        const cssHash = btoa(cssString).slice(0, 10);
        const existingStyle = document.querySelector(`style[data-css-hash="${cssHash}"]`);
        
        if (existingStyle) {
            console.debug('injectCSS: CSS already injected, skipping');
            return existingStyle;
        }
        
        const styleEl = document.createElement('style');
        styleEl.textContent = cssString;
        styleEl.setAttribute('data-css-hash', cssHash);
        styleEl.setAttribute('data-injected-at', new Date().toISOString());
        
        document.head.appendChild(styleEl);
        return styleEl;
    } catch (error) {
        console.error('injectCSS: Error injecting CSS:', error);
        return null;
    }
}

// Enhanced HTML injection with better error handling
export function injectHTML(targetSelector, htmlString) {
    if (!targetSelector || typeof targetSelector !== 'string') {
        throw new Error('injectHTML: targetSelector must be a non-empty string');
    }
    
    if (htmlString === null || htmlString === undefined) {
        htmlString = '';
    }
    
    try {
        const target = document.querySelector(targetSelector);
        if (!target) {
            throw new Error(`injectHTML: No element matches selector: ${targetSelector}`);
        }
        
        // Sanitize HTML if needed (basic check)
        if (typeof htmlString === 'string' && htmlString.includes('<script')) {
            console.warn('injectHTML: Script tags detected in HTML string');
        }
        
        target.innerHTML = String(htmlString);
        return target;
    } catch (error) {
        console.error('injectHTML: Error injecting HTML:', error);
        throw error;
    }
}

// Enhanced title injection with better validation
export function injectTitle(titleHtmlString) {
    if (!titleHtmlString || typeof titleHtmlString !== 'string') {
        console.warn('injectTitle: Invalid title string provided');
        return;
    }
    
    try {
        let head = document.head;
        if (!head) {
            // Create head if it doesn't exist
            head = document.createElement('head');
            document.documentElement.appendChild(head);
        }

        // Remove existing title
        const existingTitle = head.querySelector('title');
        if (existingTitle) {
            existingTitle.remove();
        }

        // Clean and validate title HTML
        const cleanTitle = titleHtmlString.trim();
        if (!cleanTitle.startsWith('<title>') || !cleanTitle.endsWith('</title>')) {
            console.warn('injectTitle: Title string should be wrapped in <title> tags');
        }

        head.insertAdjacentHTML('beforeend', cleanTitle);
        
        // Log title change for debugging
        const titleElement = head.querySelector('title');
        if (titleElement) {
            console.debug('injectTitle: Title updated to:', titleElement.textContent);
        }
        
    } catch (error) {
        console.error('injectTitle: Error injecting title:', error);
    }
}

// Enhanced development hook with better error handling and configuration
export const AdjustHook = (options = {}) => {
    const config = {
        interval: options.interval || 1000,
        endpoint: options.endpoint || "/reload",
        onReload: options.onReload || (() => location.reload()),
        onError: options.onError || ((error) => console.warn('AdjustHook: Reload check failed:', error)),
        enabled: options.enabled !== false // Default to enabled
    };
    
    if (!config.enabled) {
        console.debug('AdjustHook: Hot reload disabled');
        return;
    }
    
    let intervalId = null;
    let isChecking = false;
    
    const checkReload = async () => {
        if (isChecking) return;
        
        isChecking = true;
        try {
            const response = await fetch(config.endpoint, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data && data.reload) {
                console.info('AdjustHook: Reload triggered by server');
                config.onReload();
            }
        } catch (error) {
            // Only log errors in development
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                config.onError(error);
            }
        } finally {
            isChecking = false;
        }
    };
    
    // Start checking
    intervalId = setInterval(checkReload, config.interval);
    console.debug(`AdjustHook: Started reload checking every ${config.interval}ms`);
    
    // Return cleanup function
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            console.debug('AdjustHook: Stopped reload checking');
        }
    };
};

// Export additional utilities
export const MintUtils = {
    // DOM utilities
    isElement: (el) => el instanceof Element,
    isTextNode: (node) => node instanceof Text,
    
    // VDOM utilities  
    isVNode: (obj) => obj && typeof obj === 'object' && 'tag' in obj,
    
    // Performance utilities
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
    
    // State utilities
    deepEqual: (a, b) => {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return a === b;
        }
    }
};