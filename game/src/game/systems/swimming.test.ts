import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SwimmingSystem, BREATH_SECONDS, type Swimmer} from './SwimmingSystem.ts';
const probe = (x: number) => (x >= 100 && x < 900 ? {top: 320, bed: x < 600 ? 600 : 450} : null);
const none = {horizontal: 0, vertical: 0, jump: false};

test('bridge remains walkable until diving; ocean entry floats and exits by jumping', () => {
  const swim = new SwimmingSystem(probe);
  const onBridge = {x: 200, y: 319, vx: 0, vy: 0};
  assert.equal(swim.update(1 / 60, onBridge, none), null);
  let body = swim.update(1 / 60, onBridge, {...none, vertical: 1})!;
  assert.ok(swim.active);
  for (let i = 0; i < 200; i++) body = swim.update(1 / 60, body, none)!;
  assert.ok(Math.abs(body.y - 366) < 1);
  const exit = swim.update(1 / 60, body, {...none, jump: true})!;
  assert.equal(swim.active, false);
  assert.equal(exit.y, 319);
  assert.ok(exit.vy < 0);
  assert.equal(swim.update(1 / 60, exit, none), null);
  swim.reset();
  assert.ok(swim.update(1 / 60, {x: 200, y: 400, vx: 0, vy: 0}, none));
  assert.ok(swim.active);
});

test('swimmer cannot pass banks or seabed and diagonal swimming is speed bounded', () => {
  const swim = new SwimmingSystem(probe);
  let body: Swimmer = {x: 130, y: 500, vx: 0, vy: 0};
  for (let i = 0; i < 120; i++) body = swim.update(1 / 60, body, {...none, horizontal: -1, vertical: 1})!;
  assert.ok(body.x >= 112);
  assert.ok(body.y <= 598);
  assert.ok(Math.hypot(body.vx, body.vy) <= 145);
  body = {x: 590, y: 520, vx: 0, vy: 0};
  for (let i = 0; i < 120; i++) body = swim.update(1 / 60, body, {...none, horizontal: 1, vertical: 1})!;
  assert.ok(body.x < 600, 'không xuyên qua bậc đáy cao');
  assert.ok(body.y <= 598);
});

test('breath depletes only with head underwater, forces ascent and refills at surface', () => {
  const swim = new SwimmingSystem(probe);
  let body: Swimmer = {x: 300, y: 500, vx: 0, vy: 0};
  for (let i = 0; i < (BREATH_SECONDS + 5) * 60; i++) body = swim.update(1 / 60, body, {...none, vertical: 1})!;
  assert.ok(body.y < 430, 'tự nổi lên dù vẫn giữ nút lặn');
  assert.ok(swim.air > 0);
  for (let i = 0; i < 300; i++) body = swim.update(1 / 60, body, {...none, vertical: -1})!;
  assert.equal(swim.submerged, false);
  assert.equal(swim.air, BREATH_SECONDS);
  const before = swim.air;
  assert.equal(swim.update(Number.NaN, body, none), null);
  assert.equal(swim.air, before);
  swim.reset();
  assert.equal(swim.active, false);
});
