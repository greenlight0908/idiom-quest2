/* 사자성어 여행단 - 학생별 자동 업데이트 서비스 워커 */
const VERSION="96-2026.07.19";
const CACHE=`idiom-quest-v${VERSION}`;
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/data/pos-questions-v1.js"
];

function canStore(response){
  return response&&response.ok&&(response.type==="basic"||response.type==="cors");
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const results=await Promise.allSettled(APP_SHELL.map(async url=>{
      const response=await fetch(url,{cache:"reload"});
      if(!canStore(response))throw new Error(`precache failed: ${url}`);
      await cache.put(url,response);
    }));
    const indexReady=results[1]?.status==="fulfilled";
    if(!indexReady)throw new Error("index precache failed");
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith("idiom-quest-")&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:"APP_VERSION",version:VERSION}));
  })());
});

self.addEventListener("message",event=>{
  if(event.data==="skip"||event.data?.type==="SKIP_WAITING")self.skipWaiting();
  if(event.data?.type==="GET_VERSION")event.source?.postMessage({type:"APP_VERSION",version:VERSION});
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(canStore(response))cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return cached;
    if(request.mode==="navigate")return cache.match("./index.html");
    throw error;
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(canStore(response))cache.put(request,response.clone());
  return response;
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const isDocument=request.mode==="navigate"||request.destination==="document"||url.pathname.endsWith(".html")||url.pathname.endsWith("/manifest.json");
  event.respondWith(isDocument?networkFirst(request):cacheFirst(request));
});
