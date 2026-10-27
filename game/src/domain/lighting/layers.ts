/** Từ depth này trở lên là lớp hiệu ứng: không bị chiếu sáng (lửa, quầng, nhãn, xem trước). */
export const EFFECTS_DEPTH = 21;

/** Nền (trời, mây, núi, rừng: depth âm), thế giới (chiếu sáng) và hiệu ứng (không chiếu). */
export type LightLayer = 'background' | 'world' | 'effects';

export function layerForDepth(depth: number): LightLayer {
  if (depth < 0) return 'background';
  if (depth >= EFFECTS_DEPTH) return 'effects';
  return 'world';
}
