import { updateProps } from './props-updater.js';

/**
 * Create DOM node from virtual node
 * @param {Object} vNode - Virtual node
 * @returns {Node} DOM node
 */
export function createDomNode(vNode) {
    if (vNode === null || vNode === undefined || vNode === false) {
        return document.createTextNode('');
    }

    if (typeof vNode === 'function') {
        const value = vNode();
        return createDomNode(value);
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