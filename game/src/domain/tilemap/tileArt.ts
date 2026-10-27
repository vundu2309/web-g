import {type TileGrid} from './grid.ts';
import {hash01} from './random.ts';
import {TILE, TILE_ART, type TileKind} from './types.ts';
import {PEBBLE, REGION_MIX, RIM_DARK, RIM_LIGHT, TONES, blend, pack, regionTint} from './tileColors.ts';

const SEED = 0x7a11;
export const UP = 1;
export const DOWN = 2;
export const LEFT = 4;
export const RIGHT = 8;
const GRASS_SIDE_ROWS = 9;

/** Tông vùng cho từng cột ô; tính một lần khi dựng lưới. */
export function columnTints(grid: TileGrid) {
  return Int32Array.from({length: grid.cols}, (_, c) => regionTint(c * TILE + TILE / 2));
}

/** Bit các cạnh tiếp xúc không khí (nước tính là thoáng). Dùng cho autotile và cỏ. */
export function openMask(grid: TileGrid, c: number, r: number) {
  let mask = 0;
  if (!grid.isSolid(c, r - 1)) mask |= UP;
  if (!grid.isSolid(c, r + 1)) mask |= DOWN;
  if (!grid.isSolid(c - 1, r)) mask |= LEFT;
  if (!grid.isSolid(c + 1, r)) mask |= RIGHT;
  return mask;
}

/**
 * Một điểm ảnh của ô (c, r) tại (px, py) trong ô 16×16, đóng gói RGBA.
 * Lớp đất/đá (waterLayer = false) và lớp nước (true) được vẽ riêng; ô trống trả 0 (trong suốt).
 */
export function tilePixel(
  grid: TileGrid,
  tints: Int32Array,
  c: number,
  r: number,
  px: number,
  py: number,
  waterLayer: boolean,
) {
  if (grid.isWater(c, r)) return waterLayer ? waterPixel(grid, c, r, px, py) : 0;
  if (waterLayer) return 0;
  const kind = grid.kindAt(c, r);
  if (kind === 'air') return wallPixel(grid, c, r, px, py);
  const mask = openMask(grid, c, r);
  return pack(solidRgb(grid, c, r, px, py, mask, tints[c]), 255);
}

function solidRgb(grid: TileGrid, c: number, r: number, px: number, py: number, mask: number, tint: number) {
  const kind = grid.kindAt(c, r);
  let col = materialRgb(grid, kind, c, r, px, py, mask);
  if (kind !== 'crystal') col = blend(col, tint, REGION_MIX);
  if (kind !== 'dirt' && (mask & UP) !== 0 && py === 0) col = blend(col, RIM_LIGHT, 0.28);
  if ((mask & DOWN) !== 0 && py === TILE_ART - 1) col = blend(col, RIM_DARK, 0.3);
  if ((mask & LEFT) !== 0 && px === 0) col = blend(col, RIM_DARK, 0.22);
  if ((mask & RIGHT) !== 0 && px === TILE_ART - 1) col = blend(col, RIM_DARK, 0.22);
  return col;
}

function materialRgb(grid: TileGrid, kind: TileKind, c: number, r: number, px: number, py: number, mask: number) {
  const gx = c * TILE_ART + px;
  const gy = r * TILE_ART + py;
  const n = hash01(SEED, gx >> 1, gy >> 1) * 0.6 + hash01(SEED + 1, gx, gy) * 0.4;
  switch (kind) {
    case 'dirt':
      return dirtRgb(grid, c, r, px, py, mask, n);
    case 'sand':
      return hash01(SEED + 6, gx, gy) > 0.97 ? TONES.sand[2] : pickTone(TONES.sand, n);
    case 'copper':
      return oreRgb(TONES.copper, gx, gy, px, py, stoneRgb(gx, gy, n));
    case 'iron':
      return oreRgb(TONES.iron, gx, gy, px, py, stoneRgb(gx, gy, n));
    case 'crystal':
      return crystalRgb(c, r, px, py, stoneRgb(gx, gy, n));
    default:
      return stoneRgb(gx, gy, n);
  }
}

/** Mảng đất: cỏ phủ trên mặt có không khí và rủ xuống mép bên; sâu cỏ đổi theo từng cột điểm ảnh. */
function dirtRgb(grid: TileGrid, c: number, r: number, px: number, py: number, mask: number, n: number) {
  const gx = c * TILE_ART + px;
  const gy = r * TILE_ART + py;
  const top = (mask & UP) !== 0 && !grid.isWater(c, r - 1);
  const drip = py < GRASS_SIDE_ROWS && (((mask & LEFT) !== 0 && px < 2) || ((mask & RIGHT) !== 0 && px > 13));
  const depth = 3 + Math.floor(hash01(SEED + 4, gx, 0) * 3);
  if ((top && py < depth) || drip) {
    if (py === depth - 1 || (drip && py === GRASS_SIDE_ROWS - 1)) return TONES.grass[2];
    if (py === 0) return TONES.grass[3];
    return pickTone(TONES.grass, n);
  }
  if (hash01(SEED + 2, gx, gy) > 0.988) return TONES.dirt[2];
  if (hash01(SEED + 3, gx >> 1, gy >> 1) > 0.95 && ((px + py) & 1) === 0) return PEBBLE;
  return pickTone(TONES.dirt, n);
}

function stoneRgb(gx: number, gy: number, n: number) {
  const seam = (gx + gy * 2 + Math.floor(hash01(SEED + 4, gx >> 3, gy >> 3) * 8)) % 11 === 0;
  if (seam && hash01(SEED + 5, gx >> 2, gy >> 2) > 0.62) return TONES.stone[2];
  return pickTone(TONES.stone, n);
}

/** Quặng: cụm hình tròn lệch trong ô đá, có điểm sáng ở góc trên trái. */
function oreRgb(tones: readonly number[], gx: number, gy: number, px: number, py: number, base: number) {
  const dx = px - 7.5;
  const dy = py - 7.5;
  const radius = 5.5 + hash01(SEED + 7, gx, gy) * 2.2;
  const inside = dx * dx + dy * dy < radius * radius && hash01(SEED + 8, gx >> 1, gy >> 1) > 0.3;
  if (!inside) return base;
  if (py < 8 && px < 8 && hash01(SEED + 9, gx, gy) > 0.6) return tones[1];
  const v = hash01(SEED + 10, gx, gy);
  if (v < 0.5) return tones[0];
  return v < 0.8 ? tones[2] : tones[1];
}

/** Đá có một mảnh pha lê tĩnh (ổn định theo tọa độ ô); T6 sẽ làm phát sáng. */
function crystalRgb(c: number, r: number, px: number, py: number, base: number) {
  const cx = 4 + Math.floor(hash01(SEED + 11, c, r) * 8);
  const cy = 4 + Math.floor(hash01(SEED + 12, c, r) * 8);
  const dy = py - cy;
  const d = Math.abs(px - cx) + Math.abs(dy);
  if (d > 3) return base;
  if (dy > 0) return TONES.crystal[2];
  return d <= 1 ? TONES.crystal[0] : TONES.crystal[1];
}

/** Tường nền: tối hơn đá, có mạch gạch mờ, không có viền sáng/tối kiểu bevel. */
function wallPixel(grid: TileGrid, c: number, r: number, px: number, py: number) {
  const wall = grid.wallAt(c, r);
  if (wall === 'none') return 0;
  const gx = c * TILE_ART + px;
  const gy = r * TILE_ART + py;
  const tones = wall === 'wallDirt' ? TONES.wallDirt : TONES.wallStone;
  let col = pickTone(tones, hash01(SEED + 15, gx >> 1, gy >> 1) * 0.6 + hash01(SEED + 16, gx, gy) * 0.4);
  if ((gy + ((gx >> 3) & 1) * 4) % 8 === 0) col = blend(col, RIM_DARK, 0.18);
  if (gx % 8 === 0) col = blend(col, RIM_DARK, 0.1);
  return pack(col, 255);
}

/** Nước trong lòng hồ: đậm dần theo độ sâu (0 là hàng mặt nước ngang lối gỗ), vạch sáng và lấp lánh cố định. */
function waterPixel(grid: TileGrid, c: number, r: number, px: number, py: number) {
  const depth = r - grid.waterSurfaceRow(c);
  const gx = c * TILE_ART + px;
  const gy = r * TILE_ART + py;
  let col = blend(TONES.water[0], TONES.water[1], Math.min(1, (depth + py / TILE_ART) / 3));
  const sea = grid.surfaceRow(c) > grid.waterSurfaceRow(c);
  let alpha = sea ? Math.min(255, 210 + depth * 12) : 168;
  if (depth === 0 && py === 0) {
    col = TONES.water[2];
    alpha = 230;
  } else if (depth === 0 && py === 1 && hash01(SEED + 13, gx >> 1, 1) > 0.55) {
    col = TONES.water[3];
    alpha = 180;
  }
  if (hash01(SEED + 14, gx >> 2, gy) > 0.93) col = blend(col, TONES.water[2], 0.35);
  return pack(col, alpha);
}

/** Chọn tông theo ngưỡng ngẫu nhiên đã băm: giữa nhiều nhất, sáng nhất hiếm nhất. */
function pickTone(tones: readonly number[], n: number) {
  if (n < 0.45) return tones[0];
  if (n < 0.75) return tones[1];
  if (n < 0.92) return tones[2];
  return tones[3];
}
