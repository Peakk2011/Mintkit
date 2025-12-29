// Performance monitoring utility
export const PerformanceMonitor = {
    timers: new Map(),
    enabled: false,

    /**
     * Start timer for label
     * @param {string} label - Timer label
     * @returns {PerformanceMonitor} This instance for chaining
     */
    start(label) {
        if (!this.enabled) return this;
        this.timers.set(label, performance.now());
        return this;
    },

    /**
     * End timer and log duration
     * @param {string} label - Timer label
     * @returns {number} Duration in milliseconds
     */
    end(label) {
        if (!this.enabled) return 0;
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(label);
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    },

    /**
     * Measure synchronous function execution time
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
     * Measure asynchronous function execution time
     * @param {string} label - Timer label
     * @param {Function} fn - Async function to measure
     * @returns {Promise<any>} Promise with function result
     */
    async measureAsync(label, fn) {
        this.start(label);
        const result = await fn();
        this.end(label);
        return result;
    },

    /**
     * Get current timer statistics
     * @returns {Object} Timer stats
     */
    getStats() {
        const stats = {};
        for (const [label, startTime] of this.timers) {
            stats[label] = performance.now() - startTime;
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
     * Enable performance monitoring
     */
    enable() {
        this.enabled = true;
        console.log('PerformanceMonitor enabled.');
    },

    /**
     * Disable performance monitoring
     */
    disable() {
        this.enabled = false;
    }
};