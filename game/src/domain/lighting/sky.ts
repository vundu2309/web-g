import type {TileGrid} from '../tilemap/grid.ts';
import {ATTEN_OPEN, ATTEN_SOLID, ATTEN_WALL, ATTEN_WATER, SKY_SURFACE} from './lightConfig.ts';

/** Số lượt quét tối đa; mỗi lượt quét xuôi rồi ngược, nên hội tụ rất nhanh trên lưới 500 × 29. */
const MAX_SWEEPS = 128;

/** Hệ số suy giảm khi ánh sáng bước VÀO ô (c, r): ô rắn, nước, tường nền hoặc không khí hở. */
export function attenuationAt(grid: TileGrid, c: number, r: number) {
  if (grid.isSolid(c, r)) return ATTEN_SOLID;
  if (grid.isWater(c, r)) return ATTEN_WATER;
  if (grid.wallAt(c, r) !== 'none') return ATTEN_WALL;
  return ATTEN_OPEN;
}

/** Bảng hệ số suy giảm theo từng ô của một lưới chữ nhật, dựng một lần. */
export function attenuationTable(grid: TileGrid) {
  const table = new Float32Array(grid.cols * grid.rows);
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) table[r * grid.cols + c] = attenuationAt(grid, c, r);
  }
  return table;
}

/** Ô kề theo bốn hướng; dùng cho trời (ánh sáng không chéo qua góc). */
const ORTHO: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
/** Tám ô kề; dùng cho nguồn để vùng sáng tròn thay vì hình thoi. */
const RING: readonly (readonly [number, number])[] = [...ORTHO, [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * Lan truyền giá trị lớn nhất qua các ô kề: ô i nhận max(giá trị hiện tại, giá trị láng giềng × hệ số của i).
 * Quét xuôi rồi ngược đến khi không còn ô nào đổi. Không cấp phát; `diagonal` bật tám ô kề.
 */
export function relaxField(field: Float32Array, atten: Float32Array, cols: number, rows: number, diagonal = false) {
  const dirs = diagonal ? RING : ORTHO;
  for (let sweep = 0; sweep < MAX_SWEEPS; sweep++) {
    let changed = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) changed = relaxCell(field, atten, dirs, cols, rows, c, r) || changed;
    }
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = cols - 1; c >= 0; c--) changed = relaxCell(field, atten, dirs, cols, rows, c, r) || changed;
    }
    if (!changed) return;
  }
}

function relaxCell(
  field: Float32Array,
  atten: Float32Array,
  dirs: readonly (readonly [number, number])[],
  cols: number,
  rows: number,
  c: number,
  r: number,
) {
  const i = r * cols + c;
  const a = atten[i];
  let best = field[i];
  for (const [dc, dr] of dirs) {
    const nc = c + dc;
    const nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
    best = Math.max(best, field[nr * cols + nc] * a);
  }
  if (best <= field[i]) return false;
  field[i] = best;
  return true;
}

/**
 * Trường ánh sáng trời cho toàn lưới (một lần khi nạp, vì địa hình không đổi).
 * Không khí phía trên mặt đất được 1; ô rắn đầu tiên của cột được SKY_SURFACE; phần còn lại lan theo luật.
 */
export function computeSkyField(grid: TileGrid, out: Float32Array) {
  const atten = attenuationTable(grid);
  out.fill(0);
  for (let c = 0; c < grid.cols; c++) {
    for (let r = 0; r < grid.rows; r++) {
      const i = r * grid.cols + c;
      if (grid.isSolid(c, r)) {
        out[i] = SKY_SURFACE;
        break;
      }
      out[i] = 1;
    }
  }
  relaxField(out, atten, grid.cols, grid.rows);
}
