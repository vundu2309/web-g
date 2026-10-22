import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishingSystem} from './FishingSystem.ts';
import {ConstructionSystem} from './ConstructionSystem.ts';
import {newSave} from '../../camping.ts';
test('fishing only hooks during bite and awards exactly once after a won fight', () => {
  const fishing = new FishingSystem(() => 0);
  const save = newSave();
  fishing.cast({id: 'pond', habitat: 'pond'});
  assert.equal(fishing.reel(save), null);
  assert.deepEqual(save.fish, {});
  assert.equal(fishing.update(2.5), 'bite');
  assert.equal(fishing.reel(save), null);
  assert.equal(fishing.session?.phase, 'fight');
  for (let i = 0; i < 2000 && fishing.session?.phase === 'fight'; i++) {
    fishing.update(1 / 60, fishing.session.tension < 55);
  }
  const fish = fishing.reel(save)!;
  assert.ok(fish);
  assert.equal(save.fish[fish.species.id]?.count, 1);
  assert.equal(fishing.reel(save), null);
  fishing.cast({id: 'river', habitat: 'river'});
  assert.equal(fishing.update(2.5), 'bite');
  assert.equal(fishing.update(2), 'escaped');
});
test('cancelling fishing leaves inventory unchanged', () => {
  const fishing = new FishingSystem(() => 0),
    save = newSave();
  fishing.cast({id: 'lake', habitat: 'lake'});
  assert.equal(fishing.cancel(), true);
  assert.equal(fishing.update(20), null);
  assert.equal(fishing.reel(save), null);
  assert.deepEqual(save.fish, {});
});
test('construction validates terrain before consuming materials and prevents overlapping builds', () => {
  const system = new ConstructionSystem({
      width: 16000,
      heightAt: () => 600,
      isWet: (x) => x >= 800 && x <= 1200,
      resources: [{id: 'node-0', x: 500}],
    }),
    save = newSave();
  system.selected = 'tent';
  assert.equal(system.place(save, 900).ok, false);
  assert.equal(save.wood, 24);
  assert.equal(system.place(save, 500).ok, false);
  assert.equal(system.place(save, 200).ok, true);
  assert.equal(save.wood, 16);
  assert.equal(system.selected, null);
  system.selected = 'tent';
  assert.equal(system.place(save, 220).ok, false);
  assert.equal(save.wood, 16);
  save.wood = 0;
  assert.equal(system.place(save, 1400).ok, false);
  assert.equal(save.buildings.length, 1);
});

test('construction rejects every invalid position atomically', () => {
  const terrain = {
    width: 16000,
    heightAt: (x: number) => 600 + x * 0,
    isWet: (x: number) => x < 0,
    resources: [{id: 'node-1', x: 700}],
  };
  const system = new ConstructionSystem(terrain);
  const save = newSave();
  system.selected = 'tent';
  const original = structuredClone(save);
  for (const x of [64, 15936, 700]) {
    assert.equal(system.place(save, x).ok, false);
    assert.deepEqual(save, original);
  }
  terrain.isWet = () => true;
  assert.match(system.error(save, 300), /đất khô/);
  terrain.isWet = () => false;
  terrain.heightAt = (x) => (x < 300 ? 600 : 616);
  assert.match(system.error(save, 300), /đất bằng/);
  assert.deepEqual(save, original);
  terrain.heightAt = () => 600;
  save.wood = 0;
  const poor = structuredClone(save);
  assert.equal(system.place(save, 300).ok, false);
  assert.deepEqual(save, poor);
  system.selected = null;
  assert.equal(system.place(save, 300).ok, false);
  assert.equal(system.position(120, false), 192);
  assert.equal(system.position(120, true), 32);
});
test('fishing clock and random source are deterministic at both waiting bounds', () => {
  for (const random of [0, 1]) {
    const system = new FishingSystem(() => random);
    system.cast({id: 'pond', habitat: 'pond'});
    const wait = 2.5 + random * 2.5;
    assert.equal(system.update(wait - 0.01), null);
    assert.equal(system.update(0.02), 'bite');
    assert.equal(system.update(1.99), null);
    assert.equal(system.update(0.02), 'escaped');
    assert.equal(system.update(100), null);
  }
});
