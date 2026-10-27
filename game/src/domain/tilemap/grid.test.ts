import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TILE} from './types.ts';
import {terrainGrid, WORLD_WIDTH} from '../../data/world.ts';

test('collider runs cover every column once, with each run at its own ground height', () => {
  const runs = terrainGrid.solidRuns();
  let x = 0;
  for (const run of runs) {
    assert.equal(run.x, x, 'run starts where the previous ends');
    const c = run.x / TILE;
    assert.equal(run.y, terrainGrid.surfaceRow(c) * TILE, 'run height at column ' + c);
    for (let k = 0; k < run.width / TILE; k++) assert.equal(terrainGrid.surfaceRow(c + k), terrainGrid.surfaceRow(c));
    x += run.width;
  }
  assert.equal(x, WORLD_WIDTH);
});

test('colliders merge equal-height columns into a sensible number of bodies', () => {
  const count = terrainGrid.solidRuns().length;
  assert.ok(count >= 30 && count <= Math.ceil(WORLD_WIDTH / 16000) * 80, 'bodies: ' + count);
});
