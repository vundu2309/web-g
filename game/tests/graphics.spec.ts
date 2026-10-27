import {test, expect} from '@playwright/test';
// artHeight: accepted visible height in art pixels; 844x390 at density 1 is the documented short-window exception.
const viewports = [
  {width: 1920, height: 1080, artHeight: [240, 330]},
  {width: 1440, height: 900, artHeight: [240, 330]},
  {width: 1024, height: 768, artHeight: [240, 330]},
  {width: 390, height: 844, artHeight: [240, 330]},
  {width: 844, height: 390, artHeight: [180, 200]},
];
for (const viewport of viewports) {
  test(`adaptive canvas fills ${viewport.width}x${viewport.height} with whole pixels and stable physics`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:5173');
    await page.waitForFunction(() => Boolean(window.forest));
    await page.locator('#start').click();
    await page.waitForFunction(() => window.forest.player.body!.blocked.down);
    await page.waitForFunction(() => window.forest.visuals.outfitsReady);
    await page.evaluate(() => {
      const scene = window.forest;
      scene.game.loop.sleep();
      scene.state.time = 160;
      scene.player.setPosition(2400, 400).setVelocity(0);
      scene.player.body!.updateFromGameObject();
      for (let i = 0; i < 70; i++) scene.update(0, 1000 / 60);
    });
    const actual = await page.evaluate(() => {
      const scene = window.forest;
      const body = scene.player.body!;
      const camera = scene.cameras.main;
      const canvas = document.querySelector('canvas')!;
      const rect = canvas.getBoundingClientRect();
      return {
        bounds: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
        height: camera.worldView.height,
        pixelScale: scene.viewport.pixelScale,
        artHeight: scene.viewport.height / 2,
        backing: [canvas.width, canvas.height],
        zoom: camera.zoom,
        playerRatio: scene.player.displayWidth / scene.player.displayHeight,
        target: (scene.player.x - camera.worldView.x) / camera.worldView.width,
        body: [body.width, body.height, body.bottom - scene.player.y],
        factors: scene.background.layers.map((layer) => layer.sprites[0].scrollFactorX),
        textures: scene.textures.getTextureKeys().filter((key) => !/^(terrain-|water-|decor-|tree-|aquatic-)/.test(key))
          .length,
        fishTextures: scene.textures.getTextureKeys().filter((key) => key.startsWith('aquatic-')).length,
        loadedChunks: scene.worldStreamer.stats.loadedChunks,
        camperSheets: scene.textures.getTextureKeys().filter((key) => key.startsWith('camper-rig:')).length,
      };
    });
    expect(actual.bounds.y).toBeLessThanOrEqual(1);
    expect(actual.bounds.x).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.bounds.width - viewport.width)).toBeLessThan(2);
    expect(Math.abs(actual.bounds.height - viewport.height)).toBeLessThan(2);
    expect(Number.isInteger(actual.pixelScale)).toBe(true);
    expect(actual.zoom * 2).toBe(actual.pixelScale);
    expect(actual.backing).toEqual([Math.round(actual.bounds.width), Math.round(actual.bounds.height)]);
    expect(actual.artHeight).toBeGreaterThanOrEqual(viewport.artHeight[0]);
    expect(actual.artHeight).toBeLessThanOrEqual(viewport.artHeight[1]);
    expect(actual.height).toBeCloseTo(actual.artHeight * 2, 3);
    expect(actual.playerRatio).toBeCloseTo(36 / 48, 6);
    expect(actual.target).toBeCloseTo(0.42, 2);
    expect(actual.body).toEqual([24, 74, 0]);
    expect(new Set(actual.factors).size).toBe(5);
    await page.evaluate(() => window.forest.game.loop.wake());
    await page.waitForTimeout(150);
    await page.screenshot({path: `test-results/graphics-${viewport.width}x${viewport.height}.png`});
    const stable = await page.evaluate(() => {
      const scene = window.forest;
      scene.game.loop.sleep();
      scene.keys.add('KeyD');
      for (let i = 0; i < 240; i++) scene.update(0, 1000 / 60);
      scene.keys.clear();
      scene.applyQuality('low');
      return {
        textures: scene.textures.getTextureKeys().filter((key) => !/^(terrain-|water-|decor-|tree-|aquatic-)/.test(key))
          .length,
        fishTextures: scene.textures.getTextureKeys().filter((key) => key.startsWith('aquatic-')).length,
        loadedChunks: scene.worldStreamer.stats.loadedChunks,
        camperSheets: scene.textures.getTextureKeys().filter((key) => key.startsWith('camper-rig:')).length,
        visible: scene.background.layers.filter((layer) => layer.sprites.some((sprite) => sprite.visible)).length,
      };
    });
    expect(stable.textures).toBe(actual.textures);
    expect(actual.fishTextures).toBeLessThanOrEqual(15);
    expect(stable.fishTextures).toBeLessThanOrEqual(15);
    expect(actual.loadedChunks).toBeLessThanOrEqual(12);
    expect(stable.loadedChunks).toBeLessThanOrEqual(12);
    expect(actual.camperSheets).toBe(16);
    expect(stable.camperSheets).toBe(actual.camperSheets);
    expect(stable.visible).toBe(2);
    await page.evaluate(() => window.forest.game.loop.wake());
    await page.waitForTimeout(150);
    await page.evaluate(() => window.forest.game.loop.wake());
    await page.waitForTimeout(150);
    await page.screenshot({path: `test-results/graphics-boundary-low-${viewport.width}.png`});
  });
}
