import {test,expect} from '@playwright/test';
async function start(page:any){await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click()}
test('settings are hidden in gameplay and pause has a clear overlay',async({page})=>{
 await start(page);for(const id of ['god','music','fullscreen'])await expect(page.locator('#'+id)).toBeHidden();
 await page.locator('#pause').click();await expect(page.getByRole('heading',{name:'Đang tạm dừng'})).toBeVisible();
 const before=await page.evaluate(()=>{const f=(window as any).forest;return [f.run.time,f.player.y,f.cooldown]});
 await page.waitForTimeout(200);expect(await page.evaluate(()=>{const f=(window as any).forest;return [f.run.time,f.player.y,f.cooldown]})).toEqual(before);
 await page.locator('#resume').click();await expect(page.locator('#pause-menu')).not.toBeVisible();expect(await page.evaluate(()=>(window as any).forest.status)).toBe('play');
});
test('settings pause gameplay, contain focus and return to pause',async({page})=>{
 await start(page);await page.locator('#settings').click();await expect(page.locator('#settings-menu')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).forest.status)).toBe('pause');
 await page.locator('#god').click();await expect(page.locator('#god')).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('p');expect(await page.evaluate(()=>(window as any).forest.status)).toBe('pause');
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.querySelector('#settings-menu')!.contains(document.activeElement))).toBeTruthy();
 await page.keyboard.press('Escape');await expect(page.locator('#settings-menu')).not.toBeVisible();await expect(page.locator('#pause-menu')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('#pause-menu')).not.toBeVisible();expect(await page.evaluate(()=>(window as any).forest.status)).toBe('play');
});
test('settings from title do not start a run and restart clears pause',async({page})=>{
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#welcome-settings').click();
 expect(await page.evaluate(()=>(window as any).forest.status)).toBe('ready');await page.locator('#done-settings').click();await page.locator('#start').click();await page.locator('#pause').click();await page.locator('#restart').click();
 await expect(page.locator('#pause-menu')).not.toBeVisible();await expect(page.locator('#welcome')).toBeHidden();expect(await page.evaluate(()=>(window as any).forest.run.shield)).toBe(0);
});
test('distant trees are smaller and every trunk reaches ground pixels',async({page})=>{
 await start(page);
 const layers=await page.evaluate(()=>{const f=(window as any).forest;return f.layers.map((layer:any)=>{
  const canvas=layer.displayTexture.getSourceImage() as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let top=canvas.height,bottom=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(pixels[(y*canvas.width+x)*4+3]>0){top=Math.min(top,y);bottom=Math.max(bottom,y)}}
  const rootX=Math.round(canvas.width*.42);const root=ctx.getImageData(rootX,canvas.height-2,1,1).data[3];return {top,bottom,root};
 })});
 expect(layers[0].top).toBeGreaterThan(layers[1].top);expect(layers[1].top).toBeGreaterThan(layers[2].top);
 for(const layer of layers){expect(layer.bottom).toBe(599);expect(layer.root).toBe(255)}
});
for(const viewport of [{width:390,height:844},{width:844,height:390}])test(`mobile dialogs ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await start(page);await page.locator('#settings').click();
 await expect(page.locator('#close-settings')).toBeInViewport();await page.locator('#done-settings').scrollIntoViewIfNeeded();await expect(page.locator('#done-settings')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.locator('#done-settings').click();
 await expect(page.locator('#resume')).toBeInViewport();await page.locator('#resume').click();for(const id of ['pause','settings','jump'])await expect(page.locator('#'+id)).toBeInViewport();
});
