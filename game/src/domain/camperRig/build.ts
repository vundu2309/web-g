import {camperRigPalette} from '../../data/palette/camperRig.ts';
import {toneRamp} from '../tone.ts';
import {buildGeometry, type Geometry} from './geometry.ts';
import {ROLE_ID, type Rgb} from './raster.ts';
import type {Dress} from './parts.ts';
import type {HatShape} from '../../data/camperHead.ts';
import {
  FRAME_H,
  FRAME_W,
  RIG_ROLES,
  RIG_STATES,
  type Frame,
  type RigOutfit,
  type RigPalette,
  type RigRole,
  type RigState,
} from './types.ts';

export interface CamperRigSet {
  readonly outfit: RigOutfit;
  readonly frames: Readonly<Record<RigState, readonly Frame[]>>;
  /** Mọi frame theo thứ tự trạng thái trong `RIG_STATES`, mỗi trạng thái theo thứ tự chỉ số. */
  readonly all: readonly Frame[];
}

const SLOTS = ['hat', 'shirt', 'pants', 'bag'] as const;
const HATS: readonly HatShape[] = ['hat-ranger', 'hat-knit'];

/** Bảng màu đầy đủ của một bộ trang bị: màu cố định cộng bốn tông của mỗi món. */
export function rigPaletteOf(outfit: RigOutfit): RigPalette {
  const tones: Record<string, string> = {};
  for (const slot of SLOTS) {
    const ramp = toneRamp(outfit[slot].color);
    tones[slot + '0'] = ramp.hi;
    tones[slot + '1'] = ramp.base;
    tones[slot + '2'] = ramp.shade;
    tones[slot + '3'] = ramp.deep;
  }
  return {...camperRigPalette, ...tones} as RigPalette;
}

/** Đổi id trang bị thành hình dáng; id lạ là lỗi dữ liệu, không được đoán. */
export function dressOf(outfit: RigOutfit): Dress {
  const hat = HATS.find((shape) => shape === outfit.hat.id);
  if (hat === undefined) throw new Error('camperRig: mũ không rõ ' + outfit.hat.id);
  return {hat, shirt: outfit.shirt.id, pants: outfit.pants.id, bag: outfit.bag.id};
}

function parseRgb(hex: string): Rgb {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('camperRig: màu không hợp lệ ' + hex);
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Bảng mã vai trò → RGB; phần tử 0 không dùng (pixel trong suốt). */
export function rgbTable(palette: RigPalette): Rgb[] {
  const table: Rgb[] = [[0, 0, 0]];
  for (const role of RIG_ROLES) table[ROLE_ID[role]] = parseRgb(palette[role as RigRole]);
  return table;
}

const geometries = new Map<string, readonly Geometry[]>();
const cache = new Map<string, CamperRigSet>();

/** Khóa cache: id và màu của bốn món (hình dáng quyết định hình học, màu quyết định tông). */
export function outfitKey(outfit: RigOutfit) {
  return SLOTS.map((slot) => outfit[slot].id + '/' + outfit[slot].color).join('|');
}

/**
 * Dựng mọi frame của một bộ trang bị (46 frame). Hình học theo hình dáng dựng một lần; màu thay theo bộ trang bị.
 * Kết quả cache theo id và màu của bốn món, không phụ thuộc Phaser.
 */
export function buildCamperFrames(outfit: RigOutfit): CamperRigSet {
  const key = outfitKey(outfit);
  const hit = cache.get(key);
  if (hit) return hit;
  const dress = dressOf(outfit);
  const shapeKey = [dress.hat, dress.shirt, dress.pants, dress.bag].join('|');
  let geometry = geometries.get(shapeKey);
  if (!geometry) {
    geometry = buildGeometry(dress);
    geometries.set(shapeKey, geometry);
  }
  const table = rgbTable(rigPaletteOf(outfit));
  const all = geometry.map((item): Frame => ({
    state: item.state,
    index: item.index,
    width: FRAME_W,
    height: FRAME_H,
    rgba: item.canvas.toRgba(table),
    anchors: item.anchors,
  }));
  const frames = Object.fromEntries(
    RIG_STATES.map((state) => [state, all.filter((frame) => frame.state === state)]),
  ) as Record<RigState, Frame[]>;
  const set: CamperRigSet = {outfit, frames, all};
  cache.set(key, set);
  return set;
}

/** Băm FNV-1a 32 bit của toàn bộ pixel RGBA theo thứ tự frame; dùng để khóa hồi quy khi art đổi. */
export function hashFrames(frames: readonly Frame[]): number {
  let hash = 0x811c9dc5;
  for (const frame of frames) {
    for (const byte of frame.rgba) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return hash >>> 0;
}
