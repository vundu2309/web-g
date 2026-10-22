import {palette, colorNumber} from '../../data/palette';
import Phaser from 'phaser';
import {paintNightSky, paintStars} from '../../night-art';
import {nightAmount, periodAt} from '../../domain/dayTime';
import type {Save} from '../../domain/saveTypes';
import {groundAt, WORLD_WIDTH, WORLD_HEIGHT} from '../../data/world';
import type {Quality} from './resolution';
/** Light sources farther than this beyond the view edge are skipped; the glow radius is at most 65 units. */
const LIGHT_REACH = 80;
/** Reuses cached textures and graphics. No textures, game objects or arrays allocated during draw. */
export class DayNightRenderer {
  private readonly sky: Phaser.GameObjects.Image;
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly lights: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    for (const key of ['camp-sky', 'camp-stars']) {
      if (scene.textures.exists(key)) continue;
      const texture = scene.textures.createCanvas(key, 512, 900)!;
      if (key === 'camp-sky') paintNightSky(texture.context);
      else paintStars(texture.context);
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.sky = scene.add
      .image(0, 0, 'camp-sky')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-10)
      .setScrollFactor(0);
    this.stars = scene.add
      .tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'camp-stars')
      .setOrigin(0)
      .setDepth(-9)
      .setScrollFactor(0);
    this.veil = scene.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, colorNumber(palette.nightTint))
      .setOrigin(0)
      .setDepth(21)
      .setAlpha(0)
      .setScrollFactor(0);
    this.lights = scene.add.graphics().setDepth(23);
  }
  private fitScreen() {
    const camera = this.sky.scene.cameras.main;
    const view = camera.worldView;
    const x = view.x - camera.scrollX;
    const y = view.y - camera.scrollY;
    this.sky.setPosition(x, y).setDisplaySize(view.width + 2, view.height + 2);
    this.stars.setPosition(x, y).setSize(view.width + 2, view.height + 2);
    this.veil.setPosition(x, y).setSize(view.width + 2, view.height + 2);
  }
  draw(state: Save, clock: number, quality: Quality) {
    this.fitScreen();
    const amount = nightAmount(state.time);
    const dusk = periodAt(state.time) === 'dusk';
    this.sky.setTint(dusk ? colorNumber(palette.sunsetTint) : colorNumber(palette.legacy141));
    this.veil
      .setFillStyle(dusk ? colorNumber(palette.duskTint) : colorNumber(palette.nightTint))
      .setAlpha(amount * (dusk ? 0.24 : 0.55));
    this.stars.setAlpha(quality === 'high' ? amount * 0.8 : 0);
    this.lights.clear();
    if (amount <= 0) return;
    const view = this.sky.scene.cameras.main.worldView;
    for (const building of state.buildings) {
      if (building.x < view.x - LIGHT_REACH || building.x > view.right + LIGHT_REACH) continue;
      const kind = building.kind;
      if (kind !== 'fire' && kind !== 'stove' && kind !== 'lantern' && kind !== 'tent') continue;
      const y = groundAt(building.x) - (kind === 'lantern' ? 43 : 22);
      const radius = kind === 'tent' ? 27 : 65;
      const flicker = quality === 'high' ? Math.sin(clock * 4 + building.x) * 3 : 0;
      this.lights.fillStyle(colorNumber(palette.legacy143), amount * 0.09);
      this.lights.fillCircle(building.x, y, radius + flicker);
      this.lights.fillStyle(colorNumber(palette.legacy144), amount * 0.13);
      this.lights.fillCircle(building.x, y, radius * 0.55);
      if (kind === 'tent') {
        this.lights.fillStyle(colorNumber(palette.legacy145), amount * 0.38);
        this.lights.fillTriangle(building.x - 22, y + 18, building.x, y - 19, building.x + 20, y + 18);
      }
    }
  }
}
