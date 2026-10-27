import {hash01} from '../tilemap/random.ts';
import {type Art} from './art.ts';
import {
  CAP_DOT,
  CAP_RED,
  CAP_TEAL,
  CAP_TEAL_DARK,
  FLOWERS,
  FLOWER_CENTER,
  GRASS,
  GRASS_SUN,
  MUSHROOM_STEM,
  ROCK,
  STEM,
} from './tones.ts';

const SEED = 0x6a55;

/** Cỏ, hoa, nấm và đá nhỏ. `px`/`gy` là cột và hàng mặt đất trong chunk; `wx` là x thế giới để băm. */

export function paintGrass(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 1) > 0.55) return;
  const h = 1 + Math.floor(hash01(SEED, wx, 2) * 4);
  for (let k = 0; k < h; k++) art.put(px, gy - 1 - k, k === h - 1 ? GRASS_SUN : GRASS[(k + px) % 3]);
  if (hash01(SEED, wx, 3) > 0.6) art.put(px + 1, gy - 1, GRASS[1]);
}

export function paintFlower(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 4) < 0.985) return;
  const h = 3 + Math.floor(hash01(SEED, wx, 5) * 3);
  for (let k = 0; k < h; k++) art.put(px, gy - 1 - k, STEM);
  const top = gy - 1 - h;
  const petal = FLOWERS[Math.floor(hash01(SEED, wx, 6) * FLOWERS.length)];
  art.put(px - 1, top, petal);
  art.put(px + 1, top, petal);
  art.put(px, top - 1, petal);
  art.put(px, top, FLOWER_CENTER);
}

export function paintMushroom(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 7) < 0.994 || px < 3 || px > art.w - 4) return;
  for (let k = 1; k <= 3; k++) art.put(px, gy - k, MUSHROOM_STEM);
  const teal = hash01(SEED, wx, 8) > 0.6;
  for (let x = px - 2; x <= px + 2; x++) art.put(x, gy - 4, teal ? CAP_TEAL_DARK : CAP_RED);
  for (let x = px - 1; x <= px + 1; x++) art.put(x, gy - 5, teal ? CAP_TEAL : CAP_RED);
  if (!teal) art.put(px - 1, gy - 5, CAP_DOT);
  if (!teal) art.put(px + 2, gy - 4, CAP_DOT);
}

/** Đá nhỏ 3–6 pixel: đáy tối, mặt trên sáng, nửa trái sáng hơn nửa phải. */
export function paintRock(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 9) < 0.992) return;
  const w = 3 + Math.floor(hash01(SEED, wx, 10) * 4);
  const x0 = px - (w >> 1);
  if (x0 < 0 || x0 + w > art.w) return;
  const h = w > 4 ? 3 : 2;
  for (let k = 0; k < h; k++) {
    for (let j = 0; j < w; j++) {
      const edge = j === 0 || j === w - 1;
      let tone = j < w / 2 ? ROCK[2] : ROCK[1];
      if (k === h - 1) tone = ROCK[3];
      if (k === 0 || (edge && k > 0)) tone = ROCK[0];
      art.put(x0 + j, gy - 1 - k, tone);
    }
  }
}
