import {test} from 'node:test';
import assert from 'node:assert/strict';
import {soilTone} from './soil.ts';
test('ground tone changes gradually across every region border', () => {
  for (const x of [3200, 6400, 9600, 12800]) {
    const left = soilTone(x - 0.01);
    const right = soilTone(x + 0.01);
    for (const shift of [0, 8, 16]) {
      assert.ok(Math.abs(((left >> shift) & 255) - ((right >> shift) & 255)) <= 1);
    }
  }
  assert.notEqual(soilTone(100), soilTone(3300));
  assert.equal(soilTone(-50), soilTone(0));
});
