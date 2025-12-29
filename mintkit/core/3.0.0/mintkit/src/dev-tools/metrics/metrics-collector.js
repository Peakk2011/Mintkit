/**
 * Metrics collector for performance monitoring
 */
export const MetricsCollector = {
    /**
     * Initialize metrics object
     * @returns {Object} Initialized metrics
     */
    initialize() {
        return {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                retries: 0
            },
            performance: {
                totalTime: 0,
                avgResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                lastResponseTime: 0,
                responseTimeHistory: []
            },
            errors: {
                total: 0,
                consecutive: 0,
                maxConsecutive: 0,
                types: {},
                lastError: null,
                lastErrorTime: null
            }
        };
    },

    /**
     * Update performance metrics
     * @param {Object} metrics - Metrics object
     * @param {number} responseTime - Response time in ms
     */
    updatePerformance(metrics, responseTime) {
        const perf = metrics.performance;

        perf.totalTime += responseTime;
        perf.lastResponseTime = responseTime;
        perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
        perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
        
        if (metrics.requests.total > 0) {
            perf.avgResponseTime = perf.totalTime / metrics.requests.total;
        }

        perf.responseTimeHistory.push(responseTime);
        if (perf.responseTimeHistory.length > 50) {
            perf.responseTimeHistory.shift();
        }
    },

    /**
     * Update error metrics
     * @param {Object} metrics - Metrics object
     * @param {Error} error - Error object
     */
    updateErrorMetrics(metrics, error) {
        metrics.errors.total++;
        metrics.errors.consecutive++;
        metrics.errors.maxConsecutive = Math.max(
            metrics.errors.maxConsecutive,
            metrics.errors.consecutive
        );
        metrics.errors.lastError = error.message || error.toString();
        metrics.errors.lastErrorTime = Date.now();

        const errorType = error.name || 'UnknownError';
        metrics.errors.types[errorType] = (metrics.errors.types[errorType] || 0) + 1;
    },

    /**
     * Reset consecutive errors
     * @param {Object} metrics - Metrics object
     */
    resetConsecutiveErrors(metrics) {
        metrics.errors.consecutive = 0;
    },

    /**
     * Get response time percentile
     * @param {Object} metrics - Metrics object
     * @param {number} percentile - Percentile (0-100)
     * @returns {number} Percentile value
     */
    getResponseTimePercentile(metrics, percentile) {
        if (metrics.performance.responseTimeHistory.length === 0) return 0;

        const sorted = [...metrics.performance.responseTimeHistory].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
};