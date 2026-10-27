import {hash01} from '../tilemap/random.ts';

const TAU = Math.PI * 2;

/**
 * Đường núi gồ ghề: tổng hai sóng 1-|sin| với tần số nguyên theo chiều rộng tile, nên lặp ngang không lộ nối.
 * Trả về hàng y (điểm ảnh nghệ thuật) của đỉnh núi tại mỗi cột; y càng nhỏ càng cao.
 */
export function ridgeLine(
  width: number,
  base: number,
  amp: number,
  harmonics: readonly [number, number],
  seed: number,
) {
  const phaseA = hash01(seed, 1, 0) * TAU;
  const phaseB = hash01(seed, 2, 0) * TAU;
  const heights = new Int16Array(width);
  for (let x = 0; x < width; x++) {
    const u = x / width;
    const a = 1 - Math.abs(Math.sin(TAU * harmonics[0] * u + phaseA));
    const b = 1 - Math.abs(Math.sin(TAU * harmonics[1] * u + phaseB));
    heights[x] = Math.round(base - amp * (a * 0.62 + b * 0.38));
  }
  return heights;
}
