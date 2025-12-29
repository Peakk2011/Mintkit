/**
 * @typedef {Object} VNode
 * @property {string} tag - HTML tag name
 * @property {Object} props - Element properties
 * @property {Array} children - Child nodes
 * @property {string|null} key - Unique key for diffing
 */

/**
 * @typedef {Object} State
 * @property {Function} get - Get current state value
 * @property {Function} set - Set new state value
 * @property {Function} subscribe - Subscribe to state changes
 * @property {Function} getSubscriberCount - Get number of subscribers
 * @property {Function} hasSubscribers - Check if has subscribers
 * @property {Function} clear - Clear subscribers and reset
 */

/**
 * @typedef {Object} InjectionOptions
 * @property {boolean} [sanitize=true] - Enable HTML sanitization
 * @property {boolean} [allowScripts=false] - Allow script tags
 * @property {boolean} [allowEvents=false] - Allow event handlers
 * @property {string} [mode='replace'] - Insertion mode
 * @property {Function} [onError] - Error handler
 * @property {boolean} [validate=true] - Enable validation
 */

/**
 * @typedef {Object} CSSInjectionOptions
 * @property {string|null} [nonce] - CSP nonce
 * @property {string|null} [media] - Media query
 * @property {string} [priority='normal'] - Loading priority
 * @property {boolean} [validate=true] - Security validation
 * @property {Function} [onError] - Error handler
 */

/**
 * @typedef {Object} RouteHandler
 * @property {string} pattern - Route pattern
 * @property {Function} callback - Route callback function
 */

/**
 * @typedef {Object} AdjustHookConfig
 * @property {number} [interval=1000] - Check interval in ms
 * @property {string} [endpoint="/reload"] - Reload endpoint
 * @property {Function} [onReload] - Reload callback
 * @property {Function} [onError] - Error callback
 * @property {Function} [onMetricsUpdate] - Metrics callback
 * @property {boolean} [enabled=true] - Enable/disable
 * @property {boolean} [performanceMonitoring=false] - Enable metrics
 * @property {boolean} [detailedLogging=false] - Enable detailed logs
 * @property {number} [maxRetries=3] - Max retry attempts
 * @property {number} [retryDelay=2000] - Retry delay in ms
 * @property {number} [healthCheckInterval=30000] - Health check interval
 * @property {number} [metricsReportInterval=10] - Metrics report interval
 */