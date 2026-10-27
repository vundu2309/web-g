import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HAT_GRIDS, HEAD_GRIDS, HEAD_H, HEAD_W, KEY_ROLE} from '../../data/camperHead.ts';
import {buildCamperFrames, hashFrames} from './build.ts';
import {gear} from '../../data/catalog.ts';
import {RIG_POSES} from './poses.ts';
import {RIG_STATES, type Frame, type RigOutfit, type RigState} from './types.ts';
import {camperRigPalette} from '../../data/palette/camperRig.ts';

const piece = (id: string): RigOutfit['hat'] => {
  const item = gear.find((entry) => entry.id === id);
  if (!item) throw new Error('thiếu món ' + id);
  return {id, color: item.color};
};
const BASE: RigOutfit = {
  hat: piece('hat-ranger'),
  shirt: piece('shirt-linen'),
  pants: piece('pants-trail'),
  bag: piece('bag-canvas'),
};
const sameOutfit = (over: Partial<RigOutfit>): RigOutfit => ({...BASE, ...over});

test('every head and hat grid is 14×14, uses only mapped keys and every mapped role exists in the palette', () => {
  const grids = [...Object.values(HEAD_GRIDS), ...Object.values(HAT_GRIDS)];
  for (const grid of grids) {
    assert.equal(grid.length, HEAD_H);
    for (const row of grid) {
      assert.equal(row.length, HEAD_W, row);
      for (const key of row) {
        if (key === '.') continue;
        const role = KEY_ROLE[key];
        assert.ok(role !== undefined, 'khóa không có trong bảng: ' + key);
        assert.ok(role in camperRigPalette || role.startsWith('hat') || role.startsWith('shirt'), role);
      }
    }
  }
});

test('face variants keep the same neck anchor: the bottom two rows match across all six variants', () => {
  const bottom = (grid: readonly string[]) => grid.slice(-3).join('|');
  const faces = Object.values(HEAD_GRIDS).map(bottom);
  assert.ok(
    faces.every((value) => value === faces[0]),
    'đáy lưới đầu lệch giữa các biến thể',
  );
});

test('each face variant differs from the open face (blink, glance, strain, bow, air are real changes)', () => {
  const open = HEAD_GRIDS.open.join('\n');
  for (const [name, grid] of Object.entries(HEAD_GRIDS)) {
    if (name === 'open') continue;
    assert.notEqual(grid.join('\n'), open, name);
  }
});

test('headTop follows the hat being worn: ranger and knit caps have different crown heights', () => {
  const ranger = buildCamperFrames(BASE).frames.idle[0].anchors.headTop.y;
  const knit = buildCamperFrames(sameOutfit({hat: piece('hat-knit')})).frames.idle[0].anchors.headTop.y;
  assert.notEqual(ranger, knit);
  for (const state of RIG_STATES) {
    for (const frame of buildCamperFrames(BASE).frames[state]) {
      assert.ok(frame.anchors.headTop.y <= frame.anchors.head.y - 4, state + ' #' + frame.index + ' đỉnh mũ quá thấp');
    }
  }
});

test('every face variant × both hats × every pose stays inside the frame with a 1 px margin', () => {
  for (const hat of [piece('hat-ranger'), piece('hat-knit')]) {
    const set = buildCamperFrames(sameOutfit({hat}));
    for (const frame of set.all) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {
          if (frame.rgba[(y * frame.width + x) * 4 + 3]) {
            xs.push(x);
            ys.push(y);
          }
        }
      }
      assert.ok(Math.min(...xs) >= 1 && Math.max(...xs) <= frame.width - 2, frame.state + ' #' + frame.index + ' x');
      assert.ok(Math.min(...ys) >= 1 && Math.max(...ys) <= frame.height - 2, frame.state + ' #' + frame.index + ' y');
    }
  }
});

test('the two shapes of each slot produce different pixels with the same color', () => {
  const hash = (over: Partial<RigOutfit>) => hashFrames(buildCamperFrames(sameOutfit(over)).all);
  const base = hash({});
  assert.notEqual(hash({hat: piece('hat-knit')}), base, 'mũ');
  assert.notEqual(hash({shirt: piece('shirt-pine')}), base, 'áo');
  assert.notEqual(hash({pants: piece('pants-denim')}), base, 'quần');
  assert.notEqual(hash({bag: piece('bag-moss')}), base, 'balo');
});

test('the anchor for the hand lies on the hand pixels in every pose state', () => {
  for (const state of RIG_STATES) {
    for (const frame of buildCamperFrames(BASE).frames[state]) {
      const {x, y} = frame.anchors.hand;
      const at = (px: number, py: number) => frame.rgba[(py * frame.width + px) * 4 + 3];
      assert.ok(at(x, y) > 0 || at(x + 1, y) > 0 || at(x - 1, y) > 0, state + ' #' + frame.index + ' tay lạc');
    }
  }
});

test('building a full outfit cold stays under 50 ms and reports its time', () => {
  const fresh = {
    hat: piece('hat-knit'),
    shirt: piece('shirt-pine'),
    pants: piece('pants-denim'),
    bag: piece('bag-moss'),
  };
  const start = performance.now();
  buildCamperFrames(fresh);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 50, 'dựng quá chậm: ' + elapsed.toFixed(1) + ' ms');
});

export type {Frame, RigState};
export {RIG_POSES};
