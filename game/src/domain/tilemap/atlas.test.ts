import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tileAtlas} from './atlas.ts';

test('atlas đủ bảy loại × 16 mask, hai tường, ba tầng nước và xác định', () => {
  const tiles = tileAtlas();
  assert.equal(tiles.length, 117);
  assert.equal(tiles.filter((tile) => tile.name === 'dirt').length, 16);
  assert.ok(tiles.every((tile) => tile.rgba.length === 1024));
  assert.deepEqual(tiles, tileAtlas());
  assert.notDeepEqual(tiles[16].rgba, tiles[17].rgba);
});
