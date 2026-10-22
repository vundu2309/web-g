import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PoseMachine, type PoseInput} from './poseMachine.ts';
const ground: PoseInput = {vx: 0, vy: 0, grounded: true, fishing: 'none'};
test('ground poses follow walking, and rising and falling follow vertical speed', () => {
  const machine = new PoseMachine();
  assert.equal(machine.update(0, ground), 'idle');
  assert.equal(machine.update(0.1, {...ground, vx: 220}), 'run');
  assert.equal(machine.update(0.2, {...ground, grounded: false, vy: -500}), 'jump');
  assert.equal(machine.update(0.4, {...ground, grounded: false, vy: 300}), 'fall');
});
test('landing plays once for its duration and then returns to the ground pose', () => {
  const machine = new PoseMachine();
  machine.update(0, {...ground, grounded: false, vy: 300});
  assert.equal(machine.update(1, ground), 'land');
  assert.equal(machine.since, 1);
  assert.equal(machine.update(1.1, ground), 'land');
  assert.equal(machine.update(1.25, ground), 'idle');
});
test('timed actions are cancelled by walking and sample from their own start time', () => {
  const machine = new PoseMachine();
  machine.start('gather', 2);
  assert.equal(machine.update(2.05, ground), 'gather');
  assert.equal(machine.since, 2);
  assert.equal(machine.update(2.5, ground), 'idle');
  machine.start('build', 3);
  assert.equal(machine.update(3.1, {...ground, vx: 220}), 'run');
});
test('fishing phases choose their poses and override ordinary walking', () => {
  const machine = new PoseMachine();
  machine.start('cast', 0);
  assert.equal(machine.update(0.1, {...ground, fishing: 'waiting'}), 'cast');
  assert.equal(machine.update(0.5, {...ground, fishing: 'waiting'}), 'fish-wait');
  assert.equal(machine.update(1, {...ground, fishing: 'bite'}), 'bite');
  assert.equal(machine.update(1.2, {...ground, fishing: 'fight'}), 'reel');
});
