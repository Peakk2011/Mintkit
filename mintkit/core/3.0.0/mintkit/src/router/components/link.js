import { createElement } from '../../vdom/create-element.js';

/**
 * Link component for navigation without page reload
 * @param {Object} props - Component properties
 * @param {string} props.to - Destination path
 * @param {...any} children - Child elements or content
 * @returns {Object} - Virtual DOM element
 */
export function Link(props, ...children) {
    return createElement('a', {
        href: props.to,
        onClick: (e) => {
            e.preventDefault();
            // Router will handle navigation via popstate
            window.history.pushState({}, '', props.to);
            window.dispatchEvent(new PopStateEvent('popstate'));
        },
        ...props
    }, ...children);
}