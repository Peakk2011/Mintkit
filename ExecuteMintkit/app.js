import { Mint } from './lib/mint.js';
import { Webfunctions } from './EventHandle.js';
import { WebContent, WebElements } from './Content.js';

const APP_CONFIG = {
    TARGET_ELEMENT: '#app',
    MAIN_CONTAINER_ID: 'ROOT'
};

const MAIN_STYLESHEET_ID = 'main-dynamic-stylesheet';
const SetHTMLtitle = `<title>${WebContent.PageTitle}</title>`;

// Function to gen CSS content
const generateMainStylesheet = () => {
    return WebContent.StyledElementComponents();
};

const Main = Mint.createState({});

const Logger = {
    error: (...args) => console.error('[MintKit Error]', ...args),
    info: (...args) => console.info('[MintKit]', ...args),
    warn: (...args) => console.warn('[MintKit Warn]', ...args),
};

const UIRenderer = {
    lastRenderedHTML: null,
    shouldRender: function(newHTML) {
        const render = newHTML !== this.lastRenderedHTML;
        if (render) {
            this.lastRenderedHTML = newHTML;
        }
        return render;
    },
};

Main.subscribe(state => {
    try {
        const html = `
            <div id="${APP_CONFIG.MAIN_CONTAINER_ID}">
                ${WebContent.ElementComponents()}
                ${WebContent.ElementComponents2()}
            </div>
        `;
        if (UIRenderer.shouldRender(html)) {
            Mint.injectHTML(APP_CONFIG.TARGET_ELEMENT, html);
            if (typeof Mint.MintAssembly === 'function') {
                Mint.MintAssembly();
            }
        }
    } catch (error) {
        Logger.error('Rendering UI Error:', error);
    }
});

const InitialMintkit = () => {
    try {
        // Inject fonts
        if (WebElements.StoredFontFamily) {
            const fontStyleElId = 'fonts-stylesheet';
            if (!document.getElementById(fontStyleElId)) {
                const fontStyleEl = document.createElement('style');
                fontStyleEl.id = fontStyleElId;
                fontStyleEl.textContent = WebElements.StoredFontFamily;
                document.head.appendChild(fontStyleEl);
            }
        }

        let mainStyleEl = document.getElementById(MAIN_STYLESHEET_ID);
        if (!mainStyleEl) {
            mainStyleEl = document.createElement('style');
            mainStyleEl.id = MAIN_STYLESHEET_ID;
            document.head.appendChild(mainStyleEl);
        }
        mainStyleEl.textContent = generateMainStylesheet();

        Mint.injectTitle(SetHTMLtitle);
        Main.set(currentState => ({ ...currentState }));
        
        WebContent.setThemeChangeCallback(() => {
            if (mainStyleEl) mainStyleEl.textContent = generateMainStylesheet();
            Main.set(s => ({ ...s, _themeUpdate: Date.now() })); 
        });

        Logger.info('Mintkit initialized');
    } catch (error) { Logger.error('InitialMintkit Error:', error); }
};

const startMintkit = () => {
    try {
        if (typeof Mint.AdjustHook === 'function') {
            Mint.AdjustHook();
        }
        InitialMintkit();
        if (typeof Webfunctions === 'function') {
            Webfunctions(Main);
        } else {
            Logger.warn('Webfunctions Missing');
        }
    } catch (error) { Logger.error('startMintkit Error:', error); }
};

if (typeof window !== 'undefined') {
    startMintkit();
} else {
    Logger.error('Mintkit requires a browser environment to run.');
}