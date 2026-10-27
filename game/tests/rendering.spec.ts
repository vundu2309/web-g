import {test, expect} from '@playwright/test';
async function ready(page: any) {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean((window as any).forest));
  await page.locator('#start').click();
}
test('render backing and world text adapt to full HD, 4K, and live resizing', async ({page}) => {
  await page.setViewportSize({width: 1920, height: 1080});
  await ready(page);
  const sample = () =>
    page.evaluate(() => {
      const f = (window as any).forest,
        c = document.querySelector('canvas')!,
        r = c.getBoundingClientRect();
      return {
        backing: c.width,
        display: r.width,
        dpr: devicePixelRatio,
        zoom: f.cameras.main.zoom,
        text: f.visuals.fishLabel.style.resolution,
        pixel: f.viewport.pixelScale,
        nearest: f.player.texture.source[0].scaleMode,
        root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      };
    });
  let view = await sample();
  expect(view.backing).toBeGreaterThanOrEqual(view.display * view.dpr);
  expect(view.text).toBe(view.zoom);
  expect(view.nearest).toBe(1);
  expect(view.root).toBe(18);
  await page.locator('#pause').click();
  await page.setViewportSize({width: 3840, height: 2160});
  await page.waitForFunction(() => document.querySelector('canvas')!.width >= 3840);
  view = await sample();
  expect(view.text).toBe(view.zoom);
  expect(view.root).toBe(24);
  expect(await page.evaluate(() => (window as any).forest.status)).toBe('pause');
  await page.setViewportSize({width: 390, height: 844});
  // 390x844 at density 1 has a whole-pixel scale of 3, so the canvas is 843 device pixels tall.
  await page.waitForFunction(() => document.querySelector('canvas')!.height === 843);
  await expect(page.locator('#resume')).toBeInViewport();
  await page.locator('#resume').click();
  for (const id of ['left', 'jump', 'inventory', 'build']) await expect(page.locator('#' + id)).toBeInViewport();
});
test.describe('retina rendering', () => {
  test.use({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 2});
  test('canvas and canvas text are drawn at device density', async ({page}) => {
    await ready(page);
    const actual = await page.evaluate(() => {
      const f = (window as any).forest,
        c = document.querySelector('canvas')!,
        r = c.getBoundingClientRect();
      return {
        backing: c.width,
        physical: r.width * devicePixelRatio,
        resolution: f.visuals.fishLabel.style.resolution,
        zoom: f.cameras.main.zoom,
      };
    });
    expect(actual.backing).toBeGreaterThanOrEqual(actual.physical);
    expect(actual.resolution).toBe(actual.zoom);
    await page.locator('#pause').click();
    await page.locator('#pause-settings').click();
    await page.locator('#quality-low').click();
    expect(await page.evaluate(() => (window as any).forest.viewport.pixelScale)).toBe(4);
  });
});
test('scene restart disposes old controls and reuses textures without duplicate listeners', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.evaluate(() => {
    const w = window as any;
    w.retiredControls = w.forest.controls;
    w.forest.scene.restart();
  });
  await page.waitForFunction(() => {
    const w = window as any;
    return w.forest.controls !== w.retiredControls;
  });
  await page.locator('#start').click();
  await page.keyboard.down('ArrowRight');
  const controls = await page.evaluate(() => {
    const w = window as any;
    return {old: w.retiredControls.keys.size, current: w.forest.keys.has('ArrowRight')};
  });
  await page.keyboard.up('ArrowRight');
  expect(controls).toEqual({old: 0, current: true});
  expect(errors).toEqual([]);
});
