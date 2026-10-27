import {PERIOD_COUNT} from '../backdrop/periods.ts';
import {AMBIENT, BLOOM_BY_PERIOD, SKY_BY_PERIOD} from './lightConfig.ts';
import type {SourceField} from './sources.ts';

/** Vùng ô cần tổng hợp (góc trên-trái và kích thước, theo ô thế giới). */
export interface LightWindow {
  c0: number;
  r0: number;
  cols: number;
  rows: number;
}

/** Trường ánh sáng trời của cả lưới (chỉ số r·cols + c). */
export interface SkyField {
  cols: number;
  rows: number;
  values: Float32Array;
}

/** Ghi màu trời (r, g, b) theo trọng số ba trạng thái vào `out` (ba số). Không cấp phát. */
export function skyTint(weights: ArrayLike<number>, out: Float64Array) {
  for (let ch = 0; ch < 3; ch++) {
    let sum = 0;
    for (let p = 0; p < PERIOD_COUNT; p++) sum += weights[p] * SKY_BY_PERIOD[p][ch];
    out[ch] = sum;
  }
}

/** Cường độ quầng sáng theo trọng số giờ: ban ngày yếu, đêm mạnh. */
export function bloomStrength(weights: ArrayLike<number>) {
  let sum = 0;
  for (let p = 0; p < PERIOD_COUNT; p++) sum += weights[p] * BLOOM_BY_PERIOD[p];
  return sum;
}

function skyValue(sky: SkyField, c: number, r: number) {
  if (r < 0) return 1;
  if (c < 0 || r >= sky.rows || c >= sky.cols) return 0;
  return sky.values[r * sky.cols + c];
}

/**
 * Tổng hợp màu ánh sáng theo ô cho một vùng: màu = max(trời × màuTrời, max_nguồn(trường × màuNguồn)) theo từng kênh,
 * kẹp tối thiểu AMBIENT. Ghi RGBA vào `out` (4 byte mỗi ô, theo hàng); chỉ đọc trường, không cấp phát.
 * Giá trị 255 là giữ nguyên màu khi nhân lên lớp thế giới; nhỏ hơn là tối đi.
 */
export function composeLight(
  sky: SkyField,
  skyRgb: ArrayLike<number>,
  fields: readonly SourceField[],
  win: LightWindow,
  out: Uint8ClampedArray,
) {
  for (let y = 0; y < win.rows; y++) {
    const r = win.r0 + y;
    for (let x = 0; x < win.cols; x++) {
      const c = win.c0 + x;
      const s = skyValue(sky, c, r);
      const o = (y * win.cols + x) * 4;
      writeCell(out, o, s, skyRgb, fields, c, r);
      out[o + 3] = 255;
    }
  }
}

function writeCell(
  out: Uint8ClampedArray,
  o: number,
  s: number,
  skyRgb: ArrayLike<number>,
  fields: readonly SourceField[],
  c: number,
  r: number,
) {
  for (let ch = 0; ch < 3; ch++) {
    let value = s * skyRgb[ch];
    for (const field of fields) {
      const lx = c - field.c0;
      const ly = r - field.r0;
      if (lx < 0 || ly < 0 || lx >= field.side || ly >= field.side) continue;
      const v = field.values[ly * field.side + lx] * field.spec.rgb[ch];
      if (v > value) value = v;
    }
    const clamped = value < AMBIENT ? AMBIENT : value > 1 ? 1 : value;
    out[o + ch] = Math.round(clamped * 255);
  }
}
