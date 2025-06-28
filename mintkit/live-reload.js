(()=>{
    let isReloading=false,lastTimestamp=0,stats={requests:0,errors:0,totalTime:0,avgTime:0};
    
    const controller=new AbortController();
    const signal=controller.signal;
    
    const checkForUpdates=async()=>{
        if(isReloading)return;
        
        const startTime=performance.now();
        try{
            stats.requests++;
            const response=await fetch('/reload',{
                signal,
                method:'GET',
                headers:{'Cache-Control':'no-cache'},
                keepalive:true
            });
            
            if(!response.ok)throw new Error(`HTTP ${response.status}`);
            
            const data=await response.json();
            
            if(data.reload&&data.timestamp!==lastTimestamp){
                isReloading=true;
                const reloadTime=performance.now()-startTime;
                console.log(`File changed, reloading... (Memory: ${data.memory_usage} bytes, Response: ${reloadTime.toFixed(2)}ms)`);
                controller.abort();
                requestAnimationFrame(()=>location.reload());
                return;
            }
            lastTimestamp=data.timestamp;
        }catch(error){
            if(error.name!=='AbortError'){
                stats.errors++;
                console.log('Live reload check failed:',error);
            }
        }
        
        const endTime=performance.now();
        const requestTime=endTime-startTime;
        stats.totalTime+=requestTime;
        stats.avgTime=stats.totalTime/stats.requests;
        
        if(stats.requests%10===0){
            console.log(`Live Reload Stats: ${stats.requests} requests, ${stats.errors} errors, Avg: ${stats.avgTime.toFixed(2)}ms, Last: ${requestTime.toFixed(2)}ms`);
        }
    };
    
    const interval=setInterval(checkForUpdates,500);
    console.log('Live reload enabled with enhanced performance monitoring');
    
    const cleanup=()=>{
        clearInterval(interval);
        controller.abort();
        console.log(`Final Stats: ${stats.requests} requests, ${stats.errors} errors, Avg response: ${stats.avgTime.toFixed(2)}ms`);
    };
    
    window.addEventListener('beforeunload',cleanup,{once:true});
    window.addEventListener('pagehide',cleanup,{once:true});
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){
            clearInterval(interval);
        }else if(!isReloading){
            setInterval(checkForUpdates,500);
        }
    });
})();