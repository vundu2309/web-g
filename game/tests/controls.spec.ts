import {test,expect} from '@playwright/test';
test('manual keyboard movement, stationary terrain and pause clears held input',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 await page.evaluate(()=>{const f=(window as any).forest;f.game.loop.sleep();f.run.god=true;f.cooldown=999;f.itemTime=999;f.items.clear(true,true);for(let i=0;i<10;i++)f.update(0,1000/60)});
 const sample=()=>page.evaluate(()=>{const f=(window as any).forest;return {x:f.player.x,y:f.player.y,distance:f.run.distance,ground:f.ground.tilePositionX}});
 const step=()=>page.evaluate(()=>{for(let i=0;i<30;i++)(window as any).forest.update(0,1000/60)});
 const initial=await sample();await step();expect((await sample()).x).toBe(initial.x);expect((await sample()).distance).toBe(0);
 await page.keyboard.down('ArrowRight');await step();const right=await sample();expect(right.x).toBeGreaterThan(initial.x+100);
 await page.keyboard.up('ArrowRight');await step();expect((await sample()).x).toBe(right.x);
 await page.keyboard.down('a');await page.keyboard.press('Space');await step();const left=await sample();expect(left.x).toBeLessThan(right.x-100);expect(left.y).toBeLessThan(initial.y-30);
 await page.locator('#pause').click();await page.keyboard.up('a');await page.locator('#resume').click();const pausedX=(await sample()).x;await step();expect((await sample()).x).toBe(pausedX);

});
test('touch controls support holding direction while jumping and release cleanly',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 for(const id of ['left','right','jump','settings','pause'])await expect(page.locator('#'+id)).toBeInViewport();
 await page.evaluate(()=>{const f=(window as any).forest;f.game.loop.sleep();f.cooldown=999;f.itemTime=999;f.run.god=true;for(let i=0;i<10;i++)f.update(0,1000/60)});
 const result=await page.evaluate(()=>{
  const f=(window as any).forest,right=document.getElementById('right')!,jump=document.getElementById('jump')!;
  const start=f.player.x,startY=f.player.y;
  // An actual pointer is captured in the browser test below; dispatch a separate jump while held.
  f.touchDirections.set(42,1);jump.dispatchEvent(new PointerEvent('pointerdown',{pointerId:43,bubbles:true}));
  for(let i=0;i<15;i++)f.update(0,1000/60);
  const moved=f.player.x>start+40,airborne=f.player.y<startY-30;
  right.dispatchEvent(new PointerEvent('pointercancel',{pointerId:42,bubbles:true}));
  for(let i=0;i<10;i++)f.update(0,1000/60);
  return {moved,airborne,released:f.player.body.velocity.x===0};
 });expect(result).toEqual({moved:true,airborne:true,released:true});
 const right=page.locator('#right'),box=(await right.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 expect(await page.evaluate(()=>(window as any).forest.touchDirections.size)).toBe(1);
 await page.mouse.move(0,0);await page.mouse.up();expect(await page.evaluate(()=>(window as any).forest.touchDirections.size)).toBe(0);
});
