import {mixColor} from './mix.ts';

/** Số dải màu của trời; mỗi dải chuyển sang dải kế bằng dither Bayer 4×4. */
export const SKY_BANDS = 14;
/** Chiều cao (điểm ảnh nghệ thuật) mà dải trời chạy từ đỉnh xuống; phía dưới là màu chân trời. */
export const SKY_SPAN = 160;

/** Bayer 4×4 đã chuẩn hóa về (0, 1), theo hàng rồi cột. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** Mức màu (0..SKY_BANDS) của điểm ảnh (x, y) trong trời; cùng vị trí luôn cho cùng mức. */
export function skyLevel(x: number, y: number) {
  const pos = Math.min(1, y / SKY_SPAN) * SKY_BANDS;
  const band = Math.floor(pos);
  const threshold = BAYER[((y & 3) << 2) + (x & 3)];
  const up = pos - band > threshold ? 1 : 0;
  return Math.min(SKY_BANDS, band + up);
}

/** Màu của một mức: nội suy đỉnh → giữa → chân trời (0xRRGGBB). */
export function skyColor(level: number, top: number, mid: number, low: number) {
  const b = level / SKY_BANDS;
  return b < 0.5 ? mixColor(top, mid, b * 2) : mixColor(mid, low, (b - 0.5) * 2);
}
