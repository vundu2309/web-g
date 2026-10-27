import {test} from 'node:test';
import assert from 'node:assert/strict';
import {terrainGrid, groundAt, waters, regionAt, regions, resourceNodes, TERRAIN_SEED, flatSpans} from './world.ts';
import {COAST_X, LEGACY_WIDTH, OCEAN_X, SEA_LEVEL, SEA_FLOOR_END, WORLD_WIDTH} from './worldLayout.ts';
import {TILE} from '../domain/tilemap/types.ts';
import {buildTerrainData} from '../domain/tilemap/terrain.ts';
import {newSave, decodeSave} from '../domain/saveCodec.ts';
import {rollFish} from '../domain/camping.ts';

test('the larger world keeps all legacy terrain cells and surface heights exactly', () => {
  const old = buildTerrainData({
    cols: 500,
    rows: 29,
    seed: TERRAIN_SEED,
    lakes: waters.filter((water) => water.x < LEGACY_WIDTH),
    flats: flatSpans,
  });
  assert.equal(WORLD_WIDTH, 32000);
  for (let c = 0; c < old.cols; c++) {
    assert.equal(terrainGrid.surfaceRow(c), old.surface[c]);
    for (let r = 0; r < old.rows; r++) {
      const i = r * old.cols + c;
      assert.equal(terrainGrid.isWater(c, r), old.water[i] === 1);
    }
  }
});

test('ocean has a level surface, a solid sandy bed and monotonically increasing depth to the right', () => {
  let previous = 0;
  const depths = new Set<number>();
  for (let x = OCEAN_X; x < WORLD_WIDTH; x += TILE) {
    const c = terrainGrid.columnAt(x);
    const top = terrainGrid.waterSurfaceRow(c);
    const bed = terrainGrid.waterBedRow(c);
    assert.equal(top * TILE, SEA_LEVEL);
    assert.equal(terrainGrid.kindAt(c, bed), 'sand');
    assert.equal(terrainGrid.isSolid(c, bed), true);
    assert.equal(terrainGrid.surfaceRow(c), bed);
    assert.ok(bed >= previous);
    assert.ok(bed < terrainGrid.rows - 2);
    for (let r = top; r < bed; r++) assert.equal(terrainGrid.isWater(c, r), true);
    previous = bed;
    depths.add(bed);
  }
  assert.ok(depths.size >= 20);
  assert.equal(groundAt(WORLD_WIDTH - 1), SEA_FLOOR_END);
});

test('beach reaches sea level through sand without a cliff or a full-width wooden ocean bridge', () => {
  for (let x = COAST_X; x < OCEAN_X; x += TILE) {
    const c = terrainGrid.columnAt(x);
    assert.equal(terrainGrid.kindAt(c, terrainGrid.surfaceRow(c)), 'sand');
    assert.equal(terrainGrid.waterSurfaceRow(c), -1);
    assert.ok(Math.abs(groundAt(x) - groundAt(x - TILE)) <= TILE);
  }
  assert.equal(groundAt(OCEAN_X - TILE), SEA_LEVEL);
  assert.equal(waters.at(-1)?.habitat, 'sea');
});

test('new regions and resources extend beyond the old map without changing old resource ids', () => {
  assert.equal(regions.length, 10);
  assert.equal(regionAt(WORLD_WIDTH - 1).name, 'BIỂN SÂU');
  assert.ok(resourceNodes.some((node) => node.x > LEGACY_WIDTH));
  assert.equal(resourceNodes.find((node) => node.id === 'node-0')?.x, 350);
  for (let x = 0; x < WORLD_WIDTH; x += 256) assert.ok(regionAt(x));
});

test('Save v2 round trips player and camp positions in the expanded region without schema changes', () => {
  const save = newSave();
  save.x = 25000;
  save.buildings = [{id: 'build-new-coast', kind: 'tent', x: 26000}];
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  assert.equal(decodeSave(JSON.stringify({...save, x: Infinity})).x, 120);
});

test('sea fishing always selects marine species across all times of day', () => {
  for (const period of ['dawn', 'day', 'dusk', 'night'] as const) {
    for (let i = 0; i < 20; i++) {
      const catchResult = rollFish('sea', i / 20, i / 20, 1, period);
      assert.ok((catchResult.species.habitats as readonly string[]).includes('sea'));
    }
  }
});
