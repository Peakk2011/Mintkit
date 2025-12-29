/**
 * Update queue handler for state management
 */
export const UpdateQueue = {
    /**
     * Create a new update queue
     * @returns {Object} Update queue instance
     */
    create() {
        return {
            queue: [],
            isProcessing: false,
            maxSize: 1000,
            onOverflow: 'drop-oldest' // 'drop-oldest' | 'drop-newest' | 'throw'
        };
    },

    /**
     * Add update to queue
     * @param {Object} queue - Update queue
     * @param {any} update - Update to add
     * @param {Function} updateFn - Update function
     * @returns {boolean} True if update was added
     */
    enqueue(queue, update, updateFn) {
        if (queue.queue.length >= queue.maxSize) {
            return this.handleOverflow(queue, update, updateFn);
        }

        queue.queue.push({ update, updateFn, timestamp: Date.now() });
        return true;
    },

    /**
     * Handle queue overflow
     * @param {Object} queue - Update queue
     * @param {any} update - Update to add
     * @param {Function} updateFn - Update function
     * @returns {boolean} True if update was handled
     */
    handleOverflow(queue, update, updateFn) {
        switch (queue.onOverflow) {
            case 'drop-oldest':
                queue.queue.shift(); // Remove oldest
                queue.queue.push({ update, updateFn, timestamp: Date.now() });
                console.warn('UpdateQueue: Dropped oldest update due to overflow');
                return true;

            case 'drop-newest':
                console.warn('UpdateQueue: Dropped newest update due to overflow');
                return false;

            case 'throw':
                throw new Error('UpdateQueue: Queue overflow');

            default:
                console.warn('UpdateQueue: Queue overflow, dropping update');
                return false;
        }
    },

    /**
     * Process queue
     * @param {Object} queue - Update queue
     */
    process(queue) {
        if (queue.isProcessing || queue.queue.length === 0) {
            return;
        }

        queue.isProcessing = true;

        try {
            while (queue.queue.length > 0) {
                const { update, updateFn } = queue.queue.shift();
                if (updateFn && typeof updateFn === 'function') {
                    try {
                        updateFn(update);
                    } catch (error) {
                        console.error('UpdateQueue: Error processing update:', error);
                    }
                }
            }
        } finally {
            queue.isProcessing = false;
        }
    },

    /**
     * Clear queue
     * @param {Object} queue - Update queue
     */
    clear(queue) {
        queue.queue = [];
    },

    /**
     * Get queue size
     * @param {Object} queue - Update queue
     * @returns {number} Queue size
     */
    size(queue) {
        return queue.queue.length;
    },

    /**
     * Check if queue is empty
     * @param {Object} queue - Update queue
     * @returns {boolean} True if empty
     */
    isEmpty(queue) {
        return queue.queue.length === 0;
    },

    /**
     * Get queue statistics
     * @param {Object} queue - Update queue
     * @returns {Object} Queue statistics
     */
    getStats(queue) {
        const now = Date.now();
        const ages = queue.queue.map(item => now - item.timestamp);
        
        return {
            size: queue.queue.length,
            maxSize: queue.maxSize,
            utilization: (queue.queue.length / queue.maxSize) * 100,
            oldestUpdate: ages.length > 0 ? Math.max(...ages) : 0,
            newestUpdate: ages.length > 0 ? Math.min(...ages) : 0,
            avgAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0,
            isProcessing: queue.isProcessing
        };
    },

    /**
     * Set queue maximum size
     * @param {Object} queue - Update queue
     * @param {number} maxSize - New maximum size
     */
    setMaxSize(queue, maxSize) {
        if (maxSize < 1) {
            throw new Error('UpdateQueue: maxSize must be at least 1');
        }

        queue.maxSize = maxSize;
        
        // Trim if necessary
        if (queue.queue.length > maxSize) {
            const excess = queue.queue.length - maxSize;
            queue.queue.splice(0, excess);
            console.warn(`UpdateQueue: Trimmed ${excess} updates due to size reduction`);
        }
    },

    /**
     * Set overflow behavior
     * @param {Object} queue - Update queue
     * @param {string} behavior - Overflow behavior
     */
    setOverflowBehavior(queue, behavior) {
        const validBehaviors = ['drop-oldest', 'drop-newest', 'throw'];
        if (!validBehaviors.includes(behavior)) {
            throw new Error(`UpdateQueue: Invalid overflow behavior. Must be one of: ${validBehaviors.join(', ')}`);
        }
        queue.onOverflow = behavior;
    },

    /**
     * Schedule queue processing
     * @param {Object} queue - Update queue
     */
    scheduleProcessing(queue) {
        if (queue.isProcessing) {
            return;
        }

        // Use microtask for processing
        Promise.resolve().then(() => {
            this.process(queue);
        });
    },

    /**
     * Batch enqueue multiple updates
     * @param {Object} queue - Update queue
     * @param {Array} updates - Array of updates
     * @param {Function} updateFn - Update function
     * @returns {number} Number of successfully enqueued updates
     */
    batchEnqueue(queue, updates, updateFn) {
        let successCount = 0;
        
        for (const update of updates) {
            if (this.enqueue(queue, update, updateFn)) {
                successCount++;
            }
        }
        
        return successCount;
    }
};