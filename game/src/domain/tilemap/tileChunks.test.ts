import {test} from 'node:test';
import assert from 'node:assert/strict';
import {asciiGrid} from './testGrid.ts';
import {CHUNK_TILES, chunkCount, chunkHasWater, chunkOf, chunkPixels, chunkRange, paintChunk} from './tileChunks.ts';
import {columnTints, tilePixel} from './tileArt.ts';
import {terrainGrid} from '../../data/world.ts';
import {TILE_ART} from './types.ts';

test('every column belongs to exactly one chunk, and chunk edges do not shift', () => {
  const cols = terrainGrid.cols;
  let covered = 0;
  for (let index = 0; index < chunkCount(cols); index++) {
    const {first, end} = chunkRange(index, cols);
    covered += end - first;
    for (let c = first; c < end; c++) assert.equal(chunkOf(c), index, 'column ' + c);
  }
  assert.equal(covered, cols);
  assert.equal(CHUNK_TILES, 16);
  assert.equal(chunkOf(15), 0);
  assert.equal(chunkOf(16), 1);
});

test('a chunk buffer matches its pixel size and paints the same pixels as the tile function', () => {
  const grid = asciiGrid(['#####', '#d#.#', '.s.##']);
  const tints = columnTints(grid);
  const size = chunkPixels(grid, 0);
  assert.equal(size.width, 5 * TILE_ART);
  assert.equal(size.height, 3 * TILE_ART);
  const out = new Uint8ClampedArray(size.width * size.height * 4);
  paintChunk(grid, tints, 0, false, out);
  const c = 2;
  const r = 1;
  const py = 5;
  const v = tilePixel(grid, tints, c, r, 3, py, false);
  const o = ((r * TILE_ART + py) * size.width + c * TILE_ART + 3) * 4;
  assert.equal(out[o], (v >> 16) & 255);
  assert.equal(out[o + 1], (v >> 8) & 255);
  assert.equal(out[o + 2], v & 255);
  assert.equal(out[o + 3], v >>> 24);
});

test('a water layer chunk is opaque only over water cells, and reports its water', () => {
  const grid = asciiGrid(['..', 'dd', 'ww', 'ss']);
  const size = chunkPixels(grid, 0);
  const out = new Uint8ClampedArray(size.width * size.height * 4);
  paintChunk(grid, columnTints(grid), 0, true, out);
  const alphaAt = (pixelRow: number) => out[(pixelRow * size.width + 3) * 4 + 3];
  assert.equal(alphaAt(0), 0);
  assert.equal(alphaAt(TILE_ART), 0);
  assert.ok(alphaAt(2 * TILE_ART) > 0);
  assert.equal(chunkHasWater(grid, 0), true);
  assert.equal(chunkHasWater(asciiGrid(['..', 'dd']), 0), false);
});
