/**
 * Inject or update page title
 * @param {string} titleHtmlString - Title HTML string
 */
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