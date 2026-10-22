import {type TerrainData} from './types.ts';

/** Đặt loại ô và cờ nước; bỏ qua ô ngoài lưới. */
export function setCell(data: TerrainData, c: number, r: number, kind: number, water: number) {
  if (c < 0 || c >= data.cols || r < 0 || r >= data.rows) return;
  const i = r * data.cols + c;
  data.kinds[i] = kind;
  data.water[i] = water;
}
