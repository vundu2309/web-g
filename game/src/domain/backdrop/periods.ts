import {DAY_SECONDS} from '../dayTime.ts';

/** Trọng số ngày (0), hoàng hôn (1), đêm (2); tổng luôn bằng 1. Bình minh dùng bảng hoàng hôn. */
export const PERIOD_DAY = 0;
export const PERIOD_DUSK = 1;
export const PERIOD_NIGHT = 2;
export const PERIOD_COUNT = 3;

interface Key {
  hour: number;
  weights: readonly [number, number, number];
}

const KEYS: readonly Key[] = [
  {hour: 0, weights: [0, 0, 1]},
  {hour: 4.5, weights: [0, 0, 1]},
  {hour: 6, weights: [0, 1, 0]},
  {hour: 8, weights: [1, 0, 0]},
  {hour: 15.5, weights: [1, 0, 0]},
  {hour: 18, weights: [0, 1, 0]},
  {hour: 20.5, weights: [0, 0, 1]},
  {hour: 24, weights: [0, 0, 1]},
];

/** Ghi trọng số ba bảng màu theo thời gian game vào `out` (không cấp phát). Nối bằng smoothstep: không nhảy bậc. */
export function writePeriodWeights(time: number, out: Float64Array) {
  const hour = ((((time % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS) / DAY_SECONDS) * 24;
  let i = 0;
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].hour) i++;
  const from = KEYS[i];
  const to = KEYS[i + 1];
  const t = Math.max(0, Math.min(1, (hour - from.hour) / (to.hour - from.hour)));
  const eased = t * t * (3 - 2 * t);
  for (let p = 0; p < PERIOD_COUNT; p++) {
    out[p] = from.weights[p] + (to.weights[p] - from.weights[p]) * eased;
  }
}
