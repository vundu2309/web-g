import {ART_PIXEL} from '../../data/palette.ts';
import {LANDSCAPE_BASE_ART, LANDSCAPE_GROUND_OFFSET} from '../../data/parallax.ts';

const ANCHOR_STEP = 512;
/** Lấy đường cao độ nền liên tục trong không gian thế giới, không phụ thuộc camera/viewport/nhảy. */
export function backdropGround(x: number, width: number, groundAt: (x: number) => number) {
  const start = Math.floor(x / ANCHOR_STEP) * ANCHOR_STEP;
  const first = sample(start, width, groundAt);
  const last = sample(start + ANCHOR_STEP, width, groundAt);
  return first + (last - first) * ((x - start) / ANCHOR_STEP);
}
function sample(x: number, width: number, groundAt: (x: number) => number) {
  let sum = 0;
  for (let offset = -2; offset <= 2; offset++) {
    const at = Math.max(0, Math.min(width - 1, x + offset * 128));
    sum += groundAt(at) * (3 - Math.abs(offset));
  }
  return sum / 9;
}
export function landscapeTop(kind: keyof typeof LANDSCAPE_BASE_ART, ground: number) {
  return ground + LANDSCAPE_GROUND_OFFSET[kind] - LANDSCAPE_BASE_ART[kind] * ART_PIXEL;
}
