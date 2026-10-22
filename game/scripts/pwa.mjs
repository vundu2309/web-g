import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())result.push(...await files(path));else result.push(path)}return result}
const paths=(await files('dist')).filter(p=>!p.endsWith('.mp3')&&!p.endsWith('/sw.js'));
const hash=createHash('sha256');for(const p of paths)hash.update(await readFile(p));
const cache='pixel-forest-phaser-'+hash.digest('hex').slice(0,12);
const urls=paths.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pixel-forest-phaser-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(url.origin!==location.origin||!url.href.startsWith(self.registration.scope)||e.request.method!=='GET'||url.pathname.endsWith('.mp3'))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope))));return}
e.respondWith(caches.match(e.request,{ignoreVary:true}).then(found=>found||fetch(e.request)))});`);
console.log('PWA shell cache:',cache,'; audio excluded from precache');
