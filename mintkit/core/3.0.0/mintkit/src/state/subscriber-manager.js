/**
 * Subscriber management for state
 */
export const SubscriberManager = {
    /**
     * Create subscriber collection
     * @returns {Object} Subscriber collection
     */
    createSubscriberCollection() {
        return {
            subscribers: [],
            nextId: 1,
            subscriberMap: new Map()
        };
    },

    /**
     * Add subscriber
     * @param {Function} subscriber - Subscriber function
     * @param {Object} collection - Subscriber collection
     * @returns {Function} Unsubscribe function
     */
    addSubscriber(subscriber, collection) {
        if (typeof subscriber !== 'function') {
            throw new Error('Subscriber must be a function');
        }

        const id = collection.nextId++;
        collection.subscribers.push(subscriber);
        collection.subscriberMap.set(id, subscriber);

        return () => {
            this.removeSubscriberById(id, collection);
        };
    },

    /**
     * Remove subscriber by ID
     * @param {number} id - Subscriber ID
     * @param {Object} collection - Subscriber collection
     */
    removeSubscriberById(id, collection) {
        const subscriber = collection.subscriberMap.get(id);
        if (subscriber) {
            const index = collection.subscribers.indexOf(subscriber);
            if (index > -1) {
                collection.subscribers.splice(index, 1);
            }
            collection.subscriberMap.delete(id);
        }
    },

    /**
     * Remove subscriber by function reference
     * @param {Function} subscriber - Subscriber function
     * @param {Object} collection - Subscriber collection
     */
    removeSubscriber(subscriber, collection) {
        const index = collection.subscribers.indexOf(subscriber);
        if (index > -1) {
            collection.subscribers.splice(index, 1);
            
            // Also remove from map
            for (const [id, sub] of collection.subscriberMap.entries()) {
                if (sub === subscriber) {
                    collection.subscriberMap.delete(id);
                    break;
                }
            }
        }
    },

    /**
     * Notify all subscribers
     * @param {any} state - Current state
     * @param {Object} collection - Subscriber collection
     */
    notifySubscribers(state, collection) {
        for (let i = 0, l = collection.subscribers.length; i < l; i++) {
            const subscriber = collection.subscribers[i];
            if (typeof subscriber === 'function') {
                try {
                    subscriber(state);
                } catch (error) {
                    console.error('SubscriberManager: Error in subscriber:', error);
                }
            }
        }
    },

    /**
     * Get subscriber count
     * @param {Object} collection - Subscriber collection
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(collection) {
        return collection.subscribers.length;
    },

    /**
     * Check if has subscribers
     * @param {Object} collection - Subscriber collection
     * @returns {boolean} True if has subscribers
     */
    hasSubscribers(collection) {
        return collection.subscribers.length > 0;
    },

    /**
     * Clear all subscribers
     * @param {Object} collection - Subscriber collection
     */
    clearSubscribers(collection) {
        collection.subscribers = [];
        collection.subscriberMap.clear();
    },

    /**
     * Get subscriber IDs
     * @param {Object} collection - Subscriber collection
     * @returns {number[]} Array of subscriber IDs
     */
    getSubscriberIds(collection) {
        return Array.from(collection.subscriberMap.keys());
    },

    /**
     * Check if subscriber exists
     * @param {Function} subscriber - Subscriber function
     * @param {Object} collection - Subscriber collection
     * @returns {boolean} True if subscriber exists
     */
    hasSubscriber(subscriber, collection) {
        return collection.subscribers.includes(subscriber);
    },

    /**
     * Batch update subscribers
     * @param {Function} updateFn - Update function
     * @param {Object} collection - Subscriber collection
     */
    batchUpdate(updateFn, collection) {
        // Store current subscribers
        const currentSubscribers = [...collection.subscribers];
        
        // Clear and rebuild
        this.clearSubscribers(collection);
        
        // Apply update and re-add
        currentSubscribers.forEach(subscriber => {
            const updated = updateFn(subscriber);
            if (typeof updated === 'function') {
                this.addSubscriber(updated, collection);
            }
        });
    }
};