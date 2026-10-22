import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishingSystem} from './FishingSystem.ts';
import {newSave, adjustedWeight, rollFish} from '../../domain/camping.ts';
import {rods, type RodId} from '../../data/rods.ts';
import {fishSpecies} from '../../data/catalog.ts';
function fight(rod: RodId, policy: (system: FishingSystem) => boolean, easy = false) {
  const system = new FishingSystem(() => 0.5);
  const save = newSave();
  system.cast({id: 'pond', habitat: 'pond'}, rod);
  system.update(5);
  system.reel(save);
  let event: ReturnType<FishingSystem['update']> = null;
  let frames = 0;
  while (system.session?.phase === 'fight' && frames++ < 4000) {
    event = system.update(1 / 60, policy(system), easy);
  }
  return {event, frames, system, save};
}
test('rhythmic pulling wins while continuous holding breaks and idle escapes', () => {
  const rhythm = fight('bamboo', (system) => system.session!.tension < 55);
  assert.equal(rhythm.event, 'caught');
  assert.equal(rhythm.system.reel(rhythm.save)?.species.id !== undefined, true);
  assert.equal(rhythm.save.fishBag.length, 1);
  assert.equal(fight('bamboo', () => true).event, 'broken');
  assert.equal(fight('bamboo', () => false).event, 'escaped');
});
test('better rods require fewer pulling frames and easy mode assists continuous hold', () => {
  const beginner = fight('bamboo', (s) => s.session!.tension < 55);
  const advanced = fight('legendary', (s) => s.session!.tension < 55);
  assert.equal(advanced.event, 'caught');
  assert.ok(advanced.frames < beginner.frames);
  assert.equal(fight('bamboo', () => true, true).event, 'caught');
});
test('luck weights stay positive and weighted selection remains in habitat and size bounds', () => {
  for (const rod of rods) {
    assert.ok(fishSpecies.reduce((sum, f) => sum + adjustedWeight(f.weight, f.rarity, rod.luck), 0) > 0);
    for (const edge of [0, 0.5, 1]) {
      const fish = rollFish('pond', edge, edge, rod.luck);
      assert.ok((fish.species.habitats as readonly string[]).includes('pond'));
      assert.ok(fish.length >= fish.species.min && fish.length <= fish.species.max);
    }
  }
  assert.equal(adjustedWeight(1, 'Rất hiếm', NaN), 1);
});
