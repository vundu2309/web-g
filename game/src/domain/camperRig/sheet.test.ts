import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCamperFrames, outfitKey} from './build.ts';
import {
  FEET_EDGE,
  ORIGIN_Y,
  SHEET_ANIMATIONS,
  SHEET_FRAME_COUNT,
  cellCenter,
  cellCorner,
  mirrorColumn,
  mirrorPoint,
  sheetIndex,
} from './sheet.ts';
import {FRAME_H, FRAME_W, GROUND_ROW, RIG_FRAME_COUNTS, RIG_STATES} from './types.ts';
import {STARTER_SHAPES, outfitOf, shapeOf, starterOutfits, type WearItem} from './wear.ts';
import {gear} from '../../data/catalog.ts';

const starter: WearItem[] = gear.filter((item) => !item.id.includes('-adventure') && !item.id.includes('-summit'));
const equipped = {hat: 'hat-knit', shirt: 'shirt-pine', pants: 'pants-denim', backpack: 'bag-moss'} as const;

test('sheet indices follow the rig order and cover all 46 frames', () => {
  const set = buildCamperFrames(outfitOf(equipped, starter));
  assert.equal(SHEET_FRAME_COUNT, 46);
  assert.equal(set.all.length, SHEET_FRAME_COUNT);
  for (const state of RIG_STATES) {
    for (let index = 0; index < RIG_FRAME_COUNTS[state]; index++) {
      const frame = set.all[sheetIndex(state, index)]!;
      assert.equal(frame.state, state);
      assert.equal(frame.index, index);
    }
  }
});

test('animations reference only frames of their own state and keep the old clock rates', () => {
  for (const state of RIG_STATES) {
    const animation = SHEET_ANIMATIONS[state];
    for (const frame of animation.frames) {
      const owner = RIG_STATES.find(
        (name) => frame >= sheetIndex(name, 0) && frame < sheetIndex(name, 0) + RIG_FRAME_COUNTS[name],
      );
      assert.equal(owner, state, `frame ${frame} của ${state}`);
    }
  }
  assert.deepEqual(SHEET_ANIMATIONS.run.frames, [4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(SHEET_ANIMATIONS.run.frameRate, 9);
  assert.equal(SHEET_ANIMATIONS.cast.repeat, 0);
  assert.equal(SHEET_ANIMATIONS.idle.frames.length, 8);
});

test('mirror axis matches the sprite flip, so anchors and pixels stay in step', () => {
  for (let column = 0; column < FRAME_W; column++) {
    assert.equal(mirrorColumn(column), FRAME_W - 1 - column);
  }
  assert.deepEqual(mirrorPoint({x: 10, y: 19}, true), {x: 25, y: 19});
  assert.deepEqual(mirrorPoint({x: 10, y: 19}, false), {x: 10, y: 19});
});

test('a cell corner in the world is the sprite origin minus the frame offset, mirrored when facing left', () => {
  const place = {x: 300, y: 500, flip: false, scale: 2};
  assert.deepEqual(cellCorner({x: 0, y: 0}, place), {x: 300 - 36, y: 500 - FEET_EDGE * 2});
  assert.deepEqual(cellCorner({x: 17, y: GROUND_ROW}, place), {x: 300 - 36 + 34, y: 500 - 92 + 90});
  const left = {...place, flip: true};
  assert.deepEqual(cellCorner({x: 0, y: 0}, left), {x: 300 - 36 + 70, y: 500 - 92});
  assert.deepEqual(cellCenter({x: 0, y: 0}, left), {x: 300 - 36 + 70 + 1, y: 500 - 92 + 1});
});

test('the sprite origin puts the feet row bottom edge on the placement point', () => {
  assert.equal(FEET_EDGE, GROUND_ROW + 1);
  assert.equal(ORIGIN_Y * FRAME_H, FEET_EDGE);
});

test('wearing shop gear keeps the item colour and borrows a starter shape', () => {
  const shop: WearItem[] = [
    {id: 'hat-summit', slot: 'hat', color: '#b38b58'},
    {id: 'shirt-adventure', slot: 'shirt', color: '#668d99'},
    {id: 'pants-summit', slot: 'pants', color: '#123456'},
    {id: 'backpack-adventure', slot: 'backpack', color: '#abcdef'},
  ];
  const outfit = outfitOf(
    {hat: 'hat-summit', shirt: 'shirt-adventure', pants: 'pants-summit', backpack: 'backpack-adventure'},
    shop,
  );
  assert.deepEqual(outfit.hat, {id: 'hat-knit', color: '#b38b58'});
  assert.deepEqual(outfit.shirt, {id: 'shirt-linen', color: '#668d99'});
  assert.deepEqual(outfit.pants, {id: 'pants-denim', color: '#123456'});
  assert.deepEqual(outfit.bag, {id: 'bag-canvas', color: '#abcdef'});
  assert.equal(shapeOf('hat', 'hat-ranger'), 'hat-ranger');
});

test('a missing or foreign equipped id falls back to the first starter item of the slot', () => {
  const outfit = outfitOf({hat: 'hat-x', shirt: 'shirt-pine', pants: 'pants-denim', backpack: 'bag-moss'}, starter);
  assert.equal(outfit.hat.id, STARTER_SHAPES.hat[0]);
  assert.equal(outfit.hat.color, starter.find((item) => item.id === 'hat-ranger')!.color);
  assert.throws(() => outfitOf({hat: 'x', shirt: 'x', pants: 'x', backpack: 'x'}, []), /thiếu món gốc/);
});

test('every catalog item, starter or shop, builds a full rig set', () => {
  for (const hat of gear.filter((item) => item.slot === 'hat')) {
    for (const shirt of gear.filter((item) => item.slot === 'shirt')) {
      const outfit = outfitOf({hat: hat.id, shirt: shirt.id, pants: 'pants-trail', backpack: 'bag-canvas'}, gear);
      assert.equal(buildCamperFrames(outfit).all.length, SHEET_FRAME_COUNT);
    }
  }
});

test('the sixteen starter outfits are distinct and every one builds', () => {
  const outfits = starterOutfits(starter);
  assert.equal(outfits.length, 16);
  assert.equal(new Set(outfits.map(outfitKey)).size, 16);
  for (const outfit of outfits) assert.equal(buildCamperFrames(outfit).all.length, SHEET_FRAME_COUNT);
});
