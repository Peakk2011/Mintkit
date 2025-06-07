(function() {
    let isReloading = false;
    let lastTimestamp = 0;
    let stats = { requests: 0, errors: 0 };
    
    const checkForUpdates = async () => {
        if (isReloading) return;
        
        const startTime = performance.now();
        try {
            stats.requests++;
            const response = await fetch('/reload');
            const data = await response.json();
            
            if (data.reload && data.timestamp !== lastTimestamp) {
                isReloading = true;
                console.log('File changed, reloading... (Memory: ' + data.memory_usage + ' bytes)');
                setTimeout(() => location.reload(), 100);
            }
            lastTimestamp = data.timestamp;
        } catch (error) {
            stats.errors++;
            console.log('Live reload check failed:', error);
        }
        
        const endTime = performance.now();
        if (stats.requests % 10 === 0) {
            // console.log(`Stats: ${stats.requests} requests, ${stats.errors} errors, last check: ${(endTime - startTime).toFixed(2)}ms`);
        }
    };
    
    const interval = setInterval(checkForUpdates, 500);
    console.log('Live reload enabled with performance monitoring');
    
    window.addEventListener('beforeunload', () => {
        clearInterval(interval);
    });
})();
