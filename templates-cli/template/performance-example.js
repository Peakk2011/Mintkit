// Example usage of performance monitoring features
import { AdjustHook, PerformanceMonitor, ReloadPerformanceTracker } from './mintkit/MintUtils.js';

// Using the enhanced AdjustHook with performance monitoring
const reloadController = AdjustHook({
    interval: 1000,
    performanceMonitoring: true,
    onReload: () => {
        console.log('Page reloading...');
        ReloadPerformanceTracker.recordReload(
            performance.now() - window.reloadStartTime || 0,
            1, // file count
            performance.memory?.usedJSHeapSize || 0
        );
        location.reload();
    }
});

// Using PerformanceMonitor for custom timing
PerformanceMonitor.start('pageLoad');
setTimeout(() => {
    PerformanceMonitor.end('pageLoad');
}, 1000);

// Measuring function execution time
PerformanceMonitor.measure('dataProcessing', () => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
    }
    return sum;
});

// Measuring async operations
PerformanceMonitor.measureAsync('apiCall', async () => {
    const response = await fetch('/api/data');
    return response.json();
});

// Using ReloadPerformanceTracker
window.reloadStartTime = performance.now();

// Log stats every 30 seconds
setInterval(() => {
    ReloadPerformanceTracker.logStats();
}, 30000);

// Custom performance monitoring
class CustomPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    start(label) {
        this.metrics.set(label, {
            startTime: performance.now(),
            endTime: null,
            duration: null
        });
    }

    end(label) {
        const metric = this.metrics.get(label);
        if (metric) {
            metric.endTime = performance.now();
            metric.duration = metric.endTime - metric.startTime;
            console.log(`${label}: ${metric.duration.toFixed(2)}ms`);
        }
    }

    getReport() {
        const report = {};
        for (const [label, metric] of this.metrics) {
            if (metric.duration !== null) {
                report[label] = metric.duration;
            }
        }
        return report;
    }
}

// Usage
const customMonitor = new CustomPerformanceMonitor();
customMonitor.start('customOperation');
setTimeout(() => {
    customMonitor.end('customOperation');
    console.log('Custom Report:', customMonitor.getReport());
}, 500);

console.log('Performance monitoring examples loaded');
console.log('Use the browser console to see performance metrics');
console.log('Hot reload performance will be tracked automatically');

/* Hook into index.html if you want to see log
    Performance Monitoring
    import { PerformanceMonitor, ReloadPerformanceTracker } from './mintkit/MintUtils.js';

    window.addEventListener('load', () => {
        const loadTime = performance.now() - window.pageLoadStart;
        console.log(`Page load completed in ${loadTime.toFixed(2)}ms`);

        ReloadPerformanceTracker.recordReload(loadTime, 0, performance.memory?.usedJSHeapSize || 0);
        });

        document.addEventListener('DOMContentLoaded', () => {
        const domReadyTime = performance.now() - window.pageLoadStart;
        console.log(`DOM ready in ${domReadyTime.toFixed(2)}ms`);
        });

        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        // console.log('Development mode: Enhanced performance monitoring enabled');

        setInterval(() => {
            const stats = ReloadPerformanceTracker.getStats();
            if (stats) {
            console.log(`Development Stats: ${stats.totalReloads} reloads, Avg: ${stats.averageTime.toFixed(2)}ms`);
            }
        }, 60000);
    }
*/