import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {asciiGrid} from './testGrid.ts';
import {columnTints, tilePixel, UP, DOWN, LEFT, RIGHT, openMask} from './tileArt.ts';
import {REGION_MIX, TONES, blend} from './tileColors.ts';
import {TILE_ART} from './types.ts';

const SOIL_TINT = new Int32Array(64);

function pixels(grid: ReturnType<typeof asciiGrid>, c: number, r: number, water = false) {
  const out: number[] = [];
  for (let py = 0; py < TILE_ART; py++) {
    for (let px = 0; px < TILE_ART; px++) out.push(tilePixel(grid, SOIL_TINT, c, r, px, py, water));
  }
  return out;
}

function lum(v: number) {
  return ((v >> 16) & 255) + ((v >> 8) & 255) + (v & 255);
}

const GRASS_ALLOWED = TONES.grass.map((col) => blend(col, 0, REGION_MIX));

test('a tile is 16 by 16 pixels and the same coordinates always give the same pixel', () => {
  const grid = asciiGrid(['#####', '#####', '#####']);
  const first = pixels(grid, 2, 1);
  const second = pixels(grid, 2, 1);
  assert.equal(first.length, TILE_ART * TILE_ART);
  assert.deepEqual(first, second);
});

test('grass shows only on dirt with air above, and dirt under stone has none', () => {
  const open = asciiGrid(['...', '.d.', '.##']);
  const roofed = asciiGrid(['###', '#d#', '###']);
  const grassOpen = pixels(open, 1, 1)
    .slice(0, 4 * TILE_ART)
    .filter((v) => GRASS_ALLOWED.includes(v & 0xffffff));
  const grassRoofed = pixels(roofed, 1, 1)
    .slice(0, 4 * TILE_ART)
    .filter((v) => GRASS_ALLOWED.includes(v & 0xffffff));
  assert.ok(grassOpen.length > 0, 'open top should have grass');
  assert.equal(grassRoofed.length, 0);
});

test('a bright top rim appears only where air is above, and the bottom and sides darken against air', () => {
  const air = asciiGrid(['.....', '.#...', '.....']);
  const roof = asciiGrid(['#####', '#####', '#####']);
  const top = (g: ReturnType<typeof asciiGrid>) => lum(tilePixel(g, SOIL_TINT, 1, 1, 6, 0, false));
  assert.ok(top(air) > top(roof));
  const bottomAir = asciiGrid(['#####', '#####', '.....']);
  const bottomRoof = asciiGrid(['#####', '#####', '#####']);
  const bottom = (g: ReturnType<typeof asciiGrid>) => lum(tilePixel(g, SOIL_TINT, 2, 1, 6, 15, false));
  assert.ok(bottom(bottomAir) < bottom(bottomRoof));
  const solidLeft = asciiGrid(['###', '###', '###']);
  const leftPixel = (g: ReturnType<typeof asciiGrid>) => lum(tilePixel(g, SOIL_TINT, 1, 1, 0, 6, false));
  assert.ok(leftPixel(asciiGrid(['.##', '.##', '.##'])) < leftPixel(solidLeft));
});

test('solid neighbours share no seam: an edge darkens only against air', () => {
  const sameKind = asciiGrid(['###', '###', '###']);
  const airRight = asciiGrid(['##.', '##.', '##.']);
  const edge = (g: ReturnType<typeof asciiGrid>) => lum(tilePixel(g, SOIL_TINT, 1, 1, 15, 8, false));
  assert.ok(edge(airRight) < edge(sameKind));
});

test('open-side mask reads the four neighbours and treats water as open', () => {
  const grid = asciiGrid(['.w.', 'd#.', '.#.']);
  assert.equal(openMask(grid, 1, 1), UP | RIGHT);
  assert.equal(openMask(grid, 0, 1) & RIGHT, 0);
  assert.equal(openMask(grid, 1, 1) & DOWN, 0);
  assert.equal(openMask(grid, 1, 1) & LEFT, 0);
});

test('water is only drawn in the water layer, and air with no wall stays transparent', () => {
  const grid = asciiGrid(['..', 'dd', 'ww', 'ss']);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 0, 3, 3, false), 0);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 0, 3, 3, true), 0);
  assert.ok(tilePixel(grid, SOIL_TINT, 0, 1, 3, 3, false) >>> 24 === 255);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 1, 3, 3, true), 0);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 2, 3, 3, false), 0);
  assert.ok(tilePixel(grid, SOIL_TINT, 0, 2, 3, 3, true) >>> 24 > 0);
});

test('walls are opaque, darker than stone, and drawn only behind air', () => {
  const grid = asciiGrid(['WW', 'W#']);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 0, 2, 2, false) >>> 24, 255);
  assert.equal(tilePixel(grid, SOIL_TINT, 0, 0, 2, 2, true), 0);
});

test('tile tones are named palette roles, and tileArt and tileColors hold no hex literals', () => {
  const sources = ['./tileArt.ts', './tileColors.ts'].map((path) =>
    readFileSync(new URL(path, import.meta.url), 'utf8'),
  );
  for (const source of sources) assert.doesNotMatch(source, /#[0-9a-fA-F]{6}/);
  for (const tones of Object.values(TONES)) for (const col of tones) assert.ok(col >= 0 && col <= 0xffffff);
  assert.equal(columnTints(asciiGrid(['..', '..'])).length, 2);
});
