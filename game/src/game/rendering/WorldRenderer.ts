import {paintSoil} from './soil';
import {palette, colorNumber} from '../../data/palette';
import Phaser from 'phaser';
import {paintFerns} from '../../night-art';
import {groundAt, groundRuns, waterAt, waters, regions, WORLD_WIDTH, WORLD_HEIGHT, SECTION} from '../../data/world';

export function buildWorld(scene: Phaser.Scene) {
  const platforms = scene.physics.add.staticGroup();
  // Collider follows the tile grid: one body per run of equal-height columns.
  for (const run of groundRuns()) {
    const platform = scene.add.rectangle(run.x, run.y, run.width, WORLD_HEIGHT - run.y, 0, 0).setOrigin(0);
    platforms.add(platform);
  }
  // Cache narrow chunks once; Phaser culls their draw calls outside the viewport.
  for (let start = 0; start < WORLD_WIDTH; start += 512) {
    const width = Math.min(512, WORLD_WIDTH - start),
      key = 'land-' + start;
    if (scene.textures.exists(key)) {
      scene.add.image(start, 0, key).setOrigin(0).setDepth(8);
      continue;
    }
    const texture = scene.textures.createCanvas(key, width, WORLD_HEIGHT)!,
      c = texture.context;
    for (let local = 0; local < width; local += SECTION) {
      const x = start + local,
        y = groundAt(x),
        zone = Math.floor(x / 3200);
      paintSoil(c, local, y, WORLD_HEIGHT, x);
      const tx = local + 55 + (Math.sin(x * 0.03) * 0.5 + 0.5) * 100,
        scale = 0.63 + (Math.sin(x * 0.071) * 0.5 + 0.5) * 0.48;
      c.save();
      if (waterAt(x + 128)) c.globalAlpha = 0;
      c.translate(tx, groundAt(start + tx));
      if (zone === 1 || zone === 3) {
        const height = 160 + scale * 65;
        c.fillStyle = palette.legacy076;
        c.fillRect(-4, -height, 8, height);
        for (let branch = 0; branch < 5; branch++) {
          const top = -height + branch * height * 0.14,
            w = 22 + branch * 10;
          c.fillStyle = branch % 2 ? palette.legacy077 : palette.legacy078;
          c.beginPath();
          c.moveTo(0, top - 20);
          c.lineTo(-w, top + 55);
          c.lineTo(w, top + 55);
          c.closePath();
          c.fill();
          c.fillStyle = palette.legacy079;
          c.fillRect(-w + 8, top + 53, w, 2);
        }
      } else {
        c.scale(scale, scale);
        c.fillStyle = palette.legacy080;
        c.fillRect(-6, -174, 12, 174);
        c.fillStyle = palette.legacy081;
        c.fillRect(-4, -132, 2, 125);
        for (let branch = 0; branch < 3; branch++) {
          c.fillStyle = palette.legacy080;
          c.fillRect(branch % 2 ? -23 : 0, -120 - branch * 17, 24, 4);
        }
        const leafColors = [palette.forestShade, palette.forestLeaf, palette.forestLight];
        for (let crown = 0; crown < 3; crown++) {
          const cx = (crown - 1) * 29,
            cy = -168 + (crown % 2) * 24;
          c.fillStyle = leafColors[crown];
          c.beginPath();
          c.moveTo(cx - 34, cy - 20);
          c.lineTo(cx - 20, cy - 34);
          c.lineTo(cx + 19, cy - 32);
          c.lineTo(cx + 36, cy - 13);
          c.lineTo(cx + 33, cy + 20);
          c.lineTo(cx + 12, cy + 29);
          c.lineTo(cx - 30, cy + 22);
          c.closePath();
          c.fill();
          for (let j = 0; j < 24; j++) {
            c.fillStyle = j % 3 ? palette.legacy085 : palette.legacy086;
            c.fillRect(cx - 24 + ((j * 17) % 49), cy - 23 + ((j * 11) % 42), 2 + (j % 3), 1);
          }
        }
        c.fillStyle = palette.legacy087;
        c.fillRect(-10, -4, 23, 4);
      }
      c.restore();
      c.save();
      c.translate(local, y - 20);
      paintFerns(c);
      c.restore();
      // Rounded boulders, moss, mushrooms and clumps of grass are scenery only.
      for (let i = 0; i < 8; i++) {
        const px = local + 7 + ((i * 83 + start) % 242);
        c.fillStyle = palette.legacy088;
        c.fillRect(px, y - 5, 1, 5);
        c.fillRect(px + 2, y - 8, 1, 8);
        if (i % 3 === 0) {
          c.fillStyle = palette.legacy089;
          c.fillRect(px + 12, y - 8, 2, 8);
          c.fillStyle = palette.legacy090;
          c.fillRect(px + 8, y - 10, 11, 3);
        }
      }
      if ((x / SECTION) % 5 === 2) {
        c.fillStyle = palette.legacy091;
        c.beginPath();
        c.ellipse(local + 180, y - 5, 24, 13, 0, Math.PI, Math.PI * 2);
        c.fill();
        c.fillStyle = palette.legacy092;
        c.fillRect(local + 164, y - 16, 25, 3);
      }
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.image(start, 0, key).setOrigin(0).setDepth(8);
  }
  const scenery = scene.add.graphics().setDepth(10);
  // Cascading water and a reflecting pool, behind the walkable ridge.
  const wx = 7350,
    wy = groundAt(wx);
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
  // Lakes belong to the terrain itself. A timber crossing keeps the route traversable.
  for (const lake of waters) {
    const y = groundAt(lake.x),
      x = lake.x,
      w = lake.width;
    scenery.fillStyle(colorNumber(palette.legacy100));
    scenery.fillRoundedRect(x - 12, y - 7, w + 24, 69, 18);
    scenery.fillStyle(colorNumber(palette.legacy101));
    scenery.fillRoundedRect(x, y - 3, w, 52, 14);
    scenery.fillStyle(colorNumber(palette.legacy102), 0.7);
    for (let i = 0; i < 18; i++)
      scenery.fillRect(x + 15 + (i * (w - 30)) / 18, y + 8 + (i % 4) * 11, 12 + (i % 3) * 8, 1);
    scenery.fillStyle(colorNumber(palette.legacy103));
    for (let i = 0; i < 6; i++) scenery.fillEllipse(x + 35 + (i * w) / 7, y + 26 + (i % 2) * 18, 18, 5);
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
    scene.add
      .text(x + 18, y - 50, lake.name + ' · Câu cá [E]', {
        fontFamily: 'Nunito',
        fontSize: '12px',
        fontStyle: 'bold',
        color: palette.legacy108,
        backgroundColor: palette.legacy109,
        padding: {x: 7, y: 5},
      })
      .setDepth(12)
      .setResolution(2);
  }
  const ax = 13950,
    ay = groundAt(ax);
  scenery.fillStyle(colorNumber(palette.legacy110));
  scenery.fillRect(ax, ay - 100, 22, 100);
  scenery.fillRect(ax + 95, ay - 100, 22, 100);
  scenery.fillRect(ax - 6, ay - 115, 130, 22);
  scenery.lineStyle(2, colorNumber(palette.legacy111), 0.6);
  scenery.strokeRect(ax + 5, ay - 90, 12, 60);
  scenery.strokeRect(ax + 100, ay - 90, 12, 60);
  for (const r of regions)
    scene.add
      .text(r.x + 260, groundAt(r.x + 260) - 100, r.name, {
        fontFamily: 'Nunito',
        fontSize: '12px',
        fontStyle: 'bold',
        color: palette.legacy112,
        backgroundColor: palette.legacy113,
        padding: {x: 9, y: 6},
      })
      .setDepth(12)
      .setResolution(2);
  return platforms;
}
