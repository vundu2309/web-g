import Phaser from 'phaser';
import {fishFrame} from '../../domain/aquatic/fishArt.ts';
import type {FishBot} from '../systems/FishSchoolSystem.ts';

/** Chỉ dựng sprite cá gần màn hình; texture dùng chung theo loài, vẫy đuôi theo đồng hồ game. */
export class FishRenderer {
  private readonly sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  draw(fish: readonly FishBot[], clock: number) {
    const live = new Set(fish.map((bot) => bot.id));
    for (const [id, sprite] of this.sprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.sprites.delete(id);
    }
    for (const bot of fish) {
      const key = 'aquatic-' + bot.species.id;
      if (!this.scene.textures.exists(key)) {
        const texture = this.scene.textures.createCanvas(key, 28 * 4, 18)!;
        for (let i = 0; i < 4; i++) {
          const art = fishFrame(bot.species, i);
          const image = texture.context.createImageData(28, 18);
          image.data.set(art.data);
          texture.context.putImageData(image, 28 * i, 0);
          texture.add(i, 0, i * 28, 0, 28, 18);
        }
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      let sprite = this.sprites.get(bot.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(bot.x, bot.y, key, 0).setDepth(14);
        this.sprites.set(bot.id, sprite);
      }
      const size = Math.round(Math.max(0.5, Math.min(1.25, 0.4 + bot.length / 140)) * 4) / 4;
      sprite
        .setPosition(Math.round(bot.x / 2) * 2, Math.round(bot.y / 2) * 2)
        .setFrame(Math.floor(clock * (bot.mode === 'flee' ? 14 : 7) + bot.phase) % 4)
        .setFlipX(bot.direction < 0)
        .setScale(size * 2);
    }
  }
  dispose() {
    for (const sprite of this.sprites.values()) sprite.destroy();
    this.sprites.clear();
  }
}
