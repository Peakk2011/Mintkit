(()=>{
    let isReloading=false,lastTimestamp=0,stats={requests:0,errors:0};
    
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
                console.log('File changed, reloading... (Memory: '+data.memory_usage+' bytes)');
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
        
        if(stats.requests%10===0){
            const endTime=performance.now();
        }
    };
    
    const interval=setInterval(checkForUpdates,500);
    console.log('Live reload enabled with performance monitoring');
    
    const cleanup=()=>{
        clearInterval(interval);
        controller.abort();
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