import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newSave, decodeSave, storeFish} from './camping.ts';
import {fishPrice, sellFish, sellExceptRecords, buyGear, cook, foodPrice, eat} from './economy.ts';
import {fishSpecies, gear, rarityPrices} from '../data/catalog.ts';
test('prices respect rarity and bounded size ratio', () => {
  for (const species of fishSpecies) {
    const base = rarityPrices[species.rarity];
    assert.equal(fishPrice({id: species.id, length: species.min}), base);
    assert.equal(fishPrice({id: species.id, length: species.max}), base * 2);
    assert.equal(fishPrice({id: species.id, length: 9999}), base * 2);
  }
});
test('sale keeps collection records and bulk sale retains one record fish per species', () => {
  const save = newSave();
  storeFish(save, 'carp', 65);
  storeFish(save, 'carp', 20);
  storeFish(save, 'carp', 65);
  const collection = structuredClone(save.fish);
  assert.equal(sellExceptRecords(save), true);
  assert.deepEqual(save.fishBag, [{id: 'carp', length: 65}]);
  assert.deepEqual(save.fish, collection);
  assert.equal(sellFish(save, 0), true);
  assert.equal(save.fishBag.length, 0);
  assert.deepEqual(save.fish, collection);
});
test('cooking consumes exactly one fish, preserves records, meals have premium and eating grants buff', () => {
  const save = newSave();
  storeFish(save, 'perch', 20);
  storeFish(save, 'perch', 25);
  const original = structuredClone(save);
  assert.equal(cook(save, 0, 'soup', false), false);
  assert.deepEqual(save, original);
  assert.equal(cook(save, 0, 'grilled', false), true);
  assert.equal(save.fishBag.length, 1);
  assert.equal(save.food.length, 1);
  assert.deepEqual(save.fish, original.fish);
  assert.ok(foodPrice(save.food[0]) > fishPrice(original.fishBag[0]));
  assert.equal(eat(save, 0), true);
  assert.equal(save.speedBuff, 120);
  assert.equal(save.food.length, 0);
});
test('failed purchase and invalid transactions never mutate state', () => {
  const save = newSave();
  const item = gear.find((g) => g.price > 0)!;
  const original = structuredClone(save);
  assert.equal(buyGear(save, item.id), false);
  assert.equal(sellFish(save, -1), false);
  assert.equal(cook(save, 0, 'grilled', true), false);
  assert.deepEqual(save, original);
  save.coin = item.price;
  assert.equal(buyGear(save, item.id), true);
  assert.equal(save.coin, 0);
  assert.ok(save.owned.includes(item.id));
});
test('v1 migration retains all old progress and creates stable building ids and conservative fish lengths', () => {
  const old = {
    version: 1,
    x: 4200,
    wood: 45,
    stone: 70,
    equipped: {hat: 'hat-knit'},
    fish: {carp: {count: 3, largest: 45}},
    buildings: [{kind: 'tent', x: 192}],
    harvested: ['node-1'],
  };
  const save = decodeSave(JSON.stringify(old));
  assert.equal(save.version, 2);
  assert.equal(save.x, old.x);
  assert.equal(save.wood, old.wood);
  assert.equal(save.stone, old.stone);
  assert.equal(save.equipped.hat, 'hat-knit');
  assert.deepEqual(save.fish, old.fish);
  assert.deepEqual(
    save.fishBag.map((f) => f.length),
    [45, 20, 20],
  );
  assert.equal(save.buildings[0].id, 'build-old-0');
  assert.deepEqual(save.harvested, old.harvested);
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
});
test('save v2 sanitizes dirty coins, unknown items, nonfinite buildings and broken roots', () => {
  for (const [value, expected] of [
    [-10, 0],
    [1e9, 999999],
    ['oops', 0],
    [4.8, 4],
  ] as const) {
    assert.equal(decodeSave(JSON.stringify({...newSave(), coin: value})).coin, expected);
  }
  const save = decodeSave(
    JSON.stringify({
      ...newSave(),
      fishBag: [{id: 'hack', length: 5}],
      owned: ['hack'],
      food: [{id: 'carp', length: 20, meal: 'hack'}],
      buildings: [{kind: 'tent', x: null}],
    }),
  );
  assert.equal(save.fishBag.length, 0);
  assert.equal(save.food.length, 0);
  assert.equal(save.buildings.length, 0);
  assert.equal(save.owned.includes('hack'), false);
  assert.deepEqual(decodeSave('null'), newSave());
});
test('rod purchases validate all costs and ownership before charging', async () => {
  const {buyRod, equipRod} = await import('./economy.ts');
  const save = newSave();
  save.coin = 500;
  save.wood = 0;
  const poor = structuredClone(save);
  assert.equal(buyRod(save, 'carbon'), false);
  assert.deepEqual(save, poor);
  save.wood = save.stone = 50;
  assert.equal(buyRod(save, 'carbon'), true);
  assert.equal(save.coin, 150);
  assert.equal(save.wood, 42);
  assert.equal(save.stone, 44);
  assert.equal(save.rod, 'carbon');
  const bought = structuredClone(save);
  assert.equal(buyRod(save, 'carbon'), false);
  assert.deepEqual(save, bought);
  assert.equal(equipRod(save, 'legendary'), false);
  assert.equal(equipRod(save, 'bamboo'), true);
});
