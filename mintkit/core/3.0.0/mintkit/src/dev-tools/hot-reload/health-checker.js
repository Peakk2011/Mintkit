/**
 * Health check utilities for hot reload
 */
export const HealthChecker = {
    /**
     * Update health metrics
     * @param {Object} metrics - Metrics object
     * @param {Object} health - Health object to update
     * @param {number} startTime - Start timestamp
     */
    updateHealthMetrics(metrics, health, startTime) {
        health.uptime = Date.now() - startTime;

        const total = metrics.requests.successful + metrics.requests.failed;
        health.successRate = total > 0
            ? (metrics.requests.successful / total) * 100
            : 100;
    },

    /**
     * Check if system is healthy
     * @param {number} consecutiveErrors - Consecutive error count
     * @returns {boolean} True if healthy
     */
    isHealthy(consecutiveErrors) {
        return consecutiveErrors < 5;
    },

    /**
     * Perform health check
     * @param {Object} metrics - Metrics object
     * @param {Object} health - Health object
     * @param {boolean} detailedLogging - Enable detailed logging
     */
    performCheck(metrics, health, detailedLogging = false) {
        this.updateHealthMetrics(metrics, health, health.startTime || Date.now());

        if (detailedLogging) {
            console.log(`Health Check: ${health.isHealthy ? 'Healthy' : 'Degraded'}`);
        }
    }
};