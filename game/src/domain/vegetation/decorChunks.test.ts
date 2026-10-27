import {test} from 'node:test';
import assert from 'node:assert/strict';
import {colorNumber, palette} from '../../data/palette.ts';
import {vegetationWorld, waterTopAt} from '../../data/vegetationWorld.ts';
import {WORLD_WIDTH} from '../../data/world.ts';
import {Art} from './art.ts';
import {DECOR_CHUNK, decorChunks, paintDecorChunk} from './decorChunks.ts';
import {type VegetationWorld} from './world.ts';

const PALETTE_COLORS = new Set(Object.values(palette).map(colorNumber));

function paintedChunk(world: VegetationWorld, index: number) {
  const chunk = decorChunks(world)[index];
  const art = new Art(chunk.width / 2, chunk.height);
  paintDecorChunk(art, chunk, world);
  return {chunk, art};
}

test('chunks cover the whole world, have even tops and hold every ground row they need', () => {
  const chunks = decorChunks(vegetationWorld);
  assert.equal(chunks.length, Math.ceil(WORLD_WIDTH / DECOR_CHUNK));
  let covered = 0;
  for (const chunk of chunks) {
    assert.equal(chunk.x0, covered, 'chunk liền nhau');
    covered += chunk.width;
    assert.equal(chunk.top % 2, 0, 'đỉnh chunk phải chẵn');
    for (let wx = chunk.x0; wx < chunk.x0 + chunk.width; wx += 2) {
      const row = (vegetationWorld.groundAt(wx) - chunk.top) / 2;
      assert.ok(row >= 0 && row < chunk.height, 'mặt đất ngoài khung tại ' + wx);
    }
  }
  assert.equal(covered, WORLD_WIDTH);
});

test('decor texture memory stays far below the old 31.7 MB total', () => {
  let bytes = 0;
  for (const chunk of decorChunks(vegetationWorld)) bytes += (chunk.width / 2) * chunk.height * 4;
  assert.ok(bytes < 10 * 1024 * 1024, 'bộ nhớ ' + bytes);
});

test('painting a chunk is deterministic and uses only palette colors', () => {
  const a = paintedChunk(vegetationWorld, 3).art.data;
  const b = paintedChunk(vegetationWorld, 3).art.data;
  assert.deepEqual(a, b);
  const {art} = paintedChunk(vegetationWorld, 3);
  for (let y = 0; y < art.h; y++) {
    for (let x = 0; x < art.w; x++) {
      if (art.has(x, y)) assert.ok(PALETTE_COLORS.has(art.rgbAt(x, y)), 'ngoài bảng tại ' + x + ',' + y);
    }
  }
});

test('lake columns get only lily pads below the water top, never grass, stones, or ferns above it', () => {
  const lake = vegetationWorld.lakes[0];
  const index = Math.floor(lake.x / DECOR_CHUNK);
  const {chunk, art} = paintedChunk(vegetationWorld, index);
  for (let px = 0; px < art.w; px++) {
    const wx = chunk.x0 + px * 2 + 1;
    const water = waterTopAt(wx);
    if (water === null || wx < lake.x || wx > lake.x + lake.width) continue;
    const surface = (water - chunk.top) / 2;
    for (let py = 0; py < surface; py++) assert.ok(!art.has(px, py), 'vật trên mặt nước tại ' + wx + ',' + py);
  }
});

test('no ground decor is cut at a chunk edge: the two outer art columns on each side stay empty', () => {
  for (const chunk of decorChunks(vegetationWorld)) {
    const art = new Art(chunk.width / 2, chunk.height);
    paintDecorChunk(art, chunk, vegetationWorld);
    for (let y = 0; y < art.h; y++) {
      for (const px of [0, 1, art.w - 2, art.w - 1]) assert.ok(!art.has(px, y), 'mép chunk ' + chunk.index);
    }
  }
});
