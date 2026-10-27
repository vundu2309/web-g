import {test, expect} from '@playwright/test';
for (const viewport of [
  {width: 390, height: 844},
  {width: 844, height: 390},
  {width: 640, height: 360},
])
  test(`pixel HUD and Vietnamese font fit ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    const externalFonts: string[] = [];
    page.on('request', (r) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) externalFonts.push(r.url());
    });
    await page.goto('http://127.0.0.1:5173');
    await page.waitForFunction(() => Boolean((window as any).forest));
    await page.locator('#start').click();
    expect(await page.evaluate(() => document.fonts.check('800 14px Nunito', 'Gỗ Đá câu cá ế ệ'))).toBe(true);
    expect(await page.locator('#inventory').evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Nunito');
    for (const id of ['pause', 'camp-tools', 'left', 'right', 'jump'])
      await expect(page.locator('#' + id)).toBeInViewport();
    expect((await page.locator('#inventory').boundingBox())?.width).toBe(44);
    expect((await page.locator('#left').boundingBox())?.width).toBe(56);
    expect((await page.locator('#jump').boundingBox())?.height).toBe(56);
    const a = (await page.locator('#camp-tools').boundingBox())!,
      b = (await page.locator('#chapter').boundingBox())!,
      c = (await page.locator('#game-actions').boundingBox())!;
    for (const [x, y] of [
      [a, b],
      [a, c],
      [b, c],
    ])
      expect(x.x >= y.x + y.width || y.x >= x.x + x.width || x.y >= y.y + y.height || y.y >= x.y + x.height).toBe(true);
    await expect(page.locator('#hud-wood')).toHaveText('24');
    await expect(page.locator('#hud-stone')).toHaveText('16');
    const portrait = await page.locator('#hud-avatar').getAttribute('src');
    await page.locator('#inventory').click();
    await expect(page.locator('#materials-panel')).toBeVisible();
    await page.locator('[data-inventory-tab="equipment"]').click();
    await page.locator('[data-gear="hat-knit"]').click();
    expect(await page.locator('#hud-avatar').getAttribute('src')).not.toBe(portrait);
    expect(
      await page.locator('#inventory-menu').evaluate((el) => ({
        radius: getComputedStyle(el).borderRadius,
        font: getComputedStyle(el).fontFamily,
      })),
    ).toEqual({radius: '0px', font: 'Nunito, system-ui, sans-serif'});
    expect(externalFonts).toEqual([]);
  });
