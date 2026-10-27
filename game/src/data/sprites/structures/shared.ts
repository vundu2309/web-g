import type {SpriteAnimation, SpriteDefinition} from '../../../domain/sprite.ts';
import {PixelGrid} from '../../../domain/pixelGrid.ts';

/** Khung công trình: 55 × 37 pixel nghệ thuật; hàng cuối (GROUND_ROW) là mặt đất, đế chạm đúng đáy khung. */
export const STRUCTURE_W = 55;
export const STRUCTURE_H = 37;
export const GROUND_ROW = STRUCTURE_H - 1;
/** Cột giữa khung: trục đối xứng của lều, bếp, đèn, quầy và rương. */
export const CENTER = 27;

/** Vai trò màu trong `palette/structures.ts` (tên có tiền tố `struct`) và ký tự tương ứng trong lưới. */
const ROLE_NAMES = [
  'woodHi',
  'wood',
  'woodMid',
  'woodShade',
  'woodDeep',
  'woodRing',
  'stoneHi',
  'stone',
  'stoneMid',
  'stoneShade',
  'stoneDeep',
  'mortar',
  'canvasHi',
  'canvas',
  'canvasMid',
  'canvasShade',
  'canvasDeep',
  'red',
  'redDeep',
  'rope',
  'doorDark',
  'doorWarm',
  'doorCore',
  'flameRed',
  'flameOrange',
  'flameYellow',
  'flameCore',
  'ember',
  'spark',
  'ironHi',
  'iron',
  'ironDeep',
  'goldHi',
  'gold',
  'goldDeep',
  'glassCore',
  'glass',
  'glassEdge',
  'leafHi',
  'leaf',
  'leafMid',
  'leafShade',
  'leafDeep',
  'potHi',
  'pot',
  'potDeep',
  'fishHi',
  'fish',
  'fishDeep',
  'basketHi',
  'basket',
  'basketDeep',
] as const;

export type StructureRole = (typeof ROLE_NAMES)[number];

const GLYPHS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Ký tự của từng vai trò: `R.woodHi` là một ký tự dùng trong lưới. */
export const R = Object.fromEntries(ROLE_NAMES.map((role, i) => [role, GLYPHS[i]])) as Record<StructureRole, string>;

/** Ánh xạ ký tự → tên màu palette (`struct` + vai trò viết hoa chữ đầu). */
export const STRUCTURE_COLORS: Record<string, string> = Object.fromEntries(
  ROLE_NAMES.map((role, i) => [GLYPHS[i], 'struct' + role.charAt(0).toUpperCase() + role.slice(1)]),
);

/** Khung trống 55 × 37 để vẽ một frame. */
export function newFrame() {
  return new PixelGrid(STRUCTURE_W, STRUCTURE_H);
}

/** Đóng gói các frame đã vẽ (hàng ký tự) thành một định dạng sprite công trình. */
export function structureSprite(
  name: string,
  frames: readonly PixelGrid[],
  animations: Readonly<Record<string, SpriteAnimation>>,
): SpriteDefinition {
  return {
    name,
    width: STRUCTURE_W,
    height: STRUCTURE_H,
    colors: STRUCTURE_COLORS,
    frames: frames.map((grid) => grid.rows()),
    animations,
  };
}
