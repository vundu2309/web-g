import {SECTION, SECTION_COLS, TILE, type Lake} from './types.ts';
import {hash01} from './random.ts';

/** Công thức độ cao cũ theo SECTION (đơn vị thế giới). Chỉ dùng làm mục tiêu hình dạng. */
export function legacyGroundY(section: number) {
  return 650 - Math.round((Math.sin(section * 0.19) * 65 + section * 3.1) / 16) * 16;
}

/** Độ lệch tối đa so với mục tiêu, theo hàng (1,5 ô = 48 đơn vị, dưới ngưỡng 64). */
export const MAX_DEVIATION_ROWS = 1.5;
const STEP_PENALTY = 0.05;
const NOISE = 0.35;

/** Các SECTION bị vùng hồ (kể cả đệm 256 mỗi bên) chiếm: mặt phẳng ở một hàng cố định. */
function lakeSections(lakes: readonly Lake[], sectionCount: number) {
  const forced = new Map<number, number>();
  for (const lake of lakes) {
    const row = Math.round(legacyGroundY(Math.floor(lake.x / SECTION)) / TILE);
    for (let s = 0; s < sectionCount; s++) {
      const overlaps = s * SECTION < lake.x + lake.width + SECTION && (s + 1) * SECTION > lake.x - SECTION;
      if (overlaps) forced.set(s, row);
    }
  }
  return forced;
}

/**
 * Hàng mặt đất cho từng SECTION: bước đổi tối đa 1 ô giữa hai SECTION kề nhau, nên mọi đoạn bằng dài
 * tối thiểu 8 ô. Quy hoạch động chọn đường đi gần mục tiêu cũ nhất, có nhiễu xác định theo seed.
 */
export function sectionRows(lakes: readonly Lake[], seed: number, sectionCount: number): number[] {
  const target = Array.from({length: sectionCount}, (_, s) => legacyGroundY(s) / TILE);
  const forced = lakeSections(lakes, sectionCount);
  const low = Math.floor(Math.min(...target)) - 3;
  const high = Math.ceil(Math.max(...target)) + 3;
  const width = high - low + 1;
  const allowed = (s: number, h: number) => {
    const fixed = forced.get(s);
    if (fixed !== undefined) return h === fixed;
    return Math.abs(h - target[s]) <= MAX_DEVIATION_ROWS;
  };
  const local = (s: number, h: number) => {
    if (forced.has(s)) return 0;
    return Math.abs(h - target[s]) + NOISE * hash01(seed, s, h);
  };
  const best = new Float64Array(sectionCount * width).fill(Infinity);
  const back = new Int16Array(sectionCount * width).fill(-1);
  for (let i = 0; i < width; i++) {
    if (allowed(0, low + i)) best[i] = local(0, low + i);
  }
  for (let s = 1; s < sectionCount; s++) {
    for (let i = 0; i < width; i++) {
      const h = low + i;
      if (!allowed(s, h)) continue;
      for (let j = Math.max(0, i - 1); j <= Math.min(width - 1, i + 1); j++) {
        const total = best[(s - 1) * width + j] + local(s, h) + (j === i ? 0 : STEP_PENALTY);
        if (total < best[s * width + i]) {
          best[s * width + i] = total;
          back[s * width + i] = j;
        }
      }
    }
  }
  let index = -1;
  let cost = Infinity;
  for (let i = 0; i < width; i++) {
    const value = best[(sectionCount - 1) * width + i];
    if (value < cost) {
      cost = value;
      index = i;
    }
  }
  if (index < 0) throw new Error('Không tìm được đường cao độ thỏa ràng buộc');
  const rows = new Array<number>(sectionCount);
  for (let s = sectionCount - 1; s >= 0; s--) {
    rows[s] = low + index;
    index = back[s * width + index];
  }
  return rows;
}

/** Hàng mặt đất theo từng cột ô; cột thừa cuối (không đủ SECTION) lấy theo SECTION cuối. */
export function surfaceColumns(cols: number, rows: number[]) {
  const surface = new Int16Array(cols);
  for (let c = 0; c < cols; c++) {
    const s = Math.min(rows.length - 1, Math.floor(c / SECTION_COLS));
    surface[c] = rows[s];
  }
  return surface;
}
