import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSprite, animationFrame, type SpriteDefinition} from './sprite.ts';
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
