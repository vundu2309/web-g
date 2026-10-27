import {terrainGrid} from '../../data/world';
import {TILE} from '../../domain/tilemap/types';
import {palette, colorNumber} from '../../data/palette';
import {getRod} from '../../data/rods';
import Phaser from 'phaser';
import {recipes, type Save, type BuildingKind} from '../../camping';
import {buildingGlows, buildingSprites} from '../../data/sprites/buildings';
import {createStructure, drawStructure, type Structure} from './structureSprites';
import {woodSprite, stoneSprite} from '../../data/sprites/resources';
import {groundAt, waters, resourceNodes} from '../../data/world';
import type {FishingSession} from '../systems/FishingSystem';
import type {Quality} from './resolution';
import type {ActionName, FishingPhase} from '../../domain/poseMachine';
import {CamperView} from './CamperView';
import {warmCamperSheets} from './CamperSheet';
import {outfitOf, starterOutfits} from '../../domain/camperRig/wear.ts';
import {gear} from '../../camping.ts';
import {ART_PIXEL, loadSprite} from './SpriteLoader';
import {spriteLayersDataUrl} from './spriteImage';
import {LookCache} from './frameImage';
import {pixelLine} from './pixelDraw';
import {fishLabelBottom, type LabelBox} from '../../domain/fishingLabels.ts';
import {WorldLabelFader} from './WorldLabelFader';
export interface VisualFrame {
  state: Save;
  placement: {kind: BuildingKind; x: number; error: string} | null;
  fishing: FishingSession | null;
  clock: number;
  quality: Quality;
  swimming?: boolean;
  diving?: boolean;
}
/** Thanh lực: khung 104 × 20 đơn vị, cách chân nhân vật 4 đơn vị. */
const TENSION_WIDTH = 104;
const TENSION_FRAME = 20;
const TENSION_GAP = 4;
/** Giây game tối đa giữa hai khung để mờ nhãn (chặn bước nhảy khi tab bị tạm dừng). */
const MAX_FADE_STEP = 0.1;
/** Head and shoulders of the idle frame for the HUD portrait: columns 2–17 and rows 0–21. */
import {PORTRAIT_CROP} from '../../data/portrait';

/** Owns cached sprite assets and world views. No input, storage or HUD updates. */
export class CampRenderer {
  readonly player: Phaser.Physics.Arcade.Sprite;
  readonly camper: CamperView;
  /** HUD portrait: head and shoulders of the idle frame. */
  portrait = '';
  /** Whole idle figure for the inventory preview. */
  figure = '';
  readonly nodes = new Map<string, Phaser.GameObjects.Sprite>();
  readonly structures: Structure[] = [];
  readonly buildingImages = {} as Record<BuildingKind, string>;
  readonly fx: Phaser.GameObjects.Graphics;
  readonly shadow: Phaser.GameObjects.Graphics;
  readonly preview: Phaser.GameObjects.Sprite;
  readonly previewGlow: Phaser.GameObjects.Sprite;
  readonly fishLabel: Phaser.GameObjects.Text;
  private previewKind: BuildingKind | null = null;
  private readonly labelFader: WorldLabelFader;
  private readonly fishingBoxes: LabelBox[] = [];
  private lastClock = 0;
  private readonly looks = new LookCache(PORTRAIT_CROP);
  /** Đúng khi 16 bộ gốc đã nạp xong; test đo số texture sau cờ này. */
  outfitsReady = false;
  constructor(
    private readonly scene: Phaser.Scene,
    state: Save,
    worldLabels: readonly Phaser.GameObjects.Text[] = [],
  ) {
    this.labelFader = new WorldLabelFader(worldLabels);
    for (const kind of Object.keys(recipes) as BuildingKind[]) {
      const glow = buildingGlows[kind];
      const layers = [{def: buildingSprites[kind], frame: 0}];
      if (glow) layers.push({def: glow, frame: Math.min(1, glow.frames.length - 1)});
      this.buildingImages[kind] = spriteLayersDataUrl(layers, {}, 8);
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
    warmCamperSheets(
      scene,
      starterOutfits(gear),
      40,
      (o) => this.looks.of(o),
      () => (this.outfitsReady = true),
    );
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
    this.previewGlow = scene.add
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
    const look = this.looks.of(outfitOf(state.equipped, gear));
    this.portrait = look.portrait;
    this.figure = look.figure;
    return this.portrait;
  }

  restore(state: Save) {
    for (const n of resourceNodes) this.nodes.get(n.id)?.setVisible(!state.harvested.includes(n.id));
    while (this.structures.length > state.buildings.length) {
      const removed = this.structures.pop();
      removed?.sprite.destroy();
      removed?.glow?.destroy();
    }
    state.buildings.forEach((b, index) => {
      if (!this.structures[index]) this.structures.push(createStructure(this.scene, b));
    });
  }
  /** Starts a timed pose such as gathering, building or casting. */
  act(action: ActionName, clock: number) {
    this.camper.start(action, clock);
  }
  hideActions() {
    this.preview.setVisible(false);
    this.previewGlow.setVisible(false);
    this.fishLabel.setVisible(false);
  }
  private drawPreview(model: VisualFrame) {
    this.preview.setVisible(Boolean(model.placement));
    if (!model.placement) this.previewGlow.setVisible(false);
    if (!model.placement) return;
    const {kind, x, error} = model.placement;
    if (kind !== this.previewKind) {
      this.previewKind = kind;
      this.preview.setTexture(loadSprite(this.scene, buildingSprites[kind]), 'frame-0');
      const glow = buildingGlows[kind];
      if (glow) this.previewGlow.setTexture(loadSprite(this.scene, glow), 'frame-0');
      this.previewGlow.setVisible(Boolean(glow));
    }
    const tint = error ? colorNumber(palette.legacy124) : colorNumber(palette.legacy125);
    this.preview.setPosition(x, groundAt(x) + 1).setTint(tint);
    this.previewGlow.setPosition(x, groundAt(x) + 1).setTint(tint);
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
    const tip = this.camper.rodTip(model.clock);
    const x = Phaser.Math.Clamp(this.player.x + (this.player.flipX ? -55 : 55), lake.x + 12, lake.x + lake.width - 12),
      baseY = terrainGrid.waterSurfaceRow(terrainGrid.columnAt(x)) * TILE + 2;
    const dip = session.phase === 'bite' ? 4 : 0;
    const bob = Math.round(Math.sin(model.clock * 4) * 1) * ART_PIXEL;
    const bobberY = baseY + bob + dip;
    if (tip) pixelLine(f, tip.x, tip.y, x, bobberY, colorNumber(palette.legacy129), 0.8);
    f.fillStyle(colorNumber(palette.gearHatKnit));
    f.fillRect(x - ART_PIXEL / 2, bobberY - ART_PIXEL * 2, ART_PIXEL, ART_PIXEL);
    f.fillStyle(colorNumber(palette.cream));
    f.fillRect(x - ART_PIXEL / 2, bobberY - ART_PIXEL, ART_PIXEL, ART_PIXEL);
    this.fishLabel
      .setVisible(true)
      .setPosition(this.player.x, fishLabelBottom(this.camper.headTop(model.clock).y))
      .setText(
        session.phase === 'bite'
          ? '! MÓC CÁ [E]'
          : session.phase === 'fight'
            ? 'Giữ KÉO · Thả để chùng dây'
            : 'Đang chờ cá…',
      );
    const labelBox = this.fishLabel.getBounds();
    this.fishingBoxes.push(labelBox);
    // Nhân vật và cần theo pixel của frame: nhãn thế giới chồng lên đây cũng được làm mờ.
    this.fishingBoxes.push(this.camper.figure(model.clock));
    if (session.phase === 'fight') this.drawTension(session);
  }
  /** Thanh lực đặt dưới chân nhân vật: không bị thông báo trên cùng (toast) hay nhãn che, không chạm đầu hay cần. */
  private drawTension(session: FishingSession) {
    const f = this.fx;
    const left = this.player.x - 50;
    const frameTop = this.player.y + TENSION_GAP;
    const top = frameTop + 2;
    const warning = session.tension > getRod(session.rod).threshold - 15;
    f.fillStyle(colorNumber(palette.legacy132), 0.95);
    f.fillRect(left - 2, frameTop, TENSION_WIDTH, TENSION_FRAME);
    f.fillStyle(warning ? colorNumber(palette.legacy133) : colorNumber(palette.legacy134));
    f.fillRect(left, top, session.tension, 6);
    f.fillStyle(colorNumber(palette.legacy135));
    f.fillRect(left, top + 10, session.progress, 6);
    this.fishingBoxes.push({x: left - 2, y: frameTop, width: TENSION_WIDTH, height: TENSION_FRAME});
  }
  /** Giây game từ khung trước, kẹp để tab bị ẩn hoặc tạm dừng không làm nhãn nhảy cóc. */
  private fadeStep(clock: number) {
    const step = Math.min(MAX_FADE_STEP, Math.max(0, clock - this.lastClock));
    this.lastClock = clock;
    return step;
  }
  draw(model: VisualFrame) {
    const f = this.fx;
    f.clear();
    this.fishLabel.setVisible(false);
    this.fishingBoxes.length = 0;
    const phase: FishingPhase = model.fishing ? model.fishing.phase : 'none';
    this.camper.update(model.clock, phase, model.swimming, model.diving);
    if (model.swimming) this.shadow.clear();
    else this.drawShadow();
    this.structures.forEach((s, index) =>
      drawStructure(s, model.state.buildings[index], this.player.x, model.clock, model.state.time),
    );
    this.drawPreview(model);
    this.drawFishing(model);
    this.labelFader.update(this.fishingBoxes, this.fadeStep(model.clock));
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
