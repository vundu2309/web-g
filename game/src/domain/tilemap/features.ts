import {KIND_CODE, SECTION_COLS, TILE, type Lake, type TerrainData} from './types.ts';
import {createRng, hash01} from './random.ts';
import {setCell} from './cells.ts';

const CAVE_TRIES = 24;
const CRYSTAL_CHANCE = 0.3;

/** Các cột thuộc vùng hồ kể cả đệm: không đặt hang ở đây để nước không bị lộ ra hang. */
function reservedColumns(lakes: readonly Lake[]) {
  const reserved = new Set<number>();
  for (const lake of lakes) {
    const c0 = Math.round(lake.x / TILE);
    const c1 = Math.round((lake.x + lake.width) / TILE) - 1;
    for (let c = c0 - SECTION_COLS; c <= c1 + SECTION_COLS; c++) reserved.add(c);
  }
  return reserved;
}

/**
 * Hang elip kín: đỉnh hang cách mặt đất cao nhất trong vùng ảnh hưởng ít nhất 2 ô đất che,
 * và không có đường nối nào lên bầu trời.
 */
export function carveCaves(data: TerrainData, seed: number, lakes: readonly Lake[]) {
  const rng = createRng(seed ^ 0x0c4e5);
  const reserved = reservedColumns(lakes);
  for (let k = 0; k < CAVE_TRIES; k++) {
    const cx = 10 + Math.floor(rng() * (data.cols - 20));
    const rx = 3 + Math.floor(rng() * 4);
    const ry = 2 + Math.floor(rng() * 2);
    const from = Math.max(0, cx - rx - 1);
    const to = Math.min(data.cols - 1, cx + rx + 1);
    let top = 0;
    let blocked = false;
    for (let c = from; c <= to; c++) {
      top = Math.max(top, data.surface[c]);
      if (reserved.has(c)) blocked = true;
    }
    const cy = top + 2 + ry;
    if (blocked || cy + ry + 2 >= data.rows) continue;
    carveEllipse(data, cx, cy, rx, ry);
  }
}

function carveEllipse(data: TerrainData, cx: number, cy: number, rx: number, ry: number) {
  for (let c = cx - rx; c <= cx + rx; c++) {
    for (let r = cy - ry; r <= cy + ry; r++) {
      const a = (c + 0.5 - cx) / rx;
      const b = (r + 0.5 - cy) / ry;
      if (a * a + b * b >= 1 || r < data.surface[c] + 2) continue;
      setCell(data, c, r, KIND_CODE.air, 0);
    }
  }
}

/** Quặng đồng và sắt theo cụm trong đá; sắt nằm sâu hơn. */
export function placeOres(data: TerrainData, seed: number) {
  const rng = createRng(seed ^ 0x0a7e);
  scatter(data, rng, KIND_CODE.copper, 24, 6, 4);
  scatter(data, rng, KIND_CODE.iron, 16, 9, 5);
}

function scatter(data: TerrainData, rng: () => number, kind: number, count: number, minDepth: number, span: number) {
  for (let k = 0; k < count; k++) {
    const c = Math.floor(rng() * data.cols);
    const r = data.surface[c] + minDepth + Math.floor(rng() * span);
    if (r >= data.rows - 2) continue;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const center = dr === 0 && dc === 0;
        if (!center && rng() >= 0.55) continue;
        if (isStone(data, c + dc, r + dr)) setCell(data, c + dc, r + dr, kind, 0);
      }
    }
  }
}

function isStone(data: TerrainData, c: number, r: number) {
  if (c < 0 || c >= data.cols || r < 0 || r >= data.rows) return false;
  const i = r * data.cols + c;
  return data.kinds[i] === KIND_CODE.stone && data.water[i] === 0;
}

/** Pha lê chỉ đặt trên vách đá tiếp giáp hang kín (sẽ phát sáng ở giai đoạn sau). */
export function placeCrystals(data: TerrainData, seed: number) {
  for (let r = 0; r < data.rows; r++) {
    for (let c = 0; c < data.cols; c++) {
      if (!isWall(data, c, r) || !touchesCave(data, c, r)) continue;
      if (hash01(seed, c, r) < CRYSTAL_CHANCE) setCell(data, c, r, KIND_CODE.crystal, 0);
    }
  }
}

function isWall(data: TerrainData, c: number, r: number) {
  if (c < 0 || c >= data.cols || r < 0 || r >= data.rows) return false;
  const kind = data.kinds[r * data.cols + c];
  return kind === KIND_CODE.stone || kind === KIND_CODE.dirt;
}

function isCave(data: TerrainData, c: number, r: number) {
  if (c < 0 || c >= data.cols || r < 0 || r >= data.rows) return false;
  const i = r * data.cols + c;
  return data.kinds[i] === KIND_CODE.air && data.water[i] === 0 && r > data.surface[c];
}

function touchesCave(data: TerrainData, c: number, r: number) {
  return isCave(data, c - 1, r) || isCave(data, c + 1, r) || isCave(data, c, r - 1) || isCave(data, c, r + 1);
}
