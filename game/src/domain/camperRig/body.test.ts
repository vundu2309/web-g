import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCamperFrames} from './build.ts';
import {bodyBox} from './body.ts';
import {FEET_EDGE} from './sheet.ts';
import {FRAME_H, FRAME_W, GROUND_ROW, type Frame} from './types.ts';
import {outfitOf} from './wear.ts';
import {gear} from '../../data/catalog.ts';

const outfit = outfitOf({hat: 'hat-ranger', shirt: 'shirt-linen', pants: 'pants-trail', backpack: 'bag-canvas'}, gear);

/** Cột và hàng của mọi pixel có alpha trong khoảng hàng [top, bottom]. */
function extent(frame: Frame, top: number, bottom: number) {
  let left = FRAME_W;
  let right = -1;
  let first = FRAME_H;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      if (frame.rgba[(y * FRAME_W + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      first = Math.min(first, y);
    }
  }
  return {left, right, first};
}

test('the body box is 12 by 37 art pixels and its bottom edge is the feet row', () => {
  const box = bodyBox();
  assert.equal(box.width * 2, 24);
  assert.equal(box.height * 2, 74);
  assert.equal(box.y + box.height, FEET_EDGE);
  assert.equal(FEET_EDGE, GROUND_ROW + 1);
});

test('the body box keeps the head centre and the boots inside its width for standing frames', () => {
  const box = bodyBox();
  const set = buildCamperFrames(outfit);
  for (const frame of set.frames.idle) {
    assert.ok(frame.anchors.head.y >= box.y, 'tâm đầu nằm trong chiều cao hộp');
    const boots = extent(frame, GROUND_ROW - 2, GROUND_ROW);
    assert.ok(boots.left >= box.x && boots.right < box.x + box.width, 'giày nằm trong bề rộng hộp');
  }
});
