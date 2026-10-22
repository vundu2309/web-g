import {test,expect} from '@playwright/test';
test('large mountain world, camera follows beyond the first screen, no enemies or obstacles',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const result=await page.evaluate(()=>{const f=(window as any).forest;f.game.loop.sleep();f.items.clear(true,true);f.keys.add('ArrowRight');let maxX=0;
 for(let i=0;i<1500;i++){if(f.player.body.blocked.down&&f.player.body.blocked.right)f.jump();f.update(0,1000/60);maxX=Math.max(maxX,f.player.x)}
 f.keys.clear();f.player.setVelocityX(0);f.cameras.main.preRender();
 const camera=f.cameras.main.worldView.x;const tiles=f.children.list.filter((x:any)=>String(x.texture?.key).startsWith('land-')).length;
 const noEnemies=!f.enemy&&f.obstacles.countActive()===0;
 const positions=[f.player.x,camera];f.togglePause();for(let i=0;i<120;i++)f.update(0,1000/60);const frozen=f.player.x===positions[0]&&f.cameras.main.worldView.x===positions[1];f.togglePause();f.start();
 return {maxX,camera,tiles,noEnemies,frozen,reset:f.player.x===122&&f.run.distance===0,items:f.items.countActive()};});
 expect(result.maxX).toBeGreaterThan(2000);expect(result.camera).toBeGreaterThan(1000);expect(result.tiles).toBe(32);expect(result.noEnemies).toBe(true);expect(result.frozen).toBe(true);expect(result.reset).toBe(true);expect(result.items).toBeGreaterThan(70);expect(errors).toEqual([]);
});
test('all five regions have traversable terrain and camera respects map bounds',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const samples=await page.evaluate(()=>{const f=(window as any).forest;f.game.loop.sleep();const samples=[];
 for(const x of [1800,4800,7350,10500,14500,15950]){f.player.setPosition(x,150).setVelocity(0);f.player.body.updateFromGameObject();for(let i=0;i<150;i++)f.update(0,1000/60);f.cameras.main.preRender();samples.push({x:f.player.x,y:f.player.y,ground:f.player.body.blocked.down,scroll:f.cameras.main.worldView.x,aligned:Math.abs(f.sky.x-f.cameras.main.worldView.x)<1&&Math.abs(f.sky.y-f.cameras.main.worldView.y)<1,region:document.querySelector('#chapter span')!.textContent})}return samples});
 for(const sample of samples){expect(sample.ground).toBe(true);expect(sample.aligned).toBe(true);expect(sample.y).toBeLessThan(800);expect(sample.scroll).toBeGreaterThanOrEqual(0);expect(sample.scroll).toBeLessThanOrEqual(15201)}
 expect(new Set(samples.map(s=>s.region!.split(' · ')[0])).size).toBe(5);
});
