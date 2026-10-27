import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vegetationWorld} from '../../data/vegetationWorld.ts';
import {waters, WORLD_WIDTH, WATERFALL_X, RUINS_X, resourceNodes} from '../../data/world.ts';
import {FLAT_HALF, LAKE_MARGIN, NODE_MARGIN, placeTrees} from './placement.ts';

const trees = placeTrees(vegetationWorld);

test('tree placement is deterministic from the fixed seed', () => {
  assert.deepEqual(placeTrees(vegetationWorld), trees);
  assert.ok(trees.length >= 30, 'quá thưa: ' + trees.length);
});

test('no tree stands in a lake, on the walkway, near a landmark, or beside a resource node', () => {
  for (const tree of trees) {
    for (const lake of waters) {
      const inside = tree.x >= lake.x - LAKE_MARGIN && tree.x <= lake.x + lake.width + LAKE_MARGIN;
      assert.ok(!inside, 'cây trong hồ ' + lake.name + ' tại ' + tree.x);
    }
    assert.ok(Math.abs(tree.x - WATERFALL_X) > 160, 'cây quá gần thác ' + tree.x);
    assert.ok(Math.abs(tree.x - RUINS_X) > 40, 'cây quá gần cổng vòm ' + tree.x);
    for (const node of resourceNodes) assert.ok(Math.abs(tree.x - node.x) >= NODE_MARGIN, 'cây sát nút ' + tree.x);
  }
});

test('every tree sits on flat ground for its trunk and on the surface of its column', () => {
  for (const tree of trees) {
    assert.equal(tree.ground, vegetationWorld.groundAt(tree.x));
    assert.equal(vegetationWorld.groundAt(tree.x - FLAT_HALF), tree.ground);
    assert.equal(vegetationWorld.groundAt(tree.x + FLAT_HALF), tree.ground);
  }
});

test('zones 1 and 3 get pines, the other zones get broadleaf trees, and density stays in range', () => {
  const perZone = new Array<number>(vegetationWorld.zones).fill(0);
  for (const tree of trees) {
    perZone[tree.zone]++;
    assert.equal(tree.kind, vegetationWorld.pineZones?.includes(tree.zone) ? 'pine' : 'broadleaf', 'vùng ' + tree.zone);
    assert.ok(tree.x >= 0 && tree.x < WORLD_WIDTH);
  }
  for (const [zone, count] of perZone.entries()) {
    if (zone >= 8) assert.equal(count, 0, 'bãi biển dùng cọ trang trí');
    else assert.ok(count >= 3 && count <= 14, 'mật độ ' + perZone.join(','));
  }
});

test('trees keep a minimum spacing so canopies rarely overlap', () => {
  for (let i = 1; i < trees.length; i++) assert.ok(trees[i].x - trees[i - 1].x >= 150, 'sát nhau ở ' + trees[i].x);
});
