import {TileGrid} from './grid.ts';
import {KIND_CODE, WALL_CODE, type TileKind, type WallKind, type TerrainData} from './types.ts';
import {tilePixel, UP, DOWN, LEFT, RIGHT} from './tileArt.ts';

export interface AtlasTile {
  name: string;
  mask: number;
  rgba: Uint8ClampedArray;
}

/** Dữ liệu xem mẫu xác định: mọi loại ô, 16 mask cạnh, hai tường và ba tầng nước. Không dùng RNG hay Phaser. */
export function tileAtlas(): AtlasTile[] {
  const out: AtlasTile[] = [];
  for (const kind of Object.keys(KIND_CODE) as TileKind[]) {
    for (let mask = 0; mask < 16; mask++) out.push(sampleTile(kind, 'none', false, mask));
  }
  for (const wall of ['wallDirt', 'wallStone'] as WallKind[]) out.push(sampleTile('air', wall, false, 0));
  for (let depth = 0; depth < 3; depth++) out.push(sampleTile('air', 'none', true, 0, depth));
  return out;
}

function sampleTile(kind: TileKind, wall: WallKind, water: boolean, mask: number, depth = 0): AtlasTile {
  const data: TerrainData = {
    cols: 3,
    rows: 3,
    surface: new Int16Array(3).fill(1 - depth),
    kinds: new Uint8Array(9).fill(KIND_CODE[kind]),
    walls: new Uint8Array(9).fill(WALL_CODE[wall]),
    water: new Uint8Array(9).fill(water ? 1 : 0),
  };
  for (const [bit, index] of [
    [UP, 1],
    [DOWN, 7],
    [LEFT, 3],
    [RIGHT, 5],
  ]) {
    if (mask & bit) data.kinds[index] = KIND_CODE.air;
  }
  const grid = new TileGrid(data);
  const rgba = new Uint8ClampedArray(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const p = tilePixel(grid, new Int32Array(3), 1, 1, x, y, water);
      rgba.set([(p >>> 16) & 255, (p >>> 8) & 255, p & 255, p >>> 24], (y * 16 + x) * 4);
    }
  }
  return {name: water ? 'nước tầng ' + depth : wall === 'none' ? kind : wall, mask, rgba};
}
