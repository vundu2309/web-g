import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canopyLayout, CANOPY_STRIDE, CANOPY_TIER} from './canopy.ts';
import {cloudLayout, CLOUD_SHAPES, CLOUD_STRIDE} from './clouds.ts';
import {regionColor, regionValue, REGION_WIDTH} from './regions.ts';
import {mixColor, splitChannels} from './mix.ts';
import {PERIOD_COUNT, writePeriodWeights} from './periods.ts';
import {ridgeLine} from './ridge.ts';
import {skyColor, skyLevel, SKY_BANDS, SKY_SPAN} from './sky.ts';
import {stackAlphas} from './stack.ts';
import {DAY_SECONDS} from '../dayTime.ts';

const timeOfHour = (hour: number) => (hour / 24) * DAY_SECONDS;

function weightsAt(hour: number) {
  const out = new Float64Array(PERIOD_COUNT);
  writePeriodWeights(timeOfHour(hour), out);
  return [...out];
}

test('mixColor mixes channels and clamps the amount', () => {
  assert.equal(mixColor(0x000000, 0xffffff, 0), 0x000000);
  assert.equal(mixColor(0x000000, 0xffffff, 1), 0xffffff);
  assert.equal(mixColor(0x000000, 0xffffff, 0.5), 0x808080);
  assert.equal(mixColor(0x102030, 0x102030, 0.7), 0x102030);
  assert.equal(mixColor(0x000000, 0xffffff, 3), 0xffffff);
});

test('region values are continuous across every border and flat in the middle of a region', () => {
  const values = [0, 10, 0, 10, 0];
  for (const border of [1, 2, 3, 4]) {
    const x = border * REGION_WIDTH;
    assert.ok(Math.abs(regionValue(x - 0.01, values) - regionValue(x + 0.01, values)) < 0.01, 'border ' + border);
  }
  assert.equal(regionValue(1600, values), 0);
  assert.equal(regionValue(4800, values), 10);
  assert.equal(regionValue(-50, values), 0);
});

test('region colours change smoothly from one zone to the next', () => {
  const colors = [0xffffff, 0x000000, 0xffffff, 0x000000, 0xffffff];
  const channels = splitChannels(colors);
  for (let x = 0; x < 16000; x += 40) {
    const a = regionColor(x, channels.red, channels.green, channels.blue);
    const b = regionColor(x + 1, channels.red, channels.green, channels.blue);
    for (const shift of [0, 8, 16]) assert.ok(Math.abs(((a >> shift) & 255) - ((b >> shift) & 255)) <= 1, 'x ' + x);
  }
});

test('period weights always sum to one and change without jumps across the whole day', () => {
  let previous = weightsAt(0);
  for (let i = 1; i <= 2000; i++) {
    const current = weightsAt((i / 2000) * 24);
    assert.ok(Math.abs(current.reduce((a, b) => a + b, 0) - 1) < 1e-9, 'sum at step ' + i);
    for (let p = 0; p < PERIOD_COUNT; p++) {
      assert.ok(current[p] >= 0 && current[p] <= 1, 'range at step ' + i);
      assert.ok(Math.abs(current[p] - previous[p]) < 0.02, 'jump at step ' + i);
    }
    previous = current;
  }
});

test('period weights pick day at noon, dusk at 18h and night at 2h, with dusk rising to the sunset', () => {
  assert.deepEqual(weightsAt(12), [1, 0, 0]);
  assert.deepEqual(weightsAt(18), [0, 1, 0]);
  assert.deepEqual(weightsAt(2), [0, 0, 1]);
  const rising = [16, 16.5, 17, 17.5, 18].map((h) => weightsAt(h)[1]);
  for (let i = 1; i < rising.length; i++) assert.ok(rising[i] >= rising[i - 1]);
});

test('stacked alphas reproduce the requested weights exactly', () => {
  const weights = [0.2, 0, 0.5, 0.3];
  const alphas = new Float64Array(weights.length);
  stackAlphas(weights, alphas);
  const coverage = new Float64Array(weights.length);
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < i; j++) coverage[j] *= 1 - alphas[i];
    coverage[i] = alphas[i];
  }
  for (let i = 0; i < weights.length; i++) assert.ok(Math.abs(coverage[i] - weights[i]) < 1e-9, 'weight ' + i);
});

test('sky dither stays inside the band range and gets deeper on average going down', () => {
  const mean = (y0: number) => {
    let sum = 0;
    for (let y = y0; y < y0 + 4; y++) for (let x = 0; x < 4; x++) sum += skyLevel(x, y);
    return sum / 16;
  };
  for (let y = 0; y < 200; y++) for (let x = 0; x < 8; x++) assert.ok(skyLevel(x, y) <= SKY_BANDS);
  assert.ok(mean(0) < mean(40));
  assert.ok(mean(40) < mean(120));
});

test('sky dither spreads the next band over a 4x4 block in proportion to the band fraction', () => {
  for (const y0 of [40, 96, 120]) {
    let nextBand = 0;
    let fractionSum = 0;
    for (let dy = 0; dy < 4; dy++) {
      const pos = ((y0 + dy) / SKY_SPAN) * SKY_BANDS;
      fractionSum += pos - Math.floor(pos);
      for (let x = 0; x < 4; x++) nextBand += skyLevel(x, y0 + dy) - Math.floor(pos);
    }
    assert.ok(Math.abs(nextBand - fractionSum * 4) <= 2, 'block at ' + y0 + ': ' + nextBand + ' vs ' + fractionSum * 4);
  }
});

test('sky colours step smoothly through every level', () => {
  const top = 0x3f86d6;
  const mid = 0x7fbbe8;
  const low = 0xd3edf6;
  for (let level = 1; level <= SKY_BANDS; level++) {
    const a = skyColor(level - 1, top, mid, low);
    const b = skyColor(level, top, mid, low);
    for (const shift of [0, 8, 16]) assert.ok(Math.abs(((a >> shift) & 255) - ((b >> shift) & 255)) <= 20);
  }
  assert.equal(skyColor(0, top, mid, low), top);
  assert.equal(skyColor(SKY_BANDS, top, mid, low), low);
});

test('mountain ridges are deterministic, stay inside their band and wrap without a seam', () => {
  const a = ridgeLine(512, 142, 86, [2, 5], 11);
  const b = ridgeLine(512, 142, 86, [2, 5], 11);
  assert.deepEqual(a, b);
  for (const y of a) assert.ok(y >= 142 - 86 && y <= 142, 'ridge height ' + y);
  assert.ok(Math.abs(a[0] - a[511]) <= 3, 'seam at the tile edge');
  assert.ok(Math.min(...a) <= 142 - 86 * 0.9, 'ridge has real peaks');
  assert.notDeepEqual(ridgeLine(512, 142, 86, [2, 5], 12), a);
});

test('cloud layout is deterministic, spread across the tile and uses only known shapes', () => {
  const layout = cloudLayout(512, 7, 6);
  assert.equal(layout.length, 6 * CLOUD_STRIDE);
  assert.deepEqual(cloudLayout(512, 7, 6), layout);
  for (let i = 0; i < 6; i++) {
    const o = i * CLOUD_STRIDE;
    assert.ok(layout[o] >= 0 && layout[o] < 512);
    assert.ok(layout[o + 1] >= 28 && layout[o + 1] <= 80);
    assert.ok(layout[o + 2] >= 0.7 && layout[o + 2] <= 1.2);
    assert.ok(layout[o + 3] >= 0 && layout[o + 3] < CLOUD_SHAPES.length);
  }
});

test('canopy blobs are deterministic, sized in range and pine tiers have apex above base', () => {
  const round = canopyLayout(512, 11, false);
  assert.equal(round.length, 52 * CANOPY_STRIDE);
  for (let i = 0; i < 52; i++) assert.ok(round[i * CANOPY_STRIDE + 3] >= 11 && round[i * CANOPY_STRIDE + 3] <= 25);
  assert.deepEqual(canopyLayout(512, 11, false), round);
  const pine = canopyLayout(512, 23, true);
  assert.equal(pine.length, 22 * 3 * CANOPY_STRIDE);
  for (let o = 0; o < pine.length; o += CANOPY_STRIDE) {
    assert.equal(pine[o], CANOPY_TIER);
    assert.ok(pine[o + 2] < pine[o + 3]);
  }
});
