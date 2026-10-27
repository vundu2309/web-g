import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DIMMED_ALPHA, approachAlpha, boxesOverlap, worldLabelTarget, type LabelBox} from './fishingLabels.ts';

const box = (x: number, y: number, width = 100, height = 20): LabelBox => ({x, y, width, height});

test('boxes overlap only when they share area, with an optional gap', () => {
  assert.equal(boxesOverlap(box(0, 0), box(50, 10)), true);
  assert.equal(boxesOverlap(box(0, 0), box(100, 0)), false, 'edge touching is not overlap');
  assert.equal(boxesOverlap(box(0, 0), box(0, 30)), false);
  assert.equal(boxesOverlap(box(0, 0), box(0, 30), 12), true, 'gap widens the test');
});

test('a world label is dimmed only when it truly overlaps the fishing HUD', () => {
  const hud = [box(-60, -120, 120, 24), box(-60, -92, 120, 12)];
  assert.equal(worldLabelTarget(box(-50, -110, 200, 22), hud), DIMMED_ALPHA, 'label under the fish label');
  assert.equal(worldLabelTarget(box(900, -110, 200, 22), hud), 1, 'far label stays opaque');
  assert.equal(worldLabelTarget(box(-50, -110, 200, 22), []), 1, 'no fishing HUD means no dimming');
});

test('a label within the gap of the HUD is dimmed, beyond the gap it is not', () => {
  const hud = [box(0, 0, 100, 20)];
  assert.equal(worldLabelTarget(box(103, 0, 50, 20), hud), DIMMED_ALPHA);
  assert.equal(worldLabelTarget(box(108, 0, 50, 20), hud), 1);
});

test('alpha approaches its target smoothly and never overshoots', () => {
  let alpha = 1;
  const seen: number[] = [];
  for (let i = 0; i < 30; i++) {
    alpha = approachAlpha(alpha, DIMMED_ALPHA, 1 / 60);
    seen.push(alpha);
  }
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] <= seen[i - 1], 'monotonic fade down');
  assert.ok(alpha > DIMMED_ALPHA, 'half a second is not enough to reach the target');
  for (let i = 0; i < 600; i++) alpha = approachAlpha(alpha, DIMMED_ALPHA, 1 / 60);
  assert.ok(Math.abs(alpha - DIMMED_ALPHA) < 0.001, 'settles on the target');
  assert.ok(approachAlpha(0.5, 1, 0) === 0.5, 'no time, no change');
  const back = approachAlpha(DIMMED_ALPHA, 1, 1 / 60);
  assert.ok(back > DIMMED_ALPHA && back <= 1, 'fades back up without overshoot');
});
