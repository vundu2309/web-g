import type Phaser from 'phaser';
import {palette, colorNumber} from '../../data/palette.ts';
import {groundAt, groundRuns, waters, regions, WORLD_HEIGHT, WATERFALL_X, RUINS_X} from '../../data/world.ts';

/** Dựng nền thế giới; nhãn chữ (vùng, hồ) được ghi vào `labels` để nhãn có thể mờ khi câu cá. */
export function buildWorld(scene: Phaser.Scene, labels: Phaser.GameObjects.Text[] = []) {
  const platforms = scene.physics.add.staticGroup();
  // Collider follows the tile grid: one body per run of equal-height columns.
  for (const run of groundRuns()) {
    const platform = scene.add.rectangle(run.x, run.y, run.width, WORLD_HEIGHT - run.y, 0, 0).setOrigin(0);
    platforms.add(platform);
  }
  const scenery = scene.add.graphics().setDepth(10);
  paintWaterfall(scenery, WATERFALL_X);
  // Water itself is pixel art in the terrain chunks; the timber crossing keeps the route traversable.
  for (const lake of waters.filter((water) => water.habitat !== 'sea'))
    paintLakeFixtures(scene, scenery, lake.name, lake.x, lake.width, labels);
  paintRuins(scene, scenery, RUINS_X, labels);
  return platforms;
}

function paintWaterfall(scenery: Phaser.GameObjects.Graphics, wx: number) {
  const wy = groundAt(wx);
  scenery.fillStyle(colorNumber(palette.legacy093));
  scenery.fillPoints(
    [
      {x: wx - 60, y: wy},
      {x: wx - 53, y: wy - 155},
      {x: wx - 30, y: wy - 218},
      {x: wx + 10, y: wy - 235},
      {x: wx + 76, y: wy - 223},
      {x: wx + 100, y: wy - 140},
      {x: wx + 112, y: wy},
    ],
    true,
  );
  scenery.lineStyle(2, colorNumber(palette.legacy094), 0.5);
  for (let i = 0; i < 6; i++) {
    const rx = wx - 45 + i * 26;
    scenery.lineBetween(rx, wy - 30, rx + 7, wy - 160 - (i % 2) * 35);
  }
  scenery.fillStyle(colorNumber(palette.legacy095));
  scenery.fillRect(wx - 35, wy - 226, 110, 6);
  scenery.fillStyle(colorNumber(palette.legacy096), 0.55);
  scenery.fillEllipse(wx + 23, wy - 219, 52, 8);
  scenery.fillStyle(colorNumber(palette.legacy097), 0.38);
  scenery.fillRect(wx, wy - 210, 46, 205);
  scenery.fillStyle(colorNumber(palette.legacy098), 0.55);
  for (let i = 0; i < 8; i++) scenery.fillRect(wx + 4 + i * 5, wy - 200 + (i % 3) * 8, 2, 180);
  scenery.fillStyle(colorNumber(palette.legacy099), 0.45);
  scenery.fillEllipse(wx + 23, wy - 5, 150, 15);
}

/** Lối gỗ, cọc bờ và nhãn của hồ; mặt nước và lá sen nằm trong chunk nước và chunk trang trí. */
function paintLakeFixtures(
  scene: Phaser.Scene,
  scenery: Phaser.GameObjects.Graphics,
  name: string,
  x: number,
  w: number,
  labels: Phaser.GameObjects.Text[],
) {
  const y = groundAt(x);
  scenery.fillStyle(colorNumber(palette.legacy104));
  scenery.fillRect(x - 14, y - 2, w + 28, 5);
  scenery.fillStyle(colorNumber(palette.legacy105));
  for (let i = 0; i < w; i += 14) scenery.fillRect(x + i, y - 4, 11, 4);
  for (const bank of [x - 18, x + w + 12]) {
    scenery.fillStyle(colorNumber(palette.legacy106));
    for (let i = 0; i < 6; i++) {
      scenery.fillRect(bank + i * 3 - 7, y - 22 - (i % 3) * 5, 1, 25 + (i % 3) * 5);
      scenery.fillStyle(colorNumber(palette.legacy107));
      scenery.fillRect(bank + i * 3 - 7, y - 26 - (i % 3) * 5, 2, 5);
      scenery.fillStyle(colorNumber(palette.legacy106));
    }
  }
  labels.push(
    scene.add
      .text(x + 18, y - 50, name + ' · Câu cá [E]', {
        fontFamily: 'Nunito',
        fontSize: '12px',
        fontStyle: 'bold',
        color: palette.legacy108,
        backgroundColor: palette.legacy109,
        padding: {x: 7, y: 5},
      })
      .setDepth(22)
      .setResolution(2),
  );
}

function paintRuins(
  scene: Phaser.Scene,
  scenery: Phaser.GameObjects.Graphics,
  ax: number,
  labels: Phaser.GameObjects.Text[],
) {
  const ay = groundAt(ax);
  scenery.fillStyle(colorNumber(palette.legacy110));
  scenery.fillRect(ax, ay - 100, 22, 100);
  scenery.fillRect(ax + 95, ay - 100, 22, 100);
  scenery.fillRect(ax - 6, ay - 115, 130, 22);
  scenery.lineStyle(2, colorNumber(palette.legacy111), 0.6);
  scenery.strokeRect(ax + 5, ay - 90, 12, 60);
  scenery.strokeRect(ax + 100, ay - 90, 12, 60);
  for (const r of regions)
    labels.push(
      scene.add
        .text(r.x + 260, groundAt(r.x + 260) - 100, r.name, {
          fontFamily: 'Nunito',
          fontSize: '12px',
          fontStyle: 'bold',
          color: palette.legacy112,
          backgroundColor: palette.legacy113,
          padding: {x: 9, y: 6},
        })
        .setDepth(22)
        .setResolution(2),
    );
}
