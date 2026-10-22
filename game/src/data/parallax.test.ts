import {test} from 'node:test';
import assert from 'node:assert/strict';
import {regionColor, mixColor, type BackgroundLayer} from './parallax.ts';
test('parallax region tint is continuous on all four region boundaries', () => {
  for (const layer of ['clouds', 'far', 'near', 'forest'] as BackgroundLayer[]) {
    for (const x of [3200, 6400, 9600, 12800]) {
      const left = regionColor(x - 0.01, layer);
      const right = regionColor(x + 0.01, layer);
      for (const shift of [0, 8, 16]) {
        assert.ok(Math.abs(((left >> shift) & 255) - ((right >> shift) & 255)) <= 1);
      }
    }
  }
  assert.equal(mixColor(0x000000, 0xffffff, 0), 0x000000);
  assert.equal(mixColor(0x000000, 0xffffff, 1), 0xffffff);
  assert.equal(mixColor(0x000000, 0xffffff, 0.5), 0x808080);
});
