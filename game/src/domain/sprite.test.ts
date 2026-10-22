import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSprite, animationFrame, type SpriteDefinition} from './sprite.ts';
import {camperSprite} from '../data/sprites/camper.ts';
import {outfitColors} from '../data/sprites/outfits.ts';
import {palette, ART_PIXEL} from '../data/palette.ts';
function tiny(rows: string[]): SpriteDefinition {
  return {
    name: 'tiny',
    width: 2,
    height: 1,
    colors: {h: 'hat'},
    frames: [rows],
    animations: {idle: {frames: [0], frameRate: 1, repeat: -1}},
  };
}
test('compiler preserves dimensions, transparent dots and equipment role colors', () => {
  const result = compileSprite(tiny(['h.']), {hat: '#112233'}, {hat: '#445566'});
  assert.equal(result.width, 2);
  assert.equal(result.height, 1);
  assert.deepEqual([...result.frames[0]], [68, 85, 102, 255, 0, 0, 0, 0]);
  assert.deepEqual([...compileSprite(tiny(['h.']), {hat: '#11223380'}).frames[0]].slice(0, 4), [17, 34, 51, 128]);
});
test('compiler errors identify sprite, frame, row and unknown glyph or palette role', () => {
  assert.throws(() => compileSprite(tiny(['?.']), {}), /tiny, frame 1, dòng 1, cột 1: ký tự lạ/);
  assert.throws(() => compileSprite(tiny(['h']), {hat: '#112233'}), /tiny, frame 1, dòng 1: cần 2 cột/);
  assert.throws(() => compileSprite(tiny(['h.']), {}), /tiny, frame 1, dòng 1: không có màu palette "hat"/);
  assert.throws(() => compileSprite(tiny(['h.']), {hat: 'bad'}), /màu không hợp lệ/);
  assert.throws(() => compileSprite(tiny([]), {}), /tiny, frame 1: sai số dòng/);
});
test('every prototype frame has the expected grid and palette, and outfits change all four roles', () => {
  assert.equal(ART_PIXEL, 2);
  assert.equal(camperSprite.width * ART_PIXEL, 48);
  assert.equal(camperSprite.height * ART_PIXEL, 64);
  const first = compileSprite(camperSprite, palette, outfitColors(0));
  const second = compileSprite(camperSprite, palette, outfitColors(1));
  assert.equal(first.frames.length, 33);
  for (const frame of first.frames) assert.equal(frame.length, 24 * 32 * 4);
  assert.notDeepEqual(first.frames[0], second.frames[0]);
  const slots = ['hat', 'shirt', 'pants', 'bag'];
  for (const slot of slots) {
    const swapped = compileSprite(camperSprite, palette, {...outfitColors(0), [slot]: outfitColors(1)[slot]});
    assert.notDeepEqual(swapped.frames[0], first.frames[0]);
  }
});
test('grounded poses keep a boot on the ground line while jump and fall leave it', () => {
  const lowestRow = (rows: readonly string[]) => {
    let lowest = -1;
    rows.forEach((row, y) => {
      if (/[^.]/.test(row)) lowest = y;
    });
    return lowest;
  };
  const frames = camperSprite.frames;
  const grounded = ['idle', 'run', 'land', 'cast', 'fish-wait', 'bite', 'reel', 'gather', 'build'];
  for (const name of grounded) {
    for (const index of camperSprite.animations[name].frames) {
      assert.equal(lowestRow(frames[index]), camperSprite.height - 1, name + ' frame ' + index + ' lifts off');
    }
  }
  for (const name of ['jump', 'fall']) {
    for (const index of camperSprite.animations[name].frames) {
      assert.ok(lowestRow(frames[index]) < camperSprite.height - 1, name + ' frame ' + index + ' is not airborne');
    }
  }
});
test('animation indices are validated and game clock sampling is deterministic', () => {
  const def = tiny(['h.']);
  def.animations = {idle: {frames: [1], frameRate: 1, repeat: -1}};
  assert.throws(() => compileSprite(def, {hat: '#112233'}), /trỏ tới frame không có 1/);
  const loop = {frames: [0, 1, 2], frameRate: 2, repeat: -1};
  assert.equal(animationFrame(loop, 0.5), 1);
  assert.equal(animationFrame(loop, 1.5), 0);
  assert.equal(animationFrame({...loop, repeat: 0}, 20), 2);
  assert.equal(animationFrame(loop, 0.5), animationFrame(loop, 0.5));
});
test('detailed review has four times the pixel count and true single-pixel detail within enlarged cells', async () => {
  const {camperDetailed} = await import('../data/sprites/camperDetailed.ts');
  const detailed = compileSprite(camperDetailed, palette, outfitColors(0));
  assert.equal(detailed.width, 48);
  assert.equal(detailed.height, 64);
  assert.equal(detailed.frames[0].length, 4 * compileSprite(camperSprite, palette).frames[0].length);
  let refinedCells = 0;
  for (let y = 0; y < 64; y += 2) {
    for (let x = 0; x < 48; x += 2) {
      const glyph = camperDetailed.frames[0][y][x];
      if (camperDetailed.frames[0][y][x + 1] !== glyph || camperDetailed.frames[0][y + 1][x] !== glyph) refinedCells++;
    }
  }
  assert.ok(refinedCells > 40, 'details must refine cells rather than just enlarge the previous grid');
});
