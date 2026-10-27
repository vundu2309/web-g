import {buildTerrainData} from './terrain.ts';
import {KIND_CODE, WALL_CODE, TILE, type TerrainData, type TerrainSpec} from './types.ts';
import {COAST_X, LEGACY_HEIGHT, LEGACY_WIDTH, OCEAN_X, SEA_FLOOR_END, SEA_LEVEL} from '../../data/worldLayout.ts';

/** Giữ nguyên mọi ô trong map cũ, mở rộng vùng đất và kết thúc bằng biển có đáy sâu dần. */
export function buildExpandedTerrain(spec: TerrainSpec): TerrainData {
  const lakes = spec.lakes.filter((lake) => lake.x < OCEAN_X);
  const data = buildTerrainData({...spec, lakes});
  const oldCols = LEGACY_WIDTH / TILE;
  const old = buildTerrainData({
    ...spec,
    cols: oldCols,
    rows: Math.ceil(LEGACY_HEIGHT / TILE),
    lakes: lakes.filter((lake) => lake.x < LEGACY_WIDTH),
  });
  data.surface.set(old.surface);
  for (let r = 0; r < old.rows; r++) {
    for (const key of ['kinds', 'walls', 'water'] as const)
      data[key].set(old[key].subarray(r * old.cols, (r + 1) * old.cols), r * data.cols);
  }
  // Nối cao độ cũ với phần mới mà không tạo vách cao quá một ô tại ranh giới.
  for (let c = oldCols; c < oldCols + 8; c++) {
    const previous = data.surface[c - 1];
    const row = Math.max(previous - 1, Math.min(previous + 1, data.surface[c]));
    if (row !== data.surface[c]) resetColumn(data, c, row, false);
  }
  const coast = COAST_X / TILE;
  const ocean = OCEAN_X / TILE;
  const level = SEA_LEVEL / TILE;
  const coastRow = data.surface[coast - 1];
  for (let c = coast; c < ocean; c++) {
    const t = (c - coast + 1) / (ocean - coast);
    resetColumn(data, c, Math.round(coastRow + (level - coastRow) * t), true);
  }
  for (let c = ocean; c < data.cols; c++) {
    const t = (c - ocean) / (data.cols - ocean - 1);
    const floor = level + 1 + Math.floor(t * (SEA_FLOOR_END / TILE - level - 1));
    resetColumn(data, c, floor, true);
    for (let r = level; r < floor; r++) data.water[r * data.cols + c] = 1;
  }
  return data;
}
function resetColumn(data: TerrainData, c: number, row: number, sand: boolean) {
  data.surface[c] = row;
  for (let r = 0; r < data.rows; r++) {
    const i = r * data.cols + c;
    data.kinds[i] = r < row ? KIND_CODE.air : r < row + 3 ? (sand ? KIND_CODE.sand : KIND_CODE.dirt) : KIND_CODE.stone;
    data.walls[i] = r <= row ? WALL_CODE.none : r < row + 3 ? WALL_CODE.wallDirt : WALL_CODE.wallStone;
    data.water[i] = 0;
  }
}
