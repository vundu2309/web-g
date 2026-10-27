import {SECTION, TILE, type Span} from './types.ts';
import {hash01} from './random.ts';

/** Công thức độ cao cũ theo SECTION (đơn vị thế giới). Chỉ dùng làm mục tiêu hình dạng. */
export function legacyGroundY(section: number) {
  return 650 - Math.round((Math.sin(section * 0.19) * 65 + section * 3.1) / 16) * 16;
}

/** Độ lệch tối đa so với công thức cũ theo hàng (1,5 ô = 48 đơn vị, dưới ngưỡng 64). */
export const MAX_DEVIATION_ROWS = 1.5;
/** Mỗi đoạn bằng tối thiểu số cột này, trừ vùng hồ và khoảng phẳng quanh thác. */
export const MIN_FLAT_RUN = 6;
const STEP_PENALTY = 0.05;
const NOISE = 0.35;
const FREE = -1;

/** Gợn đồi theo cột (đơn vị hàng): tạo bậc 1 ô thường xuyên, vẫn trong ngưỡng lệch so với công thức cũ. */
function wiggle(c: number, phase: number) {
  return 1.1 * Math.sin(c * 0.45 + phase) + 0.5 * Math.sin(c * 1.0 + phase * 1.7);
}

/**
 * Hàng bắt buộc theo cột: vùng hồ kể cả đệm một SECTION mỗi bên (mặt lối gỗ phẳng),
 * và các khoảng phẳng khác như quanh thác. Cột tự do ghi FREE.
 */
function forcedColumns(lakes: readonly Span[], flats: readonly Span[], cols: number) {
  const forced = new Int16Array(cols).fill(FREE);
  const place = (span: Span, pad: number) => {
    const row = Math.round(legacyGroundY(Math.floor(span.x / SECTION)) / TILE);
    const c0 = Math.max(0, Math.floor((span.x - pad) / TILE));
    const c1 = Math.min(cols - 1, Math.ceil((span.x + span.width + pad) / TILE) - 1);
    for (let c = c0; c <= c1; c++) forced[c] = row;
  };
  for (const lake of lakes) place(lake, SECTION);
  for (const flat of flats) place(flat, 0);
  return forced;
}

/**
 * Hàng mặt đất theo từng cột ô. Quy hoạch động theo cột: hai cột kề nhau chênh tối đa 1 ô,
 * đổi hàng chỉ sau khi đoạn hiện tại đủ MIN_FLAT_RUN cột (hoặc ở vùng bắt buộc), và bám mục tiêu cũ
 * với nhiễu xác định theo seed. Cùng đầu vào luôn cho cùng kết quả.
 */
export function columnRows(lakes: readonly Span[], flats: readonly Span[], seed: number, cols: number) {
  const forced = forcedColumns(lakes, flats, cols);
  const base = Float64Array.from({length: cols}, (_, c) => legacyGroundY(Math.floor((c * TILE) / SECTION)) / TILE);
  const phase = hash01(seed, 0, 1) * Math.PI * 2;
  const target = Float64Array.from({length: cols}, (_, c) => base[c] + wiggle(c, phase));
  const low = Math.floor(Math.min(...target)) - 3;
  const high = Math.ceil(Math.max(...target)) + 3;
  const height = high - low + 1;
  const run = MIN_FLAT_RUN;
  const states = height * run;
  const allowed = (c: number, i: number) => {
    if (forced[c] !== FREE) return low + i === forced[c];
    return Math.abs(low + i - base[c]) <= MAX_DEVIATION_ROWS;
  };
  const local = (c: number, i: number) => {
    if (forced[c] !== FREE) return 0;
    return Math.abs(low + i - target[c]) + NOISE * hash01(seed, c, low + i);
  };
  let cost = new Float64Array(states).fill(Infinity);
  let next = new Float64Array(states).fill(Infinity);
  const back = new Int32Array(cols * states).fill(-1);
  for (let i = 0; i < height; i++) {
    if (allowed(0, i)) cost[i * run] = local(0, i);
  }
  for (let c = 1; c < cols; c++) {
    next.fill(Infinity);
    for (let j = 0; j < height; j++) {
      for (let rp = 1; rp <= run; rp++) {
        const from = j * run + rp - 1;
        if (cost[from] === Infinity) continue;
        for (let i = Math.max(0, j - 1); i <= Math.min(height - 1, j + 1); i++) {
          if (!allowed(c, i)) continue;
          const same = i === j;
          if (!same && rp < run && forced[c - 1] === FREE) continue;
          const to = same ? i * run + Math.min(rp, run - 1) : i * run;
          const total = cost[from] + local(c, i) + (same ? 0 : STEP_PENALTY);
          if (total < next[to]) {
            next[to] = total;
            back[c * states + to] = from;
          }
        }
      }
    }
    [cost, next] = [next, cost];
  }
  let best = -1;
  for (let s = 0; s < states; s++) {
    const length = (s % run) + 1;
    if (length < run && forced[cols - 1] === FREE) continue;
    if (cost[s] < (best < 0 ? Infinity : cost[best])) best = s;
  }
  if (best < 0) throw new Error('Không tìm được đường cao độ thỏa ràng buộc');
  const rows = new Int16Array(cols);
  let s = best;
  for (let c = cols - 1; c >= 0; c--) {
    rows[c] = low + Math.floor(s / run);
    s = back[c * states + s];
  }
  return rows;
}
