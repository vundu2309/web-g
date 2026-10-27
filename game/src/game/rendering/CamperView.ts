import {terrainGrid} from '../../data/world.ts';
import {TILE} from '../../domain/tilemap/types.ts';
import type Phaser from 'phaser';
import {gear, type Save} from '../../camping.ts';
import {PoseMachine, type ActionName, type FishingPhase, type PoseName} from '../../domain/poseMachine.ts';
import {groundAt} from '../../data/world.ts';
import {buildCamperFrames, type CamperRigSet} from '../../domain/camperRig/build.ts';
import {outfitOf} from '../../domain/camperRig/wear.ts';
import {bodyBox} from '../../domain/camperRig/body.ts';
import {type Frame, type Point, type RigOutfit} from '../../domain/camperRig/types.ts';
import {
  ORIGIN_X,
  ORIGIN_Y,
  SHEET_ANIMATIONS,
  cellCenter,
  cellCorner,
  type Placement,
} from '../../domain/camperRig/sheet.ts';
import {ART_PIXEL} from './SpriteLoader.ts';
import {loadCamperSheet} from './CamperSheet.ts';
import {ClockSprite} from './ClockSprite.ts';
import {figureBox} from '../../domain/camperRig/figure.ts';
import type {LabelBox} from '../../domain/fishingLabels.ts';

const DUST_COUNT = 12;
const DUST_LIFE = 0.45;

/** Trang bị đang mặc của save thành bộ xương (hình dáng và màu). */
function outfitFor(state: Save): RigOutfit {
  return outfitOf(state.equipped, gear);
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
  private rig: CamperRigSet;
  private lastClock = 0;
  private lastFoot = -1;
  private lastLanding = -1;

  constructor(scene: Phaser.Scene, state: Save) {
    const outfit = outfitFor(state);
    this.rig = buildCamperFrames(outfit);
    this.texture = loadCamperSheet(scene, outfit);
    const waterTop = terrainGrid.waterSurfaceRow(terrainGrid.columnAt(state.x)) * TILE;
    const spawnY = waterTop >= 0 && groundAt(state.x) > waterTop ? waterTop + 46 : groundAt(state.x) - 1;
    this.sprite = scene.physics.add
      .sprite(state.x, spawnY, this.texture, 'frame-0')
      .setOrigin(ORIGIN_X, ORIGIN_Y)
      .setScale(ART_PIXEL)
      .setDepth(20);
    this.sprite.setCollideWorldBounds(true).setGravityY(2088).setMaxVelocity(300, 900);
    this.applyBody();
    this.clip = new ClockSprite(this.sprite, SHEET_ANIMATIONS);
    for (let i = 0; i < DUST_COUNT; i++) {
      const rect = scene.add.rectangle(0, 0, ART_PIXEL, ART_PIXEL, 0xddd0a6, 0).setDepth(23).setVisible(false);
      this.dust.push({rect, x: 0, y: 0, vx: 0, vy: 0, life: 0});
    }
  }

  /** Hộp va chạm theo bộ xương (đáy đúng hàng chân), đơn vị pixel nghệ thuật và nhân theo ART_PIXEL. */
  private applyBody() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const box = bodyBox();
    body.setSize(box.width, box.height).setOffset(box.x, box.y);
  }

  refresh(state: Save) {
    const outfit = outfitFor(state);
    const key = loadCamperSheet(this.sprite.scene, outfit);
    if (key !== this.texture) {
      this.texture = key;
      this.rig = buildCamperFrames(outfit);
      this.sprite.setTexture(key, 'frame-0').setScale(ART_PIXEL);
      this.applyBody();
    }
  }

  start(action: ActionName, clock: number) {
    this.machine.start(action, clock);
  }

  /** Chooses the pose from physics and fishing, then samples its animation at the game clock. */
  update(clock: number, fishing: FishingPhase, swimming = false, diving = false) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const name = this.machine.update(clock, {
      swimming,
      diving,
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

  /** Frame of the rig shown at this clock: the sheet frame the pose animation is on. */
  frameAt(clock: number): Frame {
    const animation = SHEET_ANIMATIONS[this.machine.name];
    const step = this.clip.indexAt(clock - this.machine.since);
    return this.rig.all[animation.frames[step]!]!;
  }

  /** Đỉnh mũ của frame hiện tại trong thế giới (cạnh trên của ô đỉnh). */
  headTop(clock: number): Point {
    return cellCorner(this.frameAt(clock).anchors.headTop, this.placement());
  }

  /** Khối thế giới bao nhân vật và cần của frame hiện tại. */
  figure(clock: number): LabelBox {
    return figureBox(this.frameAt(clock), this.placement());
  }

  /** Tâm cổ chân gần (0) hoặc xa (1) trong thế giới, dùng cho bụi khi chân chạm đất. */
  ankle(clock: number, near: 0 | 1): Point {
    return cellCenter(this.frameAt(clock).anchors.feet[near], this.placement());
  }

  /** Đầu cần câu trong thế giới (tâm ô), hoặc null khi frame hiện tại không cầm cần. */
  rodTip(clock: number): Point | null {
    const tip = this.frameAt(clock).anchors.rodTip;
    return tip ? cellCenter(tip, this.placement()) : null;
  }

  /** Frame đứng yên (idle đầu tiên) của bộ trang bị hiện tại, cho chân dung HUD và kho đồ. */
  idleFrame(): Frame {
    return this.rig.frames.idle[0]!;
  }

  /** Vị trí, hướng và kích thước ô hiện tại của sprite, đầu vào của mọi quy đổi neo. */
  placement(): Placement {
    return {x: this.sprite.x, y: this.sprite.y, flip: this.sprite.flipX, scale: ART_PIXEL};
  }

  /** Cổ chân thấp hơn trong frame hiện tại: chân đang đặt xuống, bụi bật ra từ đó. */
  private plantedAnkle(clock: number): Point {
    const low = this.ankle(clock, 0).y >= this.ankle(clock, 1).y ? 0 : 1;
    return this.ankle(clock, low);
  }

  private spawnDust(name: PoseName, clock: number) {
    const footFrame = this.clip.indexAt(clock - this.machine.since);
    if (name === 'run' && (footFrame === 0 || footFrame === 3) && footFrame !== this.lastFoot) {
      this.lastFoot = footFrame;
      this.puff(this.plantedAnkle(clock).x - this.sprite.x, 0, 2);
    }
    if (name !== 'run') this.lastFoot = -1;
    if (name === 'land' && this.lastLanding !== this.machine.since) {
      this.lastLanding = this.machine.since;
      this.puff(this.ankle(clock, 0).x - this.sprite.x, 0, 3);
      this.puff(this.ankle(clock, 1).x - this.sprite.x, 0, 3);
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
