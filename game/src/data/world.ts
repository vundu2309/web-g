import type {Habitat} from './catalog.ts';
import {buildExpandedTerrain} from '../domain/tilemap/expandedTerrain.ts';
import {WORLD_WIDTH, WORLD_HEIGHT, OCEAN_X} from './worldLayout.ts';
export {WORLD_WIDTH, WORLD_HEIGHT} from './worldLayout.ts';
import {TileGrid} from '../domain/tilemap/grid.ts';
import {TILE} from '../domain/tilemap/types.ts';
export const SECTION = 256,
  TERRAIN_SEED = 2026;
export const waters: {id: string; name: string; x: number; width: number; habitat: Habitat}[] = [
  {id: 'pond', name: 'Ao Sen', x: 768, width: 512, habitat: 'pond'},
  {id: 'lake', name: 'Hồ Thông', x: 3584, width: 768, habitat: 'lake'},
  {id: 'river', name: 'Suối Đá', x: 6656, width: 512, habitat: 'river'},
  {id: 'mirror', name: 'Hồ Gương', x: 9984, width: 768, habitat: 'lake'},
  {id: 'spring', name: 'Suối Trăng', x: 13312, width: 512, habitat: 'river'},
  {id: 'ancient', name: 'Hồ Cổ Thụ', x: 17920, width: 768, habitat: 'lake'},
  {id: 'jade', name: 'Hồ Ngọc', x: 23040, width: 1024, habitat: 'lake'},
  {id: 'ocean', name: 'Biển Lam', x: OCEAN_X, width: WORLD_WIDTH - OCEAN_X, habitat: 'sea'},
];
/** Thác nước: đáy thác và mặt đất quanh nó phải phẳng; x của thác giữ nguyên từ bản cũ. */
export const WATERFALL_X = 7350;
/** x của cổng vòm phế tích (vẽ trong WorldRenderer). */
export const RUINS_X = 13950;
/** Khoảng phẳng bắt buộc quanh thác (bao phủ hình thác từ wx-60 đến wx+112). */
export const flatSpans = [{x: WATERFALL_X - 64, width: 192}];
export const resourceNodes = Array.from({length: 144}, (_, i) => ({
  id: 'node-' + i,
  x: 350 + i * 210,
  kind: i % 3 === 0 ? ('stone' as const) : ('wood' as const),
})).filter((n) => !waters.some((w) => n.x > w.x - 90 && n.x < w.x + w.width + 90));
export function waterAt(x: number) {
  return waters.find((w) => x >= w.x - 60 && x <= w.x + w.width + 60);
}
export const regions = [
  {x: 0, name: 'THUNG LŨNG AO SEN'},
  {x: 3200, name: 'RỪNG THÔNG SƯƠNG'},
  {x: 6400, name: 'THÁC NGÂN HÀ'},
  {x: 9600, name: 'ĐÈO TRĂNG'},
  {x: 12800, name: 'PHẾ TÍCH TRÊN MÂY'},
  {x: 16000, name: 'RỪNG CỔ THỤ'},
  {x: 19200, name: 'THẢO NGUYÊN HOA'},
  {x: 22400, name: 'HỒ NGỌC'},
  {x: 25600, name: 'BỜ CÁT TRẮNG'},
  {x: 28800, name: 'BIỂN SÂU'},
];
/** Lưới ô của toàn thế giới; sinh một lần khi nạp module (xác định theo TERRAIN_SEED). */
export const terrainGrid = new TileGrid(
  buildExpandedTerrain({
    cols: WORLD_WIDTH / TILE,
    rows: Math.ceil(WORLD_HEIGHT / TILE),
    seed: TERRAIN_SEED,
    lakes: waters,
    flats: flatSpans,
  }),
);
export function groundAt(x: number) {
  return terrainGrid.groundAt(x);
}
/** Đoạn mặt đất để dựng va chạm tĩnh. */
export function groundRuns() {
  return terrainGrid.solidRuns();
}
export function regionAt(x: number) {
  return regions[Math.min(regions.length - 1, Math.floor(Math.max(0, x) / 3200))];
}

export function nearestWater(x: number) {
  const distance = (water: (typeof waters)[number]) => Math.max(water.x - x, x - water.x - water.width, 0);
  return waters.reduce((nearest, water) => (distance(water) < distance(nearest) ? water : nearest));
}
export function waterDirections(x: number) {
  const water = nearestWater(x);
  const side = x < water.x ? 'bên phải' : 'bên trái';
  return 'Đến gần gỗ/đá để thu thập, hoặc tới ' + water.name + ' phía ' + side + ' để câu cá.';
}
