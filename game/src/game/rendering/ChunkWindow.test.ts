import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ChunkWindow} from './ChunkWindow.ts';
import {canopyInView} from './canopyVisibility.ts';

function fixture() {
  const made: number[] = [];
  const freed: number[] = [];
  const window = new ChunkWindow(
    32,
    512,
    (index) => {
      made.push(index);
      return {index};
    },
    (index, value) => {
      assert.equal(index, value.index);
      freed.push(index);
    },
  );
  return {window, made, freed};
}

test('camera loads only visible chunks plus one prefetch per update, including partial edges', () => {
  const {window, made} = fixture();
  window.update(1024, 2049);
  assert.deepEqual(made, [2, 3, 4, 1]);
  window.update(1024, 2049);
  assert.deepEqual(made, [2, 3, 4, 1, 5]);
  window.update(1024, 2049);
  assert.equal(made.length, 5);
});
test('retention prevents thrashing at boundaries but releases far resources on teleport', () => {
  const {window, made, freed} = fixture();
  window.update(0, 1024);
  const zero = window.loaded.get(0);
  window.update(512, 1536);
  window.update(0, 1024);
  assert.equal(window.loaded.get(0), zero);
  assert.equal(made.filter((index) => index === 0).length, 1);
  window.update(10000, 11000);
  assert.ok(freed.includes(0));
  for (const index of [19, 20, 21]) assert.ok(window.loaded.has(index));
  window.update(0, 1024);
  assert.ok(window.loaded.has(0));
  assert.equal(made.filter((index) => index === 0).length, 2);
});
test('repeated whole-world traversal keeps a bounded cache and dispose releases each live chunk once', () => {
  const {window, freed} = fixture();
  for (let lap = 0; lap < 4; lap++) {
    for (let index = 0; index < 32; index++) {
      window.update(index * 512, Math.min(16000, index * 512 + 1600));
      assert.ok(window.loaded.size <= 11);
      for (const active of window.loaded.keys()) assert.ok(active >= 0 && active < 32);
    }
  }
  const remaining = window.loaded.size;
  const before = freed.length;
  window.dispose();
  window.dispose();
  window.update(0, 512);
  assert.equal(freed.length - before, remaining);
  assert.equal(window.loaded.size, 0);
});
test('canopies count as visible when their trunk is outside the view; fully hidden trees are skipped', () => {
  const view = {x: 100, y: 100, right: 300, bottom: 300};
  assert.equal(canopyInView(75, 200, 80, 100, 0.5, view), true);
  assert.equal(canopyInView(325, 200, 80, 100, 0.5, view), true);
  assert.equal(canopyInView(40, 200, 80, 100, 0.5, view), false);
  assert.equal(canopyInView(360, 200, 80, 100, 0.5, view), false);
  assert.equal(canopyInView(200, 90, 80, 100, 0.5, view), false);
  assert.equal(canopyInView(200, 410, 80, 100, 0.5, view), false);
});
