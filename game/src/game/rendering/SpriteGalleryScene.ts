import Phaser from 'phaser';
import {buildingGlows, buildingSprites} from '../../data/sprites/buildings';
import {woodSprite, stoneSprite} from '../../data/sprites/resources';
import {palette, colorNumber} from '../../data/palette';
import type {SpriteDefinition} from '../../domain/sprite';
import {loadSprite} from './SpriteLoader';
import {ClockSprite} from './ClockSprite';

export type GalleryLayer = 'both' | 'body' | 'glow';

const propLabels: Record<string, string> = {
  tent: 'Lều vải',
  fire: 'Bếp lửa',
  stove: 'Bếp nấu',
  lantern: 'Đèn lồng',
  bench: 'Bàn dã ngoại',
  stall: 'Quầy thu mua',
  fence: 'Hàng rào',
  plant: 'Cây chậu',
  chest: 'Rương gỗ',
  wood: 'Gỗ khô',
  stone: 'Đá',
};

interface Prop {
  kind: string;
  body: SpriteDefinition;
  glow?: SpriteDefinition;
}

const propDefs: Prop[] = [
  ...(Object.entries(buildingSprites) as [string, SpriteDefinition][]).map(([kind, body]) => ({
    kind,
    body,
    glow: buildingGlows[kind as keyof typeof buildingGlows],
  })),
  {kind: 'wood', body: woodSprite},
  {kind: 'stone', body: stoneSprite},
];

const CELL_PAD = 42;
const GROUND_PAD = 42;

/** Layout shared with the DOM host: a prop cell fits the sprite at the chosen zoom, with a label above it. */
export function galleryLayout(width: number, zoom = 3) {
  const artHeight = 37 * zoom;
  const columns = zoom >= 6 ? (width >= 900 ? 3 : 1) : width >= 900 ? 4 : width >= 560 ? 3 : 2;
  const cell = Math.max(240, artHeight + CELL_PAD + GROUND_PAD);
  return {columns, cellWidth: Math.floor(width / columns), cell, height: Math.ceil(propDefs.length / columns) * cell};
}

interface Layer {
  kind: 'body' | 'glow';
  clip: ClockSprite;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
  animation: string;
}

interface Cell {
  layers: Layer[];
}

/** Xưởng pixel: công trình (thân, lớp phát sáng, ghép) và tài nguyên cùng lưới pixel. */
export class SpriteGalleryScene extends Phaser.Scene {
  clock = 0;
  speed = 1;
  paused = false;
  zoom = 3;
  layer: GalleryLayer = 'both';
  night = false;
  /** Called when the layout changes height; the DOM owns the page height. */
  onLayout?: (height: number) => void;
  cells: Cell[] = [];
  private built: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('sprite-review');
  }

  create() {
    this.build();
    Object.assign(window, {spriteGallery: this});
  }

  /** Rebuilds all prop cells; cached textures and animations are reused. */
  build() {
    for (const object of this.built) object.destroy();
    this.built = [];
    this.cells = [];
    const layout = galleryLayout(this.scale.width, this.zoom);
    if (this.scale.height !== layout.height) this.scale.resize(this.scale.width, layout.height);
    this.onLayout?.(layout.height);
    propDefs.forEach((prop, i) => {
      const x = (i % layout.columns) * layout.cellWidth;
      const y = Math.floor(i / layout.columns) * layout.cell;
      this.frameBox(x, y, layout.cellWidth, layout.cell);
      const label = this.add
        .text(x + 20, y + 20, propLabels[prop.kind] + ' · ' + prop.kind, {
          fontFamily: 'Nunito',
          fontSize: '13px',
          fontStyle: 'bold',
          color: this.night ? palette.cream : palette.ink,
        })
        .setResolution(2);
      label.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.built.push(label);
      // Thân được tạo trước để lớp phát sáng nằm trên (thứ tự tạo quyết định thứ tự vẽ trong xưởng).
      const layers: Layer[] = [this.addLayer(prop.body, 'body', x, y, layout.cellWidth, layout.cell)];
      if (prop.glow) layers.push(this.addLayer(prop.glow, 'glow', x, y, layout.cellWidth, layout.cell));
      this.cells.push({layers});
    });
    this.applyLayer();
  }

  private addLayer(def: SpriteDefinition, kind: 'body' | 'glow', x: number, y: number, width: number, cell: number) {
    const texture = loadSprite(this, def);
    const sprite = this.add
      .sprite(x + width / 2, y + cell - GROUND_PAD, texture, 'frame-0')
      .setOrigin(0.5, 1)
      .setScale(this.zoom);
    this.built.push(sprite);
    return {
      kind,
      clip: new ClockSprite(sprite, def.animations),
      sprite,
      texture,
      animation: Object.keys(def.animations)[0] ?? '',
    };
  }

  /** Chỉ hiện thân, chỉ hiện lớp phát sáng, hoặc ghép cả hai. */
  setLayer(layer: GalleryLayer) {
    this.layer = layer;
    this.applyLayer();
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.build();
  }

  setNight(night: boolean) {
    this.night = night;
    this.build();
  }

  private applyLayer() {
    for (const cell of this.cells) {
      for (const layer of cell.layers) {
        layer.sprite.setVisible(this.layer === 'both' || this.layer === layer.kind);
      }
    }
  }

  private frameBox(x: number, y: number, width: number, cell: number) {
    const fill = this.night ? palette.bgSkyNightMid : palette.paper;
    const panel = this.add.rectangle(x + 8, y + 8, width - 16, cell - 16, colorNumber(fill)).setOrigin(0);
    const ground = this.add.graphics();
    ground.fillStyle(colorNumber(palette.grassShade)).fillRect(x + 24, y + cell - GROUND_PAD + 2, width - 48, 3);
    ground.fillStyle(colorNumber(palette.soilForest)).fillRect(x + 24, y + cell - GROUND_PAD + 5, width - 48, 4);
    this.built.push(panel, ground);
  }

  flip() {
    for (const cell of this.cells) for (const layer of cell.layers) layer.sprite.toggleFlipX();
  }

  update(_time: number, delta: number) {
    if (!this.paused) this.clock += Math.min(delta / 1000, 0.1) * this.speed;
    for (const cell of this.cells) {
      for (const layer of cell.layers) {
        if (layer.animation) layer.clip.draw(layer.texture, layer.animation, this.clock);
      }
    }
  }
}
