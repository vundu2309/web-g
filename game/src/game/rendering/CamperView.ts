import type Phaser from 'phaser';
import {camperSprite} from '../../data/sprites/camper.ts';
import {camperPoses} from '../../data/sprites/camperPoses.ts';
import {gear, type Save, type Slot} from '../../camping.ts';
import {PoseMachine, type ActionName, type FishingPhase, type PoseName} from '../../domain/poseMachine.ts';
import {groundAt} from '../../data/world.ts';
import {loadSprite, ART_PIXEL} from './SpriteLoader.ts';
import {ClockSprite} from './ClockSprite.ts';
const DUST_COUNT = 12;
const DUST_LIFE = 0.45;
/** Equipment roles of the camper sprite, taken from the equipped catalog items. */
export function camperSlotColors(state: Save) {
  const colors: Record<string, string> = {};
  const roles: [Slot, string][] = [
    ['hat', 'hat'],
    ['shirt', 'shirt'],
    ['pants', 'pants'],
    ['backpack', 'bag'],
  ];
  for (const [slot, role] of roles) {
    const item = gear.find((entry) => entry.id === state.equipped[slot]);
    if (item) colors[role] = item.color;
  }
  return colors;
}
interface Dust {
  rect: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
/** The player's visual: pose machine, pooled sprite animation and dust. Physics stays in the scene. */
export class CamperView {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly clip: ClockSprite;
  private readonly machine = new PoseMachine();
  private readonly dust: Dust[] = [];
  private texture = '';
  private lastClock = 0;
  private lastFoot = -1;
  private lastLanding = -1;
  constructor(scene: Phaser.Scene, state: Save) {
    this.texture = loadSprite(scene, camperSprite, camperSlotColors(state));
    this.sprite = scene.physics.add
      .sprite(state.x, groundAt(state.x) - 1, this.texture, 'frame-0')
      .setOrigin(0.5, 1)
      .setScale(ART_PIXEL)
      .setDepth(20);
    this.sprite.setCollideWorldBounds(true).setGravityY(2088).setMaxVelocity(300, 900);
    this.applyBody();
    this.clip = new ClockSprite(this.sprite, camperSprite);
    for (let i = 0; i < DUST_COUNT; i++) {
      const rect = scene.add.rectangle(0, 0, ART_PIXEL, ART_PIXEL, 0xddd0a6, 0).setDepth(23).setVisible(false);
      this.dust.push({rect, x: 0, y: 0, vx: 0, vy: 0, life: 0});
    }
  }
  /** 24×32 art at scale 2: a 12×22 art-pixel box, feet on the bottom edge (24×44 world units). */
  private applyBody() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 22).setOffset(6, 10);
  }
  refresh(state: Save) {
    const key = loadSprite(this.sprite.scene, camperSprite, camperSlotColors(state));
    if (key !== this.texture) {
      this.texture = key;
      this.sprite.setTexture(key, 'frame-0').setScale(ART_PIXEL);
      this.applyBody();
    }
  }
  start(action: ActionName, clock: number) {
    this.machine.start(action, clock);
  }
  /** Chooses the pose from physics and fishing, then samples its animation at the game clock. */
  update(clock: number, fishing: FishingPhase) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const name = this.machine.update(clock, {
      vx: body.velocity.x,
      vy: body.velocity.y,
      grounded: body.blocked.down,
      fishing,
    });
    this.clip.draw(this.texture, name, clock - this.machine.since);
    this.spawnDust(name, clock);
    this.moveDust(clock);
    this.lastClock = clock;
  }
  get pose(): PoseName {
    return this.machine.name;
  }
  /** Front hand in world units, for the rod that the renderer draws from it. */
  handPosition(clock: number): {x: number; y: number} {
    const frames = camperPoses[this.machine.name as keyof typeof camperPoses] ?? camperPoses.idle;
    const hand = frames[Math.min(frames.length - 1, this.clip.indexAt(clock - this.machine.since))].hands[1];
    const flip = this.sprite.flipX ? 23 - hand[0] : hand[0];
    return {x: this.sprite.x - 24 + flip * ART_PIXEL, y: this.sprite.y - 64 + hand[1] * ART_PIXEL};
  }
  private spawnDust(name: PoseName, clock: number) {
    const footFrame = this.clip.indexAt(clock - this.machine.since);
    if (name === 'run' && (footFrame === 0 || footFrame === 3) && footFrame !== this.lastFoot) {
      this.lastFoot = footFrame;
      this.puff(-(this.sprite.flipX ? -1 : 1) * 14, 0, 2);
    }
    if (name !== 'run') this.lastFoot = -1;
    if (name === 'land' && this.lastLanding !== this.machine.since) {
      this.lastLanding = this.machine.since;
      this.puff(-10, 0, 3);
      this.puff(10, 0, 3);
    }
  }
  private puff(offsetX: number, offsetY: number, count: number) {
    for (let i = 0; i < count; i++) {
      const slot = this.dust.find((d) => d.life <= 0);
      if (!slot) return;
      slot.x = this.sprite.x + offsetX + i * 4;
      slot.y = this.sprite.y + offsetY - 2;
      slot.vx = (i % 2 ? 1 : -1) * (30 + i * 8);
      slot.vy = -40 - i * 6;
      slot.life = DUST_LIFE;
      slot.rect.setPosition(slot.x, slot.y).setVisible(true).setAlpha(1);
    }
  }
  private moveDust(clock: number) {
    const dt = Math.min(0.1, Math.max(0, clock - this.lastClock));
    for (const d of this.dust) {
      if (d.life <= 0) continue;
      d.life -= dt;
      if (d.life <= 0) {
        d.rect.setVisible(false);
        continue;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 260 * dt;
      d.rect.setPosition(Math.round(d.x / ART_PIXEL) * ART_PIXEL, Math.round(d.y / ART_PIXEL) * ART_PIXEL);
      d.rect.setAlpha(d.life / DUST_LIFE);
    }
  }
}
