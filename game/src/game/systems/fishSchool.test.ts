import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishSchoolSystem} from './FishSchoolSystem.ts';
import {FishingSystem} from './FishingSystem.ts';
import {newSave} from '../../domain/camping.ts';
const area = {id: 'test', x: 100, width: 1000, habitat: 'lake' as const};
const probe = (x: number) => (x >= 100 && x < 1100 ? {top: 320, bed: x < 600 ? 600 : 480} : null);
const view = {left: 0, right: 1200};
const player = {x: 0, y: 0, wet: false};

test('fish population is deterministic, habitat-specific, bounded and sleeps away from camera', () => {
  const school = new FishSchoolSystem([area], probe);
  assert.deepEqual(school.fish, new FishSchoolSystem([area], probe).fish);
  assert.ok(school.fish.length >= 3);
  const far = structuredClone(school.fish.at(-1)!);
  school.update(1 / 60, 0, player, {left: 0, right: 50}, null);
  assert.ok(school.updated < school.fish.length);
  assert.equal(school.fish.at(-1)!.x, far.x);
  for (let i = 0; i < 1200; i++) school.update(1 / 60, i / 60, player, view, null);
  for (const fish of school.fish) {
    assert.ok((fish.species.habitats as readonly string[]).includes('lake'));
    const water = probe(fish.x)!;
    assert.ok(water);
    assert.ok(fish.y >= water.top + 14 && fish.y <= water.bed - 14);
  }
});

test('fish flee from swimmers, approach the lure, hook, disappear on catch and respawn after cooldown', () => {
  const school = new FishSchoolSystem([area], probe);
  const fish = school.fish[2];
  school.update(1 / 60, 1, {x: fish.x - 20, y: fish.y + 30, wet: true}, view, null);
  assert.equal(fish.mode, 'flee');
  const lure = {waterId: area.id, x: fish.homeX, y: 320};
  const target = school.reserve(lure, 'day', 1, 0)!;
  assert.ok(target);
  for (let i = 0; i < 1500 && !school.atLure(lure); i++) school.update(1 / 60, i / 60, player, view, lure);
  assert.ok(school.atLure(lure));
  school.hook();
  school.update(1 / 60, 30, player, view, lure);
  assert.equal(target.mode, 'hooked');
  school.release(true);
  school.update(1 / 60, 31, player, view, null);
  assert.ok(!school.visible.includes(target));
  assert.equal(school.reserve(lure, 'day', 1, 0)?.id === target.id, false);
  school.release(false);
  for (let i = 0; i < 2500; i++) school.update(1 / 60, 32 + i / 60, player, view, null);
  assert.ok(school.visible.includes(target));
});

test('fishing waits for the real fish and stores its exact species and length once', () => {
  const school = new FishSchoolSystem([area], probe);
  const target = school.reserve({waterId: 'test', x: 400, y: 320}, 'day', 1, 0)!;
  const fishing = new FishingSystem(() => 0.1);
  const state = newSave();
  fishing.cast(area, 'bamboo', 160, {species: target.species, length: target.length});
  assert.equal(fishing.update(10, false, false, false), null);
  assert.equal(fishing.session!.phase, 'waiting');
  assert.equal(fishing.update(0.1, false, false, true), 'bite');
  fishing.reel(state);
  assert.equal(fishing.session!.caught!.species.id, target.species.id);
  assert.equal(fishing.session!.caught!.length, target.length);
  fishing.session!.phase = 'landed';
  fishing.reel(state);
  assert.equal(state.fishBag.length, 1);
  assert.equal(state.fishBag[0].id, target.species.id);
  assert.equal(fishing.reel(state), null);
});

test('the reserved fish stays awake outside a narrow mobile viewport until it reaches the lure', () => {
  const school = new FishSchoolSystem([area], probe);
  const lure = {waterId: area.id, x: 200, y: 320};
  const target = school.reserve(lure, 'day', 1, 0.9999)!;
  assert.ok(target);
  target.x = 540;
  for (let i = 0; i < 1500 && !school.atLure(lure); i++)
    school.update(1 / 60, i / 60, player, {left: 130, right: 270}, lure);
  assert.ok(school.atLure(lure));
});

test('caught fish stays absent for forty game seconds and new generations vary species and size', () => {
  const school = new FishSchoolSystem([area], probe);
  const lure = {waterId: area.id, x: 200, y: 320};
  const variants = new Set<string>();
  for (let generation = 0; generation < 40; generation++) {
    const fish = school.reserve(lure, 'night', 1, 0)!;
    assert.ok(fish);
    const id = fish.id;
    variants.add(fish.species.id + ':' + fish.length);
    school.release(true);
    for (let i = 0; i < 390; i++) school.update(0.1, i / 10, player, view, null, 'night');
    assert.ok(!school.visible.includes(fish));
    for (let i = 0; i < 20; i++) school.update(0.1, 40 + i / 10, player, view, null, 'night');
    assert.notEqual(fish.id, id);
    assert.ok(fish.species.activeAt.includes('night'));
  }
  assert.ok(variants.size > 10);
});
