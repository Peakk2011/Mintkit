'use strict';

const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

let currentMode = 'mouse';

const isInputElement = (element) => 
    element && (
        element.tagName === 'INPUT' || 
        element.tagName === 'TEXTAREA' || 
        element.contentEditable === 'true'
    );

const getAllInputs = () => Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]'));

const applyCursorStyle = (mode, element) => {
    const style = element.style;
    if (mode === 'keyboard') {
        style.cursor = 'none';
        style.setProperty('cursor', 'none', 'important');
    } else {
        style.cursor = '';
        style.removeProperty('cursor');
    }
    return element;
};

const applyCaretStyle = (mode, element) => {
    if (!isInputElement(element)) return element;
    
    const style = element.style;
    if (mode === 'keyboard') {
        style.caretColor = 'transparent';
        style.setProperty('caret-color', 'transparent', 'important');
    } else {
        style.caretColor = '';
        style.removeProperty('caret-color');
    }
    return element;
};

const injectGlobalStyles = (mode) => {
    const styleId = 'cursor-styles';
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
        existingStyle.remove();
    }
    
    if (mode === 'keyboard') {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            *, *::before, *::after {
                cursor: none !important;
            }
            html, body {
                cursor: none !important;
            }
        `;
        document.head.appendChild(style);
    }
};

const removeGlobalStyles = () => {
    const styleSheet = document.getElementById('cursor-styles');
    if (styleSheet) {
        styleSheet.remove();
    }
};

const handleKeyboardEvent = (event) => {
    if (currentMode !== 'keyboard') {
        currentMode = 'keyboard';
        applyModeEffects('keyboard');
    }
};

const handleMouseEvent = (event) => {
    if (currentMode !== 'mouse') {
        currentMode = 'mouse';
        applyModeEffects('mouse');
    }
};

const applyModeEffects = (mode) => {
    injectGlobalStyles(mode);    
    applyCursorStyle(mode, document.body);
    applyCursorStyle(mode, document.documentElement);    
    getAllInputs().forEach(input => applyCaretStyle(mode, input));
};

const cleanupEffects = () => {
    removeGlobalStyles();    
    document.body.style.cursor = '';
    document.documentElement.style.cursor = '';

    getAllInputs().forEach(input => {
        input.style.caretColor = '';
        input.style.removeProperty('caret-color');
    });
};

const createMutationHandler = () => 
    throttle((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    applyCursorStyle(currentMode, node);
                    
                    if (node.querySelectorAll) {
                        const inputs = node.querySelectorAll('input, textarea, [contenteditable="true"]');
                        inputs.forEach(input => applyCaretStyle(currentMode, input));
                    }
                    
                    if (isInputElement(node)) {
                        applyCaretStyle(currentMode, node);
                    }
                }
            });
        });
    }, 50);

const initializeCursorController = () => {
    const mutationHandler = createMutationHandler();
    const observer = new MutationObserver(mutationHandler);
    
    const initialize = () => {
        applyModeEffects('mouse');
        
        document.addEventListener('keydown', handleKeyboardEvent, { passive: true });
        document.addEventListener('mousemove', handleMouseEvent, { passive: true });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };
    
    const cleanup = () => {
        document.removeEventListener('keydown', handleKeyboardEvent);
        document.removeEventListener('mousemove', handleMouseEvent);
        observer.disconnect();
        cleanupEffects();
    };
    
    return { initialize, cleanup };
};

const controller = initializeCursorController();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => controller.initialize());
} else {
    controller.initialize();
}

window.cursorController = {
    ...controller,
    getMode: () => currentMode,
    setMode: (mode) => {
        currentMode = mode;
        applyModeEffects(mode);
    },
    forceKeyboard: () => {
        currentMode = 'keyboard';
        applyModeEffects('keyboard');
    },
    forceMouse: () => {
        currentMode = 'mouse';
        applyModeEffects('mouse');
    },
    toggle: () => {
        currentMode = currentMode === 'keyboard' ? 'mouse' : 'keyboard';
        applyModeEffects(currentMode);
    }
};