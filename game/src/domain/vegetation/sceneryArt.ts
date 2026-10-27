import {colorNumber, palette} from '../../data/palette.ts';
import {hash01} from '../tilemap/random.ts';
import type {Art} from './art.ts';
import {BARK, FERN, FLOWERS, FLOWER_CENTER, ROCK, ROOT} from './tones.ts';

const c = colorNumber;
const SHELL = [c(palette.terrainSandLight), c(palette.terrainSandDeep), c(palette.lilyPetal)];
const CORAL = [c(palette.flowerRed), c(palette.flowerPurple), c(palette.lilyPetalLight)];

function rect(art: Art, x: number, y: number, w: number, h: number, color: number) {
  for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) art.put(x + col, y + row, color);
}
function rock(art: Art, x: number, y: number, size: number) {
  for (let dy = -size; dy < 0; dy++) {
    const span = Math.floor(Math.sqrt(Math.max(0, size * size - dy * dy)));
    for (let dx = -span; dx <= span; dx++)
      art.put(x + dx, y + dy, dy < -size * 0.6 ? ROCK[3] : dx > size * 0.3 ? ROCK[0] : ROCK[1]);
  }
  for (let dx = -size + 2; dx < size - 1; dx += 2) art.put(x + dx, y - size + 2, FERN[1]);
}

/** Bụi quả, gỗ đổ/rỗng, gốc cây, đá rêu và cụm hoa; đều trang trí, không tạo collider. */
export function paintLandScenery(art: Art, x: number, y: number, wx: number) {
  if (wx % 64 !== 1 || x < 18 || x >= art.w - 18) return;
  const kind = Math.floor(hash01(807, wx, 1) * 5);
  if (kind === 0) {
    for (let dy = -9; dy < 0; dy++) {
      const span = Math.floor(10 * Math.sqrt(Math.max(0, 1 - ((dy + 3) / 9) ** 2)));
      for (let dx = -span; dx <= span; dx++) {
        art.put(x + dx, y + dy, FERN[(dx + dy + 100) % 3]);
        if (hash01(808, wx + dx, dy) > 0.94) art.put(x + dx, y + dy, CORAL[0]);
      }
    }
  } else if (kind === 1) {
    rect(art, x - 14, y - 7, 28, 7, BARK.edge);
    rect(art, x - 13, y - 6, 26, 4, BARK.base);
    rect(art, x - 11, y - 6, 23, 1, BARK.light);
    rect(art, x - 14, y - 5, 3, 4, ROOT[2]);
    rect(art, x - 13, y - 4, 2, 2, BARK.edge);
    for (let dx = -8; dx < 12; dx += 3) art.put(x + dx, y - 7, FERN[1]);
  } else if (kind === 2) {
    rect(art, x - 5, y - 11, 10, 11, BARK.edge);
    rect(art, x - 4, y - 10, 8, 9, BARK.base);
    rect(art, x - 4, y - 11, 8, 2, BARK.light);
    rect(art, x - 2, y - 10, 4, 1, ROOT[0]);
    rect(art, x - 8, y - 2, 16, 2, BARK.mid);
  } else if (kind === 3) rock(art, x, y, 7 + Math.floor(hash01(809, wx, 1) * 6));
  else {
    for (let stem = -9; stem <= 9; stem += 3) {
      const h = 5 + Math.floor(hash01(810, wx, stem) * 8);
      rect(art, x + stem, y - h, 1, h, FERN[1]);
      const petal = FLOWERS[Math.floor(hash01(811, wx, stem) * FLOWERS.length)];
      rect(art, x + stem - 1, y - h - 1, 3, 2, petal);
      art.put(x + stem, y - h, FLOWER_CENTER);
    }
  }
}

/** Vỏ sò, sao biển, cua, gỗ dạt và cỏ cát trên bãi biển. */
export function paintBeachScenery(art: Art, x: number, y: number, wx: number) {
  if (wx % 48 !== 1 || x < 12 || x >= art.w - 12) return;
  const kind = Math.floor(hash01(812, wx, 2) * 5);
  if (kind === 0) {
    for (let dy = -5; dy <= 0; dy++) {
      for (let dx = dy; dx <= -dy; dx++) art.put(x + dx, y + dy, SHELL[(dx + 20) % 3]);
    }
  } else if (kind === 1) {
    rect(art, x - 3, y - 4, 7, 3, CORAL[0]);
    for (const dx of [-6, -4, 4, 6]) {
      art.put(x + dx, y - 2, CORAL[0]);
      art.put(x + dx, y - 1, CORAL[0]);
    }
    art.put(x - 2, y - 5, SHELL[0]);
    art.put(x + 2, y - 5, SHELL[0]);
  } else if (kind === 2) {
    rect(art, x - 9, y - 3, 18, 3, BARK.mid);
    rect(art, x - 8, y - 3, 14, 1, BARK.light);
  } else if (kind === 3) {
    for (let k = 0; k < 8; k++) art.put(x - 4 + k, y - 1 - k, FERN[2]);
    for (let k = 0; k < 8; k++) art.put(x + 4 - k, y - 1 - k, FERN[1]);
  } else if (x >= 25 && x < art.w - 25) {
    for (let h = 0; h < 34; h++) {
      const bend = Math.floor((h * h) / 220);
      rect(art, x + bend, y - h, 3, 1, h % 4 === 0 ? BARK.edge : BARK.light);
    }
    const crown = x + 5;
    for (const direction of [-1, 1]) {
      for (let tier = 0; tier < 3; tier++) {
        for (let k = 0; k < 18; k++) {
          const dy = Math.round(-Math.sin(k / 8) * (8 - tier * 2) + (k * k) / 40);
          art.put(crown + direction * k, y - 33 + dy, FERN[1]);
          art.put(crown + direction * k, y - 32 + dy + tier * 2, FERN[2]);
        }
      }
    }
    rect(art, crown - 2, y - 32, 5, 3, BARK.base);
  }
}

/** Rong, san hô, đá ngầm, vỏ sò/sao biển  nằm trong chunk; không có update mỗi frame. */
export function paintUnderwaterScenery(art: Art, x: number, surface: number, bed: number, wx: number, sea: boolean) {
  if (x < 16 || x >= art.w - 16 || wx % 32 !== 1 || bed - surface < 8) return;
  const kind = Math.floor(hash01(814, wx, 1) * 5);
  if (kind === 0) {
    const h = Math.min(bed - surface - 3, 12 + Math.floor(hash01(815, wx, 1) * 22));
    for (let k = 0; k < h; k++) {
      const dx = Math.round(Math.sin(k * 0.3 + wx) * 3);
      art.put(x + dx, bed - k - 1, FERN[1]);
      art.put(x + dx + 1, bed - k - 1, FERN[2]);
      if (k % 5 === 0) rect(art, x + dx - 3, bed - k, 4, 1, FERN[0]);
    }
  } else if (kind === 1 && sea) {
    const color = CORAL[Math.floor(hash01(816, wx, 1) * CORAL.length)];
    for (const dx of [-6, 0, 6]) {
      const h = Math.min(bed - surface - 3, 8 + Math.floor(hash01(816, wx, dx) * 11));
      rect(art, x + dx, bed - h, 2, h, color);
      rect(art, x + dx - 1, bed - h - 1, 4, 3, color);
      const arm = Math.floor(h / 2);
      rect(art, x + dx - 4, bed - arm, 5, 2, color);
      rect(art, x + dx - 4, bed - arm - 4, 2, 5, color);
      rect(art, x + dx + 1, bed - arm - 3, 5, 2, color);
      rect(art, x + dx + 4, bed - arm - 6, 2, 4, color);
    }
  } else if (kind === 2) rock(art, x, bed, Math.min(9, Math.floor((bed - surface) / 2)));
  else if (kind === 3 && sea) {
    for (let k = -4; k <= 4; k++) {
      art.put(x + k, bed - 3, CORAL[0]);
      art.put(x + Math.round(k * 0.5), bed - 3 + k, CORAL[0]);
    }
    art.put(x, bed - 3, SHELL[0]);
  }
}
