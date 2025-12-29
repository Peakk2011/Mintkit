/**
 * Update DOM element properties
 * @param {Element} $el - DOM element
 * @param {Object} oldProps - Old properties
 * @param {Object} newProps - New properties
 */
export function updateProps($el, oldProps, newProps) {
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