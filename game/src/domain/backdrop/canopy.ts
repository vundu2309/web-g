import {hash01} from '../tilemap/random.ts';

/** Mỗi phần tán có năm số: loại (0 tròn, 1 tầng cây thông), rồi bốn tham số theo loại. */
export const CANOPY_STRIDE = 5;
export const CANOPY_ROUND = 0;
export const CANOPY_TIER = 1;

const ROUND_COUNT = 52;
const PINE_COUNT = 22;
const TIERS = 3;

/**
 * Các khối tán theo seed, tính theo chiều cao so với mặt nền (âm là phía trên).
 * Tán lá rộng: vòng tròn [loại, x, y, bán kính, 0]; cây thông: tầng tam giác [loại, x, đỉnh, đáy, nửa rộng].
 */
export function canopyLayout(width: number, seed: number, pine: boolean) {
  const count = pine ? PINE_COUNT : ROUND_COUNT;
  const out = new Float32Array(pine ? count * TIERS * CANOPY_STRIDE : count * CANOPY_STRIDE);
  if (pine) return pineLayout(width, seed, count, out);
  for (let i = 0; i < count; i++) {
    const o = i * CANOPY_STRIDE;
    const r = 11 + hash01(seed, i, 4) * 14;
    out[o] = CANOPY_ROUND;
    out[o + 1] = (i * width) / count + hash01(seed, i, 5) * 6;
    out[o + 2] = -r * 0.4;
    out[o + 3] = r;
  }
  return out;
}

function pineLayout(width: number, seed: number, count: number, out: Float32Array) {
  for (let i = 0; i < count; i++) {
    const h = 48 + hash01(seed, i, 6) * 26;
    const half = 13 + hash01(seed, i, 7) * 7;
    const x = (i * width) / count + hash01(seed, i, 8) * 4;
    for (let k = 0; k < TIERS; k++) {
      const o = (i * TIERS + k) * CANOPY_STRIDE;
      const apex = -h + k * h * 0.28;
      out[o] = CANOPY_TIER;
      out[o + 1] = x;
      out[o + 2] = apex;
      out[o + 3] = apex + h * 0.55;
      out[o + 4] = half * (0.5 + 0.25 * k);
    }
  }
  return out;
}
