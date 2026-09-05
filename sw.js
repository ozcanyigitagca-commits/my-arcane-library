const CACHE='arcane-library-v14-1';
const CORE=['./','./index.html','./library-bg.png','./manifest.webmanifest','./icon-192.png','./icon-512.png','./fix.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin)return;
 if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){
   e.respondWith(fetch(e.request).then(async r=>{
     const html=await r.clone().text();
     if(html.includes('my-arcane-live-hotfix')) return new Response(html,{status:r.status,statusText:r.statusText,headers:r.headers});
     const patched=html.replace('</body>','<script id="my-arcane-live-hotfix" src="./fix.js"></script></body>');
     const headers=new Headers(r.headers); headers.set('Content-Type','text/html; charset=utf-8');
     return new Response(patched,{status:r.status,statusText:r.statusText,headers});
   }).catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html'))));
   return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>cached)));
});
