import type Phaser from 'phaser';
import type {Building, BuildingKind} from '../../camping';
import {buildingGlows, buildingSprites} from '../../data/sprites/buildings';
import {groundAt} from '../../data/world';
import {EFFECTS_DEPTH} from '../../domain/lighting/layers.ts';
import {nightAmount} from '../../domain/dayTime.ts';
import {ART_PIXEL, loadSprite} from './SpriteLoader';
import {ClockSprite} from './ClockSprite';

/** Animation of the body (lớp thế giới) while standing in the camp; chests follow the player's distance instead. */
const BODY_LOOPS: Partial<Record<BuildingKind, string>> = {tent: 'flutter'};
/** Animation of the glow layer (lớp hiệu ứng); the tent door has one frame and fades in at night. */
const GLOW_LOOPS: Partial<Record<BuildingKind, string>> = {fire: 'burn', stove: 'glow', lantern: 'glow', tent: 'glow'};
const CHEST_OPEN_RANGE = 90;
/** Thân công trình ở lớp thế giới (được chiếu sáng); phần phát sáng ở lớp hiệu ứng (không chiếu sáng). */
const BODY_DEPTH = 16;

/** Một công trình trên màn hình: thân (lớp thế giới) và lớp phát sáng (lớp hiệu ứng) nếu có. */
export interface Structure {
  kind: BuildingKind;
  sprite: Phaser.GameObjects.Sprite;
  clip: ClockSprite | null;
  animation: string;
  since: number;
  glow: Phaser.GameObjects.Sprite | null;
  glowClip: ClockSprite | null;
}

/** Thân và lớp phát sáng cùng vị trí, gốc đáy và tỉ lệ; lớp phát sáng nằm ở EFFECTS_DEPTH (không bị chiếu sáng). */
export function createStructure(scene: Phaser.Scene, b: Building): Structure {
  const def = buildingSprites[b.kind];
  const y = groundAt(b.x) + 1;
  const sprite = scene.add
    .sprite(b.x, y, loadSprite(scene, def), 'frame-0')
    .setOrigin(0.5, 1)
    .setScale(ART_PIXEL)
    .setDepth(BODY_DEPTH);
  const glowDef = buildingGlows[b.kind];
  const glow = glowDef
    ? scene.add
        .sprite(b.x, y, loadSprite(scene, glowDef), 'frame-0')
        .setOrigin(0.5, 1)
        .setScale(ART_PIXEL)
        .setDepth(EFFECTS_DEPTH)
    : null;
  const animated = b.kind === 'chest' || b.kind in BODY_LOOPS;
  return {
    kind: b.kind,
    sprite,
    clip: animated ? new ClockSprite(sprite, def.animations) : null,
    animation: b.kind === 'chest' ? 'close' : (BODY_LOOPS[b.kind] ?? ''),
    since: 0,
    glow,
    glowClip: glowDef && glow ? new ClockSprite(glow, glowDef.animations) : null,
  };
}

/** Cập nhật hoạt hình thân (rương theo khoảng cách người chơi) và lớp phát sáng (cửa lều theo đêm). */
export function drawStructure(s: Structure, building: Building, playerX: number, clock: number, time: number) {
  if (s.clip) {
    if (s.kind === 'chest') {
      const animation = Math.abs(building.x - playerX) < CHEST_OPEN_RANGE ? 'open' : 'close';
      if (animation !== s.animation) {
        s.animation = animation;
        s.since = clock;
      }
    }
    s.clip.draw(s.sprite.texture.key, s.animation, clock - s.since);
  }
  if (s.glow && s.glowClip) {
    s.glowClip.draw(s.glow.texture.key, GLOW_LOOPS[s.kind] ?? '', clock);
    // Cửa lều chỉ sáng khi đêm xuống: theo nightAmount, ban ngày gần như ẩn.
    if (s.kind === 'tent') s.glow.setAlpha(nightAmount(time));
  }
}
