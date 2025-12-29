import { clone } from '../core/clone/index.js';
import { createDomNode } from '../vdom/dom-creator.js';
import { diff } from '../vdom/differ.js';
import { StateUpdater } from './state-updater.js';
import { SubscriberManager } from './subscriber-manager.js';
import { UpdateQueue } from './update-queue.js';

/**
 * Create reactive state with virtual DOM support
 * @param {any} initialValue - Initial state value
 * @returns {Object} State object with getter, setter, and subscriber methods
 */
export function createState(initialValue) {
    let currentState = initialValue;
    
    // Initialize managers
    const subscriberCollection = SubscriberManager.createSubscriberCollection();
    const updateQueue = UpdateQueue.create();
    const vdomInfo = {
        oldVNode: null,
        root: null,
        isMounted: false
    };

    // State update function
    const updateState = (newState) => {
        if (!StateUpdater.shouldUpdate(newState, currentState)) {
            return;
        }

        currentState = newState;

        // Schedule update processing
        UpdateQueue.scheduleProcessing(updateQueue);
    };

    // Process updates
    const processUpdates = () => {
        StateUpdater.processStateUpdates(
            () => currentState,
            updateState,
            subscriberCollection.subscribers,
            vdomInfo,
            updateQueue
        );
    };

    // Configure update queue
    updateQueue.onOverflow = 'drop-oldest';
    UpdateQueue.setMaxSize(updateQueue, 1000);

    // Create state object
    const state = {
        /**
         * Get current state value
         * @returns {any} Current state
         */
        get() {
            return currentState;
        },

        /**
         * Set new state value
         * @param {any} newValue - New state value or update function
         */
        set(newValue) {
            const nextState = typeof newValue === "function" 
                ? newValue(currentState) 
                : newValue;

            UpdateQueue.enqueue(updateQueue, nextState, updateState);
            
            // Schedule processing on next tick
            setTimeout(processUpdates, 0);
        },

        /**
         * Subscribe to state changes or mount virtual DOM
         * @param {Function|HTMLElement} subscriberOrMountPoint - Subscriber function or mount point
         * @param {HTMLElement} [mountPoint] - Mount point for virtual DOM (if first param is function)
         * @returns {Function|undefined} Unsubscribe function or undefined
         */
        subscribe(subscriberOrMountPoint, mountPoint) {
            // Handle mount point
            if (subscriberOrMountPoint instanceof HTMLElement || mountPoint instanceof HTMLElement) {
                const mountEl = subscriberOrMountPoint instanceof HTMLElement 
                    ? subscriberOrMountPoint 
                    : mountPoint;
                
                vdomInfo.root = mountEl;
                
                if (currentState && typeof currentState === 'object' && currentState.vdom) {
                    try {
                        vdomInfo.oldVNode = clone(currentState.vdom);
                        vdomInfo.isMounted = true;
                        
                        mountEl.innerHTML = '';
                        const domNode = createDomNode(currentState.vdom);
                        if (domNode) {
                            mountEl.appendChild(domNode);
                        }
                    } catch (error) {
                        console.error('createState: Error mounting initial DOM:', error);
                        vdomInfo.isMounted = false;
                    }
                }
                
                return;
            }

            // Handle subscriber function
            if (typeof subscriberOrMountPoint === "function") {
                return SubscriberManager.addSubscriber(subscriberOrMountPoint, subscriberCollection);
            }

            console.warn('createState: Invalid subscriber or mount point');
        },

        /**
         * Update state with callback (alternative to set)
         * @param {Function} updater - Update function
         */
        update(updater) {
            if (typeof updater !== 'function') {
                throw new Error('State.update: updater must be a function');
            }
            this.set(updater);
        },

        /**
         * Get subscriber count
         * @returns {number} Number of subscribers
         */
        getSubscriberCount() {
            return SubscriberManager.getSubscriberCount(subscriberCollection);
        },

        /**
         * Check if there are any subscribers
         * @returns {boolean} True if has subscribers
         */
        hasSubscribers() {
            return SubscriberManager.hasSubscribers(subscriberCollection);
        },

        /**
         * Clear all subscribers
         */
        clearSubscribers() {
            SubscriberManager.clearSubscribers(subscriberCollection);
        },

        /**
         * Clear everything (subscribers, queue, vdom)
         */
        clear() {
            SubscriberManager.clearSubscribers(subscriberCollection);
            UpdateQueue.clear(updateQueue);
            
            vdomInfo.oldVNode = null;
            vdomInfo.root = null;
            vdomInfo.isMounted = false;
            
            // Reset state to initial value
            currentState = initialValue;
        },

        /**
         * Get state statistics
         * @returns {Object} State statistics
         */
        getStats() {
            return {
                subscriberCount: this.getSubscriberCount(),
                hasSubscribers: this.hasSubscribers(),
                queueStats: UpdateQueue.getStats(updateQueue),
                vdomMounted: vdomInfo.isMounted,
                stateType: typeof currentState,
                stateIsObject: typeof currentState === 'object' && currentState !== null
            };
        },

        /**
         * Batch multiple updates
         * @param {Function} batchFn - Batch function that receives set function
         */
        batch(batchFn) {
            if (typeof batchFn !== 'function') {
                throw new Error('State.batch: batchFn must be a function');
            }

            const batchUpdates = [];
            const batchSet = (value) => {
                batchUpdates.push(value);
            };

            batchFn(batchSet);

            if (batchUpdates.length > 0) {
                UpdateQueue.batchEnqueue(updateQueue, batchUpdates, updateState);
                setTimeout(processUpdates, 0);
            }
        },

        /**
         * Get unsubscribe function for specific subscriber
         * @param {Function} subscriber - Subscriber function
         * @returns {Function|null} Unsubscribe function or null if not found
         */
        getUnsubscriber(subscriber) {
            if (!SubscriberManager.hasSubscriber(subscriber, subscriberCollection)) {
                return null;
            }

            return () => {
                SubscriberManager.removeSubscriber(subscriber, subscriberCollection);
            };
        },

        /**
         * Create computed state (derived state)
         * @param {Function} computedFn - Computation function
         * @returns {Object} Computed state object
         */
        computed(computedFn) {
            const computedState = createState(computedFn(currentState));
            
            // Subscribe to changes
            const unsubscribe = this.subscribe(() => {
                computedState.set(computedFn(currentState));
            });
            
            // Add cleanup
            computedState.cleanup = () => {
                if (unsubscribe) unsubscribe();
            };
            
            return computedState;
        }
    };

    return state;
}