import {test, expect, type Page} from '@playwright/test';
import type {CampingScene} from '../src/game/CampingScene';
declare global {
  interface Window {
    forest: CampingScene;
  }
}
async function start(page: Page) {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
}
async function seedActivity(page: Page, kind: 'stall' | 'fire' | 'chest') {
  await page.evaluate(async (kind) => {
    const scene = window.forest;
    const path = '/src/domain/camping.ts';
    const {storeFish} = await import(path);
    scene.state.buildings.push({id: 'build-test', kind, x: 192});
    storeFish(scene.state, 'carp', 40);
    storeFish(scene.state, 'carp', 25);
    scene.visuals.restore(scene.state);
    scene.player.setPosition(192, 500).setVelocity(0);
    scene.player.body!.updateFromGameObject();
  }, kind);
  await page.waitForFunction(() => window.forest.player.body!.blocked.down && window.forest.player.y > 600);
  await page.locator('#action').click();
}
for (const viewport of [
  {width: 390, height: 844},
  {width: 844, height: 390},
]) {
  test(`shop and cooking transactions fit ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await start(page);
    await seedActivity(page, 'stall');
    await expect(page.getByRole('heading', {name: 'Cửa hàng', exact: true})).toBeVisible();
    await page.locator('[data-command="sell:1"]').click();
    expect(await page.evaluate(() => window.forest.state.fishBag.length)).toBe(1);
    expect(await page.evaluate(() => window.forest.state.fish.carp?.count)).toBe(2);
    await page.locator('[data-command="tab:buy"]').click();
    await expect(page.locator('[data-command="buy:hat-adventure"]')).toBeDisabled();
    await page.screenshot({path: `test-results/shop-${viewport.width}.png`});
    await page.locator('#done-activity').scrollIntoViewIfNeeded();
    await page.locator('#done-activity').click();
    await page.locator('#resume').click();
    await page.evaluate(() => {
      window.forest.state.buildings[0].kind = 'fire';
    });
    await page.locator('#action').click();
    await expect(page.getByRole('heading', {name: 'Nấu ăn', exact: true})).toBeVisible();
    await page.locator('[data-command="grilled:0"]').click();
    expect(await page.evaluate(() => window.forest.state.food.length)).toBe(1);
    expect(await page.evaluate(() => window.forest.state.fishBag.length)).toBe(0);
    await page.screenshot({path: `test-results/cook-${viewport.width}.png`});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
for (const viewport of [
  {width: 390, height: 844},
  {width: 844, height: 390},
]) {
  test(`chest transfers, persists and pauses clock at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await start(page);
    await seedActivity(page, 'chest');
    await expect(page.getByRole('heading', {name: 'Rương gỗ', exact: true, level: 2})).toBeVisible();
    const time = await page.evaluate(() => window.forest.state.time);
    await page.locator('[data-command="deposit:-1"]').click();
    expect(await page.evaluate(() => window.forest.state.wood)).toBe(0);
    await expect(page.locator('#hud-wood')).toHaveText('0');
    expect(await page.evaluate(() => window.forest.state.fishBag.length)).toBe(0);
    await page.screenshot({path: `test-results/chest-${viewport.width}.png`});
    expect(await page.evaluate(() => window.forest.state.time)).toBe(time);
    await page.locator('[data-command="withdraw:-1"]').click();
    expect(await page.evaluate(() => window.forest.state.wood)).toBe(24);
    await page.locator('[data-command="deposit:-1"]').click();
    const chest = await page.evaluate(() => window.forest.state.chests);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.forest));
    expect(await page.evaluate(() => window.forest.state.chests)).toEqual(chest);
    expect(await page.evaluate(() => window.forest.state.fish.carp?.largest)).toBe(40);
  });
}
test('night lighting reuses textures through resize, low quality and FPS sampling', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  await page.waitForFunction(() => window.forest.visuals.outfitsReady);
  await page.evaluate(() => {
    const scene = window.forest;
    scene.state.time = 440;
    for (const [index, kind] of (['fire', 'lantern', 'tent'] as const).entries()) {
      scene.state.buildings.push({id: 'build-light-' + index, kind, x: 200 + index * 120});
    }
    scene.visuals.restore(scene.state);
  });
  await page.waitForFunction(() => window.forest.fps.samples >= 3);
  const high = await page.evaluate(() => ({
    fps: window.forest.fps.average,
    textures: window.forest.textures.getTextureKeys().filter((key) => !/^(terrain-|water-|decor-|tree-)/.test(key))
      .length,
  }));
  await page.screenshot({path: 'test-results/night-high.png'});
  await page.locator('#pause').click();
  await page.locator('#pause-settings').click();
  await page.locator('#quality-low').click();
  await page.locator('#done-settings').click();
  await page.locator('#resume').click();
  await page.setViewportSize({width: 390, height: 844});
  await page.setViewportSize({width: 844, height: 390});
  const samples = await page.evaluate(() => window.forest.fps.samples);
  await page.waitForFunction((samples) => window.forest.fps.samples >= samples + 3, samples);
  const low = await page.evaluate(() => ({
    fps: window.forest.fps.average,
    textures: window.forest.textures.getTextureKeys().filter((key) => !/^(terrain-|water-|decor-|tree-)/.test(key))
      .length,
  }));
  expect(low.textures).toBe(high.textures);
  expect(high.fps).toBeGreaterThan(0);
  expect(low.fps).toBeGreaterThan(0);
  console.warn('DEV FPS (headless Chrome / software GPU): ' + JSON.stringify({high, low}));
  await page.screenshot({path: 'test-results/night-low-landscape.png'});
  expect(errors).toEqual([]);
});
test('touch pulling tracks each pointer and releases on cancellation and pause', async ({page}) => {
  await start(page);
  const result = await page.evaluate(() => {
    const scene = window.forest;
    const action = document.getElementById('action')!;
    // Synthetic pointer captures are unavailable; model two active fingers and dispatch real release handlers.
    scene.controls.actionPointers.add(1);
    scene.controls.actionPointers.add(2);
    action.dispatchEvent(new PointerEvent('pointercancel', {pointerId: 1}));
    const oneRemains = scene.controls.pulling;
    action.dispatchEvent(new PointerEvent('lostpointercapture', {pointerId: 2}));
    const released = !scene.controls.pulling;
    scene.controls.actionPointers.add(3);
    scene.togglePause();
    return {oneRemains, released, cleared: !scene.controls.pulling};
  });
  expect(result).toEqual({oneRemains: true, released: true, cleared: true});
});
