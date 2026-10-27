import {TileGrid} from './grid.ts';
import {KIND_CODE, WALL_CODE, type TerrainData} from './types.ts';

const CODES: Record<string, {kind: number; wall?: number; water?: number}> = {
  '.': {kind: KIND_CODE.air},
  W: {kind: KIND_CODE.air, wall: WALL_CODE.wallDirt},
  w: {kind: KIND_CODE.air, water: 1},
  d: {kind: KIND_CODE.dirt, wall: WALL_CODE.wallDirt},
  '#': {kind: KIND_CODE.stone, wall: WALL_CODE.wallStone},
  s: {kind: KIND_CODE.sand},
  C: {kind: KIND_CODE.copper},
  I: {kind: KIND_CODE.iron},
  K: {kind: KIND_CODE.crystal, wall: WALL_CODE.wallStone},
};

/** Lưới nhỏ từ bản vẽ ASCII để test điểm ảnh; hàng đầu tiên là hàng 0. Surface là hàng đặc đầu tiên mỗi cột. */
export function asciiGrid(rows: string[]) {
  const cols = rows[0].length;
  const data: TerrainData = {
    cols,
    rows: rows.length,
    surface: new Int16Array(cols).fill(rows.length),
    kinds: new Uint8Array(cols * rows.length),
    walls: new Uint8Array(cols * rows.length),
    water: new Uint8Array(cols * rows.length),
  };
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = CODES[rows[r][c]];
      const i = r * cols + c;
      data.kinds[i] = cell.kind;
      data.walls[i] = cell.wall ?? 0;
      data.water[i] = cell.water ?? 0;
      const solid = cell.kind !== KIND_CODE.air;
      if (solid && data.surface[c] === rows.length) data.surface[c] = r;
    }
  }
  return new TileGrid(data);
}
