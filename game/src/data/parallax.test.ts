import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LAYER_FACTORS, TINT_CHANNELS, PINE_SHARE} from './parallax.ts';
import {regionColor, regionValue, REGION_WIDTH} from '../domain/backdrop/regions.ts';

test('layer factors keep the old values and add the far forest between mountains and near forest', () => {
  assert.deepEqual(LAYER_FACTORS, {
    clouds: 0.04,
    mountainFar: 0.14,
    mountainMid: 0.3,
    forestFar: 0.4,
    forestNear: 0.55,
  });
});

test('region tint is continuous on all four region boundaries', () => {
  for (const border of [1, 2, 3, 4]) {
    const x = border * REGION_WIDTH;
    const left = regionColor(x - 0.01, TINT_CHANNELS.red, TINT_CHANNELS.green, TINT_CHANNELS.blue);
    const right = regionColor(x + 0.01, TINT_CHANNELS.red, TINT_CHANNELS.green, TINT_CHANNELS.blue);
    for (const shift of [0, 8, 16]) {
      assert.ok(Math.abs(((left >> shift) & 255) - ((right >> shift) & 255)) <= 1);
    }
  }
});

test('pine forest sits in configured regions, and blends across borders', () => {
  assert.deepEqual([...PINE_SHARE], [0, 1, 0, 1, 0, 0, 0, 1, 0, 0]);
  assert.equal(regionValue(1600, PINE_SHARE), 0);
  assert.equal(regionValue(4800, PINE_SHARE), 1);
  assert.equal(regionValue(3200, PINE_SHARE), 0.5);
});
