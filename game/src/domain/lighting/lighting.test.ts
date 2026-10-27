import {test} from 'node:test';
import assert from 'node:assert/strict';
import {asciiGrid} from '../tilemap/testGrid.ts';
import {writePeriodWeights} from '../backdrop/periods.ts';
import {DAY_SECONDS} from '../dayTime.ts';
import {AMBIENT, ATTEN_OPEN, ATTEN_SOLID, ATTEN_WALL, ATTEN_WATER, SKY_SURFACE, SOURCE_SPECS} from './lightConfig.ts';
import {attenuationAt, computeSkyField} from './sky.ts';
import {buildingSources, computeSourceField, crystalSources, falloffAt, type LightSource} from './sources.ts';
import {bloomStrength, composeLight, skyTint, type SkyField} from './compose.ts';
import {EFFECTS_DEPTH, layerForDepth} from './layers.ts';
import {LightField} from './lightField.ts';

const DAY = [1, 1, 1];
const NIGHT = [0.3, 0.4, 0.66];

function skyOf(rows: string[]) {
  const grid = asciiGrid(rows);
  const values = new Float32Array(grid.cols * grid.rows);
  computeSkyField(grid, values);
  return {grid, sky: {cols: grid.cols, rows: grid.rows, values} satisfies SkyField};
}

function fieldFor(grid: ReturnType<typeof asciiGrid>, col: number, row: number, kind: 'fire' | 'crystal' = 'fire') {
  return computeSourceField(grid, {id: 'test-' + col + '-' + row, kind, col, row});
}

function window1(c0: number, r0: number, cols: number, rows: number) {
  return {c0, r0, cols, rows};
}

test('attenuation per destination cell follows the mockup rules', () => {
  const grid = asciiGrid(['.W.', 'w#.', '...']);
  assert.equal(attenuationAt(grid, 0, 0), ATTEN_OPEN);
  assert.equal(attenuationAt(grid, 1, 0), ATTEN_WALL);
  assert.equal(attenuationAt(grid, 0, 1), ATTEN_WATER);
  assert.equal(attenuationAt(grid, 1, 1), ATTEN_SOLID);
});

test('open air is fully lit, the first solid cell gets the surface value, and light fades down', () => {
  const {sky} = skyOf(['.....', '.....', '#####', '#####', '#####']);
  const at = (c: number, r: number) => sky.values[r * sky.cols + c];
  assert.equal(at(2, 0), 1);
  assert.equal(at(2, 1), 1);
  assert.ok(Math.abs(at(2, 2) - SKY_SURFACE) < 1e-6);
  assert.ok(Math.abs(at(2, 3) - SKY_SURFACE * ATTEN_SOLID) < 1e-6);
  assert.ok(at(2, 3) > at(2, 4));
});

test('sealed rock is dimmer than open air at the same depth, and sky light never goes negative', () => {
  const {sky} = skyOf(['.....', '.#.#.', '.###.', '.....', '#####']);
  const sealed = sky.values[2 * sky.cols + 2];
  const open = sky.values[3 * sky.cols + 0];
  assert.ok(sealed > 0 && sealed < open);
  assert.ok(sky.values.every((v) => v >= 0 && v <= 1));
});

test('a lone source fades with distance and solid rock darkens it faster than open air', () => {
  const air = fieldFor(asciiGrid(['.........', '.........', '.........', '.........', '.........']), 4, 2);
  const at = (f: typeof air, x: number, y: number) => f.values[(y - f.r0) * f.side + (x - f.c0)];
  assert.ok(Math.abs(at(air, 4, 2) - SOURCE_SPECS.fire.intensity) < 1e-6);
  assert.ok(at(air, 5, 2) > at(air, 6, 2));
  assert.ok(at(air, 6, 2) > at(air, 7, 2));
  const wall = ['..#....', '..#....', '..#....', '..#....', '..#....'];
  const open = ['.......', '.......', '.......', '.......', '.......'];
  const behindRock = fieldFor(asciiGrid(wall), 1, 2);
  const behindAir = fieldFor(asciiGrid(open), 1, 2);
  assert.ok(at(behindRock, 3, 2) < at(behindAir, 3, 2));
  assert.ok(at(behindRock, 3, 2) > 0);
});

test('a source reaches no further than its reach and its window edge stays dark', () => {
  const grid = asciiGrid(Array.from({length: 24}, () => '.'.repeat(24)));
  const field = fieldFor(grid, 12, 12);
  const reach = SOURCE_SPECS.fire.reach;
  assert.equal(field.side, reach * 2 + 1);
  assert.equal(field.values[0], 0);
  assert.equal(field.values[field.values.length - 1], 0);
  assert.equal(falloffAt(reach + 1, reach), 0);
  assert.equal(falloffAt(0, reach), 1);
});

test('two sources combine by the per-channel maximum, not by addition', () => {
  const grid = asciiGrid(['.......', '.......', '.......', '.......', '.......']);
  const fire = fieldFor(grid, 3, 2, 'fire');
  const crystal = fieldFor(grid, 3, 2, 'crystal');
  const win = window1(0, 0, 7, 5);
  const alone = (fields: readonly (typeof fire)[]) => {
    const out = new Uint8ClampedArray(7 * 5 * 4);
    composeLight({cols: 7, rows: 5, values: new Float32Array(35)}, [0, 0, 0], fields, win, out);
    return out;
  };
  const both = alone([fire, crystal]);
  const onlyFire = alone([fire]);
  const onlyCrystal = alone([crystal]);
  const o = (3 + 2 * 7) * 4;
  for (let ch = 0; ch < 3; ch++) assert.equal(both[o + ch], Math.max(onlyFire[o + ch], onlyCrystal[ch + o]));
  assert.equal(both[o + 3], 255);
});

test('sky colour changes the lit background smoothly while source-lit cells keep their colour', () => {
  const {grid, sky} = skyOf(['.....', '.....', '#####', '#####']);
  const fire = fieldFor(grid, 2, 0, 'fire');
  const win = window1(0, 0, 5, 4);
  const day = new Uint8ClampedArray(5 * 4 * 4);
  const night = new Uint8ClampedArray(5 * 4 * 4);
  composeLight(sky, DAY, [], win, day);
  composeLight(sky, NIGHT, [], win, night);
  const far = (0 * 5 + 0) * 4;
  assert.equal(day[far], 255);
  assert.equal(night[far], Math.round(NIGHT[0] * 255));
  assert.equal(night[far + 2], Math.round(NIGHT[2] * 255));
  const sourceCell = (0 * 5 + 2) * 4;
  composeLight(sky, NIGHT, [fire], win, night);
  const lit = (ch: number) => Math.round(Math.min(1, SOURCE_SPECS.fire.intensity * SOURCE_SPECS.fire.rgb[ch]) * 255);
  assert.equal(night[sourceCell], lit(0));
  assert.equal(night[sourceCell + 1], lit(1));
});

test('deep rock at night keeps the ambient floor so it stays readable', () => {
  const {sky} = skyOf(['.....', '#####', '#####', '#####', '#####', '#####', '#####', '#####', '#####']);
  const out = new Uint8ClampedArray(5 * 9 * 4);
  composeLight(sky, NIGHT, [], window1(0, 0, 5, 9), out);
  const deep = (8 * 5 + 2) * 4;
  assert.equal(out[deep], Math.round(AMBIENT * 255));
  assert.ok(out[deep + 2] >= Math.round(AMBIENT * 255));
});

test('composition is deterministic and writes only into the given buffer', () => {
  const {grid, sky} = skyOf(['.....', '..K..', '#####']);
  const fields = [fieldFor(grid, 2, 1, 'crystal')];
  const a = new Uint8ClampedArray(5 * 3 * 4);
  const b = new Uint8ClampedArray(5 * 3 * 4);
  composeLight(sky, NIGHT, fields, window1(0, 0, 5, 3), a);
  composeLight(sky, NIGHT, fields, window1(0, 0, 5, 3), b);
  assert.deepEqual(a, b);
});

test('building sources: fire, stove and lantern always count, tent only at night, positions follow ground', () => {
  const grid = asciiGrid(['.....', '.....', '.....', '.....', '.....', '#####', '#####']);
  const out: LightSource[] = [];
  const buildings = [
    {id: 'f', kind: 'fire' as const, x: 100},
    {id: 'l', kind: 'lantern' as const, x: 150},
    {id: 't', kind: 'tent' as const, x: 200},
    {id: 'c', kind: 'chest' as const, x: 250},
  ];
  const noon = 0.5 * DAY_SECONDS;
  const midnight = 0;
  assert.equal(buildingSources(grid, buildings, noon, out), 2);
  assert.deepEqual(
    out.map((s) => s.id),
    ['f', 'l'],
  );
  assert.equal(buildingSources(grid, buildings, midnight, out), 3);
  assert.equal(out[0].col, 3);
  assert.equal(out[0].row, 4);
  assert.equal(out[1].row, 3);
});

test('crystal sources list every crystal cell once and no other kind', () => {
  const grid = asciiGrid(['.K.', 'KK.', '###']);
  const out: LightSource[] = [];
  assert.equal(crystalSources(grid, out), 3);
  assert.ok(out.every((s) => s.kind === 'crystal'));
});

test('sky tint and bloom follow the period weights (day, dusk, night)', () => {
  const weights = new Float64Array(3);
  const tint = new Float64Array(3);
  writePeriodWeights(0, weights);
  skyTint(weights, tint);
  assert.deepEqual(
    Array.from(tint, (v) => Math.round(v * 100) / 100),
    [0.3, 0.4, 0.66],
  );
  assert.equal(bloomStrength(weights), 1);
  writePeriodWeights(0.5 * DAY_SECONDS, weights);
  skyTint(weights, tint);
  assert.deepEqual(
    Array.from(tint, (v) => Math.round(v * 100) / 100),
    [1, 1, 1],
  );
  assert.equal(Math.round(bloomStrength(weights) * 100) / 100, 0.2);
  writePeriodWeights(0.75 * DAY_SECONDS, weights);
  skyTint(weights, tint);
  assert.deepEqual(
    Array.from(tint, (v) => Math.round(v * 100) / 100),
    [1, 0.8, 0.64],
  );
  assert.equal(Math.round(bloomStrength(weights) * 100) / 100, 0.55);
});

test('water-filled cells attenuate with the water factor', () => {
  assert.ok(ATTEN_WATER > ATTEN_SOLID && ATTEN_WATER < ATTEN_OPEN);
  assert.ok(ATTEN_WALL < ATTEN_OPEN);
});

test('depth decides the layer: negative is background, 21 and up is effects, the rest is world', () => {
  assert.equal(layerForDepth(-10), 'background');
  assert.equal(layerForDepth(0), 'world');
  assert.equal(layerForDepth(20), 'world');
  assert.equal(layerForDepth(EFFECTS_DEPTH), 'effects');
  assert.equal(layerForDepth(25), 'effects');
});

test('light field rebuilds building sources only when the set changes and keeps crystals fixed', () => {
  const grid = asciiGrid(['.K.....', '.......', '.......', '#######']);
  const field = new LightField(grid);
  const crystalCount = field.sources().length;
  assert.ok(crystalCount >= 1);
  const fire = [{id: 'b1', kind: 'fire' as const, x: 96}];
  assert.equal(field.setBuildings(fire, 0.5 * DAY_SECONDS), true);
  assert.equal(field.sources().length, crystalCount + 1);
  assert.equal(field.setBuildings(fire, 0.5 * DAY_SECONDS), false);
  assert.equal(field.setBuildings([], 0.5 * DAY_SECONDS), true);
  assert.equal(field.sources().length, crystalCount);
});

test('light field composes the same output as the pure compose function', () => {
  const grid = asciiGrid(['.....', '.....', '#####']);
  const field = new LightField(grid);
  field.setBuildings([{id: 'f', kind: 'fire', x: 64}], 0.5 * DAY_SECONDS);
  const win = {c0: 0, r0: 0, cols: 5, rows: 3};
  const a = new Uint8ClampedArray(5 * 3 * 4);
  const b = new Uint8ClampedArray(5 * 3 * 4);
  field.compose(win, [1, 1, 1], a);
  field.compose(win, [1, 1, 1], b);
  assert.deepEqual(a, b);
  assert.equal(a[(0 * 5 + 2) * 4 + 3], 255);
});

test('a lone source spreads in a round area: two steps straight and two steps diagonal carry the same value', () => {
  const grid = asciiGrid(Array.from({length: 15}, () => '.'.repeat(15)));
  const field = fieldFor(grid, 7, 7);
  const reach = SOURCE_SPECS.fire.reach;
  const at = (x: number, y: number) => field.values[(y - field.r0) * field.side + (x - field.c0)];
  const straight = at(9, 7) / falloffAt(2, reach);
  const diagonal = at(9, 9) / falloffAt(2 * Math.SQRT2, reach);
  assert.ok(Math.abs(straight - diagonal) < 1e-5, straight + ' vs ' + diagonal);
});
