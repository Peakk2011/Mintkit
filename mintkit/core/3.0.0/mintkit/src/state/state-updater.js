import { clone } from '../core/clone/index.js';
import { diff } from '../vdom/differ.js';

/**
 * State update logic with batching and queue management
 */
export const StateUpdater = {
    /**
     * Create state update queue
     * @returns {Object} Update queue
     */
    createUpdateQueue() {
        return {
            queue: [],
            isProcessing: false,
            hasPendingUpdates: false
        };
    },

    /**
     * Process update queue
     * @param {Function} updateCallback - Callback to execute for each update
     * @param {Object} queue - Update queue
     * @param {Function} [onComplete] - Callback when queue is empty
     */
    processQueue(updateCallback, queue, onComplete) {
        if (queue.isProcessing || queue.queue.length === 0) {
            return;
        }

        queue.isProcessing = true;

        try {
            while (queue.queue.length > 0) {
                const update = queue.queue.shift();
                if (update) {
                    updateCallback(update);
                }
            }
        } finally {
            queue.isProcessing = false;
            queue.hasPendingUpdates = false;

            if (onComplete) {
                onComplete();
            }
        }
    },

    /**
     * Add update to queue
     * @param {any} update - State update
     * @param {Object} queue - Update queue
     */
    enqueueUpdate(update, queue) {
        queue.queue.push(update);
        queue.hasPendingUpdates = true;
    },

    /**
     * Process state updates with batching
     * @param {Function} getState - Function to get current state
     * @param {Function} setState - Function to set new state
     * @param {Array} subscribers - Array of subscriber functions
     * @param {Object} vdomInfo - Virtual DOM information
     * @param {Object} updateQueue - Update queue
     */
    processStateUpdates(getState, setState, subscribers, vdomInfo, updateQueue) {
        if (updateQueue.isProcessing) {
            return;
        }

        updateQueue.isProcessing = true;

        try {
            // Notify subscribers
            for (let i = 0, l = subscribers.length; i < l; i++) {
                const subscriber = subscribers[i];
                if (typeof subscriber === 'function') {
                    try {
                        subscriber(getState());
                    } catch (error) {
                        console.error('StateUpdater: Error in subscriber:', error);
                    }
                }
            }

            // Update virtual DOM if needed
            if (vdomInfo.root && vdomInfo.oldVNode !== null) {
                const currentState = getState();
                if (currentState && typeof currentState === 'object' && currentState.vdom) {
                    try {
                        diff(vdomInfo.root, currentState.vdom, vdomInfo.oldVNode);
                        vdomInfo.oldVNode = clone(currentState.vdom);
                    } catch (error) {
                        console.error('StateUpdater: Error updating virtual DOM:', error);
                    }
                }
            }
        } finally {
            updateQueue.isProcessing = false;
            updateQueue.hasPendingUpdates = false;
        }
    },

    /**
     * Schedule state update
     * @param {Function} updateFunction - Function to execute
     * @param {Object} queue - Update queue
     */
    scheduleUpdate(updateFunction, queue) {
        if (queue.isProcessing) {
            this.enqueueUpdate(updateFunction, queue);
            return;
        }

        // Use microtask for batching
        Promise.resolve().then(() => {
            updateFunction();
            this.processQueue(updateFunction, queue);
        });
    },

    /**
     * Check if update is needed
     * @param {any} newState - New state value
     * @param {any} currentState - Current state value
     * @returns {boolean} True if update is needed
     */
    shouldUpdate(newState, currentState) {
        return newState !== currentState;
    },

    /**
     * Deep compare for state updates
     * @param {any} obj1 - First object
     * @param {any} obj2 - Second object
     * @returns {boolean} True if objects are deeply equal
     */
    deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;

        if (obj1 == null || obj2 == null) return false;
        if (obj1.constructor !== obj2.constructor) return false;

        if (typeof obj1 === 'object') {
            if (Array.isArray(obj1)) {
                if (obj1.length !== obj2.length) return false;
                for (let i = 0; i < obj1.length; i++) {
                    if (!this.deepEqual(obj1[i], obj2[i])) return false;
                }
                return true;
            }

            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;

            for (const key of keys1) {
                if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
                if (!this.deepEqual(obj1[key], obj2[key])) return false;
            }

            return true;
        }

        return false;
    }
};