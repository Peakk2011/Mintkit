// About Service Worker fetching up data
const CACHE_NAME='mintkit-v1';
const STATIC_CACHE='static-v1';
const DYNAMIC_CACHE='dynamic-v1';

const STATIC_ASSETS=[
    '/',
    '/app.js',
    '/live-reload.js',
    '/assists/FavIcons/darkmode.svg'
];

const CACHE_STRATEGIES={
    '/app.js':'stale-while-revalidate',
    '/live-reload.js':'cache-first',
    '/assists/':'cache-first',
    '/api/':'network-first',
    '/reload':'network-only'
};

self.addEventListener('install',e=>{
    e.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache=>cache.addAll(STATIC_ASSETS)),
            self.skipWaiting()
        ])
    );
});

self.addEventListener('activate',e=>{
    e.waitUntil(
        Promise.all([
            caches.keys().then(keys=>
                Promise.all(keys.map(key=>
                    ![STATIC_CACHE,DYNAMIC_CACHE].includes(key)?caches.delete(key):null
                ).filter(Boolean))
            ),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch',e=>{
    const url=new URL(e.request.url);
    
    if(e.request.method!=='GET'||url.pathname==='/reload')return;
    
    const strategy=Object.keys(CACHE_STRATEGIES).find(path=>
        url.pathname.startsWith(path)
    );
    
    if(!strategy){
        e.respondWith(fetch(e.request));
        return;
    }
    
    switch(CACHE_STRATEGIES[strategy]){
        case'cache-first':
            e.respondWith(cacheFirst(e.request));
            break;
        case'network-first':
            e.respondWith(networkFirst(e.request));
            break;
        case'stale-while-revalidate':
            e.respondWith(staleWhileRevalidate(e.request));
            break;
        default:
            e.respondWith(fetch(e.request));
    }
});

const cacheFirst=async req=>{
    const cached=await caches.match(req);
    if(cached)return cached;
    
    const response=await fetch(req);
    if(response.ok){
        const cache=await caches.open(DYNAMIC_CACHE);
        cache.put(req,response.clone());
    }
    return response;
};

const networkFirst=async req=>{
    try{
        const response=await fetch(req);
        if(response.ok){
            const cache=await caches.open(DYNAMIC_CACHE);
            cache.put(req,response.clone());
        }
        return response;
    }catch{
        return await caches.match(req)||new Response('Offline',{status:503});
    }
};

const staleWhileRevalidate=async req=>{
    const cached=await caches.match(req);
    const fetchPromise=fetch(req).then(response=>{
        if(response.ok){
            const cache=caches.open(DYNAMIC_CACHE);
            cache.then(c=>c.put(req,response.clone()));
        }
        return response;
    });
    
    return cached||fetchPromise;
};

self.addEventListener('message',e=>{
    if(e.data?.type==='SKIP_WAITING'){
        self.skipWaiting();
    }
});