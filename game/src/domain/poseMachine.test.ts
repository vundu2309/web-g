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

test('every situation picks its own pose: stand, run, jump, fall, land, cast, wait, bite, reel, gather, build', () => {
  const machine = new PoseMachine();
  const seen = [
    machine.update(0, ground),
    machine.update(0.1, {...ground, vx: 220}),
    machine.update(0.2, {...ground, grounded: false, vy: -500}),
    machine.update(0.3, {...ground, grounded: false, vy: 300}),
    machine.update(0.4, ground),
  ];
  machine.start('cast', 0.7);
  seen.push(machine.update(0.7, {...ground, fishing: 'waiting'}));
  seen.push(machine.update(1.2, {...ground, fishing: 'waiting'}));
  seen.push(machine.update(1.4, {...ground, fishing: 'bite'}));
  seen.push(machine.update(1.6, {...ground, fishing: 'fight'}));
  seen.push(machine.update(2, {...ground, fishing: 'landed'}));
  machine.start('gather', 2.1);
  seen.push(machine.update(2.2, ground));
  machine.start('build', 3);
  seen.push(machine.update(3.1, ground));
  assert.deepEqual(seen, [
    'idle',
    'run',
    'jump',
    'fall',
    'land',
    'cast',
    'fish-wait',
    'bite',
    'reel',
    'reel',
    'gather',
    'build',
  ]);
});

test('a landing from a fall lasts its own duration even while a fish is biting', () => {
  const machine = new PoseMachine();
  machine.update(0, {...ground, grounded: false, vy: 300});
  assert.equal(machine.update(1, {...ground, fishing: 'bite'}), 'land');
  assert.equal(machine.update(1.3, {...ground, fishing: 'bite'}), 'bite');
});
