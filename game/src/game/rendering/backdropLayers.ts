import {canopyLayout, CANOPY_ROUND, CANOPY_STRIDE} from '../../domain/backdrop/canopy.ts';
import {cloudLayout, CLOUD_SHAPES, CLOUD_STRIDE} from '../../domain/backdrop/clouds.ts';
import {mixColor} from '../../domain/backdrop/mix.ts';
import {ridgeLine} from '../../domain/backdrop/ridge.ts';
import {hash01} from '../../domain/tilemap/random.ts';
import type {BackdropPixels} from './backdropPixels.ts';

/** Một tile nền rộng 512 điểm ảnh nghệ thuật (lặp ngang không lộ nối); mỗi điểm ảnh là 2 đơn vị thế giới. */
export const BACKDROP_WIDTH = 512;
const CLOUD_COUNT = 6;

/** Đường núi có viền sáng 2 điểm ảnh và sương mờ dần về chân núi (dither), như mockup. */
export function paintRidge(
  px: BackdropPixels,
  base: number,
  amp: number,
  harmonics: readonly [number, number],
  seed: number,
  tones: readonly [number, number],
  haze: number,
  hazeAmount: number,
) {
  const heights = ridgeLine(px.width, base, amp, harmonics, seed);
  for (let x = 0; x < px.width; x++) {
    const top = heights[x];
    for (let y = top; y < px.height; y++) {
      const depth = (y - top) / (base - top + 40);
      const body = y - top < 2 ? tones[1] : tones[0];
      const dither = ((x + y) & 1) === 1 ? 1 : 0.6;
      const amount = Math.min(hazeAmount, depth * hazeAmount * 1.4) * dither;
      px.put(x, y, mixColor(body, haze, amount));
    }
  }
}

/** Rừng nền: đặc dưới đường gốc, trên là các khối tán (tròn) hoặc tầng cây thông; đỉnh tán sáng hơn thân. */
export function paintForest(
  px: BackdropPixels,
  base: number,
  pine: boolean,
  body: number,
  highlight: number,
  seed: number,
) {
  for (let y = base - 2; y < px.height; y++) {
    for (let x = 0; x < px.width; x++) px.put(x, y, body);
  }
  const layout = canopyLayout(px.width, seed, pine);
  for (let o = 0; o < layout.length; o += CANOPY_STRIDE) {
    for (const shift of [-px.width, 0, px.width]) {
      const x = layout[o + 1] + shift;
      if (layout[o] === CANOPY_ROUND) paintBlob(px, x, base + layout[o + 2], layout[o + 3], body, highlight, seed);
      else paintTier(px, x, base + layout[o + 2], base + layout[o + 3], layout[o + 4], body, highlight);
    }
  }
}

function paintBlob(
  px: BackdropPixels,
  cx: number,
  cy: number,
  r: number,
  body: number,
  highlight: number,
  seed: number,
) {
  const x0 = Math.floor(cx - r);
  const y0 = Math.floor(cy - r);
  for (let y = y0; y <= cy + r; y++) {
    for (let x = x0; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy >= r * r) continue;
      const lit = dy < -r * 0.35 && hash01(seed, x, y) > 0.5;
      px.put(x, y, lit ? highlight : body);
    }
  }
}

function paintTier(
  px: BackdropPixels,
  cx: number,
  apex: number,
  bottom: number,
  half: number,
  body: number,
  highlight: number,
) {
  const height = bottom - apex;
  for (let y = Math.floor(apex); y <= bottom; y++) {
    const t = (y - apex) / height;
    const reach = half * Math.max(0, t);
    const color = t < 0.35 ? highlight : body;
    for (let x = Math.floor(cx - reach); x <= cx + reach; x++) px.put(x, y, color);
  }
}

/** Mây ba tông (sáng, giữa, bóng) với đáy phẳng; vị trí cố định theo seed và được vẽ thêm bản sao để lặp đều. */
export function paintClouds(px: BackdropPixels, tones: readonly [number, number, number], seed: number) {
  const layout = cloudLayout(px.width, seed, CLOUD_COUNT);
  for (let o = 0; o < layout.length; o += CLOUD_STRIDE) {
    const shape = CLOUD_SHAPES[layout[o + 3]];
    for (const shift of [-px.width, 0, px.width]) {
      paintCloud(px, layout[o] + shift, layout[o + 1], layout[o + 2], shape, tones);
    }
  }
}

function paintCloud(
  px: BackdropPixels,
  x: number,
  y: number,
  s: number,
  parts: readonly (readonly [number, number, number])[],
  tones: readonly [number, number, number],
) {
  for (let p = Math.floor(x - 30 * s); p <= Math.ceil(x + 44 * s); p++) {
    let top = Infinity;
    let bottom = -Infinity;
    for (const [dx, dy, r] of parts) {
      const rr = r * s;
      const d = p - (x + dx * s);
      if (Math.abs(d) >= rr) continue;
      const h = Math.sqrt(rr * rr - d * d);
      top = Math.min(top, y + dy * s - h);
      bottom = Math.max(bottom, y + dy * s + h);
    }
    if (top === Infinity) continue;
    bottom = Math.min(bottom, y + 9 * s);
    for (let py = Math.ceil(top); py <= bottom; py++) {
      const t = (py - top) / Math.max(1, bottom - top);
      px.put(p, py, t < 0.3 ? tones[0] : t < 0.7 ? tones[1] : tones[2]);
    }
  }
}
