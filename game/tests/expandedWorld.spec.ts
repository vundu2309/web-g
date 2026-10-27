import {test, expect} from '@playwright/test';

test('expanded land and descending ocean stream safely, save new positions and preserve old camps', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  const samples = await page.evaluate(async () => {
    const {groundAt, terrainGrid} = await import('../src/data/world');
    const {OCEAN_X, WORLD_WIDTH} = await import('../src/data/worldLayout');
    const scene = window.forest;
    scene.game.loop.sleep();
    scene.state.buildings.push({id: 'build-preserved-camp', kind: 'tent', x: 192});
    scene.visuals.restore(scene.state);
    const results = [];
    for (const x of [18000, 22000, 26000, OCEAN_X + 256, 30000, WORLD_WIDTH - 120]) {
      scene.player.setPosition(x, groundAt(x) - 1).setVelocity(0);
      scene.player.body!.updateFromGameObject();
      scene.centerCamera();
      scene.centerCamera();
      const column = terrainGrid.columnAt(x);
      results.push({
        x,
        sea: x >= OCEAN_X,
        floor: groundAt(x),
        top: terrainGrid.waterSurfaceRow(column),
        chunks: scene.worldStreamer.stats.loadedChunks,
        layers: scene.background.layers.filter(
          (layer) => layer.kind !== 'clouds' && layer.sprites.some((sprite) => sprite.visible),
        ).length,
      });
    }
    scene.persist();
    scene.game.loop.wake();
    return results;
  });
  for (const sample of samples) expect(sample.chunks).toBeLessThanOrEqual(12);
  const ocean = samples.filter((sample) => sample.sea);
  expect(ocean).toHaveLength(3);
  expect(ocean[0].floor).toBeLessThan(ocean[1].floor);
  expect(ocean[1].floor).toBeLessThan(ocean[2].floor);
  expect(ocean.every((sample) => sample.layers === 0)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.forest));
  expect(await page.evaluate(() => window.forest.state.x)).toBeGreaterThan(30000);
  expect(
    await page.evaluate(() => window.forest.state.buildings.some((building) => building.id === 'build-preserved-camp')),
  ).toBe(true);
  await page.locator('#start').click();
  await page.waitForFunction(() => window.forest.aquatic.swimming.active);
  await page.evaluate(async () => {
    const {OCEAN_X} = await import('../src/data/worldLayout');
    const {groundAt, resourceNodes} = await import('../src/data/world');
    const scene = window.forest;
    scene.state.harvested.push(
      ...resourceNodes.filter((node) => Math.abs(node.x - (OCEAN_X - 32)) < 75).map((node) => node.id),
    );
    scene.aquatic.reset();
    scene.player.setPosition(OCEAN_X - 32, groundAt(OCEAN_X - 32) - 1).setVelocity(0);
    scene.player.body!.updateFromGameObject();
  });
  await page.waitForFunction(() => window.forest.player.body!.blocked.down);
  await page.keyboard.press('e');
  expect(await page.evaluate(() => window.forest.fishing?.habitat)).toBe('sea');
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
