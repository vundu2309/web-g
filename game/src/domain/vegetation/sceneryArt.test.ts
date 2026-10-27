import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Art} from './art.ts';
import {paintBeachScenery, paintLandScenery, paintUnderwaterScenery} from './sceneryArt.ts';
import {colorNumber, palette} from '../../data/palette.ts';

const colors = new Set(Object.values(palette).map(colorNumber));
function verify(art: Art) {
  let pixels = 0;
  for (let y = 0; y < art.h; y++)
    for (let x = 0; x < art.w; x++) {
      if (!art.has(x, y)) continue;
      assert.ok(colors.has(art.rgbAt(x, y)));
      pixels++;
    }
  assert.ok(pixels > 100);
}

test('forest and beach scenery is deterministic, non-empty and uses only the shared palette', () => {
  for (const paint of [paintLandScenery, paintBeachScenery]) {
    const first = new Art(128, 128);
    const second = new Art(128, 128);
    for (let i = 0; i < 50; i++) {
      paint(first, 64, 100, i * 192 + 1);
      paint(second, 64, 100, i * 192 + 1);
    }
    assert.deepEqual(first.data, second.data);
    verify(first);
    assert.ok(first.bounds()!.minY >= 48, 'cảnh không vượt vùng đệm trên mặt đất');
  }
});

test('underwater scenery stays below the surface and is deterministic in lakes and deep ocean', () => {
  for (const sea of [false, true]) {
    const first = new Art(128, 256);
    const second = new Art(128, 256);
    for (let i = 0; i < 30; i++) {
      paintUnderwaterScenery(first, 64, 40, 220, i * 32 + 1, sea);
      paintUnderwaterScenery(second, 64, 40, 220, i * 32 + 1, sea);
    }
    assert.deepEqual(first.data, second.data);
    assert.ok(first.bounds()!.minY >= 40);
    assert.ok(first.bounds()!.maxY <= 221);
    verify(first);
  }
});
