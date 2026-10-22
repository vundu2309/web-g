import {palette, colorNumber} from '../../data/palette';
import {getRod} from '../../data/rods';
import Phaser from 'phaser';
import {recipes, type Save, type BuildingKind, type Building} from '../../camping';
import {buildingSprites} from '../../data/sprites/buildings';
import {woodSprite, stoneSprite} from '../../data/sprites/resources';
import {groundAt, waters, resourceNodes} from '../../data/world';
import type {FishingSession} from '../systems/FishingSystem';
import type {Quality} from './resolution';
import type {ActionName, FishingPhase} from '../../domain/poseMachine';
import {camperSprite} from '../../data/sprites/camper';
import {CamperView, camperSlotColors} from './CamperView';
import {ClockSprite} from './ClockSprite';
import {ART_PIXEL, loadSprite} from './SpriteLoader';
import {spriteDataUrl} from './spriteImage';
import {pixelLine} from './pixelDraw';
export interface VisualFrame {
  state: Save;
  placement: {kind: BuildingKind; x: number; error: string} | null;
  fishing: FishingSession | null;
  clock: number;
  quality: Quality;
}
/** Animation a structure loops while standing in the camp; chests follow the player's distance instead. */
const LOOPS: Partial<Record<BuildingKind, string>> = {tent: 'flutter', fire: 'burn', stove: 'glow', lantern: 'glow'};
const CHEST_OPEN_RANGE = 90;
interface Structure {
  kind: BuildingKind;
  sprite: Phaser.GameObjects.Sprite;
  clip: ClockSprite | null;
  animation: string;
  since: number;
}
/** Owns cached sprite assets and world views. No input, storage or HUD updates. */
export class CampRenderer {
  readonly player: Phaser.Physics.Arcade.Sprite;
  readonly camper: CamperView;
  portrait = '';
  readonly nodes = new Map<string, Phaser.GameObjects.Sprite>();
  readonly structures: Structure[] = [];
  readonly buildingImages = {} as Record<BuildingKind, string>;
  readonly fx: Phaser.GameObjects.Graphics;
  readonly shadow: Phaser.GameObjects.Graphics;
  readonly preview: Phaser.GameObjects.Sprite;
  readonly fishLabel: Phaser.GameObjects.Text;
  private previewKind: BuildingKind | null = null;
  constructor(
    private readonly scene: Phaser.Scene,
    state: Save,
  ) {
    for (const kind of Object.keys(recipes) as BuildingKind[]) {
      this.buildingImages[kind] = spriteDataUrl(buildingSprites[kind], {}, 0, 8);
    }
    const woodKey = loadSprite(scene, woodSprite);
    const stoneKey = loadSprite(scene, stoneSprite);
    for (const n of resourceNodes)
      this.nodes.set(
        n.id,
        scene.add
          .sprite(n.x, groundAt(n.x), n.kind === 'wood' ? woodKey : stoneKey, 'frame-0')
          .setOrigin(0.5, 1)
          .setScale(ART_PIXEL)
          .setDepth(12),
      );
    this.camper = new CamperView(scene, state);
    this.player = this.camper.sprite;
    this.shadow = scene.add.graphics().setDepth(19);
    this.fx = scene.add.graphics().setDepth(24);
    this.preview = scene.add
      .sprite(0, 0, loadSprite(scene, buildingSprites.tent), 'frame-0')
      .setOrigin(0.5, 1)
      .setScale(ART_PIXEL)
      .setAlpha(0.6)
      .setDepth(22)
      .setVisible(false);
    this.fishLabel = scene.add
      .text(0, 0, '', {
        fontFamily: 'Nunito',
        fontSize: '12px',
        fontStyle: 'bold',
        color: palette.legacy114,
        backgroundColor: palette.legacy115,
        padding: {x: 6, y: 4},
      })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setVisible(false);
    this.refreshAppearance(state);
    this.restore(state);
  }
  refreshAppearance(state: Save) {
    this.camper.refresh(state);
    this.portrait = spriteDataUrl(camperSprite, camperSlotColors(state), 0, 12);
    return this.portrait;
  }
  restore(state: Save) {
    for (const n of resourceNodes) this.nodes.get(n.id)?.setVisible(!state.harvested.includes(n.id));
    while (this.structures.length > state.buildings.length) this.structures.pop()?.sprite.destroy();
    state.buildings.forEach((b, index) => {
      if (!this.structures[index]) this.structures.push(this.createStructure(b));
    });
  }
  private createStructure(b: Building): Structure {
    const def = buildingSprites[b.kind];
    const key = loadSprite(this.scene, def);
    const sprite = this.scene.add
      .sprite(b.x, groundAt(b.x) + 1, key, 'frame-0')
      .setOrigin(0.5, 1)
      .setScale(ART_PIXEL)
      .setDepth(16);
    const animated = b.kind === 'chest' || b.kind in LOOPS;
    return {
      kind: b.kind,
      sprite,
      clip: animated ? new ClockSprite(sprite, def) : null,
      animation: b.kind === 'chest' ? 'close' : (LOOPS[b.kind] ?? ''),
      since: 0,
    };
  }
  /** Starts a timed pose such as gathering, building or casting. */
  act(action: ActionName, clock: number) {
    this.camper.start(action, clock);
  }
  hideActions() {
    this.preview.setVisible(false);
    this.fishLabel.setVisible(false);
  }
  private drawStructures(model: VisualFrame) {
    for (const s of this.structures) {
      if (!s.clip) continue;
      const building = model.state.buildings[this.structures.indexOf(s)];
      if (s.kind === 'chest') {
        const animation = Math.abs(building.x - this.player.x) < CHEST_OPEN_RANGE ? 'open' : 'close';
        if (animation !== s.animation) {
          s.animation = animation;
          s.since = model.clock;
        }
      }
      s.clip.draw(s.sprite.texture.key, s.animation, model.clock - s.since);
    }
  }
  private drawPreview(model: VisualFrame) {
    this.preview.setVisible(Boolean(model.placement));
    if (!model.placement) return;
    const {kind, x, error} = model.placement;
    if (kind !== this.previewKind) {
      this.previewKind = kind;
      this.preview.setTexture(loadSprite(this.scene, buildingSprites[kind]), 'frame-0');
    }
    this.preview
      .setPosition(x, groundAt(x) + 1)
      .setTint(error ? colorNumber(palette.legacy124) : colorNumber(palette.legacy125));
    this.fx.lineStyle(1, error ? colorNumber(palette.legacy126) : colorNumber(palette.legacy127), 0.9);
    this.fx.strokeEllipse(x, groundAt(x), 115, 8);
  }
  private drawShadow() {
    const s = this.shadow;
    s.clear();
    const y = groundAt(this.player.x);
    const rows = [
      [24, 0.22],
      [20, 0.16],
    ] as const;
    rows.forEach(([width, alpha], i) => {
      s.fillStyle(colorNumber(palette.ink), alpha);
      s.fillRect(this.player.x - width / 2, y - 2 + i * 2, width, 2);
    });
  }
  private drawFishing(model: VisualFrame) {
    const session = model.fishing;
    if (!session) return;
    const f = this.fx;
    const lake = waters.find((w) => w.id === session.waterId)!;
    const hand = this.camper.handPosition(model.clock);
    const tipX = hand.x + 12,
      tipY = hand.y - 14;
    const x = Phaser.Math.Clamp(this.player.x + 55, lake.x + 12, lake.x + lake.width - 12),
      baseY = groundAt(lake.x) + 12;
    const dip = session.phase === 'bite' ? 4 : 0;
    const bob = Math.round(Math.sin(model.clock * 4) * 1) * ART_PIXEL;
    const bobberY = baseY + bob + dip;
    pixelLine(f, hand.x, hand.y, tipX, tipY, colorNumber(palette.legacy128));
    pixelLine(f, tipX, tipY, x, bobberY, colorNumber(palette.legacy129), 0.8);
    f.fillStyle(colorNumber(palette.legacy157));
    f.fillRect(x - ART_PIXEL / 2, bobberY - ART_PIXEL * 2, ART_PIXEL, ART_PIXEL);
    f.fillStyle(colorNumber(palette.cream));
    f.fillRect(x - ART_PIXEL / 2, bobberY - ART_PIXEL, ART_PIXEL, ART_PIXEL);
    this.fishLabel
      .setVisible(true)
      .setPosition(this.player.x, this.player.y - 78)
      .setText(
        session.phase === 'bite'
          ? '! MÓC CÁ [E]'
          : session.phase === 'fight'
            ? 'Giữ KÉO · Thả để chùng dây'
            : 'Đang chờ cá…',
      );
    if (session.phase === 'fight') this.drawTension(session);
  }
  private drawTension(session: FishingSession) {
    const f = this.fx;
    const left = this.player.x - 50;
    const top = this.player.y - 72;
    const warning = session.tension > getRod(session.rod).threshold - 15;
    f.fillStyle(colorNumber(palette.legacy132), 0.95);
    f.fillRect(left - 2, top - 2, 104, 20);
    f.fillStyle(warning ? colorNumber(palette.legacy133) : colorNumber(palette.legacy134));
    f.fillRect(left, top, session.tension, 6);
    f.fillStyle(colorNumber(palette.legacy135));
    f.fillRect(left, top + 10, session.progress, 6);
  }
  draw(model: VisualFrame) {
    const f = this.fx;
    f.clear();
    this.fishLabel.setVisible(false);
    const phase: FishingPhase = model.fishing ? model.fishing.phase : 'none';
    this.camper.update(model.clock, phase);
    this.drawShadow();
    this.drawStructures(model);
    this.drawPreview(model);
    this.drawFishing(model);
    const view = this.scene.cameras.main.worldView;
    for (const lake of waters)
      if (lake.x < view.right && lake.x + lake.width > view.x) {
        f.lineStyle(1, colorNumber(palette.legacy136), 0.5);
        for (let i = 0; i < (model.quality === 'high' ? 8 : 3); i++) {
          const x = lake.x + 30 + ((i * 91 + model.clock * 5) % (lake.width - 50)),
            y = groundAt(lake.x) + 14 + (i % 4) * 10;
          f.strokeEllipse(x, y, 12 + Math.sin(model.clock * 2 + i) * 4, 2);
        }
      }
    for (const b of model.state.buildings)
      if (b.kind === 'fire' && Math.abs(b.x - this.player.x) < 650) {
        const y = groundAt(b.x) - 15;
        f.fillStyle(colorNumber(palette.legacy137), 0.07);
        f.fillCircle(b.x, y, 34 + Math.sin(model.clock * 4) * 3);
        f.fillStyle(colorNumber(palette.legacy138), 0.9);
        for (let i = 0; i < 3; i++) f.fillRect(b.x - 7 + i * 7, y - ((model.clock * 20 + i * 9) % 25), 1, 2);
      }
  }
}
