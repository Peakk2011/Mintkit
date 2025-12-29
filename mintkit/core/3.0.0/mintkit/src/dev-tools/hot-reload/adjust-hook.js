import { formatBytes, formatDuration } from '../../utils/formatting/index.js';

export const AdjustHook = (options = {}) => {
    const config = {
        interval: options.interval || 1000,
        endpoint: options.endpoint || "/reload",
        onReload: options.onReload || (() => location.reload()),
        onError: options.onError || ((error) => console.warn('AdjustHook: Reload check failed:', error)),
        onMetricsUpdate: options.onMetricsUpdate || null,
        enabled: options.enabled !== false,
        performanceMonitoring: options.performanceMonitoring || false,
        detailedLogging: options.detailedLogging || false,
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 2000,
        healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
        metricsReportInterval: options.metricsReportInterval || 10 // Report every N requests
    };

    if (!config.enabled) {
        console.debug('AdjustHook: Hot reload disabled');
        return { stop: () => { }, getStats: () => ({}), getMetrics: () => ({}) };
    }

    let intervalId = null;
    let healthCheckId = null;
    let isChecking = false;
    let retryCount = 0;
    let startTime = Date.now();

    const metrics = {
        // Request metrics
        requests: {
            total: 0,
            successful: 0,
            failed: 0,
            retries: 0
        },

        // Performance metrics
        performance: {
            totalTime: 0,
            avgResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            lastResponseTime: 0,
            responseTimeHistory: [] // Keep last 50 responses
        },

        // Error metrics
        errors: {
            total: 0,
            consecutive: 0,
            maxConsecutive: 0,
            types: {},
            lastError: null,
            lastErrorTime: null
        },

        // Health metrics
        health: {
            uptime: 0,
            isHealthy: true,
            lastSuccessTime: Date.now(),
            lastFailureTime: null,
            successRate: 100
        },

        server: {
            memoryUsage: 0,
            cpuUsage: 0,
            uptime: 0,
            version: null,
            lastUpdate: null
        }
    };

    const updatePerformanceMetrics = (responseTime) => {
        const perf = metrics.performance;

        perf.totalTime += responseTime;
        perf.lastResponseTime = responseTime;
        perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
        perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
        perf.avgResponseTime = perf.totalTime / metrics.requests.total;

        perf.responseTimeHistory.push(responseTime);
        if (perf.responseTimeHistory.length > 50) {
            perf.responseTimeHistory.shift();
        }
    };

    const updateErrorMetrics = (error) => {
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

        metrics.health.isHealthy = metrics.errors.consecutive < 5;
        metrics.health.lastFailureTime = Date.now();
    };

    const resetConsecutiveErrors = () => {
        metrics.errors.consecutive = 0;
        metrics.health.isHealthy = true;
        metrics.health.lastSuccessTime = Date.now();
    };

    const updateHealthMetrics = () => {
        metrics.health.uptime = Date.now() - startTime;

        const total = metrics.requests.successful + metrics.requests.failed;
        metrics.health.successRate = total > 0
            ? (metrics.requests.successful / total) * 100
            : 100;
    };

    const getResponseTimePercentile = (percentile) => {
        if (metrics.performance.responseTimeHistory.length === 0) return 0;

        const sorted = [...metrics.performance.responseTimeHistory].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    };

    // Metrics reporting
    const reportMetrics = () => {
        if (!config.performanceMonitoring) return;

        const report = {
            timestamp: new Date().toISOString(),
            uptime: metrics.health.uptime,
            requests: metrics.requests,
            performance: {
                ...metrics.performance,
                p50: getResponseTimePercentile(50),
                p95: getResponseTimePercentile(95),
                p99: getResponseTimePercentile(99)
            },
            errors: metrics.errors,
            health: metrics.health,
            server: metrics.server
        };

        if (config.detailedLogging) {
            console.group('AdjustHook Detailed Metrics');
            console.table({
                'Total Requests': metrics.requests.total,
                'Success Rate': `${metrics.health.successRate.toFixed(2)}%`,
                'Avg Response': `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
                'P95 Response': `${getResponseTimePercentile(95).toFixed(2)}ms`,
                'Consecutive Errors': metrics.errors.consecutive,
                'Health Status': metrics.health.isHealthy ? 'Healthy' : 'Degraded'
            });
            console.groupEnd();
        } else {
            console.log(
                `AdjustHook: ${metrics.requests.total} req, ` +
                `${metrics.health.successRate.toFixed(1)}% success, ` +
                `${metrics.performance.avgResponseTime.toFixed(1)}ms avg, ` +
                `${metrics.errors.consecutive} consecutive errors`
            );
        }

        if (config.onMetricsUpdate) {
            config.onMetricsUpdate(report);
        }
    };

    const performHealthCheck = () => {
        updateHealthMetrics();

        if (config.detailedLogging) {
            console.log(`AdjustHook Health Check: ${metrics.health.isHealthy ? 'Healthy' : 'Degraded'}`);
        }
    };

    // RETRY
    const executeWithRetry = async (fn, maxRetries = config.maxRetries) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }

                metrics.requests.retries++;
                const delay = config.retryDelay * attempt; // Exponential backoff

                if (config.detailedLogging) {
                    console.warn(`AdjustHook: Retry ${attempt}/${maxRetries} in ${delay}ms`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Check reload function
    const checkReload = async () => {
        if (isChecking) return;

        isChecking = true;
        const requestStart = performance.now();

        try {
            await executeWithRetry(async () => {
                metrics.requests.total++;

                const response = await fetch(config.endpoint, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                        'X-AdjustHook-Version': '2.0',
                        'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    },
                    signal: AbortSignal.timeout(5000) // 5s
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const responseTime = performance.now() - requestStart;

                if (data.metrics) {
                    Object.assign(metrics.server, {
                        memoryUsage: data.metrics.memory || 0,
                        cpuUsage: data.metrics.cpu || 0,
                        uptime: data.metrics.uptime || 0,
                        version: data.metrics.version || null,
                        lastUpdate: Date.now()
                    });
                }

                updatePerformanceMetrics(responseTime);
                metrics.requests.successful++;
                resetConsecutiveErrors();

                if (data && data.reload) {
                    console.info(
                        `AdjustHook: Reload triggered by server ` +
                        `(Response: ${responseTime.toFixed(2)}ms, ` +
                        `Memory: ${formatBytes(data.metrics?.memory || 0)})`
                    );
                    config.onReload();
                    return;
                }

                if (metrics.requests.total % config.metricsReportInterval === 0) {
                    reportMetrics();
                }
            });

        } catch (error) {
            metrics.requests.failed++;
            updateErrorMetrics(error);

            // Only log errors in development
            if (config.detailedLogging ||
                location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1') {
                config.onError(error);
            }
        } finally {
            isChecking = false;
            updateHealthMetrics();
        }
    };

    intervalId = setInterval(checkReload, config.interval);
    healthCheckId = setInterval(performHealthCheck, config.healthCheckInterval);

    console.debug(
        `AdjustHook: Started monitoring ` +
        `(${config.interval}ms interval, ${config.maxRetries} retries, ` +
        `health check every ${config.healthCheckInterval}ms)`
    );

    // Return control object
    return {
        stop: () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            if (healthCheckId) {
                clearInterval(healthCheckId);
                healthCheckId = null;
            }

            console.debug('AdjustHook: Stopped');

            if (config.performanceMonitoring) {
                console.log('AdjustHook Final Report:');
                reportMetrics();
            }
        },

        getStats: () => ({
            requests: metrics.requests.total,
            errors: metrics.errors.total,
            totalTime: metrics.performance.totalTime,
            avgTime: metrics.performance.avgResponseTime,
            lastCheckTime: metrics.performance.lastResponseTime
        }),

        getMetrics: () => ({
            ...metrics,
            summary: {
                uptime: metrics.health.uptime,
                successRate: metrics.health.successRate,
                avgResponseTime: metrics.performance.avgResponseTime,
                p95ResponseTime: getResponseTimePercentile(95),
                healthStatus: metrics.health.isHealthy ? 'healthy' : 'degraded'
            }
        }),

        reportMetrics,
        getLastCheckTime: () => metrics.performance.lastResponseTime,
        isHealthy: () => metrics.health.isHealthy,

        getFormattedMetrics: () => ({
            uptime: formatDuration(metrics.health.uptime),
            successRate: `${metrics.health.successRate.toFixed(2)}%`,
            avgResponse: `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
            memoryUsage: formatBytes(metrics.server.memoryUsage),
            totalRequests: metrics.requests.total.toLocaleString(),
            errorRate: `${((metrics.requests.failed / metrics.requests.total) * 100).toFixed(2)}%`
        })
    };
};