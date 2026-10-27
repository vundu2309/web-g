import {type TileGrid} from './grid.ts';
import {tilePixel} from './tileArt.ts';
import {TILE_ART} from './types.ts';

/** Số cột ô trong một chunk texture; một chunk = 16 ô = 256 điểm ảnh ngang. */
export const CHUNK_TILES = 16;

export function chunkCount(cols: number) {
  return Math.ceil(cols / CHUNK_TILES);
}

/** Chỉ số chunk chứa cột ô c; mỗi cột thuộc đúng một chunk. */
export function chunkOf(c: number) {
  return Math.floor(c / CHUNK_TILES);
}

/** Cột đầu (bao gồm) và cột cuối (không bao gồm) của chunk. */
export function chunkRange(index: number, cols: number) {
  const first = index * CHUNK_TILES;
  return {first, end: Math.min(cols, first + CHUNK_TILES)};
}

/** Kích thước chunk theo điểm ảnh nghệ thuật (1 điểm = 2 đơn vị thế giới). */
export function chunkPixels(grid: TileGrid, index: number) {
  const {first, end} = chunkRange(index, grid.cols);
  return {width: (end - first) * TILE_ART, height: grid.rows * TILE_ART};
}

/** Có ô nước nào trong chunk không (để biết có cần chunk lớp nước). */
export function chunkHasWater(grid: TileGrid, index: number) {
  const {first, end} = chunkRange(index, grid.cols);
  for (let c = first; c < end; c++) {
    for (let r = 0; r < grid.rows; r++) if (grid.isWater(c, r)) return true;
  }
  return false;
}

/**
 * Vẽ một chunk vào bộ đệm RGBA (4 byte mỗi điểm ảnh, theo hàng). Gọi một lần cho mỗi chunk và cache.
 * `out` phải có đúng width × height × 4 byte của chunkPixels.
 */
export function paintChunk(
  grid: TileGrid,
  tints: Int32Array,
  index: number,
  waterLayer: boolean,
  out: Uint8ClampedArray,
) {
  const {first, end} = chunkRange(index, grid.cols);
  const width = (end - first) * TILE_ART;
  for (let r = 0; r < grid.rows; r++) {
    for (let py = 0; py < TILE_ART; py++) {
      const rowBase = (r * TILE_ART + py) * width;
      for (let c = first; c < end; c++) {
        for (let px = 0; px < TILE_ART; px++) {
          const v = tilePixel(grid, tints, c, r, px, py, waterLayer);
          const o = (rowBase + (c - first) * TILE_ART + px) * 4;
          out[o] = (v >> 16) & 255;
          out[o + 1] = (v >> 8) & 255;
          out[o + 2] = v & 255;
          out[o + 3] = v >>> 24;
        }
      }
    }
  }
}
