import {test, expect} from '@playwright/test';

test('keyboard swimming crosses below the lake bridge, breath freezes on pause and jumping returns to bridge', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  await page.evaluate(async () => {
    const {groundAt} = await import('../src/data/world');
    const scene = window.forest;
    scene.player.setPosition(18100, groundAt(18100) - 1).setVelocity(0);
    scene.player.body!.updateFromGameObject();
    scene.centerCamera();
    scene.game.loop.sleep();
  });
  await page.keyboard.down('s');
  await page.evaluate(() => {
    for (let i = 0; i < 150; i++) window.forest.update(0, 1000 / 60);
  });
  expect(await page.evaluate(() => window.forest.aquatic.swimming.active)).toBe(true);
  expect(await page.evaluate(() => window.forest.visuals.camper.pose)).toBe('dive');
  expect(await page.evaluate(() => window.forest.player.y)).toBeGreaterThan(460);
  await expect(page.locator('#action')).toBeDisabled();
  await page.keyboard.up('s');
  await page.keyboard.press('p');
  const air = await page.evaluate(() => window.forest.aquatic.swimming.air);
  await page.evaluate(() => {
    for (let i = 0; i < 180; i++) window.forest.update(0, 1000 / 60);
  });
  expect(await page.evaluate(() => window.forest.aquatic.swimming.air)).toBe(air);
  await page.keyboard.press('p');
  await page.keyboard.down('w');
  await page.evaluate(() => {
    for (let i = 0; i < 180; i++) window.forest.update(0, 1000 / 60);
  });
  await page.keyboard.up('w');
  expect(await page.evaluate(() => window.forest.aquatic.swimming.submerged)).toBe(false);
  await page.keyboard.press('Space');
  await page.evaluate(() => {
    for (let i = 0; i < 120; i++) window.forest.update(0, 1000 / 60);
  });
  expect(await page.evaluate(() => window.forest.aquatic.swimming.active)).toBe(false);
  expect(await page.evaluate(() => window.forest.player.body!.blocked.down)).toBe(true);
});

test('touch dive supports simultaneous movement and releases on cancel; depleted breath forces safe ascent', async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  const result = await page.evaluate(() => {
    const scene = window.forest;
    scene.game.loop.sleep();
    scene.player.setPosition(30000, 720).setVelocity(0);
    scene.player.body!.updateFromGameObject();
    scene.centerCamera();
    scene.update(0, 1000 / 60);
    const dive = document.getElementById('dive')!;
    const right = document.getElementById('right')!;
    for (const [button, pointerId] of [
      [dive, 71],
      [right, 72],
    ] as const) {
      button.setPointerCapture = () => {};
      button.dispatchEvent(new PointerEvent('pointerdown', {pointerId, bubbles: true}));
    }
    const x = scene.player.x;
    for (let i = 0; i < 90; i++) scene.update(0, 1000 / 60);
    const moved = scene.player.x - x;
    const descended = scene.player.y > 740;
    right.dispatchEvent(new PointerEvent('pointercancel', {pointerId: 72}));
    dive.dispatchEvent(new PointerEvent('pointercancel', {pointerId: 71}));
    const released = scene.controls.vertical === 0 && scene.controls.direction === 0;
    scene.controls.keys.add('KeyS');
    scene.aquatic.swimming.air = 0.02;
    for (let i = 0; i < 600; i++) scene.update(0, 1000 / 60);
    const safe = !scene.aquatic.swimming.submerged && scene.aquatic.swimming.air > 10;
    const forceLatch = scene.aquatic.swimming.surfacing;
    scene.clearControls();
    scene.update(0, 1000 / 60);
    return {
      moved,
      descended,
      released,
      safe,
      forceLatch,
      updated: scene.aquatic.school.updated,
      total: scene.aquatic.school.fish.length,
    };
  });
  expect(result.moved).toBeGreaterThan(50);
  expect(result.descended).toBe(true);
  expect(result.released).toBe(true);
  expect(result.safe).toBe(true);
  expect(result.forceLatch).toBe(true);
  expect(result.updated).toBeLessThan(result.total / 2);
  await expect(page.locator('#dive')).toBeVisible();
  const box = await page.locator('#dive').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(page.locator('#jump')).toHaveAttribute('aria-label', /bơi lên/);
});

test('a real fish follows the lure and the exact hooked individual becomes inventory once', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  const result = await page.evaluate(async () => {
    const {groundAt} = await import('../src/data/world');
    const scene = window.forest;
    scene.game.loop.sleep();
    scene.player.setPosition(850, groundAt(850) - 1).setVelocity(0);
    scene.player.body!.updateFromGameObject();
    for (let i = 0; i < 10; i++) scene.update(0, 1000 / 60);
    scene.interact();
    for (let i = 0; i < 1500 && scene.fishing?.phase !== 'bite'; i++) scene.update(0, 1000 / 60);
    const bot = scene.aquatic.school.fish.find((fish) => fish.mode === 'lure')!;
    const reached = Boolean(bot && scene.aquatic.readyToBite);
    scene.interact();
    const hooked = scene.fishing?.caught;
    scene.state.easyFishing = true;
    scene.controls.keys.add('KeyE');
    for (let i = 0; i < 2500 && scene.fishing; i++) scene.update(0, 1000 / 60);
    scene.controls.clear();
    const caught = scene.state.fishBag[0];
    const hidden = !scene.aquatic.school.visible.includes(bot);
    scene.persist();
    return {
      reached,
      id: bot?.species.id,
      length: bot?.length,
      hooked: hooked?.species.id,
      caught,
      count: scene.state.fishBag.length,
      hidden,
    };
  });
  expect(result.reached).toBe(true);
  expect(result.hooked).toBe(result.id);
  expect(result.caught).toEqual({id: result.id, length: result.length});
  expect(result.count).toBe(1);
  expect(result.hidden).toBe(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.forest));
  expect(await page.evaluate(() => window.forest.state.fishBag.length)).toBe(1);
  expect(errors).toEqual([]);
});
