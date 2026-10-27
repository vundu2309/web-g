import {WORLD_WIDTH} from './data/worldLayout.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSave, decodeSave, equip, craft, rollFish, storeFish, fishSpecies} from './camping.ts';
test('starter equipment and material budget are usable', () => {
  const s = newSave();
  assert.equal(Object.keys(s.equipped).length, 4);
  assert.equal(equip(s, 'shirt-pine'), true);
  assert.equal(s.equipped.shirt, 'shirt-pine');
  assert.equal(equip(s, 'hacked'), false);
  assert.equal(craft(s, 'tent', 192), true);
  assert.equal(s.wood, 16);
  assert.equal(s.stone, 14);
  assert.equal(s.buildings.length, 1);
});
test('craft never charges insufficient materials', () => {
  const s = newSave();
  s.wood = 0;
  const previous = JSON.stringify(s);
  assert.equal(craft(s, 'chest', 100), false);
  assert.equal(JSON.stringify(s), previous);
});
test('fish follow habitats and preserve counts and records', () => {
  const s = newSave();
  for (const habitat of ['pond', 'lake', 'river', 'sea'] as const)
    for (let i = 0; i < 100; i++) {
      const f = rollFish(habitat, i / 100, i / 100);
      assert.ok((f.species.habitats as readonly string[]).includes(habitat));
      assert.ok(f.length >= f.species.min && f.length <= f.species.max);
    }
  storeFish(s, 'carp', 35);
  storeFish(s, 'carp', 28);
  assert.deepEqual(s.fish.carp, {count: 2, largest: 35});
  assert.equal(fishSpecies.length, 15);
});
test('save restores equipment, fish and buildings and rejects invalid values', () => {
  const s = newSave();
  equip(s, 'bag-moss');
  storeFish(s, 'koi', 42);
  craft(s, 'fire', 192);
  assert.deepEqual(decodeSave(JSON.stringify(s)), s);
  assert.deepEqual(decodeSave('oops'), newSave());
  const cleaned = decodeSave(
    JSON.stringify({
      version: 1,
      x: 1e10,
      wood: -8,
      stone: 'bad',
      equipped: {hat: 'bad'},
      fish: {carp: {count: 2, largest: 999}, unknown: {count: 9}},
      buildings: [
        {kind: 'hack', x: 3},
        {kind: 'tent', x: -1},
      ],
      harvested: ['node-1', 'other'],
    }),
  );
  assert.equal(cleaned.wood, 0);
  assert.equal(cleaned.stone, 0);
  assert.equal(cleaned.x, WORLD_WIDTH - 40);
  assert.equal(cleaned.equipped.hat, 'hat-ranger');
  assert.equal(cleaned.fish.carp?.largest, 65);
  assert.equal(cleaned.buildings.length, 0);
  assert.deepEqual(cleaned.harvested, ['node-1']);
});
