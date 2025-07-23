/**
 * Mintkit Framework Core (lite version)
 * Updated: 23/07/2025
 * Features that essentials only my goes here making it lightweight and fast.
 * Some features are removed or not update to keep the size minimal.
 */

export const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
export const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const fastClone = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.slice();
    if (typeof obj === "object") return { ...obj };
    return obj;
};

function createElement(tag, props, ...children) {
    return {
        tag,
        props: props || {},
        children: children.flat().filter(c => c != null && c !== false)
    };
}

const isSameType = (a, b) => {
    if (typeof a !== typeof b) return false;
    return typeof a === 'string' ? true : a.tag === b.tag;
};

function updateProps($el, oldProps = {}, newProps = {}) {
    for (const key in oldProps) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                $el.removeEventListener(key.slice(2).toLowerCase(), oldProps[key]);
            } else if (key === 'className') {
                $el.className = '';
            } else {
                $el.removeAttribute(key);
            }
        }
    }

    for (const key in newProps) {
        const val = newProps[key];
        if (oldProps[key] !== val) {
            if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                if (oldProps[key]) $el.removeEventListener(event, oldProps[key]);
                $el.addEventListener(event, val);
            } else if (key === 'className') {
                $el.className = val || '';
            } else if (key === 'style') {
                if (typeof val === 'object') Object.assign($el.style, val);
                else $el.style.cssText = val;
            } else if (key === 'value') {
                $el.value = val;
            } else if (key === 'checked') {
                $el.checked = !!val;
            } else {
                $el.setAttribute(key, val);
            }
        }
    }
}

function createDomNode(vNode) {
    if (vNode == null || vNode === false) return document.createTextNode('');
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return document.createTextNode(String(vNode));
    }
    
    const $el = document.createElement(vNode.tag);
    updateProps($el, {}, vNode.props);
    
    vNode.children.forEach(child => {
        const childNode = createDomNode(child);
        if (childNode) $el.appendChild(childNode);
    });
    
    return $el;
}

function diff($parent, newVNode, oldVNode, index = 0) {
    if (!oldVNode) {
        $parent.appendChild(createDomNode(newVNode));
    } else if (!newVNode) {
        const child = $parent.childNodes[index];
        if (child) $parent.removeChild(child);
    } else if (!isSameType(newVNode, oldVNode) || 
               (typeof newVNode === 'string' && newVNode !== oldVNode)) {
        const newNode = createDomNode(newVNode);
        const oldNode = $parent.childNodes[index];
        if (oldNode) $parent.replaceChild(newNode, oldNode);
    } else if (typeof newVNode === 'object') {
        const currentNode = $parent.childNodes[index];
        updateProps(currentNode, oldVNode.props, newVNode.props);
        
        const maxLen = Math.max(
            newVNode.children?.length || 0,
            oldVNode.children?.length || 0
        );
        
        for (let i = 0; i < maxLen; i++) {
            diff(currentNode, newVNode.children?.[i], oldVNode.children?.[i], i);
        }
    }
}

export function createState(initialValue) {
    let state = initialValue;
    let subscribers = [];
    let prevVNode = null;
    let mountPoint = null;
    let isRendering = false;

    const notify = () => {
        if (isRendering) return;
        isRendering = true;
        
        requestAnimationFrame(() => {
            try {
                subscribers.forEach(fn => fn(state));
                
                if (mountPoint && state?.vdom) {
                    diff(mountPoint, state.vdom, prevVNode);
                    prevVNode = fastClone(state.vdom);
                }
            } finally {
                isRendering = false;
            }
        });
    };

    return {
        get: () => state,
        
        set: (newState) => {
            const nextState = typeof newState === 'function' ? newState(state) : newState;
            if (nextState !== state) {
                state = nextState;
                notify();
            }
        },
        
        subscribe: (fn, mount) => {
            if (typeof fn === 'function') {
                subscribers.push(fn);
                return () => {
                    const idx = subscribers.indexOf(fn);
                    if (idx > -1) subscribers.splice(idx, 1);
                };
            }
            
            if (mount instanceof HTMLElement) {
                mountPoint = mount;
                if (state?.vdom) {
                    mount.innerHTML = '';
                    mount.appendChild(createDomNode(state.vdom));
                    prevVNode = fastClone(state.vdom);
                }
            }
        },
        
        createElement
    };
}

const cssCache = new Set();

export function injectCSS(css, options = {}) {
    if (!css) return null;
    const hash = css.length + css.charCodeAt(0) + css.charCodeAt(css.length - 1);
    if (cssCache.has(hash)) return null;

    const style = document.createElement('style');
    style.textContent = css;
    
    if (options.nonce) style.nonce = options.nonce;
    if (options.media) style.media = options.media;
    
    document.head.appendChild(style);
    cssCache.add(hash);
    
    style.removeCSS = () => {
        if (style.parentNode) style.parentNode.removeChild(style);
        cssCache.delete(hash);
    };
    
    return style;
}

export function injectHTML(selector, html, options = {}) {
    const target = document.querySelector(selector);
    if (!target) throw new Error(`No element found: ${selector}`);
    
    if (options.sanitize !== false) {
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    const mode = options.mode || 'replace';
    if (mode === 'replace') {
        target.innerHTML = html;
    } else if (mode === 'append') {
        target.insertAdjacentHTML('beforeend', html);
    } else if (mode === 'prepend') {
        target.insertAdjacentHTML('afterbegin', html);
    }
    
    return target;
}

export function injectTitle(title) {
    const existing = document.querySelector('title');
    if (existing) {
        existing.textContent = title.replace(/<\/?title>/g, '');
    } else {
        document.head.insertAdjacentHTML('beforeend', `<title>${title}</title>`);
    }
}

export async function get(url, targetSelector) {
    const isCSS = url.toLowerCase().endsWith('.css');
    const isHTML = /\.(html?|htm)$/i.test(url);
    
    if (isCSS) {
        if (document.querySelector(`link[href="${url}"]`)) return;
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve(link);
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    if (isHTML) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const target = document.querySelector(targetSelector || 'body');
        if (!target) throw new Error(`No element found: ${targetSelector}`);
        
        target.insertAdjacentHTML('beforeend', html);
        return target;
    }
    
    throw new Error('Only .css and .html files supported');
}

export const include = get;

export async function processIncludes(context = document) {
    const walker = document.createTreeWalker(
        context.body || context,
        NodeFilter.SHOW_TEXT
    );
    
    const promises = [];
    let node;
    
    while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        const matches = text.match(/@include\(['"]([^'"]+)['"]\)/g);
        
        if (matches) {
            matches.forEach(match => {
                const file = match.match(/@include\(['"]([^'"]+)['"]\)/)[1];
                promises.push(
                    get(file).then(result => {
                        if (file.endsWith('.html')) {
                            node.nodeValue = node.nodeValue.replace(match, result);
                        }
                    })
                );
            });
        }
    }
    
    await Promise.all(promises);
}

export const AdjustHook = (options = {}) => {
    const config = {
        interval: options.interval || 1000,
        endpoint: options.endpoint || "/reload",
        onReload: options.onReload || (() => location.reload()),
        onError: options.onError || (() => {}),
        enabled: options.enabled !== false
    };

    if (!config.enabled) {
        return { stop: () => {}, getStats: () => ({}), getMetrics: () => ({}) };
    }

    let intervalId;
    let requests = 0;
    let errors = 0;
    const startTime = Date.now();

    const check = async () => {
        try {
            requests++;
            const response = await fetch(config.endpoint, {
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data?.reload) config.onReload();
            }
        } catch (error) {
            errors++;
            config.onError(error);
        }
    };

    intervalId = setInterval(check, config.interval);

    return {
        stop: () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        },
        
        getStats: () => ({
            requests,
            errors,
            uptime: Date.now() - startTime,
            successRate: requests > 0 ? ((requests - errors) / requests * 100) : 100
        }),
        
        getMetrics: function() { return this.getStats(); }
    };
};

export const MintUtils = {
    isElement: (el) => el instanceof Element,
    isVNode: (obj) => obj?.tag != null,
    debounce: (fn, ms) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), ms);
        };
    }
};

export const PerformanceMonitor = {
    enabled: false,
    timers: new Map(),
    
    start(label) {
        if (this.enabled) this.timers.set(label, performance.now());
        return this;
    },
    
    end(label) {
        if (!this.enabled) return 0;
        const start = this.timers.get(label);
        if (start) {
            const duration = performance.now() - start;
            this.timers.delete(label);
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    },
    
    enable() { this.enabled = true; },
    disable() { this.enabled = false; }
};

export const ReloadPerformanceTracker = {
    enabled: false,
    history: [],
    
    recordReload(duration) {
        if (this.enabled) {
            this.history.push({ duration, timestamp: Date.now() });
            if (this.history.length > 10) this.history.shift();
        }
    },
    
    getStats() {
        if (!this.history.length) return null;
        const durations = this.history.map(h => h.duration);
        return {
            totalReloads: this.history.length,
            averageTime: durations.reduce((a, b) => a + b) / durations.length,
            minTime: Math.min(...durations),
            maxTime: Math.max(...durations)
        };
    },
    
    enable() { this.enabled = true; },
    disable() { this.enabled = false; }
};

export function clearInjectionCache() {
    cssCache.clear();
}

export function getInjectionStats() {
    return {
        cssCache: cssCache.size,
        memoryUsage: performance.memory?.usedJSHeapSize || 'not available'
    };
}

export const Mint = {
    pipe,
    compose,
    createState,
    injectCSS,
    injectHTML,
    injectTitle,
    get,
    include,
    processIncludes,
    AdjustHook,
    MintUtils,
    PerformanceMonitor,
    ReloadPerformanceTracker,
    clearInjectionCache,
    getInjectionStats
};
