import {test, expect} from '@playwright/test';
test('production app reloads offline from its own cache', async ({page, context}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(() => Boolean(document.querySelector('canvas')));
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const manifest = await page.evaluate(
    async () => await (await fetch(document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href)).json(),
  );
  expect(manifest.display).toBe('standalone');
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => Boolean(document.querySelector('canvas')));
  expect(await page.evaluate(() => document.fonts.check('800 14px Nunito', 'Gỗ Đá câu cá'))).toBe(true);
  await page.locator('#start').click();
  await expect(page.locator('#welcome')).toBeHidden();
  expect(errors).toEqual([]);
});
