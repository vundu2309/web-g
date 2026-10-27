import {test, expect} from '@playwright/test';
async function start(page: any) {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean((window as any).forest));
  await page.locator('#start').click();
  await page.waitForFunction(() => (window as any).forest.player.body.blocked.down);
}
test('starter wardrobe changes the actual sprite and persists after reload', async ({page}) => {
  await start(page);
  const texture = await page.evaluate(() => (window as any).forest.player.texture.key);
  await page.locator('#inventory').click();
  await expect(page.getByRole('heading', {name: 'Kho đồ', exact: true})).toBeVisible();
  expect(await page.locator('[data-gear]').count()).toBe(8);
  await page.locator('[data-inventory-tab="equipment"]').click();
  await page.locator('[data-gear="shirt-pine"]').click();
  await expect(page.locator('[data-gear="shirt-pine"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as any).forest.player.texture.key)).not.toBe(texture);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as any).forest));
  expect(await page.evaluate(() => (window as any).forest.state.equipped.shirt)).toBe('shirt-pine');
});
test('fishing waits, bites, catches into inventory and persists records', async ({page}) => {
  await start(page);
  await page.evaluate(() => {
    const f = (window as any).forest;
    f.player.setPosition(850, 500).setVelocity(0);
    f.player.body.updateFromGameObject();
  });
  await page.waitForFunction(() => {
    const f = (window as any).forest;
    return f.player.body.blocked.down && f.player.y > 600;
  });
  await page.locator('#action').click();
  expect(await page.evaluate(() => (window as any).forest.fishing.phase)).toBe('waiting');
  await page.locator('#action').click();
  expect(await page.evaluate(() => Object.keys((window as any).forest.state.fish).length)).toBe(0);
  await page.waitForFunction(() => (window as any).forest.fishing?.phase === 'bite');
  await expect(page.locator('#action')).toHaveClass(/bite/);
  await page.locator('#action').click();
  expect(await page.evaluate(() => window.forest.fishing!.phase)).toBe('fight');
  await page.evaluate(() => {
    window.forest.state.easyFishing = true;
  });
  await page.keyboard.down('KeyE');
  await page.waitForFunction(() => !window.forest.fishing);
  await page.keyboard.up('KeyE');
  const fish = await page.evaluate(() => (window as any).forest.state.fish);
  expect(Object.values(fish).reduce((n: number, f: any) => n + f.count, 0)).toBe(1);
  await expect(page.locator('#toast')).toContainText('Đã cho vào kho đồ');
  await page.locator('#inventory').click();
  await expect(page.locator('#fish-summary')).toContainText('1 cá');
  expect(await page.locator('.fish-entry.caught').count()).toBe(1);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as any).forest));
  expect(await page.evaluate(() => (window as any).forest.state.fish)).toEqual(fish);
});
test('fishing pauses on menu, expires on missed bite and cancels on movement', async ({page}) => {
  await start(page);
  const result = await page.evaluate(() => {
    const f = (window as any).forest;
    f.game.loop.sleep();
    f.player.setPosition(850, 500);
    f.player.body.updateFromGameObject();
    const step = (n: number) => {
      for (let i = 0; i < n; i++) f.update(0, 1000 / 60);
    };
    step(50);
    f.interact();
    f.fishing.remaining = 0.1;
    f.togglePause();
    step(120);
    const frozen = f.fishing.remaining === 0.1;
    f.togglePause();
    for (let i = 0; i < 900 && f.fishing.phase !== 'bite'; i++) step(1);
    const bite = f.fishing.phase === 'bite';
    step(130);
    const missed = !f.fishing && Object.keys(f.state.fish).length === 0;
    f.interact();
    f.keys.add('KeyD');
    step(1);
    const cancelled = !f.fishing;
    return {frozen, bite, missed, cancelled};
  });
  expect(result).toEqual({frozen: true, bite: true, missed: true, cancelled: true});
});
test('construction preview places, charges exactly once, rejects overlap and survives reload', async ({page}) => {
  await start(page);
  await page.locator('#build').click();
  await expect(page.locator('#build-menu')).toBeVisible();
  await page.locator('[data-build="tent"]').click();
  expect(await page.evaluate(() => (window as any).forest.status)).toBe('play');
  await page.locator('#action').click();
  expect(
    await page.evaluate(() => {
      const f = (window as any).forest;
      return {
        wood: f.state.wood,
        stone: f.state.stone,
        count: f.state.buildings.length,
        kind: f.state.buildings[0]?.kind,
      };
    }),
  ).toEqual({wood: 16, stone: 14, count: 1, kind: 'tent'});
  await page.locator('#build').click();
  await page.locator('[data-build="tent"]').click();
  await page.locator('#action').click();
  await expect(page.locator('#toast')).toContainText('Quá gần');
  expect(await page.evaluate(() => (window as any).forest.state.wood)).toBe(16);
  await page.locator('#cancel-action').click();
  await page.reload();
  await page.waitForFunction(() => Boolean((window as any).forest));
  expect(await page.evaluate(() => (window as any).forest.structures.length)).toBe(1);
});
test('gathering is once per node; wet terrain and missing materials cannot be built on', async ({page}) => {
  await start(page);
  const result = await page.evaluate(() => {
    const f = (window as any).forest;
    f.game.loop.sleep();
    f.player.setPosition(350, 500).setVelocity(0);
    f.player.body.updateFromGameObject();
    for (let i = 0; i < 70; i++) f.update(0, 1000 / 60);
    const stone = f.state.stone;
    f.interact();
    const gathered = f.state.stone === stone + 4;
    f.interact();
    const once = f.state.stone === stone + 4;
    const wet = f.placementError(850).includes('đất khô');
    return {gathered, once, wet, hidden: !f.nodes.get('node-0').visible};
  });
  expect(result).toEqual({gathered: true, once: true, wet: true, hidden: true});
});
for (const viewport of [
  {width: 390, height: 844},
  {width: 844, height: 390},
])
  test(`camping UI fits ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await start(page);
    for (const id of ['left', 'right', 'jump', 'inventory', 'build', 'action', 'pause'])
      await expect(page.locator('#' + id)).toBeInViewport();
    const boxes = await Promise.all(
      ['left', 'right', 'jump', 'inventory', 'build', 'action'].map((id) => page.locator('#' + id).boundingBox()),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!,
          b = boxes[j]!;
        expect(a.x >= b.x + b.width || b.x >= a.x + a.width || a.y >= b.y + b.height || b.y >= a.y + a.height).toBe(
          true,
        );
      }
    await page.locator('#inventory').click();
    await expect(page.locator('#close-inventory')).toBeInViewport();
    await page.locator('#done-inventory').scrollIntoViewIfNeeded();
    await expect(page.locator('#done-inventory')).toBeInViewport();
    await page.keyboard.press('Escape');
    await page.locator('#resume').click();
    await page.locator('#pause').click();
    await page.locator('#pause-settings').click();
    await expect(page.locator('#settings-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => (window as any).forest.status)).toBe('play');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
test('large world has real lakes, no old pickups or detached background, and camera follows', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  const result = await page.evaluate(() => {
    const f = (window as any).forest;
    f.game.loop.sleep();
    f.keys.add('ArrowRight');
    for (let i = 0; i < 1200; i++) f.update(0, 1000 / 60);
    return {
      x: f.player.x,
      camera: f.cameras.main.worldView.x,
      old: !!(f.items || f.performer || f.sky || f.layers),
      land: f.children.list.filter((o: any) => String(o.texture?.key).startsWith('terrain-')).length,
    };
  });
  expect(result.x).toBeGreaterThan(3000);
  expect(result.camera).toBeGreaterThan(2000);
  expect(result.old).toBe(false);
  expect(result.land).toBeGreaterThan(0);
  expect(result.land).toBeLessThanOrEqual(12);
  expect(errors).toEqual([]);
});
