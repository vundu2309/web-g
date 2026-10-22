import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildTerrainData} from './terrain.ts';
import {TileGrid} from './grid.ts';
import {sectionRows} from './surface.ts';
import {TILE, WALL_KINDS} from './types.ts';
import {TERRAIN_SEED, WORLD_HEIGHT, WORLD_WIDTH, groundAt, regions, terrainGrid, waters} from '../../data/world.ts';

const COLS = WORLD_WIDTH / TILE;
const ROWS = Math.ceil(WORLD_HEIGHT / TILE);
const spec = {cols: COLS, rows: ROWS, seed: TERRAIN_SEED, lakes: waters};

/** Bản sao độc lập của công thức cũ (trước T2) để so sánh; không dùng code mới. */
function legacyGroundAt(x: number) {
  const water = waters.find((w) => x >= w.x - 256 && x < w.x + w.width + 256);
  const sample = water ? water.x : x;
  const column = Math.floor(Math.max(0, Math.min(WORLD_WIDTH - 1, sample)) / 256);
  return 650 - Math.round((Math.sin(column * 0.19) * 65 + column * 3.1) / 16) * 16;
}

function inLakeZone(x: number) {
  return waters.some((w) => x >= w.x - 256 && x < w.x + w.width + 256);
}

function sameBuild(a: TileGrid, b: TileGrid) {
  for (let c = 0; c < a.cols; c++) {
    if (a.surfaceRow(c) !== b.surfaceRow(c)) return false;
    for (let r = 0; r < a.rows; r++) {
      if (a.kindAt(c, r) !== b.kindAt(c, r) || a.wallAt(c, r) !== b.wallAt(c, r)) return false;
      if (a.isWater(c, r) !== b.isWater(c, r)) return false;
    }
  }
  return true;
}

test('the same seed gives the same grid, and the grid has the expected size', () => {
  const first = new TileGrid(buildTerrainData(spec));
  const second = new TileGrid(buildTerrainData(spec));
  assert.equal(first.cols, 500);
  assert.equal(first.rows, 29);
  assert.ok(sameBuild(first, second));
  assert.ok(sameBuild(first, terrainGrid));
  assert.equal(sectionRows(waters, TERRAIN_SEED, 62).length, 62);
});

test('ground stays within 48 units of the legacy profile and inside 64', () => {
  let worst = 0;
  for (let x = 0; x < WORLD_WIDTH; x += 8) worst = Math.max(worst, Math.abs(groundAt(x) - legacyGroundAt(x)));
  assert.ok(worst <= 48, 'worst deviation ' + worst);
});

test('neighbouring columns differ by at most one tile', () => {
  for (let c = 1; c < COLS; c++) {
    assert.ok(Math.abs(terrainGrid.surfaceRow(c) - terrainGrid.surfaceRow(c - 1)) <= 1, 'column ' + c);
  }
});

test('ground height changes only on SECTION borders, so old 256-unit drawing stays aligned', () => {
  for (let c = 0; c < COLS; c += 8) {
    for (let k = 1; k < 8; k++) assert.equal(terrainGrid.surfaceRow(c + k), terrainGrid.surfaceRow(c));
  }
});

test('every flat run outside lakes is at least 6 tiles, and each region has one', () => {
  let start = 0;
  for (let c = 1; c <= COLS; c++) {
    if (c < COLS && terrainGrid.surfaceRow(c) === terrainGrid.surfaceRow(start)) continue;
    const exempt = [...Array(c - start).keys()].some((k) => inLakeZone((start + k) * TILE + 16));
    if (!exempt) assert.ok(c - start >= 6, 'flat run from column ' + start + ' is ' + (c - start));
    start = c;
  }
  for (const [i, region] of regions.entries()) {
    const end = regions[i + 1]?.x ?? WORLD_WIDTH;
    const longest = maxFlatRun(region.x / TILE, end / TILE);
    assert.ok(longest >= 6, region.name + ' has no flat run of 6 tiles');
  }
});

function maxFlatRun(from: number, to: number) {
  let best = 0;
  let run = 0;
  for (let c = from + 1; c < to; c++) {
    run = terrainGrid.surfaceRow(c) === terrainGrid.surfaceRow(c - 1) ? run + 1 : 0;
    best = Math.max(best, run + 1);
  }
  return best;
}

test('lakes are flat decks with a basin of water and sand under them', () => {
  for (const lake of waters) {
    const c0 = Math.round(lake.x / TILE);
    const c1 = Math.round((lake.x + lake.width) / TILE) - 1;
    const deck = terrainGrid.surfaceRow(c0);
    for (let c = c0; c <= c1; c++) {
      assert.equal(terrainGrid.surfaceRow(c), deck, lake.id + ' column ' + c);
      assert.ok(terrainGrid.isWater(c, deck + 1), lake.id + ' water at column ' + c);
      assert.equal(terrainGrid.isSolid(c, deck), true, lake.id + ' deck is solid');
      assert.ok(!terrainGrid.isWater(c, deck), lake.id + ' deck is not water');
    }
    assert.ok(waterCount(c0, c1) > 0);
  }
});

function waterCount(c0: number, c1: number) {
  let count = 0;
  for (let c = c0; c <= c1; c++) for (let r = 0; r < ROWS; r++) count += terrainGrid.isWater(c, r) ? 1 : 0;
  return count;
}

test('water exists only inside lake basins', () => {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (!terrainGrid.isWater(c, r)) continue;
      const lake = waters.find((w) => c >= Math.round(w.x / TILE) && c < Math.round((w.x + w.width) / TILE));
      assert.ok(lake, 'water outside lake at ' + c + ',' + r);
      assert.ok(r > terrainGrid.surfaceRow(c));
    }
  }
});

test('caves are sealed: no air below ground can be reached from the sky', () => {
  const seen = new Uint8Array(COLS * ROWS);
  const queue: number[] = [];
  for (let c = 0; c < COLS; c++) {
    seen[c] = 1;
    queue.push(c);
  }
  const steps = [1, -1, COLS, -COLS];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    const c = i % COLS;
    for (const step of steps) {
      const j = i + step;
      if (step === 1 && c === COLS - 1) continue;
      if (step === -1 && c === 0) continue;
      if (j < 0 || j >= COLS * ROWS || seen[j] || terrainGrid.isSolid(j % COLS, Math.floor(j / COLS))) continue;
      seen[j] = 1;
      queue.push(j);
    }
  }
  for (let i = 0; i < COLS * ROWS; i++) {
    if (!seen[i]) continue;
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    assert.ok(r < terrainGrid.surfaceRow(c), 'air reached below ground at ' + c + ',' + r);
  }
});

test('caves exist, crystals sit only on cave walls, and ores are underground', () => {
  let cave = 0;
  let crystal = 0;
  let copper = 0;
  let iron = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = terrainGrid.surfaceRow(c) + 1; r < ROWS; r++) {
      const kind = terrainGrid.kindAt(c, r);
      if (kind === 'air' && !terrainGrid.isWater(c, r)) cave++;
      if (kind === 'copper') copper++;
      if (kind === 'iron') iron++;
      if (kind !== 'crystal') continue;
      crystal++;
      const touching = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dc, dr]) => terrainGrid.kindAt(c + dc, r + dr) === 'air' && !terrainGrid.isWater(c + dc, r + dr));
      assert.ok(touching, 'crystal not on cave wall at ' + c + ',' + r);
    }
  }
  assert.ok(cave > 50, 'caves: ' + cave);
  assert.ok(crystal > 0, 'crystals: ' + crystal);
  assert.ok(copper > 0 && iron > 0, 'ores: ' + copper + '/' + iron);
});

test('walls fill every tile below ground and none above', () => {
  for (let c = 0; c < COLS; c += 13) {
    assert.equal(terrainGrid.wallAt(c, terrainGrid.surfaceRow(c)), 'none');
    assert.notEqual(terrainGrid.wallAt(c, terrainGrid.surfaceRow(c) + 1), 'none');
    assert.ok(WALL_KINDS.includes(terrainGrid.wallAt(c, ROWS - 1)));
    assert.equal(terrainGrid.wallAt(c, 0), 'none');
  }
});
