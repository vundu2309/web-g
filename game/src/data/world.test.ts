import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestWater, waterDirections} from './world.ts';
test('directions use nearest shoreline rather than always pointing to Ao Sen', () => {
  assert.equal(nearestWater(100).id, 'pond');
  assert.equal(nearestWater(9000).id, 'mirror');
  assert.match(waterDirections(15000), /Suối Trăng phía bên trái/);
  assert.match(waterDirections(3000), /Hồ Thông phía bên phải/);
});
