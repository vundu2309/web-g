import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCamperFrames} from './build.ts';
import {figureBox, frameBounds} from './figure.ts';
import {FEET_EDGE, cellCenter, mirrorColumn, type Placement} from './sheet.ts';
import {FRAME_W, RIG_STATES, type Frame} from './types.ts';
import {outfitOf} from './wear.ts';
import {fishLabelBottom, LABEL_GAP} from '../fishingLabels.ts';
import {gear} from '../../data/catalog.ts';

const outfit = outfitOf({hat: 'hat-knit', shirt: 'shirt-pine', pants: 'pants-denim', backpack: 'bag-moss'}, gear);
const place = (flip: boolean): Placement => ({x: 400, y: 600, flip, scale: 2});
const all = buildCamperFrames(outfit).all;

test('the figure box sits on the placement point: its bottom is the feet row', () => {
  for (const frame of all) {
    const box = figureBox(frame, place(false));
    assert.equal(box.y + box.height, place(false).y, `${frame.state} ${frame.index}`);
  }
});

test('flipping the figure mirrors its box around the body axis and keeps its size', () => {
  for (const frame of all) {
    const normal = figureBox(frame, place(false));
    const flipped = figureBox(frame, place(true));
    assert.equal(flipped.width, normal.width);
    assert.equal(flipped.height, normal.height);
    assert.equal(flipped.y, normal.y);
    const bounds = frameBounds(frame);
    const expected = 400 - (FRAME_W * 2) / 2 + mirrorColumn(bounds.right) * 2;
    assert.equal(flipped.x, expected, `${frame.state} ${frame.index}`);
  }
});

test('the figure box contains the head centre and the rod tip of every frame, in both directions', () => {
  for (const flip of [false, true]) {
    for (const frame of all) {
      const box = figureBox(frame, place(flip));
      const head = cellCenter(frame.anchors.head, place(flip));
      assert.ok(head.x >= box.x && head.x <= box.x + box.width, 'tâm đầu theo x');
      assert.ok(head.y >= box.y && head.y <= box.y + box.height, 'tâm đầu theo y');
      if (!frame.anchors.rodTip) continue;
      const tip = cellCenter(frame.anchors.rodTip, place(flip));
      assert.ok(tip.x >= box.x && tip.x <= box.x + box.width, `${frame.state} ${frame.index} đầu cần theo x`);
      assert.ok(tip.y >= box.y && tip.y <= box.y + box.height, `${frame.state} ${frame.index} đầu cần theo y`);
    }
  }
});

test('the fishing label sits LABEL_GAP above the top of the hat in every frame', () => {
  for (const frame of all) {
    const top = cellCenter(frame.anchors.headTop, place(false)).y - 1;
    assert.equal(fishLabelBottom(top), top - LABEL_GAP);
    assert.ok(fishLabelBottom(top) < top, 'nhãn nằm trên mũ');
  }
});

test('every frame of every state keeps its feet on or above the ground row', () => {
  const grounded = (frame: Frame) => frame.anchors.feet.every((foot) => foot.y <= FEET_EDGE);
  for (const state of RIG_STATES) {
    const frames = buildCamperFrames(outfit).frames[state];
    assert.ok(frames.length > 0);
    for (const frame of frames) assert.ok(grounded(frame), `${state} ${frame.index}`);
  }
});
