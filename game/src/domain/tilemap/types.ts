import {ART_PIXEL} from '../../data/palette.ts';

/** Một ô bằng 16 pixel nghệ thuật, tức 32 đơn vị thế giới. */
export const TILE_ART = 16;
export const TILE = TILE_ART * ART_PIXEL;
/** SECTION cũ (256 đơn vị). Mặt đất chỉ đổi độ cao tại ranh giới SECTION, nên dùng được cho vẽ cũ. */
export const SECTION = 256;
export const SECTION_COLS = SECTION / TILE;

export const TILE_KINDS = ['air', 'dirt', 'stone', 'sand', 'copper', 'iron', 'crystal'] as const;
export type TileKind = (typeof TILE_KINDS)[number];
export const WALL_KINDS = ['none', 'wallDirt', 'wallStone'] as const;
export type WallKind = (typeof WALL_KINDS)[number];

export interface Lake {
  x: number;
  width: number;
}

export interface TerrainSpec {
  cols: number;
  rows: number;
  seed: number;
  lakes: readonly Lake[];
}

/** Dữ liệu ô thô, lưu bằng mảng kiểu số; chỉ `TileGrid` được truy cập trực tiếp. */
export interface TerrainData {
  cols: number;
  rows: number;
  /** Hàng của mặt đất theo cột (hàng đầu tiên thuộc đất). */
  surface: Int16Array;
  /** Chỉ số trong TILE_KINDS. */
  kinds: Uint8Array;
  /** Chỉ số trong WALL_KINDS. */
  walls: Uint8Array;
  /** 1 nếu ô là nước (không đặc). */
  water: Uint8Array;
}

/** Mã số của từng loại ô trong `TerrainData.kinds`. */
export const KIND_CODE: Record<TileKind, number> = {
  air: 0,
  dirt: 1,
  stone: 2,
  sand: 3,
  copper: 4,
  iron: 5,
  crystal: 6,
};
/** Mã số của từng loại tường nền trong `TerrainData.walls`. */
export const WALL_CODE: Record<WallKind, number> = {none: 0, wallDirt: 1, wallStone: 2};
