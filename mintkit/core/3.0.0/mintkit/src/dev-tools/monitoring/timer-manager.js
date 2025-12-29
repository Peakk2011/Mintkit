/**
 * Timer manager for performance monitoring
 */
export const TimerManager = {
    timers: new Map(),

    /**
     * Start timer
     * @param {string} label - Timer label
     * @returns {TimerManager} This instance
     */
    start(label) {
        this.timers.set(label, {
            startTime: performance.now(),
            endTime: null,
            duration: null
        });
        return this;
    },

    /**
     * End timer
     * @param {string} label - Timer label
     * @returns {number} Duration in milliseconds
     */
    end(label) {
        const timer = this.timers.get(label);
        if (!timer) return 0;

        timer.endTime = performance.now();
        timer.duration = timer.endTime - timer.startTime;
        
        console.log(`${label}: ${timer.duration.toFixed(2)}ms`);
        
        return timer.duration;
    },

    /**
     * Get timer duration
     * @param {string} label - Timer label
     * @returns {number} Duration or 0 if not found
     */
    getDuration(label) {
        const timer = this.timers.get(label);
        return timer?.duration || 0;
    },

    /**
     * Get all timer stats
     * @returns {Object} Timer statistics
     */
    getStats() {
        const stats = {};
        for (const [label, timer] of this.timers) {
            stats[label] = timer.duration || performance.now() - timer.startTime;
        }
        return stats;
    },

    /**
     * Clear all timers
     */
    clear() {
        this.timers.clear();
    },

    /**
     * Measure function execution time
     * @param {string} label - Timer label
     * @param {Function} fn - Function to measure
     * @returns {any} Function result
     */
    measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    },

    /**
     * Measure async function execution time
     * @param {string} label - Timer label
     * @param {Function} fn - Async function to measure
     * @returns {Promise<any>} Promise with result
     */
    async measureAsync(label, fn) {
        this.start(label);
        const result = await fn();
        this.end(label);
        return result;
    }
};