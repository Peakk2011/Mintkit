// Reload performance tracker
export const ReloadPerformanceTracker = {
    history: [],
    maxHistory: 25,
    enabled: false,

    /**
     * Record reload performance data
     * @param {number} duration - Reload duration in ms
     * @param {number} fileCount - Number of files reloaded
     * @param {number} memoryUsage - Memory usage in bytes
     * @returns {Object|null} Recorded entry or null if disabled
     */
    recordReload(duration, fileCount = 0, memoryUsage = 0) {
        if (!this.enabled) return null;
        const entry = {
            timestamp: Date.now(),
            duration,
            fileCount,
            memoryUsage,
            date: new Date().toISOString()
        };

        this.history.push(entry);

        // Keep only the last maxHistory entries
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        console.log(`Reload recorded: ${duration.toFixed(2)}ms, Files: ${fileCount}, Memory: ${memoryUsage} bytes`);
        return entry;
    },

    /**
     * Get reload statistics
     * @returns {Object|null} Statistics or null if no history
     */
    getStats() {
        if (this.history.length === 0) return null;

        const durations = this.history.map(h => h.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return {
            totalReloads: this.history.length,
            averageTime: avg,
            minTime: min,
            maxTime: max,
            lastReload: this.history[this.history.length - 1]
        };
    },

    /**
     * Log statistics to console
     */
    logStats() {
        if (!this.enabled) return;
        const stats = this.getStats();
        if (stats) {
            console.log(`Reload Performance Stats:`);
            console.log(`   Total reloads: ${stats.totalReloads}`);
            console.log(`   Average time: ${stats.averageTime.toFixed(2)}ms`);
            console.log(`   Min time: ${stats.minTime.toFixed(2)}ms`);
            console.log(`   Max time: ${stats.maxTime.toFixed(2)}ms`);
            console.log(`   Last reload: ${stats.lastReload.duration.toFixed(2)}ms`);
        }
    },

    /**
     * Clear reload history
     */
    clear() {
        this.history = [];
    },

    /**
     * Enable reload tracking
     */
    enable() {
        this.enabled = true;
        console.log('ReloadPerformanceTracker enabled.');
    },

    /**
     * Disable reload tracking
     */
    disable() {
        this.enabled = false;
    }
};