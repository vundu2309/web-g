import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transfer, backpackItems} from './chest.ts';
import {newSave, decodeSave, storeFish, craft, rollFish} from './camping.ts';
import {periodAt, clockText, DAY_SECONDS, nightAmount} from './dayTime.ts';
function camp() {
  const save = newSave();
  craft(save, 'chest', 192);
  return save;
}
test('chest transfers wood stone fish and food both ways without altering collection', () => {
  const save = camp();
  storeFish(save, 'carp', 45);
  save.food.push({id: 'perch', length: 20, meal: 'grilled'});
  const original = structuredClone(save);
  const id = save.buildings[0].id;
  assert.equal(transfer(save, id, 'deposit', -1), true);
  assert.equal(save.wood + save.stone + save.fishBag.length + save.food.length, 0);
  assert.equal(save.chests[id].length, 4);
  assert.deepEqual(save.fish, original.fish);
  assert.equal(transfer(save, id, 'withdraw', -1), true);
  assert.deepEqual(save, original);
  assert.ok(backpackItems(save).length > 0);
});
test('a full chest and overflowing backpack reject the entire transfer atomically', () => {
  const save = camp();
  const id = save.buildings[0].id;
  save.chests[id] = Array.from({length: 20}, (_, i) => ({kind: 'fish', count: 1, fish: {id: 'carp', length: 20 + i}}));
  const full = structuredClone(save);
  assert.equal(transfer(save, id, 'deposit', -1), false);
  assert.deepEqual(save, full);
  save.chests[id] = [{kind: 'wood', count: 9999}];
  const overflow = structuredClone(save);
  assert.equal(transfer(save, id, 'withdraw', -1), false);
  assert.deepEqual(save, overflow);
  assert.equal(transfer(save, 'missing', 'deposit', -1), false);
  assert.equal(transfer(save, id, 'deposit', 100), false);
  assert.deepEqual(save, overflow);
});
test('stable ids isolate multiple chests and sanitize their contents', () => {
  const save = camp();
  save.wood = save.stone = 100;
  craft(save, 'chest', 400);
  const [first, second] = save.buildings;
  assert.notEqual(first.id, second.id);
  assert.equal(transfer(save, first.id, 'deposit', 0), true);
  assert.equal(save.chests[second.id].length, 0);
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  const dirty = decodeSave(
    JSON.stringify({
      ...save,
      time: -5,
      chests: {
        [first.id]: [
          {kind: 'hack', count: 1},
          {kind: 'wood', count: -1},
          {kind: 'fish', count: 5, fish: {id: 'hack', length: 50}},
        ],
        hack: [{kind: 'wood', count: 10}],
      },
    }),
  );
  assert.equal(dirty.chests[first.id].length, 0);
  assert.equal(Object.hasOwn(dirty.chests, 'hack'), false);
  assert.equal(dirty.time, 0);
});
test('eight minute clock defines dawn day dusk night and fish respect active periods', () => {
  assert.equal(DAY_SECONDS, 480);
  assert.equal(clockText(160), '08:00');
  assert.equal(clockText(480), '00:00');
  assert.equal(periodAt(120), 'dawn');
  assert.equal(periodAt(160), 'day');
  assert.equal(periodAt(360), 'dusk');
  assert.equal(periodAt(440), 'night');
  assert.equal(nightAmount(160), 0);
  assert.equal(nightAmount(440), 1);
  for (const period of ['dawn', 'day', 'dusk', 'night'] as const) {
    for (let i = 0; i <= 100; i++) {
      const caught = rollFish('river', i / 100, 0.5, 1, period);
      assert.ok(caught.species.activeAt.includes(period));
      if (period === 'day') assert.notEqual(caught.species.id, 'golden');
    }
  }
  assert.equal(rollFish('river', 1, 1, 1, 'night').species.id, 'golden');
});

test('dirty duplicate building ids become unique and remain stable on a second decode', () => {
  const save = decodeSave(
    JSON.stringify({
      ...newSave(),
      buildings: [
        {id: 'build-migrated-1', kind: 'chest', x: 200},
        {id: 'build-migrated-1', kind: 'chest', x: 400},
        {id: 'build-migrated-1-0', kind: 'chest', x: 600},
      ],
    }),
  );
  assert.equal(new Set(save.buildings.map((b) => b.id)).size, 3);
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
});
