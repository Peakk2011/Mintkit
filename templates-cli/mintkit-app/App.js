import { Mint } from './lib/mint.js';
import { Webfunctions } from './EventHandle.js';
import { WebContent, WebElements } from './Content.js';

const ROOT = '#app';
const MAIN_CONTAINER_ID = 'ROOT';
const MAIN_STYLESHEET_ID = 'main-dynamic-stylesheet';
const FONT_STYLESHEET_ID = 'fonts-stylesheet';

const cache = {
    head: document.head,
    target: document.querySelector(ROOT),
    mainStyle: null,
    fontStyle: null,
    css: null,
    cssValid: false,
    html: null,
    htmlValid: false,
    componentsValid: false,
    components: { comp1: null, comp2: null }
};

const Main = Mint.createState({});
const Logger = {
    error: console.error.bind(console, '[Mintkit Error]'),
    info: console.info.bind(console, '[Mintkit]'),
    warn: console.warn.bind(console, '[Mintkit Warn]')
};

let renderQueued = false;
let lastHTML = '';

const MintApp = (() => {
    const setHTMLtitle = `<title>${WebContent.PageTitle}</title>`;
    const containerRoot = `<div id="${MAIN_CONTAINER_ID}">`;
    const containerClose = '</div>';

    const generateMainStylesheet = () => {
        if (!cache.cssValid) {
            cache.css = WebContent.StyledElementComponents();
            cache.cssValid = true;
        }
        return cache.css;
    };

    const getCachedComponents = () => {
        if (!cache.componentsValid) {
            cache.components.comp1 = WebContent.ElementComponents();
            cache.components.comp2 = WebContent.ElementComponents2();
            cache.componentsValid = true;
        }
        return cache.components.comp1 + cache.components.comp2;
    };

    const queueRender = () => {
        if (renderQueued) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            const html = containerRoot + getCachedComponents() + containerClose;
            
            if (html !== lastHTML) {
                lastHTML = html;
                Mint.injectHTML(ROOT, html);
                Mint.MintAssembly?.();
            }
            renderQueued = false;
        });
    };

    const setupStylesheets = () => {
        // Font injection
        if (WebElements.StoredFontFamily && !cache.fontStyle) {
            cache.fontStyle = document.createElement('style');
            cache.fontStyle.id = FONT_STYLESHEET_ID;
            cache.fontStyle.textContent = WebElements.StoredFontFamily;
            cache.head.appendChild(cache.fontStyle);
        }

        // Main stylesheet creation
        if (!cache.mainStyle) {
            cache.mainStyle = document.createElement('style');
            cache.mainStyle.id = MAIN_STYLESHEET_ID;
            cache.head.appendChild(cache.mainStyle);
        }

        cache.mainStyle.textContent = generateMainStylesheet();
    };

    const setupThemeCallback = () => {
        WebContent.setThemeChangeCallback(() => {
            cache.cssValid = false;
            cache.componentsValid = false;
            cache.mainStyle.textContent = generateMainStylesheet();
            Main.set(s => ({ ...s, _t: Date.now() }));
        });
    };

    const initialize = () => {
        setupStylesheets();
        Mint.injectTitle(setHTMLtitle);
        setupThemeCallback();
        Main.set({});
        Logger.info('Mintkit initialized');
    };

    const start = () => {
        Mint.AdjustHook?.();
        initialize();
        
        if (Webfunctions) {
            Webfunctions(Main);
        }
    };

    const init = () => {
        Main.subscribe(queueRender);

        if (document.readyState === 'complete') {
            start();
        } else if (document.readyState === 'interactive') {
            setTimeout(start, 0);
        } else {
            document.addEventListener('DOMContentLoaded', start, { once: true });
        }
    };

    return { init };
})();

MintApp.init();