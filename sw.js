const CACHE="pixel-forest-phaser-13e2e701972e",FILES=["./assets/index-BO2dEWcF.css","./assets/index-j6258ji9.js","./icon-192.png","./icon-512.png","./index.html","./manifest.webmanifest"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pixel-forest-phaser-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(url.origin!==location.origin||!url.href.startsWith(self.registration.scope)||e.request.method!=='GET'||url.pathname.endsWith('.mp3'))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope))));return}
e.respondWith(caches.match(e.request,{ignoreVary:true}).then(found=>found||fetch(e.request)))});