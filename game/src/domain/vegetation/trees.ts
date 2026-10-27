import {hash01} from '../tilemap/random.ts';
import {Art} from './art.ts';
import {BARK, type Ramp} from './tones.ts';

/** Lá rộng (tán tròn nhiều khối) hoặc thông (nhiều tầng tam giác). */
export type TreeKind = 'broadleaf' | 'pine';

/** Số biến thể cố định cho mỗi loại; cùng chỉ số luôn cho cùng hình. */
export const TREE_VARIANTS = 6;

export interface TreeVariant {
  kind: TreeKind;
  index: number;
  seed: number;
  /** Chiều cao thân (pixel nghệ thuật). */
  trunk: number;
  /** Bán kính tán lá rộng, hoặc chiều cao tán thông. */
  size: number;
  /** Nửa rộng tầng dưới cùng của thông. */
  halfWidth: number;
  tiers: number;
}

/** Tán đã cắt khung: `pivotX` là cột tâm tính từ mép trái; đáy tán là hàng cuối. */
export interface Canopy {
  art: Art;
  pivotX: number;
}

/** Thân cây luôn rộng 24 pixel, tâm ở cột 12; đáy thân là hàng cuối. */
export const TRUNK_WIDTH = 24;
export const TRUNK_PIVOT_X = 12;

const BLOBS: readonly (readonly [number, number, number])[] = [
  [0, 0, 1],
  [-0.85, 0.35, 0.75],
  [0.85, 0.3, 0.8],
  [-0.4, -0.5, 0.7],
  [0.45, -0.55, 0.7],
  [0, 0.55, 0.8],
];

export function treeVariant(kind: TreeKind, index: number): TreeVariant {
  const seed = (kind === 'pine' ? 300 : 100) + index;
  const r = (k: number) => hash01(seed, k, index);
  if (kind === 'pine') {
    const trunk = 13 + Math.floor(r(1) * 4);
    const size = 70 + Math.floor(r(2) * 26);
    const halfWidth = 12 + Math.floor(r(3) * 5);
    return {kind, index, seed, trunk, size, halfWidth, tiers: 4 + Math.floor(r(4) * 2)};
  }
  const trunk = 44 + Math.floor(r(1) * 11);
  const size = 24 + Math.floor(r(2) * 7);
  return {kind, index, seed, trunk, size, halfWidth: 0, tiers: 0};
}

/** Thân: sọc vỏ theo hash, nửa trái sáng, mép tối, chân loe ở 8 pixel đầu. */
export function paintTrunk(v: TreeVariant): Art {
  const H = v.trunk;
  const art = new Art(TRUNK_WIDTH, H);
  const base = v.kind === 'pine' ? 4 : 7;
  for (let y = 0; y < H; y++) {
    const d = H - 1 - y;
    const w = base + (d < 8 ? (8 - d) * 0.5 : 0);
    const half = Math.ceil(w / 2);
    for (let dx = -half; dx <= half; dx++) {
      const e = Math.abs(dx) / (w / 2);
      const h = hash01(v.seed, dx + 50, y >> 1);
      const tone = e > 0.8 ? BARK.edge : dx < -w * 0.15 ? BARK.light : h > 0.6 ? BARK.base : BARK.mid;
      art.put(TRUNK_PIVOT_X + dx, y, tone);
    }
  }
  if (v.kind === 'broadleaf') paintBranches(art, H);
  return art;
}

function paintBranches(art: Art, H: number) {
  for (let i = 0; i < 3; i++) {
    const by = H - 1 - Math.floor(H * (0.35 + 0.2 * i));
    const dir = i % 2 ? 1 : -1;
    for (let k = 0; k < 6; k++) {
      art.put(TRUNK_PIVOT_X + dir * (3 + k), by - Math.floor(k * 0.6), k > 3 ? BARK.edge : BARK.mid);
    }
  }
}

/** Tán lá rộng: sáu khối tròn chồng nhau, sáng trên-trái, viền tối ở đáy/phải, chấm đậm theo hash. */
export function paintBroadleaf(v: TreeVariant, ramp: Ramp): Canopy {
  const R = v.size;
  const W = 2 * Math.ceil(1.4 * R) + 4;
  const H = 2 * Math.ceil(1.1 * R) + 4;
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  const mask = new Uint8Array(W * H);
  for (const [bx, by, bs] of BLOBS) {
    const rr = R * bs * 0.62;
    const ox = cx + bx * R * 0.8;
    const oy = cy + by * R * 0.55;
    for (let yy = -Math.ceil(rr); yy <= rr; yy++) {
      for (let xx = -Math.ceil(rr); xx <= rr; xx++) {
        if (xx * xx + yy * yy >= rr * rr) continue;
        const px = Math.round(ox + xx);
        const py = Math.round(oy + yy);
        if (px >= 0 && py >= 0 && px < W && py < H) mask[py * W + px] = 1;
      }
    }
  }
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? mask[y * W + x] : 0);
  const art = new Art(W, H);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (!at(px, py)) continue;
      const edge = !at(px, py + 1) || !at(px + 1, py);
      const light = ((px - cx) * -0.45 + (py - cy) * -0.75) / R + hash01(v.seed, px, py) * 0.55;
      const shade = light > 0.62 ? ramp.sun : light > 0.28 ? ramp.light : light > -0.12 ? ramp.mid : ramp.dark;
      const speck = hash01(v.seed + 5, px, py) > 0.93;
      art.put(px, py, edge ? ramp.edge : speck ? ramp.dark : shade);
    }
  }
  return cropCanopy(art, cx);
}

/** Thông: các tầng tam giác từ đỉnh xuống, tầng dưới rộng nhất; sáng bên trái, tối bên phải, đáy tầng sẫm. */
export function paintPine(v: TreeVariant, ramp: Ramp): Canopy {
  const H = v.size + 4;
  const W = 2 * (v.halfWidth + 3) + 2;
  const cx = Math.floor(W / 2);
  const art = new Art(W, H);
  const bottom = H - 2;
  const apex = bottom - v.size;
  const tierH = v.size * 0.42;
  const step = (v.size - tierH) / (v.tiers - 1);
  for (let k = v.tiers - 1; k >= 0; k--) {
    const top = apex + k * step;
    const half = v.halfWidth * (0.45 + (0.55 * (k + 1)) / v.tiers);
    for (let y = Math.floor(top); y <= Math.round(top + tierH); y++) {
      const t = (y - top) / tierH;
      const span = half * t;
      for (let dx = -Math.ceil(span); dx <= Math.ceil(span); dx++) {
        if (Math.abs(dx) > span) continue;
        const ratio = span > 0 ? dx / span : 0;
        const noise = hash01(v.seed, cx + dx, y) - 0.5;
        const l = -ratio * 0.6 + (1 - t) * 0.25 + noise * 0.35;
        let col = l > 0.5 ? ramp.sun : l > 0.2 ? ramp.light : l > -0.1 ? ramp.mid : ramp.dark;
        if (span > 2 && Math.abs(dx) >= span - 0.7) col = dx < 0 ? ramp.light : ramp.edge;
        if (y >= top + tierH - 1) col = ramp.edge;
        art.put(cx + dx, y, col);
      }
    }
  }
  return cropCanopy(art, cx);
}

function cropCanopy(art: Art, cx: number): Canopy {
  const b = art.bounds();
  if (!b) throw new Error('tán cây rỗng');
  return {art: art.crop(b), pivotX: cx - b.minX};
}
