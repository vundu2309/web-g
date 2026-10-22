import {test,expect} from '@playwright/test';
test('explorer, pickups, DJ, shield, God mode, pause and restart',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');
 await page.waitForFunction(()=>Boolean((window as any).forest));
 await page.locator('#start').click();
 await expect(page.locator('#welcome')).toBeHidden();
 await page.waitForFunction(()=>(window as any).forest.player.body.blocked.down);
 const result=await page.evaluate(()=>{
  const f=(window as any).forest;
  const landed=f.player.body.blocked.down;f.jump();const jumps=f.player.body.velocity.y<0;
  const pickup=(kind:string)=>{const item=f.items.create(600,200,'dj');item.kind=kind;f.pickup(item)};
  pickup('power');pickup('light');const double=f.run.bonus===100;
  pickup('dj');const dj=f.run.shield===3&&f.performer.visible;
  f.run.god=true;
  for(let i=0;i<4;i++){const o=f.obstacles.create(600,200,'baby');f.collide(o)}
  const protectedRun=f.status==='play'&&f.run.shield===0&&!f.performer.visible;
  f.run.god=false;f.collide(f.obstacles.create(600,200,'baby'));
  const ended=f.status==='over';f.start();f.togglePause();const time=f.run.time;f.update(0,1000);
  const paused=f.status==='pause'&&f.run.time===time;f.togglePause();
  return {landed,jumps,double,dj,protectedRun,ended,paused,restarted:f.run.bonus===0};
 });
 expect(result).toEqual({landed:true,jumps:true,double:true,dj:true,protectedRun:true,ended:true,paused:true,restarted:true});
 expect(errors).toEqual([]);
});
test('phone controls fit without page scrolling',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173');
 await page.locator('#start').click();for(const id of ['jump','pause','settings'])await expect(page.locator('#'+id)).toBeInViewport();
 for(const id of ['god','music','fullscreen'])await expect(page.locator('#'+id)).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('real Arcade collisions, correct light texture, clock and restart',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const result=await page.evaluate(()=>{
  const f=(window as any).forest;f.game.loop.sleep();
  f.items.clear(true,true);f.cooldown=999;f.itemTime=999;f.run.god=true;
  const step=(n:number,ms=1000/60)=>{for(let i=0;i<n;i++)f.update(0,ms)};
  step(10);const item=f.spawnItem('light');item.setPosition(f.player.x,f.player.y-32);(item.body as any).updateFromGameObject();step(2);
  const actualPickup=f.run.bonus===50&&!item.active;
  const clock=(ms:number,count:number)=>{f.start();f.run.god=true;f.cooldown=999;f.itemTime=999;step(count,ms);return f.run.time};
  const t60=clock(1000/60,600),t30=clock(1000/30,300);
  f.start();f.run.boost=10;step(599);const stillBoost=f.run.boost>0;step(2);const expired=f.run.boost===0;
  const clear=f.run.time>9.9;f.start();const reset=f.run.time===0&&f.obstacles.countActive()===0&&f.items.countActive()>70;
  f.game.loop.wake();return {actualPickup,clockMatch:Math.abs(t60-t30)<.001,stillBoost,expired,clear,reset};
 });
 expect(result).toEqual({actualPickup:true,clockMatch:true,stillBoost:true,expired:true,clear:true,reset:true});
});
test('DJ animation/refill, paused effects, shield burst and world pickups',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const result=await page.evaluate(()=>{
  const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;
  const step=(n:number)=>{for(let i=0;i<n;i++)f.update(0,1000/60)};
  const dj=()=>f.pickup(f.spawnItem('dj'));
  dj();const fromSky=f.performer.y<f.player.y-300;step(80);const arrived=Math.abs(f.performer.y-(f.player.y-218))<12;
  const frame=JSON.stringify(f.djMotion.commandBuffer);step(8);const animates=JSON.stringify(f.djMotion.commandBuffer)!==frame;
  const age=f.djTime;f.run.shield=1;dj();const refills=f.run.shield===3&&f.djTime===age;
  f.run.boost=10;f.togglePause();const frozen=[f.run.time,f.djTime,f.run.boost,f.cooldown];step(120);
  const pauses=JSON.stringify(frozen)===JSON.stringify([f.run.time,f.djTime,f.run.boost,f.cooldown]);f.togglePause();
  for(let i=0;i<3;i++)f.collide(f.obstacles.create(700,270,'baby'));
  const bursts=f.shieldBurst>0&&!f.performer.visible;step(41);const burstEnds=f.shieldBurst===0;
  f.start();const kinds=f.items.getChildren().map((o:any)=>o.kind);const specials=kinds.filter((k:string)=>k!=='light');const alternating=specials[0]==='dj'&&specials[1]==='power'&&specials[2]==='dj';
  f.game.loop.wake();return {fromSky,arrived,animates,refills,pauses,bursts,burstEnds,alternating};
 });
 expect(result).toEqual({fromSky:true,arrived:true,animates:true,refills:true,pauses:true,bursts:true,burstEnds:true,alternating:true});
});
test('DJ music is fetched, decoded and obeys pause/mute/shield end',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));
 await page.locator('#start').click();await page.evaluate(()=>{const f=(window as any).forest;f.run.god=true;f.pickup(f.spawnItem('dj'))});
 await page.waitForFunction(()=>{const a=(window as any).forest.audio.element;return a&&!a.paused&&a.readyState>=2},null,{timeout:20000});
 await page.locator('#pause').click();expect(await page.evaluate(()=>(window as any).forest.audio.element.paused)).toBeTruthy();
 await page.locator('#resume').click();await page.waitForFunction(()=>!(window as any).forest.audio.element.paused);
 await page.locator('#settings').click();await page.locator('#music').click();expect(await page.evaluate(()=>(window as any).forest.audio.element.paused)).toBeTruthy();
 await page.locator('#done-settings').click();await page.locator('#resume').click();
 await page.locator('#settings').click();await page.locator('#music').click();await page.locator('#done-settings').click();await page.locator('#resume').click();await page.waitForFunction(()=>!(window as any).forest.audio.element.paused);
 await page.evaluate(()=>{const f=(window as any).forest;for(let i=0;i<3;i++)f.collide(f.obstacles.create(700,270,'baby'))});
 expect(await page.evaluate(()=>{const a=(window as any).forest.audio.element;return a.paused&&a.currentTime===0})).toBeTruthy();
});

test('original gradient layers, bubble highlights and aura lifetimes',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const result=await page.evaluate(()=>{
  const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;
  f.pickup(f.spawnItem('dj'));f.pickup(f.spawnItem('power'));
  for(let i=0;i<130;i++)f.update(0,1000/60);
  const layers=f.goldenScene.visible&&f.water.visible&&f.djGlow.visible&&f.playerGlow.visible;
  const centers=Math.abs(f.djGlow.y-(f.performer.y+32))<.01;
  f.collide(f.obstacles.create(700,270,'baby'));f.drawEffects();const flash=f.shieldFlash>0&&f.run.shield===2;
  f.collide(f.obstacles.create(700,270,'baby'));f.collide(f.obstacles.create(700,270,'baby'));f.drawEffects();
  const removed=!f.goldenScene.visible&&!f.water.visible&&!f.djGlow.visible&&!f.performer.visible;
  const independent=f.playerGlow.visible&&f.run.boost>0;
  f.start();f.drawEffects();const reset=!f.playerGlow.visible&&!f.goldenScene.visible&&f.shieldBurst===0;
  f.game.loop.wake();return {layers,centers,flash,removed,independent,reset};
 });expect(result).toEqual({layers:true,centers:true,flash:true,removed:true,independent:true,reset:true});
});
