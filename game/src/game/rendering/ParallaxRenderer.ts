import Phaser from 'phaser';
import {palette} from '../../data/palette';
import {regionColor, type BackgroundLayer} from '../../data/parallax';
import {MAX_ART_HEIGHT, type Quality} from './resolution';
/** Texture height in art pixels: the largest view, so the vertical tile never repeats on screen. */
const LAYER_HEIGHT = MAX_ART_HEIGHT;
/** Each screen-sized tile reuses a small canvas texture; scrolling only changes UV coordinates. */
export class ParallaxRenderer {
  readonly layers: {kind: BackgroundLayer; factor: number; sprite: Phaser.GameObjects.TileSprite}[] = [];
  private readonly scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (const [index, kind] of (['clouds', 'far', 'near', 'forest'] as const).entries()) {
      const key = 'parallax-' + kind;
      if (!scene.textures.exists(key)) {
        const texture = scene.textures.createCanvas(key, 256, LAYER_HEIGHT)!;
        this.paint(texture.context, kind);
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      const factor = [0.04, 0.14, 0.3, 0.55][index];
      const sprite = scene.add
        .tileSprite(0, 0, 1100, LAYER_HEIGHT * 2, key)
        .setOrigin(0)
        .setDepth(-7 + index)
        .setScrollFactor(factor);
      sprite.setTileScale(2);
      this.layers.push({kind, factor, sprite});
    }
  }
  private paint(c: CanvasRenderingContext2D, kind: BackgroundLayer) {
    c.fillStyle = palette.cream;
    if (kind === 'clouds') {
      for (let i = 0; i < 4; i++) {
        const x = i * 66;
        const y = 22 + (i % 3) * 11;
        c.fillRect(x, y, 42, 5);
        c.fillRect(x + 9, y - 4, 24, 4);
        c.fillRect(x + 17, y - 7, 10, 3);
      }
      return;
    }
    if (kind === 'forest') {
      for (let i = 0; i < 12; i++) {
        const x = i * 23;
        const height = 46 + ((i * 13) % 40);
        c.fillRect(x + 6, 165 - height, 3, height);
        for (let branch = 0; branch < 4; branch++) {
          const width = 9 + branch * 6;
          c.fillRect(x + 7 - Math.floor(width / 2), 165 - height + branch * 12, width, 11);
        }
      }
      return;
    }
    const base = kind === 'far' ? 160 : 180;
    const height = kind === 'far' ? 90 : 68;
    for (let i = -1; i < 5; i++) {
      const x = i * 70;
      c.beginPath();
      c.moveTo(x - 40, base);
      c.lineTo(x + 16, base - height - ((i + 2) % 3) * 12);
      c.lineTo(x + 70, base);
      c.closePath();
      c.fill();
      c.fillRect(x - 40, base, 110, LAYER_HEIGHT - base);
    }
  }
  draw(x: number, clock: number, quality: Quality) {
    const camera = this.scene.cameras.main;
    const view = camera.worldView;
    for (const layer of this.layers) {
      const sprite = layer.sprite;
      const visible = quality === 'high' || layer.kind === 'far' || layer.kind === 'forest';
      sprite.setVisible(visible);
      if (!visible) continue;
      sprite.setPosition(view.x - camera.scrollX * (1 - layer.factor), view.y - camera.scrollY * (1 - layer.factor));
      sprite.setSize(Math.ceil(view.width) + 2, Math.ceil(view.height) + 2);
      sprite.tilePositionX = view.x * layer.factor + (layer.kind === 'clouds' ? clock * 1.5 : 0);
      sprite.tilePositionY = 0;
      sprite.setTint(regionColor(x, layer.kind));
      sprite.setAlpha(layer.kind === 'clouds' ? 0.42 : layer.kind === 'forest' ? 0.48 : 0.65);
    }
  }
}
