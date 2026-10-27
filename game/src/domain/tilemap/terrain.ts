import {KIND_CODE, TILE, WALL_CODE, type TerrainData, type TerrainSpec} from './types.ts';
import {columnRows} from './surface.ts';
import {hash01} from './random.ts';
import {carveCaves, placeCrystals, placeOres} from './features.ts';
import {setCell} from './cells.ts';

/** Sinh toàn bộ lưới ô từ seed và danh sách hồ. Cùng đầu vào luôn cho cùng kết quả. */
export function buildTerrainData(spec: TerrainSpec): TerrainData {
  const {cols, rows, seed, lakes, flats} = spec;
  const size = cols * rows;
  const data: TerrainData = {
    cols,
    rows,
    surface: columnRows(lakes, flats, seed, cols),
    kinds: new Uint8Array(size),
    walls: new Uint8Array(size),
    water: new Uint8Array(size),
  };
  for (let c = 0; c < cols; c++) fillColumn(data, c, seed);
  for (const lake of lakes) carveLake(data, lake.x, lake.width);
  carveCaves(data, seed, lakes);
  placeOres(data, seed);
  placeCrystals(data, seed);
  return data;
}

/** Đất ở vài ô đầu, đá phía dưới; tường nền cho mọi ô nằm dưới mặt đất. */
function fillColumn(data: TerrainData, c: number, seed: number) {
  const s = data.surface[c];
  const dirtDepth = 3 + Math.floor(hash01(seed, c, 7) * 3);
  for (let r = s; r < data.rows; r++) {
    const dirt = r < s + dirtDepth;
    setCell(data, c, r, KIND_CODE[dirt ? 'dirt' : 'stone'], 0);
    if (r > s) data.walls[r * data.cols + c] = dirt ? WALL_CODE.wallDirt : WALL_CODE.wallStone;
  }
}

/**
 * Lòng chảo dưới mặt nước cố định: nước bắt đầu ngay tại hàng D (mặt lối gỗ), đáy cát ở sâu 1-3 ô.
 * Hàng D không còn là ô đất nên không có dải cỏ giữa lối gỗ và mặt nước; va chạm vẫn đứng ở đỉnh hàng D.
 */
function carveLake(data: TerrainData, x: number, width: number) {
  const c0 = Math.round(x / TILE);
  const c1 = Math.round((x + width) / TILE) - 1;
  const deck = data.surface[c0];
  const span = c1 - c0 + 1;
  for (let c = c0; c <= c1; c++) {
    const u = (c - c0 + 0.5) / span;
    const depth = 1 + Math.round(2 * Math.sin(Math.PI * u));
    for (let r = deck; r <= deck + depth; r++) setCell(data, c, r, KIND_CODE.air, 1);
    setCell(data, c, deck + depth + 1, KIND_CODE.sand, 0);
  }
}
