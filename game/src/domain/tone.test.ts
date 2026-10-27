import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hexToOklab, toneRamp} from './tone.ts';
import {gear} from '../data/catalog.ts';

test('every catalog material gets four valid tones and keeps its catalog color as the base tone', () => {
  for (const item of gear) {
    const ramp = toneRamp(item.color);
    assert.equal(ramp.base, item.color, item.id);
    for (const tone of [ramp.hi, ramp.shade, ramp.deep]) assert.match(tone, /^#[\da-f]{6}$/, item.id);
  }
});

test('tones step monotonically in lightness: highlight, base, shade, deep', () => {
  for (const item of gear) {
    const ramp = toneRamp(item.color);
    const [hi, base, shade, deep] = [ramp.hi, ramp.base, ramp.shade, ramp.deep].map((hex) => hexToOklab(hex)[0]);
    assert.ok(hi - base > 0.05, item.id + ' highlight is lighter than base');
    assert.ok(base - shade > 0.05, item.id + ' shade is darker than base');
    assert.ok(shade - deep > 0.05, item.id + ' deep edge is darker than shade');
  }
});

test('tone ramps are deterministic and reject malformed colors', () => {
  assert.deepEqual(toneRamp('#4c7560'), toneRamp('#4c7560'));
  assert.throws(() => toneRamp('bad'), /màu trang bị không hợp lệ/);
  assert.throws(() => toneRamp('#4c756080'), /màu trang bị không hợp lệ/);
});
