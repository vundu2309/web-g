import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backdropGround, landscapeTop} from './terrainAnchor.ts';
import {LANDSCAPE_BASE_ART, LANDSCAPE_GROUND_OFFSET} from '../../data/parallax.ts';
import {ART_PIXEL} from '../../data/palette.ts';

test('landscape texture bases map to terrain with explicit depth offsets', () => {
  for (const kind of Object.keys(LANDSCAPE_BASE_ART) as Array<keyof typeof LANDSCAPE_BASE_ART>) {
    for (const ground of [320, 640, 1000]) {
      assert.equal(
        landscapeTop(kind, ground) + LANDSCAPE_BASE_ART[kind] * ART_PIXEL,
        ground + LANDSCAPE_GROUND_OFFSET[kind],
      );
    }
  }
});

test('terrain anchors remain continuous across tile steps and anchor boundaries', () => {
  const ground = (x: number) => 320 + Math.floor(x / 32) * 4;
  for (const x of [32, 256, 512, 1024, 1536]) {
    assert.ok(Math.abs(backdropGround(x - 0.001, 32000, ground) - backdropGround(x + 0.001, 32000, ground)) < 0.01);
  }
  assert.ok(backdropGround(1536, 32000, ground) > backdropGround(512, 32000, ground));
});

test('terrain sampling clamps to map bounds and preserves level ground', () => {
  const samples: number[] = [];
  const ground = (x: number) => {
    samples.push(x);
    return 640;
  };
  for (const x of [0, 100, 31999]) assert.equal(backdropGround(x, 32000, ground), 640);
  assert.ok(samples.every((x) => x >= 0 && x < 32000));
});
