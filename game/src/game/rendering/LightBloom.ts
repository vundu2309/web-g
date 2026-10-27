import Phaser from 'phaser';
import type {SourceField} from '../../domain/lighting/sources.ts';
import {TILE} from '../../domain/tilemap/types.ts';
import {EFFECTS_DEPTH} from '../../domain/lighting/layers.ts';
import type {Quality} from './resolution.ts';

const GLOW_KEY = 'light-glow';
const GLOW_SIZE = 64;
const POOL_HIGH = 24;
const POOL_LOW = 8;
/** Nhịp nhấp nháy của lửa: biên độ ±4% (chỉ ở chế độ Đẹp, chạy theo clock nên dừng khi pause). */
const FLICKER = 0.04;
const FLICKER_SPEED = 9;
/** Độ mờ tối đa của quầng trước khi nhân cường độ nguồn và trọng số giờ (ban đêm mạnh, ban ngày yếu). */
const BLOOM_ALPHA = 0.5;
/** Quầng là texture tròn tạo một lần; các sprite dùng lại (pool), không tạo mới trong khung hình. */
export class LightBloom {
  private readonly pool: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists(GLOW_KEY)) paintGlow(scene);
    for (let i = 0; i < POOL_HIGH; i++) {
      const image = scene.add
        .image(0, 0, GLOW_KEY)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(EFFECTS_DEPTH + 1)
        .setVisible(false);
      this.pool.push(image);
    }
  }

  /** Đặt quầng cho các nguồn trong khung nhìn (đệm 200 đơn vị); strength là cường độ theo giờ. */
  update(
    sources: readonly SourceField[],
    view: Phaser.Geom.Rectangle,
    strength: number,
    clock: number,
    quality: Quality,
  ) {
    const limit = quality === 'high' ? POOL_HIGH : POOL_LOW;
    let used = 0;
    for (let i = 0; i < sources.length && used < limit; i++) {
      const field = sources[i];
      const spec = field.spec;
      const cx = (field.c0 + field.spec.reach + 0.5) * TILE;
      const cy = (field.r0 + field.spec.reach + 0.5) * TILE;
      if (cx < view.x - 200 || cx > view.right + 200 || cy < view.y - 200 || cy > view.bottom + 200) continue;
      const flickers = quality === 'high' && field.kind === 'fire';
      const flicker = flickers ? 1 + FLICKER * Math.sin(clock * FLICKER_SPEED + i) : 1;
      const radius = spec.reach * 16;
      const alpha = Math.min(1, strength * spec.intensity * BLOOM_ALPHA * flicker);
      const image = this.pool[used];
      image
        .setPosition(cx, cy)
        .setDisplaySize(radius * 2, radius * 2)
        .setTint(tintOf(spec.rgb))
        .setAlpha(alpha)
        .setVisible(alpha > 0.002);
      used++;
    }
    for (let i = used; i < this.pool.length; i++) this.pool[i].setVisible(false);
  }
}

function tintOf(rgb: readonly [number, number, number]) {
  return Phaser.Display.Color.GetColor(Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255));
}

function paintGlow(scene: Phaser.Scene) {
  const texture = scene.textures.createCanvas(GLOW_KEY, GLOW_SIZE, GLOW_SIZE)!;
  const ctx = texture.context;
  const half = GLOW_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
