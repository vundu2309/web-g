import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LocalSaveRepository} from './SaveRepository.ts';
import {newSave} from '../camping.ts';
test('repository retains the v1 save key and restores existing progress', () => {
  const memory = new Map<string, string>(),
    repo = new LocalSaveRepository(() => ({
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    }));
  const state = newSave();
  state.wood = 70;
  state.x = 4200;
  assert.equal(repo.save(state), true);
  assert.ok(memory.has('forest-camping-v1'));
  assert.deepEqual(repo.load(), state);
});
test('unavailable storage is recoverable and never prevents playing', () => {
  const repo = new LocalSaveRepository(() => {
    throw new Error('blocked');
  });
  assert.deepEqual(repo.load(), newSave());
  assert.equal(repo.save(newSave()), false);
});
