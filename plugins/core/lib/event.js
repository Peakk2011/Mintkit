/**
 * @module MintkitEventAPI
 * @author Mint teams
 * @license MIT
 * @updated 2025-09-23
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

Event.prototype.on = function(target) {
    // The `on` method now returns a Promise directly, triggering the event.
    this._promise = new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                let element;
                if (typeof target === 'string') {
                    element = document.querySelector(target);
                    if (!element) throw new Error(`Element not found: ${target}`);
                } else {
                    element = target;
                }

                if (!element || typeof element.dispatchEvent !== 'function') {
                    throw new TypeError('Invalid event target provided.');
                }

                // The context object passed to callbacks
                const context = {
                    el: element,
                    fire: () => element.dispatchEvent(this),
                    event: this
                };

                context.fire();    // Fire the event
                resolve(context);  // Resolve the promise with the context

            } catch (error) {
                reject(error);
            }
        }, this._delay || 0);
    });

    // Return `this` to allow chaining other methods like .then(), .catch()
    return this;
};

/**
 * Sets a delay in milliseconds before the event is fired.
 * @param {number} ms - The delay time in milliseconds.
 * @returns {Event} The event instance for chaining.
 */
Event.prototype.delay = function(ms) {
    this._delay = parseInt(ms, 10) || 0;
    return this;
};

/**
 * Executes a callback when the event has been successfully fired.
 * @param {function(EventContext): any} [callback] - The function to execute.
 * @returns {Promise<any>} A new promise that resolves with the return value of the callback.
 */
Event.prototype.then = function (callback) {
    // Chain off the promise created in .on()
    return this._promise.then(callback);
};

/**
 * Attaches an error handler to the promise chain.
 * @param {function(Error): any} errorHandler - The function to handle any errors.
 * @returns {Promise<any>} A new promise for error handling.
 */
Event.prototype.catch = function(errorHandler) {
    return this._promise.catch(errorHandler);
};

/**
 * Dispatches the event on multiple targets simultaneously.
 * @param {Array<string|EventTarget>} targets - An array of CSS selectors or DOM elements.
 * @returns {Promise<Array<EventContext>>} A promise that resolves with an array of the event contexts.
 */
Event.prototype.all = function(targets) {
    if (!Array.isArray(targets)) {
        return Promise.reject(new TypeError('.all() expects an array of targets.'));
    }
    const promises = targets.map(target => {
        // Create a new event instance for each target and call .on()
        return new this.constructor(this.type, this).on(target)._promise;
    });
    return Promise.all(promises);
};

// Ensure CustomEvent also gets the new methods
CustomEvent.prototype.on = Event.prototype.on;
CustomEvent.prototype.delay = Event.prototype.delay;
CustomEvent.prototype.then = Event.prototype.then;
CustomEvent.prototype.catch = Event.prototype.catch;
CustomEvent.prototype.all = Event.prototype.all;

/* 
Example Usage:
Use `new Event()` for simple signals without extra data.
 
new Event('show-modal')
    .on('#my-modal')
    .then(context => {
        console.log(`${context.el.id} is now visible.`);
    })
    .catch(console.error);

Use `new CustomEvent()` when you need to send data with the event.
The data is passed in the `detail` property.

new CustomEvent('item-clicked', { detail: { id: 123, name: 'T-Shirt' } })
    .delay(500) // You can still chain .delay() before .on()
    .on('.list-item')
    .then(context => {
        console.log('Item clicked:', context.event.detail); // Access data via context.event.detail
    });
*/