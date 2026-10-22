import type {Habitat} from './catalog.ts';
import {buildTerrainData} from '../domain/tilemap/terrain.ts';
import {TileGrid} from '../domain/tilemap/grid.ts';
import {TILE} from '../domain/tilemap/types.ts';
export const WORLD_WIDTH = 16000,
  WORLD_HEIGHT = 900,
  SECTION = 256,
  TERRAIN_SEED = 2026;
export const waters: {id: string; name: string; x: number; width: number; habitat: Habitat}[] = [
  {id: 'pond', name: 'Ao Sen', x: 768, width: 512, habitat: 'pond'},
  {id: 'lake', name: 'Hồ Thông', x: 3584, width: 768, habitat: 'lake'},
  {id: 'river', name: 'Suối Đá', x: 6656, width: 512, habitat: 'river'},
  {id: 'mirror', name: 'Hồ Gương', x: 9984, width: 768, habitat: 'lake'},
  {id: 'spring', name: 'Suối Trăng', x: 13312, width: 512, habitat: 'river'},
];
export const resourceNodes = Array.from({length: 72}, (_, i) => ({
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
];
/** Lưới ô của toàn thế giới; sinh một lần khi nạp module (xác định theo TERRAIN_SEED). */
export const terrainGrid = new TileGrid(
  buildTerrainData({cols: WORLD_WIDTH / TILE, rows: Math.ceil(WORLD_HEIGHT / TILE), seed: TERRAIN_SEED, lakes: waters}),
);
export function groundAt(x: number) {
  return terrainGrid.groundAt(x);
}
/** Đoạn mặt đất để dựng va chạm tĩnh. */
export function groundRuns() {
  return terrainGrid.solidRuns();
}
export function regionAt(x: number) {
  return regions[Math.min(4, Math.floor(Math.max(0, x) / 3200))];
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
