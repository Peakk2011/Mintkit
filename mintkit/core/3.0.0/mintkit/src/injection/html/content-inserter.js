/**
 * Insert content into target element
 * @param {Element} target - Target DOM element
 * @param {DocumentFragment} content - Content to insert
 * @param {string} mode - Insertion mode ('replace', 'append', 'prepend')
 */
export function insertContent(target, content, mode) {
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