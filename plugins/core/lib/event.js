/**
 * @module MintkitEventAPI
 * @author Mint teams
 * @license MIT
 * @updated 2025-11-05
 */

/**
 * @typedef {object} EventContext
 * @property {Element} el - The target DOM element.
 * @property {function(): void} fire - Function to dispatch the event on the target element.
 * @property {Event} event - The original event object.
 */

/**
 * Sets the target for the event.
 * @param {string|EventTarget} target - The CSS selector string or the DOM element to target.
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.on = function (target) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element;
                if (typeof target === 'string') {
                    element = document.querySelector(target);
                    if (!element) throw new Error(
                        `Element not found: ${target}`
                    );
                } else {
                    element = target;
                }

                if (!element || typeof element.addEventListener !== 'function') {
                    throw new TypeError(
                        'Invalid event target provided.'
                    );
                }

                const context = {
                    el: element,
                    fire: () => element.dispatchEvent(this),
                    event: this
                };

                // Bind click / trigger listener
                element.addEventListener('click', () => {
                    resolve(context);
                });

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Sets a delay in milliseconds before the event is fired.
 * @param {number} ms - The delay time in milliseconds.
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.delay = function (ms) {
    this._delay = parseInt(ms, 10) || 0;
    return this;
};

/**
 * Executes a callback when the event has been successfully fired.
 * @param {function(EventContext): any} [callback] - The function to execute.
 * @returns {Promise<any>} A new promise that resolves with the return value of the callback.
 */
Event.prototype.then = function (callback) {
    return this._promise.then(callback);
};

/**
 * Attaches an error handler to the promise chain.
 * @param {function(Error): any} errorHandler - The function to handle any errors.
 * @returns {Promise<any>} A new promise for error handling.
 */
Event.prototype.catch = function (errorHandler) {
    return this._promise.catch(errorHandler);
};

/**
 * Dispatches the event on multiple targets simultaneously.
 * @param {Array<string|EventTarget>} targets - An array of CSS selectors or DOM elements.
 * @returns {Promise<Array<EventContext>>} A promise that resolves with an array of the event contexts.
 */
Event.prototype.all = function (targets) {
    if (!Array.isArray(targets)) {
        return Promise.reject(
            new TypeError('.all() expects an array of targets.')
        );
    }
    const promises = targets.map(target => {
        return new this.constructor(this.type, this).on(target)._promise;
    });
    return Promise.all(promises);
};

/**
 * Long press / Haptic touch event
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Duration in ms (default 500)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.longPress = function (target, duration = 500) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(
                        `Element not found: ${target}`
                    );
                }

                let pressTimer;
                let startTime;

                const handleStart = (e) => {
                    startTime = Date.now();
                    pressTimer = setTimeout(() => {
                        resolve({
                            el: element,
                            fire: () => element.dispatchEvent(this),
                            event: e,
                            duration: Date.now() - startTime
                        });
                    }, duration);
                };

                const handleEnd = () => {
                    clearTimeout(pressTimer);
                }

                element.addEventListener(
                    'mousedown', handleStart
                );

                element.addEventListener(
                    'touchstart',
                    handleStart,
                    {
                        passive: true
                    }
                );

                element.addEventListener(
                    'mouseup',
                    handleEnd
                );

                element.addEventListener(
                    'mouseleave',
                    handleEnd
                );

                element.addEventListener(
                    'touchend',
                    handleEnd
                );

                element.addEventListener(
                    'touchcancel',
                    handleEnd
                );

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Swipe gesture detection
 * @param {string|EventTarget} target - Target element
 * @param {string} direction - 'left', 'right', 'up', 'down'
 * @param {number} threshold - Minimum distance in pixels (default 50)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.swipe = function (target, direction = 'left', threshold = 50) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) throw new Error(
                    `Element not found: ${target}`
                );

                let touchStartX = 0;
                let touchStartY = 0;
                let touchStartTime = 0;

                element.addEventListener('touchstart', (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchStartTime = Date.now();
                }, { passive: true });

                element.addEventListener('touchend', (e) => {
                    const touchEndX = e.changedTouches[0].clientX;
                    const touchEndY = e.changedTouches[0].clientY;
                    const touchEndTime = Date.now();

                    const diffX = touchEndX - touchStartX;
                    const diffY = touchEndY - touchStartY;
                    const diffTime = touchEndTime - touchStartTime;

                    const isHorizontal = Math.abs(diffX) > Math.abs(diffY);
                    const distance = isHorizontal ? Math.abs(diffX) : Math.abs(diffY);

                    if (distance >= threshold && diffTime < 1000) {
                        let detectedDirection = null;

                        if (isHorizontal) {
                            detectedDirection = diffX > 0 ? 'right' : 'left';
                        } else {
                            detectedDirection = diffY > 0 ? 'down' : 'up';
                        }

                        if (detectedDirection === direction) {
                            resolve({
                                el: element,
                                fire: () => element.dispatchEvent(this),
                                event: e,
                                direction: detectedDirection,
                                distance: distance,
                                velocity: distance / diffTime
                            });
                        }
                    }
                });

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Double click event
 * @param {string|EventTarget} target - Target element
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.doubleClick = function (target) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) throw new Error(
                    `Element not found: ${target}`
                );

                element.addEventListener('dblclick', (e) => {
                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: e
                    });
                });

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Hover event (mouseenter)
 * @param {string|EventTarget} target - Target element
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.hover = function (target) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) throw new Error(
                    `Element not found: ${target}`
                );

                element.addEventListener('mouseenter', (e) => {
                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: e
                    });
                });
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Right click event (contextmenu)
 * @param {string|EventTarget} target - Target element
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.rightClick = function (target) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: e
                    });
                });
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Show element with transition
 * @param {string|EventTarget} target - Target element
 * @param {string} display - Display value (default 'block')
 * @param {number} duration - Transition duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.show = function (target, display = 'block', duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                // Change DisplayNone to DisplayBlock first
                element.style.display = display;

                // Force Reflow
                element.offsetHeight;

                element.style.opacity = '0';
                element.style.transform = 'scale(0.95)';

                requestAnimationFrame(() => {
                    element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                    element.style.opacity = '1';
                    element.style.transform = 'scale(1)';

                    const handleTransitionEnd = () => {
                        element.removeEventListener(
                            'transitionend',
                            handleTransitionEnd
                        );
                        element.style.transition = '';
                        resolve({
                            el: element,
                            fire: () => element.dispatchEvent(this),
                            event: new Event('shown')
                        });
                    };

                    element.addEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                });
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Hide element with transition
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Transition duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.hide = function (target, duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                element.style.opacity = '0';
                element.style.transform = 'scale(0.95)';

                const handleTransitionEnd = () => {
                    element.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                    
                    element.style.display = 'none';
                    element.style.transition = '';

                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: new Event('hidden')
                    });
                };

                element.addEventListener(
                    'transitionend',
                    handleTransitionEnd
                );
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Toggle element visibility with transition
 * @param {string|EventTarget} target - Target element
 * @param {string} display - Display value when showing (default 'block')
 * @param {number} duration - Transition duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.toggle = function (target, display = 'block', duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                const isHidden = window.getComputedStyle(element).display === 'none';

                if (isHidden) {
                    // Show
                    element.style.display = display;
                    element.offsetHeight;
                    element.style.opacity = '0';
                    element.style.transform = 'scale(0.95)';

                    requestAnimationFrame(() => {
                        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                        element.style.opacity = '1';
                        element.style.transform = 'scale(1)';

                        const handleTransitionEnd = () => {
                            element.removeEventListener(
                                'transitionend',
                                handleTransitionEnd
                            );
                            element.style.transition = '';
                            resolve({
                                el: element,
                                fire: () => element.dispatchEvent(this),
                                event: new Event('shown'),
                                state: 'visible'
                            });
                        };

                        element.addEventListener(
                            'transitionend',
                            handleTransitionEnd
                        );
                    });
                } else {
                    // Hide
                    element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                    element.style.opacity = '0';
                    element.style.transform = 'scale(0.95)';

                    const handleTransitionEnd = () => {
                        element.removeEventListener(
                            'transitionend',
                            handleTransitionEnd
                        );
                        element.style.display = 'none';
                        element.style.transition = '';

                        resolve({
                            el: element,
                            fire: () => element.dispatchEvent(this),
                            event: new Event('hidden'),
                            state: 'hidden'
                        });
                    };

                    element.addEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                }
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Fade in element
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.fadeIn = function (target, duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                element.style.display = 'block';
                element.offsetHeight;
                element.style.opacity = '0';

                requestAnimationFrame(() => {
                    element.style.transition = `opacity ${duration}ms ease`;
                    element.style.opacity = '1';

                    const handleTransitionEnd = () => {
                        element.removeEventListener(
                            'transitionend',
                            handleTransitionEnd
                        );
                        element.style.transition = '';
                        resolve({
                            el: element,
                            fire: () => element.dispatchEvent(this),
                            event: new Event('fadein')
                        });
                    };

                    element.addEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                });
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Fade out element
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.fadeOut = function (target, duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                element.style.transition = `opacity ${duration}ms ease`;
                element.style.opacity = '0';

                const handleTransitionEnd = () => {
                    element.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                    element.style.display = 'none';
                    element.style.transition = '';

                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: new Event('fadeout')
                    });
                };

                element.addEventListener(
                    'transitionend',
                    handleTransitionEnd
                );
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Slide down element
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.slideDown = function (target, duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                element.style.display = 'block';
                const height = element.scrollHeight;
                element.style.height = '0';
                element.style.overflow = 'hidden';
                element.offsetHeight;

                element.style.transition = `height ${duration}ms ease`;
                element.style.height = height + 'px';

                const handleTransitionEnd = () => {
                    element.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );

                    element.style.height = '';
                    element.style.overflow = '';
                    element.style.transition = '';

                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: new Event('slidedown')
                    });
                };

                element.addEventListener(
                    'transitionend',
                    handleTransitionEnd
                );
            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

/**
 * Slide up element
 * @param {string|EventTarget} target - Target element
 * @param {number} duration - Duration in ms (default 300)
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.slideUp = function (target, duration = 300) {
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element = typeof target === 'string'
                    ? document.querySelector(target)
                    : target;

                if (!element) {
                    throw new Error(`Element not found: ${target}`);
                }

                const height = element.scrollHeight;
                element.style.height = height + 'px';
                element.style.overflow = 'hidden';
                element.offsetHeight;

                element.style.transition = `height ${duration}ms ease`;
                element.style.height = '0';

                const handleTransitionEnd = () => {
                    element.removeEventListener(
                        'transitionend',
                        handleTransitionEnd
                    );
                    
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    element.style.transition = '';

                    resolve({
                        el: element,
                        fire: () => element.dispatchEvent(this),
                        event: new Event('slideup')
                    });
                };

                element.addEventListener(
                    'transitionend',
                    handleTransitionEnd
                );

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    return this;
};

// Apply all the methods
CustomEvent.prototype.longPress = Event.prototype.longPress;
CustomEvent.prototype.swipe = Event.prototype.swipe;
CustomEvent.prototype.doubleClick = Event.prototype.doubleClick;
CustomEvent.prototype.hover = Event.prototype.hover;
CustomEvent.prototype.rightClick = Event.prototype.rightClick;
CustomEvent.prototype.show = Event.prototype.show;
CustomEvent.prototype.hide = Event.prototype.hide;
CustomEvent.prototype.toggle = Event.prototype.toggle;
CustomEvent.prototype.fadeIn = Event.prototype.fadeIn;
CustomEvent.prototype.fadeOut = Event.prototype.fadeOut;
CustomEvent.prototype.slideDown = Event.prototype.slideDown;
CustomEvent.prototype.slideUp = Event.prototype.slideUp;

/* 
USAGE EXAMPLES:

// Basic click event
new Event('show-modal')
    .on('#my-modal')
    .then(context => {
        console.log('Modal clicked');
    });

// Long press / Haptic touch
new Event('show-menu')
    .longPress('.card', 800)
    .then(context => {
        console.log('Long pressed for', context.duration, 'ms');
    });

// Swipe gesture
new Event('next-page')
    .swipe('.gallery', 'left', 100)
    .then(context => {
        console.log('Swiped', context.direction);
    });

// Double click
new Event('like')
    .doubleClick('.post')
    .then(context => {
        console.log('Double clicked');
    });

// Hover
new Event('preview')
    .delay(200)
    .hover('.thumbnail')
    .then(context => {
        console.log('Hovered');
    });

// Right click
new Event('context-menu')
    .rightClick('.file')
    .then(context => {
        console.log('Right clicked at', context.event.clientX, context.event.clientY);
    });

// Show with transition
new Event('reveal')
    .show('#modal', 'flex', 400)
    .then(context => {
        console.log('Element shown');
    });

// Hide with transition
new Event('dismiss')
    .hide('#modal', 400)
    .then(context => {
        console.log('Element hidden');
    });

// Toggle visibility
new Event('toggle-menu')
    .toggle('#menu', 'block', 300)
    .then(context => {
        console.log('Toggled to', context.state);
    });

// Fade effects
new Event('appear').fadeIn('.notification', 500);
new Event('disappear').fadeOut('.notification', 500);

// Slide effects
new Event('expand').slideDown('.accordion-content', 400);
new Event('collapse').slideUp('.accordion-content', 400);

// Multiple targets
new Event('highlight')
    .all(['.item-1', '.item-2', '.item-3'])
    .then(contexts => {
        console.log('All items highlighted');
    });

// CustomEvent with data
new CustomEvent('item-clicked', { 
    detail: { id: 123, name: 'Product' } 
})
    .on('.item')
    .then(context => {
        console.log('Item data:', context.event.detail);
    });

// Chaining with delay
new Event('notification')
    .delay(1000)
    .fadeIn('.alert', 300)
    .then(() => {
        return new Event('dismiss').delay(3000).fadeOut('.alert', 300);
    });
    
*/