import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSprite, type SpriteDefinition} from '../../../domain/sprite.ts';
import {palette} from '../../palette.ts';
import {buildingGlows, buildingSprites} from '../buildings.ts';
import {STRUCTURE_COLORS, STRUCTURE_H, STRUCTURE_W, GROUND_ROW} from './shared.ts';

/** FNV-1a 32 bit trên toàn bộ hàng của mọi frame: đổi art thì cập nhật bảng băm dưới đây. */
function fingerprint(def: SpriteDefinition) {
  let hash = 0x811c9dc5;
  for (const frame of def.frames) {
    for (const row of frame) {
      for (let i = 0; i < row.length; i++) {
        hash ^= row.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
      hash ^= 0x0a;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, '0');
}

/** Số ô không trong suốt của một frame. */
function filled(rows: readonly string[]) {
  return rows
    .join('')
    .split('')
    .filter((glyph) => glyph !== '.').length;
}

const bodies = Object.entries(buildingSprites) as [string, SpriteDefinition][];
const glows = Object.entries(buildingGlows) as [string, SpriteDefinition][];

test('every body and glow is a 55 × 37 grid whose glyphs all name a palette color', () => {
  for (const [, def] of [...bodies, ...glows]) {
    assert.equal(def.width, STRUCTURE_W, def.name);
    assert.equal(def.height, STRUCTURE_H, def.name);
    for (const frame of def.frames) {
      assert.equal(frame.length, STRUCTURE_H, def.name);
      for (const row of frame) assert.equal(row.length, STRUCTURE_W, def.name);
    }
    for (const role of Object.values(def.colors)) {
      assert.ok(role in palette, def.name + ' thiếu màu ' + role);
      assert.ok(role.startsWith('struct'), def.name + ' dùng màu ngoài nhóm công trình ' + role);
    }
    assert.doesNotThrow(() => compileSprite(def, palette, {}), def.name);
  }
});

test('the shared glyph table covers every structure role exactly once', () => {
  const roles = Object.values(STRUCTURE_COLORS);
  assert.equal(new Set(roles).size, roles.length);
  assert.equal(new Set(Object.keys(STRUCTURE_COLORS)).size, roles.length);
  for (const role of roles) assert.ok(role in palette, role);
});

test('no body or glow touches the frame edge except the feet on the last row', () => {
  for (const [, def] of [...bodies, ...glows]) {
    for (const frame of def.frames) {
      frame.forEach((row, y) => {
        assert.equal(row[0], '.', def.name + ' chạm mép trái, hàng ' + y);
        assert.equal(row[STRUCTURE_W - 1], '.', def.name + ' chạm mép phải, hàng ' + y);
        if (y === 0) assert.equal(row.replace(/\./g, ''), '', def.name + ' chạm mép trên');
      });
    }
  }
});

test('every body stands on the ground: its last row has feet', () => {
  for (const [kind, def] of bodies) {
    for (const frame of def.frames) {
      assert.ok(frame[GROUND_ROW].replace(/\./g, '').length > 0, kind + ' không chạm mặt đất');
    }
  }
});

test('glows are small and never reach the ground row: they do not cover the whole structure', () => {
  for (const [kind, def] of glows) {
    const body = buildingSprites[kind as keyof typeof buildingSprites];
    for (const frame of def.frames) {
      assert.ok(filled(frame) > 0, kind + ' lớp sáng trống');
      assert.ok(filled(frame) < STRUCTURE_W * STRUCTURE_H * 0.2, kind + ' lớp sáng phủ quá rộng');
      assert.ok(body.frames.length > 0, kind + ' thiếu thân');
      assert.equal(frame[GROUND_ROW].replace(/\./g, ''), '', kind + ' sáng ở mặt đất');
    }
  }
});

test('exactly the self-lit structures have a glow layer', () => {
  assert.deepEqual(Object.keys(buildingGlows).sort(), ['fire', 'lantern', 'stove', 'tent']);
});

test('animations keep their frame counts and names', () => {
  assert.equal(buildingSprites.tent.frames.length, 2);
  assert.deepEqual(buildingSprites.tent.animations.flutter.frames, [0, 1]);
  assert.equal(buildingGlows.tent!.frames.length, 1);
  assert.equal(buildingGlows.fire!.frames.length, 4);
  assert.deepEqual(Object.keys(buildingGlows.fire!.animations), ['burn']);
  assert.equal(buildingGlows.stove!.frames.length, 3);
  assert.equal(buildingGlows.lantern!.frames.length, 3);
  assert.deepEqual(buildingSprites.chest.animations.open.frames, [0, 1, 2]);
  assert.deepEqual(buildingSprites.chest.animations.close.frames, [2, 1, 0]);
  assert.equal(buildingSprites.chest.frames.length, 3);
});

test('frames of one animation really differ, so the animation is visible', () => {
  for (const [kind, def] of [...bodies, ...glows]) {
    if (def.frames.length < 2) continue;
    const distinct = new Set(def.frames.map((frame) => frame.join('|')));
    assert.ok(distinct.size > 1, kind + ' các frame giống nhau');
  }
});

test('the art is deterministic and matches the recorded fingerprints (cập nhật khi art đổi)', () => {
  const expected: Record<string, string> = {
    tent: 'dae8e9b1',
    fire: '693a8220',
    stove: '905f4d96',
    lantern: '60658ff6',
    bench: 'c9d0024d',
    stall: '38749236',
    fence: '34fc5ab1',
    plant: 'b3c1bfb9',
    chest: '02616381',
    'tent-glow': 'f54de371',
    'fire-glow': '5ff82a20',
    'stove-glow': '44911f77',
    'lantern-glow': 'c04d70fa',
  };
  const actual = Object.fromEntries([
    ...bodies.map(([kind, def]) => [kind, fingerprint(def)]),
    ...glows.map(([kind, def]) => [kind + '-glow', fingerprint(def)]),
  ]);
  assert.deepEqual(actual, expected);
});
