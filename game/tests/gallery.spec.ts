import {test, expect} from '@playwright/test';
import type {SpriteGalleryScene} from '../src/game/rendering/SpriteGalleryScene';
declare global {
  interface Window {
    spriteGallery: SpriteGalleryScene;
  }
}
test('prop gallery animates registered pixel sprites, freezes and flips; the rig page is the default', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({width: 1280, height: 1040});
  await page.goto('http://127.0.0.1:5173/?gallery');
  await expect(page.getByRole('heading', {name: 'Một người bạn đường.'})).toBeVisible();
  await expect(page.locator('#review-mode')).toHaveValue('rig');
  await expect(page.locator('#sprite-review-stage')).toBeHidden();
  await page.locator('#review-mode').selectOption('props');
  await page.waitForFunction(() => Boolean(window.spriteGallery));
  const actual = await page.evaluate(() => {
    const scene = window.spriteGallery;
    return {
      nearest: scene.textures
        .getTextureKeys()
        .filter((key) => key.startsWith('pixel-'))
        .every((key) => scene.textures.get(key).source[0].scaleMode === 1),
      animations: scene.textures
        .getTextureKeys()
        .filter((key) => key.startsWith('pixel-'))
        .reduce((sum, key) => sum + scene.anims.getAnimsFromTexture(key).length, 0),
      cells: scene.cells.length,
    };
  });
  expect(actual.nearest).toBe(true);
  expect(actual.animations).toBeGreaterThan(0);
  expect(actual.cells).toBe(11);
  await page.locator('#review-pause').click();
  const frozen = await page.evaluate(() => window.spriteGallery.clock);
  await page.locator('#sprite-review-stage').screenshot({path: 'test-results/sprite-contact-sheet.png'});
  await page.locator('#review-flip').click();
  expect(await page.evaluate(() => window.spriteGallery.clock)).toBe(frozen);
  await page.locator('#review-pause').click();
  await page.waitForFunction((old) => window.spriteGallery.clock > old, frozen);
  expect(errors).toEqual([]);
});

test('gallery is readable on a portrait phone and is absent from the production route', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('http://127.0.0.1:5173/?gallery');
  await page.locator('#review-mode').selectOption('props');
  await page.waitForFunction(() => Boolean(window.spriteGallery));
  expect(await page.evaluate(() => window.spriteGallery.cells.length)).toBe(11);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.mouse.wheel(0, 2400);
  await page.waitForFunction(() => window.scrollY > 0);
  await page.goto('http://127.0.0.1:4173/?gallery');
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('.sprite-review')).toHaveCount(0);
});

test('props gallery shows every structure and resource, and the stage never collapses to zero width', async ({
  page,
}) => {
  for (const width of [800, 390]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('http://127.0.0.1:5173/?gallery');
    await page.locator('#review-mode').selectOption('props');
    await page.waitForFunction(() => Boolean(window.spriteGallery));
    const canvasWidth = await page.evaluate(
      () => document.querySelector('#sprite-review-stage canvas')!.getBoundingClientRect().width,
    );
    expect(canvasWidth).toBeGreaterThan(200);
    expect(await page.evaluate(() => window.spriteGallery.cells.length)).toBe(11);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
