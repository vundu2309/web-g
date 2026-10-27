import {hash01} from '../tilemap/random.ts';

/** Ba hình mây: mỗi phần là [dx, dy, bán kính] theo đơn vị điểm ảnh nghệ thuật, trước khi nhân tỉ lệ. */
export const CLOUD_SHAPES: readonly (readonly (readonly [number, number, number])[])[] = [
  [
    [-18, 4, 9],
    [-8, -3, 12],
    [8, -6, 13],
    [21, 1, 10],
    [33, 5, 8],
    [2, 6, 12],
  ],
  [
    [-14, 3, 8],
    [-4, -2, 11],
    [10, -4, 10],
    [22, 2, 8],
  ],
  [
    [-20, 2, 7],
    [-6, -4, 10],
    [6, -2, 12],
    [18, -5, 9],
    [30, 2, 7],
  ],
];

/** Mỗi mây có bốn số: x, y, tỉ lệ và chỉ số hình. */
export const CLOUD_STRIDE = 4;

/** Vị trí mây cố định theo seed, nằm trong [0, width); mây bị lặp ngang nên người vẽ phải vẽ thêm bản sao. */
export function cloudLayout(width: number, seed: number, count: number) {
  const out = new Float32Array(count * CLOUD_STRIDE);
  for (let i = 0; i < count; i++) {
    const o = i * CLOUD_STRIDE;
    out[o] = hash01(seed, i, 1) * width;
    out[o + 1] = 28 + hash01(seed, i, 2) * 52;
    out[o + 2] = 0.7 + hash01(seed, i, 3) * 0.5;
    out[o + 3] = Math.floor(hash01(seed, i, 4) * CLOUD_SHAPES.length);
  }
  return out;
}

/** Độ lệch cuộn của mây theo thời gian: trôi đều theo clock và lặp đúng sau một chu kỳ width. */
export function cloudDrift(clock: number, speed: number) {
  return clock * speed;
}
