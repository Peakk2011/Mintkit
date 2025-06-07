export const pipe = function () {
    const a = arguments;
    return function (x) {
        let i = 0;
        for (; i < a.length;) x = a[i++](x);
        return x;
    }
};

export const compose = function () {
    const a = arguments;
    return function (x) {
        let i = a.length - 1;
        for (; i >= 0;) x = a[i--](x);
        return x;
    }
};

function createElement(tag, props, ...children) {
    return { tag, props: props || {}, children: children.flat() };
}

function isSameNodeType(a, b) {
    return a && b && a.tag === b.tag;
}

function updateProps($el, oldProps, newProps) {
    oldProps = oldProps || {};
    newProps = newProps || {};

    // Remove old props
    for (let key in oldProps) {
        if (!(key in newProps)) {
            $el.removeAttribute(key);
        }
    }

    // Set new props
    for (let key in newProps) {
        if (oldProps[key] !== newProps[key]) {
            if (key.startsWith('on') && typeof newProps[key] === 'function') {
                // Event handler
                const eventName = key.slice(2).toLowerCase();
                $el[eventName] = newProps[key];
            } else {
                $el.setAttribute(key, newProps[key]);
            }
        }
    }
}

function createDomNode(vNode) {
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return document.createTextNode(vNode);
    }
    const $el = document.createElement(vNode.tag);
    updateProps($el, {}, vNode.props);
    vNode.children.forEach(child => {
        $el.appendChild(createDomNode(child));
    });
    return $el;
}

function diff($parent, newVNode, oldVNode, index = 0) {
    if (!oldVNode) {
        $parent.appendChild(createDomNode(newVNode));
    } else if (!newVNode) {
        $parent.removeChild($parent.childNodes[index]);
    } else if (typeof newVNode !== typeof oldVNode ||
        (typeof newVNode === 'string' && newVNode !== oldVNode) ||
        !isSameNodeType(newVNode, oldVNode)) {
        $parent.replaceChild(createDomNode(newVNode), $parent.childNodes[index]);
    } else if (newVNode.tag) {
        updateProps($parent.childNodes[index], oldVNode.props, newVNode.props);
        const newLen = newVNode.children.length;
        const oldLen = oldVNode.children.length;
        for (let i = 0; i < newLen || i < oldLen; i++) {
            diff($parent.childNodes[index], newVNode.children[i], oldVNode.children[i], i);
        }
    }
}

export function createState(v) {
    let s = v, c = [], oldVNode = null, root = null;

    return {
        get: function () {
            return s;
        },
        set: function (n) {
            s = typeof n === "function" ? n(s) : n;
            for (let i = 0, l = c.length; i < l;) c[i++](s);
            // ถ้า subscribe มี render dom ให้ diff update อัตโนมัติ
            if (root && oldVNode !== null && typeof s === 'object' && s.vdom) {
                diff(root, s.vdom, oldVNode);
                oldVNode = s.vdom;
            }
        },
        subscribe: function (f, mountPoint) {
            if (typeof f === "function") {
                c[c.length] = f;
            }
            if (mountPoint && mountPoint instanceof HTMLElement) {
                root = mountPoint;
                if (s && typeof s === 'object' && s.vdom) {
                    oldVNode = s.vdom;
                    root.innerHTML = '';
                    root.appendChild(createDomNode(s.vdom));
                }
            }
        },
        createElement,  // Vdom
    };
}

export function injectCSS(cssString) {
    const styleEl = document.createElement('style');
    styleEl.textContent = cssString;
    document.head.appendChild(styleEl);
    return styleEl;
}

export function injectHTML(targetSelector, htmlString) {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`No element matches selector: ${targetSelector}`);
    target.innerHTML = htmlString;
}

export function injectTitle(titleHtmlString) {
    const head = document.head;
    if (!head) {
        throw new Error('Document.head not found');
    } else {
        document.createElement('head');
    }

    const existingTitle = head.querySelector('title');
    if (existingTitle) {
        head.removeChild(existingTitle);
    }

    head.insertAdjacentHTML('beforeend', titleHtmlString.trim());
}

export const AdjustHook = () => {
    setInterval(() => {
        fetch("/reload")
            .then((res) => res.json())
            .then((data) => {
                if (data.reload) location.reload();
            });
    }, 1000);
}

export function PerformanceTracking({
    genHTML,
    injectHTML,
    runMintAssembly,
    mainDescription = "Operation"
}) {
    const measureStep = (stepFn, description) => {
        const startTime = performance.now();
        const result = stepFn();
        const endTime = performance.now();
        console.log(`${description} took: ${(endTime - startTime).toFixed(2)}ms`);
        return result; 
    };

    const overallStartTime = performance.now();
    try {
        const html = measureStep(genHTML, "HTML generation");
        measureStep(() => injectHTML(html), "HTML injection");

        if (runMintAssembly) {
            // measureStep(runMintAssembly, "MintAssembly execution ");
        }
    } catch (error) {
        console.error(`Error during ${mainDescription}:`, error);
    }
    const overallEndTime = performance.now();
    console.log(`Total ${mainDescription} took: ${(overallEndTime - overallStartTime).toFixed(2)}ms`);
}