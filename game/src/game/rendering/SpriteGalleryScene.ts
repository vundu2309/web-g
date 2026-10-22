import Phaser from 'phaser';
import {camperSprite} from '../../data/sprites/camper';
import {camperDetailed} from '../../data/sprites/camperDetailed';
import {reviewOutfits, outfitColors} from '../../data/sprites/outfits';
import {buildingSprites} from '../../data/sprites/buildings';
import {woodSprite, stoneSprite} from '../../data/sprites/resources';
import {palette, colorNumber} from '../../data/palette';
import type {PoseName} from '../../domain/poseMachine';
import type {SpriteDefinition} from '../../domain/sprite';
import {loadSprite, ART_PIXEL} from './SpriteLoader';
import {ClockSprite} from './ClockSprite';
export const poseNames = Object.keys(camperSprite.animations) as PoseName[];
export const poseLabels: Record<string, string> = {
  idle: 'Đứng · thở nhẹ',
  run: 'Chạy · tay và balo đung đưa',
  jump: 'Nhảy · lên',
  fall: 'Rơi',
  land: 'Đáp · bụi',
  cast: 'Quăng cần',
  'fish-wait': 'Chờ cá cắn',
  bite: 'Cá cắn · giật cần',
  reel: 'Kéo cá',
  gather: 'Nhặt gỗ · đá',
  build: 'Dựng trại',
};
export type GalleryMode = 'camper' | 'props';
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
const propDefs: [string, SpriteDefinition][] = [
  ...(Object.entries(buildingSprites) as [string, SpriteDefinition][]),
  ['wood', woodSprite],
  ['stone', stoneSprite],
];
/** Layout shared with the DOM host: camper cells are 300 px tall, prop cells 240 px. */
export function galleryLayout(mode: GalleryMode, width: number) {
  const columns =
    mode === 'camper' ? (width >= 720 ? 3 : width >= 440 ? 2 : 1) : width >= 900 ? 4 : width >= 560 ? 3 : 2;
  const count = mode === 'camper' ? 6 : propDefs.length;
  const cell = mode === 'camper' ? 300 : 240;
  return {columns, cellWidth: Math.floor(width / columns), cell, height: Math.ceil(count / columns) * cell};
}
interface Cell {
  clip: ClockSprite;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
  animation: string;
  pose: PoseName;
  row: number;
}
export class SpriteGalleryScene extends Phaser.Scene {
  clock = 0;
  speed = 1;
  paused = false;
  state: PoseName | 'all' = 'all';
  outfit = 0;
  detailed = true;
  mode: GalleryMode = 'camper';
  /** Called when a mode change needs a taller host; the DOM owns the page height. */
  onLayout?: (height: number) => void;
  cells: Cell[] = [];
  private built: Phaser.GameObjects.GameObject[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  constructor() {
    super('sprite-review');
  }
  create() {
    this.build();
    Object.assign(window, {spriteGallery: this});
  }
  private definition() {
    return this.detailed ? camperDetailed : camperSprite;
  }
  /** Rebuilds all cells for the current mode; cached textures and animations are reused. */
  build() {
    for (const object of this.built) object.destroy();
    this.built = [];
    this.labels = [];
    this.cells = [];
    const layout = galleryLayout(this.mode, this.scale.width);
    if (this.scale.height !== layout.height) this.scale.resize(this.scale.width, layout.height);
    this.onLayout?.(layout.height);
    if (this.mode === 'camper') this.buildCamper(layout);
    else this.buildProps(layout);
  }
  private frameBox(x: number, y: number, width: number, cell: number) {
    const panel = this.add.rectangle(x + 8, y + 8, width - 16, cell - 16, colorNumber(palette.paper)).setOrigin(0);
    const ground = this.add.graphics();
    ground.fillStyle(colorNumber(palette.grassShade)).fillRect(x + 24, y + cell - 38, width - 48, 3);
    ground.fillStyle(colorNumber(palette.soilForest)).fillRect(x + 24, y + cell - 35, width - 48, 4);
    this.built.push(panel, ground);
    return panel;
  }
  private buildCamper(layout: ReturnType<typeof galleryLayout>) {
    const definition = this.definition();
    const states = ['idle', 'run', 'jump'] as const;
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const pose = states[i % 3];
      const x = (i % layout.columns) * layout.cellWidth;
      const y = Math.floor(i / layout.columns) * layout.cell;
      this.frameBox(x, y, layout.cellWidth, layout.cell);
      const label = this.add
        .text(x + 20, y + 20, '', {fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: palette.ink})
        .setResolution(2);
      label.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.labels.push(label);
      this.built.push(label);
      const texture = loadSprite(this, definition, outfitColors(row));
      // Both densities display at the same 144-unit size: 24 px at x6 and 48 px at x3.
      const sprite = this.add
        .sprite(x + layout.cellWidth / 2, y + layout.cell - 42, texture, 'frame-0')
        .setOrigin(0.5, 1)
        .setScale(definition.width === 48 ? 3 : ART_PIXEL * 3);
      this.built.push(sprite);
      this.cells.push({clip: new ClockSprite(sprite, definition), sprite, texture, animation: '', pose, row});
    }
    this.refreshOutfits();
  }
  private buildProps(layout: ReturnType<typeof galleryLayout>) {
    propDefs.forEach(([kind, def], i) => {
      const x = (i % layout.columns) * layout.cellWidth;
      const y = Math.floor(i / layout.columns) * layout.cell;
      this.frameBox(x, y, layout.cellWidth, layout.cell);
      const label = this.add
        .text(x + 20, y + 20, propLabels[kind] + ' · ' + kind, {
          fontFamily: 'Nunito',
          fontSize: '13px',
          fontStyle: 'bold',
          color: palette.ink,
        })
        .setResolution(2);
      label.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.labels.push(label);
      this.built.push(label);
      const texture = loadSprite(this, def);
      const sprite = this.add
        .sprite(x + layout.cellWidth / 2, y + layout.cell - 42, texture, 'frame-0')
        .setOrigin(0.5, 1)
        .setScale(3);
      this.built.push(sprite);
      const animation = Object.keys(def.animations)[0] ?? '';
      this.cells.push({
        clip: new ClockSprite(sprite, def),
        sprite,
        texture,
        animation,
        pose: 'idle',
        row: 0,
      });
    });
  }
  refreshOutfits() {
    if (this.mode !== 'camper') return;
    const definition = this.definition();
    this.cells.forEach((cell, i) => {
      const index = (cell.row + this.outfit) % 2;
      cell.texture = loadSprite(this, definition, outfitColors(index));
      cell.clip = new ClockSprite(cell.sprite, definition);
      cell.sprite.setScale(definition.width === 48 ? 3 : ART_PIXEL * 3);
      this.labels[i].setText(reviewOutfits[index].name + '\n' + poseLabels[cell.pose]);
    });
  }
  flip() {
    for (const cell of this.cells) cell.sprite.toggleFlipX();
  }
  update(_time: number, delta: number) {
    if (!this.paused) this.clock += Math.min(delta / 1000, 0.1) * this.speed;
    for (const cell of this.cells) {
      if (this.mode === 'camper') {
        const pose = this.state === 'all' ? cell.pose : this.state;
        cell.clip.draw(cell.texture, pose, this.clock);
      } else if (cell.animation) {
        cell.clip.draw(cell.texture, cell.animation, this.clock);
      }
    }
  }
}
