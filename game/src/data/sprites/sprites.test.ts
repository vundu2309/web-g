import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSprite, type SpriteDefinition} from '../../domain/sprite.ts';
import {palette, ART_PIXEL} from '../palette.ts';
import {buildingSprites} from './buildings.ts';
import {woodSprite, stoneSprite} from './resources.ts';
import {camperSprite} from './camper.ts';
import {patchRows} from './grid.ts';
const everything: SpriteDefinition[] = [camperSprite, woodSprite, stoneSprite, ...Object.values(buildingSprites)];
test('every structure and resource compiles with palette colors, valid frames and animation indices', () => {
  for (const def of everything) {
    const compiled = compileSprite(def, palette);
    assert.ok(compiled.frames.length > 0, def.name);
    for (const [name, animation] of Object.entries(def.animations)) {
      assert.ok(animation.frames.length > 0, def.name + ' ' + name);
      for (const frame of animation.frames) assert.ok(frame < compiled.frames.length, def.name + ' ' + name);
    }
  }
});
test('building grids use the shared art pixel: 55×37 cells shown at 110×74 units', () => {
  assert.equal(ART_PIXEL, 2);
  for (const def of Object.values(buildingSprites)) {
    assert.equal(def.width * ART_PIXEL, 110, def.name);
    assert.equal(def.height * ART_PIXEL, 74, def.name);
  }
});
test('resources are 16×12 cells shown at the same 32×24 footprint as before', () => {
  for (const def of [woodSprite, stoneSprite]) {
    assert.equal(def.width * ART_PIXEL, 32, def.name);
    assert.equal(def.height * ART_PIXEL, 24, def.name);
  }
});
test('animated structures keep their named cycles', () => {
  assert.deepEqual(Object.keys(buildingSprites.chest.animations).sort(), ['close', 'open']);
  assert.ok(buildingSprites.fire.animations.burn.frames.length >= 3);
  assert.ok(buildingSprites.tent.animations.flutter.frames.length >= 2);
});
test('recorded cell patches change only the named cells and never mutate the source grid', () => {
  const source = ['ab', 'cd'];
  const patched = patchRows(source, '1,0,x 0,1,y');
  assert.deepEqual(patched, ['ax', 'yd']);
  assert.deepEqual(source, ['ab', 'cd']);
  assert.deepEqual(patchRows(source, ''), ['ab', 'cd']);
});
