import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pixelFrame, chooseScale, MIN_ART_HEIGHT, MAX_ART_HEIGHT, MIN_ART_WIDTH, MAX_ART_WIDTH} from './resolution.ts';
import {ART_PIXEL} from '../../data/palette.ts';
const sizes: [number, number, number][] = [
  [1920, 1080, 1],
  [2560, 1440, 1],
  [1440, 900, 1],
  [1024, 768, 1],
  [390, 844, 3],
  [844, 390, 3],
];
test('every supported window gets an integer pixel scale and a visible height in the accepted band', () => {
  for (const [width, height, dpr] of sizes) {
    const frame = pixelFrame(width, height, dpr, 'high');
    assert.ok(Number.isInteger(frame.pixelScale) && frame.pixelScale >= 1, `${width}x${height}`);
    assert.ok(frame.artHeight >= MIN_ART_HEIGHT && frame.artHeight <= MAX_ART_HEIGHT, `${width}x${height}`);
    assert.equal(frame.zoom * ART_PIXEL, frame.pixelScale);
  }
});
test('the canvas covers the host with whole art pixels and at most one device pixel of slack', () => {
  for (const [width, height, dpr] of sizes) {
    const frame = pixelFrame(width, height, dpr, 'high');
    const deviceWidth = Math.floor(width * dpr);
    const deviceHeight = Math.floor(height * dpr);
    assert.equal(frame.canvasWidth, frame.artWidth * frame.pixelScale);
    assert.equal(frame.canvasHeight, frame.artHeight * frame.pixelScale);
    assert.ok(deviceHeight - frame.canvasHeight < frame.pixelScale, `${width}x${height} height`);
    assert.ok(deviceWidth - frame.canvasWidth < frame.pixelScale, `${width}x${height} width`);
  }
});
test('specific windows resolve to the expected art sizes', () => {
  assert.deepEqual(pick(1920, 1080, 1), {pixelScale: 4, artWidth: 480, artHeight: 270});
  assert.deepEqual(pick(1440, 900, 1), {pixelScale: 3, artWidth: 480, artHeight: 300});
  assert.deepEqual(pick(1024, 768, 1), {pixelScale: 3, artWidth: 341, artHeight: 256});
  assert.deepEqual(pick(2560, 1440, 1), {pixelScale: 5, artWidth: 512, artHeight: 288});
  assert.deepEqual(pick(390, 844, 3), {pixelScale: 9, artWidth: 130, artHeight: 281});
  assert.deepEqual(pick(844, 390, 3), {pixelScale: 4, artWidth: 633, artHeight: 292});
});
test('very short windows at density 1 are the documented exception to the height band', () => {
  // 390 device px tall: scale 1 gives 390 art px and scale 2 gives 195; the nearer log distance wins.
  assert.deepEqual(pick(844, 390, 1), {pixelScale: 2, artWidth: 422, artHeight: 195});
  assert.equal(chooseScale(390), 2);
});
test('quality low renders at density 1 and keeps the same art size on a retina screen', () => {
  const retina = pixelFrame(1920, 1080, 2, 'high');
  const saver = pixelFrame(1920, 1080, 2, 'low');
  assert.equal(retina.density, 2);
  assert.equal(saver.density, 1);
  assert.equal(saver.artHeight, 270);
  assert.equal(saver.pixelScale, 4);
});
test('ultra wide windows keep a bounded width and only show bars beyond the limit', () => {
  const wide = pixelFrame(3440, 1440, 1, 'high');
  assert.equal(wide.artWidth, 688);
  const extreme = pixelFrame(5120, 1440, 1, 'high');
  assert.equal(extreme.artWidth, MAX_ART_WIDTH);
  assert.ok(extreme.canvasWidth < 5120);
  const narrow = pixelFrame(60, 844, 1, 'high');
  assert.equal(narrow.artWidth, MIN_ART_WIDTH);
});
function pick(width: number, height: number, dpr: number) {
  const frame = pixelFrame(width, height, dpr, 'high');
  return {pixelScale: frame.pixelScale, artWidth: frame.artWidth, artHeight: frame.artHeight};
}
