import {test, expect} from '@playwright/test';

test('compact desktop HUD keeps fixed slots, contextual actions and a paused inventory', async ({page}) => {
  await page.setViewportSize({width: 1600, height: 900});
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  await expect(page.locator('#controller')).toBeHidden();
  await expect(page.locator('#inventory-readout')).toBeHidden();
  await expect(page.locator('#inventory')).toHaveAccessibleName('Kho đồ (I)');
  for (const viewport of [
    {width: 1600, height: 900},
    {width: 3840, height: 2160},
  ]) {
    await page.setViewportSize(viewport);
    const bounds = await page.locator('#inventory').boundingBox();
    expect(bounds?.width).toBe(40);
    expect(bounds?.height).toBe(40);
  }
  await page.evaluate(async () => {
    const {waterAt, groundAt} = await import('../src/data/world');
    const scene = window.forest;
    for (let x = 1200; x < 15000; x += 100) {
      scene.player.setPosition(x, groundAt(x) - 1).setVelocity(0);
      if (!waterAt(x) && !scene.nearbyNode() && !scene.activities.nearby(x)) break;
    }
    scene.player.body?.updateFromGameObject();
    scene.refreshHUD();
  });
  await expect(page.locator('#context-action')).toBeHidden();
  await expect(page.locator('#chapter')).toBeHidden({timeout: 6000});
  await page.keyboard.press('i');
  await expect(page.locator('#inventory')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#materials-panel')).toBeVisible();
  await expect(page.locator('#hud-wood')).toHaveText('24');
  expect(await page.evaluate(() => window.forest.status)).toBe('pause');
  const time = await page.evaluate(() => window.forest.state.time);
  await page.locator('[data-inventory-tab="equipment"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#equipment-panel')).toBeVisible();
  await page.locator('[data-gear="hat-knit"]').click();
  await expect(page.locator('[data-gear="hat-knit"]')).toBeFocused();
  await expect(page.locator('#item-detail')).toContainText('Đang mặc');
  await page.locator('[data-inventory-tab="fish"]').click();
  await expect(page.locator('#fish-panel')).toBeVisible();
  await expect(page.locator('#fish-summary')).toContainText('0 cá');
  expect(await page.evaluate(() => window.forest.state.time)).toBe(time);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-menu')).toBeVisible();
  await expect(page.locator('#inventory')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#resume').click();
  await expect(page.locator('#inventory')).toBeFocused();
  await page.locator('#pause').click();
  await page.locator('#pause-settings').click();
  await expect(page.locator('#settings-menu')).toBeVisible();
});
