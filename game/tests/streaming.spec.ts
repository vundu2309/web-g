import {test, expect} from '@playwright/test';
import type Phaser from 'phaser';

test('streamed map releases distant textures and restores identical art without changing progress', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  await page.waitForFunction(() => window.forest.visuals.outfitsReady);
  const result = await page.evaluate(async () => {
    const {groundAt} = await import('../src/data/world');
    const scene = window.forest;
    scene.game.loop.sleep();
    const visit = (x: number) => {
      scene.player.setPosition(x, groundAt(x) - 1).setVelocity(0);
      scene.player.body!.updateFromGameObject();
      scene.centerCamera();
      scene.centerCamera();
    };
    const checksum = (key: string) => {
      const canvas = scene.textures.get(key).getSourceImage();
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Expected terrain canvas');
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 0;
      for (const value of pixels) hash = (Math.imul(hash, 31) + value) | 0;
      return hash;
    };
    visit(930);
    const key = 'terrain-1';
    const before = checksum(key);
    const saved = JSON.stringify({
      wood: scene.state.wood,
      harvested: scene.state.harvested,
      buildings: scene.state.buildings,
    });
    const samples: number[] = [];
    const warmCounts: number[] = [];
    let wrongCameras = 0;
    for (let lap = 0; lap < 3; lap++) {
      for (const x of [4000, 8000, 12000, 15600, 930]) {
        visit(x);
        samples.push(scene.worldStreamer.stats.loadedChunks);
        const expected = scene.cameras.main.id | scene.cameras.cameras[2].id;
        for (const image of scene.children.list.filter(
          (object) => object.type === 'Image',
        ) as Phaser.GameObjects.Image[]) {
          if (/^(terrain-|water-|decor-|tree-)/.test(image.texture.key) && image.cameraFilter !== expected)
            wrongCameras++;
        }
      }
      warmCounts.push(scene.textures.getTextureKeys().length);
    }
    visit(15600);
    const released = !scene.textures.exists(key);
    visit(930);
    const after = checksum(key);
    const sameProgress =
      saved ===
      JSON.stringify({wood: scene.state.wood, harvested: scene.state.harvested, buildings: scene.state.buildings});
    const chunks = scene.textures.getTextureKeys().filter((texture) => texture.startsWith('terrain-')).length;
    scene.game.loop.wake();
    return {before, after, released, samples, sameProgress, chunks, wrongCameras, warmCounts};
  });
  expect(result.after).toBe(result.before);
  expect(result.released).toBe(true);
  expect(result.sameProgress).toBe(true);
  expect(Math.max(...result.samples)).toBeLessThanOrEqual(12);
  expect(result.chunks).toBeLessThanOrEqual(12);
  expect(result.wrongCameras).toBe(0);
  expect(result.warmCounts[2]).toBe(result.warmCounts[1]);
  expect(errors).toEqual([]);
});

test('offscreen canopies stop animating, low quality resets rotation and restart releases streamed resources', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  const result = await page.evaluate(async () => {
    const {groundAt} = await import('../src/data/world');
    const scene = window.forest;
    scene.game.loop.sleep();
    scene.applyQuality('high');
    // Walk through nearby windows so that some retained trees are outside the current view.
    for (const x of [2600, 3000, 3400]) {
      scene.player.setPosition(x, groundAt(x) - 1).setVelocity(0);
      scene.player.body!.updateFromGameObject();
      scene.centerCamera();
    }
    const {canopyInView} = await import('../src/game/rendering/canopyVisibility');
    const trees = (
      scene.children.list.filter((object) => object.type === 'Image') as Phaser.GameObjects.Image[]
    ).filter((image) => image.texture.key.startsWith('tree-canopy-'));
    const view = scene.cameras.main.worldView;
    const hidden = trees.filter(
      (image) => !canopyInView(image.x, image.y, image.displayWidth, image.displayHeight, image.originX, view),
    );
    const rotations = hidden.map((image) => image.rotation);
    scene.clock += 0.5;
    scene.centerCamera();
    const stable = hidden.every((image, index) => image.rotation === rotations[index]);
    const high = {...scene.worldStreamer.stats};
    scene.applyQuality('low');
    const low = {...scene.worldStreamer.stats};
    const reset = trees.every((image) => image.rotation === 0);
    scene.worldStreamer.dispose();
    const released = scene.textures.getTextureKeys().every((key) => !/^(terrain-|water-|decor-)/.test(key));
    scene.scene.restart();
    scene.game.loop.wake();
    return {hidden: hidden.length, stable, high, low, reset, released};
  });
  expect(result.hidden).toBeGreaterThan(0);
  expect(result.stable).toBe(true);
  expect(result.high.updatedCanopies).toBeGreaterThan(0);
  expect(result.high.updatedCanopies).toBeLessThan(result.high.loadedTrees);
  expect(result.low.updatedCanopies).toBe(0);
  expect(result.reset).toBe(true);
  expect(result.released).toBe(true);
  await page.waitForFunction(() => window.forest.status === 'ready');
  await page.locator('#start').click();
  await page.waitForFunction(() => window.forest.worldStreamer.stats.loadedChunks > 0);
  await expect(page.locator('canvas')).toBeVisible();
});
