import { MetricsCollector } from './metrics-collector.js';

/**
 * Metrics reporter for logging and callbacks
 */
export const MetricsReporter = {
    /**
     * Generate metrics report
     * @param {Object} metrics - Metrics object
     * @param {Object} health - Health metrics
     * @param {Object} server - Server metrics
     * @returns {Object} Formatted report
     */
    generateReport(metrics, health, server) {
        return {
            timestamp: new Date().toISOString(),
            uptime: health.uptime,
            requests: { ...metrics.requests },
            performance: {
                ...metrics.performance,
                p50: MetricsCollector.getResponseTimePercentile(metrics, 50),
                p95: MetricsCollector.getResponseTimePercentile(metrics, 95),
                p99: MetricsCollector.getResponseTimePercentile(metrics, 99)
            },
            errors: { ...metrics.errors },
            health: { ...health },
            server: { ...server }
        };
    },

    /**
     * Log metrics to console
     * @param {Object} metrics - Metrics object
     * @param {Object} health - Health metrics
     * @param {boolean} detailed - Enable detailed logging
     */
    logToConsole(metrics, health, detailed = false) {
        if (detailed) {
            console.group('AdjustHook Detailed Metrics');
            console.table({
                'Total Requests': metrics.requests.total,
                'Success Rate': `${health.successRate.toFixed(2)}%`,
                'Avg Response': `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
                'P95 Response': `${MetricsCollector.getResponseTimePercentile(metrics, 95).toFixed(2)}ms`,
                'Consecutive Errors': metrics.errors.consecutive,
                'Health Status': health.isHealthy ? 'Healthy' : 'Degraded'
            });
            console.groupEnd();
        } else {
            console.log(
                `AdjustHook: ${metrics.requests.total} req, ` +
                `${health.successRate.toFixed(1)}% success, ` +
                `${metrics.performance.avgResponseTime.toFixed(1)}ms avg, ` +
                `${metrics.errors.consecutive} consecutive errors`
            );
        }
    },

    /**
     * Report metrics via callback
     * @param {Object} report - Metrics report
     * @param {Function|null} callback - Callback function
     */
    reportViaCallback(report, callback) {
        if (callback && typeof callback === 'function') {
            try {
                callback(report);
            } catch (error) {
                console.error('Metrics callback error:', error);
            }
        }
    }
};