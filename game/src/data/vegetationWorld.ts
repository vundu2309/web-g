import {COAST_X, OCEAN_X} from './worldLayout.ts';
import type {VegetationWorld} from '../domain/vegetation/world.ts';
import {TILE} from '../domain/tilemap/types.ts';
import {groundAt, RUINS_X, regions, resourceNodes, terrainGrid, waters, WATERFALL_X, WORLD_WIDTH} from './world.ts';

/** Y của hàng nước đầu tiên tại x, hoặc null nếu cột không có nước. */
export function waterTopAt(x: number) {
  const c = terrainGrid.columnAt(x);
  const top = terrainGrid.waterSurfaceRow(c);
  return top < 0 ? null : top * TILE;
}

/** Thế giới cho lớp thực vật (T5): mọi dữ liệu lấy từ data/world, không sinh lại. */
export const vegetationWorld: VegetationWorld = {
  width: WORLD_WIDTH,
  zoneWidth: WORLD_WIDTH / regions.length,
  zones: regions.length,
  pineZones: [1, 3, 7],
  spawnX: 120,
  groundAt,
  waterTopAt,
  waterBedAt: (x) => terrainGrid.waterBedRow(terrainGrid.columnAt(x)) * TILE,
  seaFrom: OCEAN_X,
  coastFrom: COAST_X,
  lakes: waters,
  landmarks: [
    {x: COAST_X, width: WORLD_WIDTH - COAST_X},
    {x: WATERFALL_X - 160, width: 380},
    {x: RUINS_X - 40, width: 300},
  ],
  nodes: resourceNodes.map((node) => node.x),
};
