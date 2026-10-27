import {test, expect} from '@playwright/test';

for (const viewport of [
  {width: 1600, height: 900},
  {width: 390, height: 844},
  {width: 844, height: 390},
]) {
  test(`camera follows jumps while mountains and forests stay aligned with the ground at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:5173');
    await page.waitForFunction(() => Boolean(window.forest));
    await page.locator('#start').click();
    await page.waitForFunction(() => window.forest.player.body!.blocked.down);
    const result = await page.evaluate(() => {
      const scene = window.forest;
      scene.game.loop.sleep();
      const view = scene.cameras.main;
      scene.centerCamera();
      const startY = scene.player.y;
      const cameraY = view.scrollY;
      const groundReference = startY;
      const layers = scene.background.layers.filter((layer) => layer.kind !== 'clouds');
      const positions = layers.map((layer) => layer.sprites[0].y);
      const clouds = scene.background.layers.find((layer) => layer.kind === 'clouds')!;
      const cloudTop = clouds.sprites[0].y - view.worldView.y;
      scene.jump();
      let rise = 0;
      let cameraDrift = 0;
      let backdropDrift = 0;
      let skyDrift = 0;
      let groundMismatch = 0;
      for (let frame = 0; frame < 90; frame++) {
        scene.update(0, 1000 / 60);
        rise = Math.max(rise, startY - scene.player.y);
        cameraDrift = Math.max(cameraDrift, Math.abs(view.scrollY - cameraY));
        skyDrift = Math.max(skyDrift, Math.abs(clouds.sprites[0].y - view.worldView.y - cloudTop));
        layers.forEach((layer, index) => {
          const image = layer.sprites[0];
          const landscapeScreenY = image.y - view.scrollY * image.scrollFactorY;
          const groundScreenY = groundReference - view.scrollY;
          groundMismatch = Math.max(
            groundMismatch,
            Math.abs(landscapeScreenY - groundScreenY - (positions[index] - groundReference)),
          );
          backdropDrift = Math.max(backdropDrift, Math.abs(layer.sprites[0].y - positions[index]));
        });
      }
      scene.game.loop.wake();
      return {rise, cameraDrift, backdropDrift, skyDrift, groundMismatch, landed: scene.player.body!.blocked.down};
    });
    expect(result.rise).toBeGreaterThan(50);
    expect(result.cameraDrift).toBeGreaterThan(50);
    expect(result.skyDrift).toBeLessThan(0.001);
    expect(result.groundMismatch).toBeLessThan(0.001);
    expect(result.backdropDrift).toBe(0);
    expect(result.landed).toBe(true);
  });
}

test('GPU light sampling follows world height: daylight above ground, darkness underground, night preserved', async ({
  page,
}) => {
  await page.setViewportSize({width: 1600, height: 900});
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => Boolean(window.forest));
  await page.locator('#start').click();
  const sample = await page.evaluate(async () => {
    const {groundAt} = await import('../src/data/world');
    const {palette, colorNumber} = await import('../src/data/palette');
    const scene = window.forest;
    scene.player.setPosition(1900, groundAt(1900) - 1).setVelocity(0);
    scene.player.body!.updateFromGameObject();
    scene.state.time = 160;
    scene.clock += 1;
    scene.centerCamera();
    scene.status = 'pause';
    const camera = scene.cameras.main;
    const view = camera.worldView;
    const x = view.centerX;
    const ys = [view.y + view.height * 0.2, view.y + view.height * 0.9];
    const markers = ys.map((y) => scene.add.rectangle(x, y, 24, 24, colorNumber(palette.lightSkyDay)).setDepth(18));
    scene.centerCamera();
    const read = () =>
      new Promise<number[][]>((resolve) => {
        scene.game.events.once('postrender', () => {
          const canvas = scene.game.canvas;
          const context = document.createElement('canvas').getContext('2d')!;
          context.canvas.width = canvas.width;
          context.canvas.height = canvas.height;
          context.drawImage(canvas, 0, 0);
          const px = Math.floor(((x - view.x) / view.width) * canvas.width);
          resolve(
            ys.map((y) => {
              const py = Math.floor(((y - view.y) / view.height) * canvas.height);
              return Array.from(context.getImageData(px, py, 1, 1).data).slice(0, 3);
            }),
          );
        });
      });
    const day = await read();
    scene.state.time = 440;
    scene.clock += 1;
    scene.centerCamera();
    const night = await read();
    for (const marker of markers) marker.destroy();
    return {day, night};
  });
  const sum = (rgb: number[]) => rgb.reduce((total, value) => total + value, 0);
  expect(sum(sample.day[0])).toBeGreaterThan(700);
  expect(sum(sample.day[1])).toBeLessThan(sum(sample.day[0]) * 0.6);
  expect(sum(sample.night[0])).toBeLessThan(sum(sample.day[0]) * 0.6);
});
