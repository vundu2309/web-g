import {hash01} from '../tilemap/random.ts';
import {type Art} from './art.ts';
import {FERN, LILY, LOTUS, REED, REED_HEAD_LIGHT, ROOT} from './tones.ts';
import {type VegetationWorld} from './world.ts';

const SEED = 0x7e11;

/** Cụm dương xỉ: năm lá mỗi cụm, rộng tối đa 9 pixel mỗi bên; cách mép chunk đủ xa để không bị cắt. */
export function paintFern(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 1) < 0.975 || px < 12 || px > art.w - 13) return;
  for (let f = 0; f < 5; f++) {
    const dir = f % 2 ? 1 : -1;
    const spread = 0.5 + f * 0.25;
    const len = 3 + Math.floor(hash01(SEED, wx, 10 + f) * 4);
    for (let k = 0; k <= len; k++) {
      const x = px + dir * Math.round(k * spread);
      const y = gy - 1 - k;
      art.put(x, y, k === len ? FERN[3] : FERN[0]);
      if (k > 1) art.put(x + (k % 2 ? 1 : -1) * dir, y, FERN[k > len / 2 ? 1 : 2]);
    }
  }
}

/** Sậy: vài thân cao 16–26 pixel nghiêng nhẹ, đầu nâu. Chỉ gọi ở dải bờ hồ. */
export function paintReeds(art: Art, px: number, gy: number, wx: number) {
  if (hash01(SEED, wx, 2) < 0.8 || px < 3 || px > art.w - 4) return;
  const stalks = 2 + Math.floor(hash01(SEED, wx, 3) * 3);
  for (let s = 0; s < stalks; s++) {
    const x = px + s - 1;
    const h = 16 + Math.floor(hash01(SEED, wx, 20 + s) * 11);
    const lean = hash01(SEED, wx, 30 + s) > 0.5 ? 1 : 0;
    for (let k = 0; k < h; k++) {
      const sx = x + Math.floor((k * lean) / 8);
      art.put(sx, gy - 1 - k, k < 2 ? REED.dark : REED.stalk);
    }
    const top = gy - 1 - h;
    art.put(x, top - 1, REED.head);
    art.put(x, top - 2, REED.head);
    art.put(x, top, REED_HEAD_LIGHT);
    art.put(x + 1, top - 1, REED.head);
  }
}

/**
 * Lá sen trên mặt nước: hai pixel sâu hơn mặt nước vì ván lối gỗ che hàng đầu; đôi khi có hoa sen nhỏ ở trên.
 * `wy` là hàng mặt nước của cột.
 */
export function paintLily(art: Art, px: number, wy: number, wx: number) {
  const n = hash01(SEED, wx, 4);
  if (n < 0.9 || px < 3 || px > art.w - 4) return;
  const pad = wy + 2;
  for (let x = px - 2; x <= px + 2; x++) art.put(x, pad, LILY.padLight);
  for (let x = px - 1; x <= px + 2; x++) art.put(x, pad + 1, LILY.padDark);
  if (n < 0.985) return;
  art.put(px - 1, pad - 1, LOTUS.petal);
  art.put(px, pad - 2, LOTUS.light);
  art.put(px + 1, pad - 1, LOTUS.petal);
  art.put(px, pad - 1, LOTUS.core);
}

/** Rễ rủ ở mép trên của bậc cao độ: chỉ tại cột cuối của ô cao khi bên cạnh xuống thấp hơn. */
export function paintRoots(art: Art, px: number, gy: number, wx: number, world: VegetationWorld) {
  const ground = world.groundAt(wx);
  const drop = world.groundAt(wx + 2) > ground || world.groundAt(wx - 2) > ground;
  if (!drop || hash01(SEED, wx, 5) < 0.5) return;
  const len = 3 + Math.floor(hash01(SEED, wx, 6) * 5);
  for (let k = 0; k < len; k++) art.put(px, gy + k, ROOT[k % 2 ? 1 : 0]);
  art.put(px, gy + len, ROOT[2]);
}
