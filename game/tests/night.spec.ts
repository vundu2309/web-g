import {test,expect} from '@playwright/test';
async function ready(page:any){await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest))}
test('quality settings resize the renderer, reduce fog and persist',async({page})=>{
 await ready(page);await page.locator('#welcome-settings').click();await page.locator('#quality-low').click();
 await expect(page.locator('#quality-low')).toHaveAttribute('aria-pressed','true');
 await page.waitForFunction(()=>document.querySelector('canvas')!.width===800);
 expect(await page.evaluate(()=>{const f=(window as any).forest;return f.quality==='low'&&f.fog.every((layer:any)=>!layer.visible)&&f.cameras.main.zoom===1})).toBeTruthy();
 await page.reload();await page.waitForFunction(()=>Boolean((window as any).forest));expect(await page.evaluate(()=>(window as any).forest.quality)).toBe('low');
 await page.locator('#start').click();await page.locator('#settings').click();const before=await page.evaluate(()=>(window as any).forest.run.time);await page.locator('#quality-high').click();
 await page.waitForFunction(()=>document.querySelector('canvas')!.width===1600);
 expect(await page.evaluate(()=>{const f=(window as any).forest;return f.quality==='high'&&f.fog.every((layer:any)=>layer.visible)&&f.cameras.main.zoom===2})).toBeTruthy();
 expect(await page.evaluate(()=>(window as any).forest.run.time)).toBe(before);await page.locator('#done-settings').click();await page.locator('#resume').click();expect(await page.evaluate(()=>(window as any).forest.status)).toBe('play');
});
test('sprite atlas has distinct run, jump, landing, pickup and Enemy poses',async({page})=>{
 await ready(page);await page.locator('#start').click();const result=await page.evaluate(()=>{
  const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;f.cooldown=999;f.itemTime=999;const step=(n:number)=>{for(let i=0;i<n;i++)f.update(0,1000/60)};step(12);
  const atlas=f.textures.get('player-atlas');const frames=['run0','run7','jump','fall','land','pickup'].every(name=>atlas.has(name));
  f.jump();step(1);const jumping=f.player.frame.name==='jump';let landing=false;for(let i=0;i<70;i++){step(1);if(f.player.frame.name==='land')landing=true}
  f.pickup(f.spawnItem('light'));step(1);const pickup=f.player.frame.name==='pickup';
  f.windup=.4;step(1);const hold=f.enemy.frame.name==='hold';f.windup=.001;step(1);const release=f.enemy.frame.name==='release';
  const fourLayers=f.layers.length===4;f.game.loop.wake();return {frames,jumping,landing,pickup,hold,release,fourLayers};
 });expect(result).toEqual({frames:true,jumping:true,landing:true,pickup:true,hold:true,release:true,fourLayers:true});
});
test('particles and floating labels are bounded, freeze on pause and reset',async({page})=>{
 await ready(page);await page.locator('#start').click();const result=await page.evaluate(()=>{
  const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;f.applyQuality('high');
  f.emit(122,260,0xffe39b,500,90);for(let i=0;i<20;i++)f.floatText(122,200,'+50',0xffe39b);
  const highBound=f.particles.length<=96&&f.labels.length<=6;
  f.togglePause();const frozen=JSON.stringify(f.particles),labelY=f.labels[0].view.y;f.update(0,1000);const paused=JSON.stringify(f.particles)===frozen&&f.labels[0].view.y===labelY;
  f.applyQuality('low');f.emit(122,260,0xffe39b,500,90);const lowBound=f.particles.length<=32;
  f.start();const reset=f.particles.length===0&&f.labels.length===0;f.game.loop.wake();return {highBound,paused,lowBound,reset};
 });expect(result).toEqual({highBound:true,paused:true,lowBound:true,reset:true});
});
test('DJ entry and shield impact have cinematic beams, water and feedback',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await ready(page);await page.locator('#start').click();
 const result=await page.evaluate(()=>{const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;f.pickup(f.spawnItem('dj'));
  for(let i=0;i<24;i++)f.update(0,1000/60);
  const entry=f.entryPulse>0&&f.beams.commandBuffer.length>0&&f.goldenScene.visible&&f.performer.visible;
  f.collide(f.obstacles.create(700,270,'baby'));f.drawEffects();const impact=f.shieldFlash>0&&f.particles.length>0&&f.feedback.commandBuffer.length>0;
  f.collide(f.obstacles.create(700,270,'baby'));f.collide(f.obstacles.create(700,270,'baby'));f.drawEffects();const ends=!f.performer.visible&&f.shieldBurst>0&&!f.water.visible;
  f.game.loop.wake();return {entry,impact,ends};});expect(result).toEqual({entry:true,impact:true,ends:true});expect(errors).toEqual([]);
});
for(const viewport of [{width:390,height:844},{width:844,height:390}])test(`night title fits phone ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await ready(page);const box=await page.locator('#welcome article').boundingBox();expect(box).not.toBeNull();
 expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width+1);expect(box!.y+box!.height).toBeLessThanOrEqual(viewport.height+1);
 await expect(page.locator('#start')).toBeInViewport();await page.locator('#start').click();await expect(page.locator('#welcome')).toBeHidden();
});
