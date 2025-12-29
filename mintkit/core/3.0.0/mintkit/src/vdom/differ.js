import { isSameNodeType } from './node-comparison.js';
import { createDomNode } from './dom-creator.js';
import { updateProps } from './props-updater.js';

/**
 * Diff and update DOM based on virtual node changes
 * @param {Element} $parent - Parent DOM element
 * @param {Object} newVNode - New virtual node
 * @param {Object} oldVNode - Old virtual node
 * @param {number} index - Child index
 */
export function diff($parent, newVNode, oldVNode, index = 0) {
    if (typeof newVNode === 'function') {
        newVNode = newVNode();
    }
    if (typeof oldVNode === 'function') {
        oldVNode = oldVNode();
    }
    
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