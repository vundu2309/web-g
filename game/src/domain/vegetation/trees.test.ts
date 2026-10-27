import {test} from 'node:test';
import assert from 'node:assert/strict';
import {colorNumber, palette} from '../../data/palette.ts';
import type {Art} from './art.ts';
import {paintBroadleaf, paintPine, paintTrunk, treeVariant, TREE_VARIANTS, TRUNK_PIVOT_X} from './trees.ts';
import {PINE_FOREST, PINE_MOON, RUINS_LEAF, VALE_LEAF, FALLS_LEAF, type Ramp} from './tones.ts';

const PALETTE_COLORS = new Set(Object.values(palette).map(colorNumber));
const RAMPS: readonly Ramp[] = [VALE_LEAF, PINE_FOREST, FALLS_LEAF, PINE_MOON, RUINS_LEAF];

function colorsOf(art: Art) {
  const out = new Set<number>();
  for (let y = 0; y < art.h; y++) {
    for (let x = 0; x < art.w; x++) {
      if (art.has(x, y)) out.add(art.rgbAt(x, y));
    }
  }
  return out;
}

function fingerprint(art: Art) {
  let h = 0;
  for (const value of art.data) h = (Math.imul(h, 31) + value) | 0;
  return art.w + 'x' + art.h + ':' + h;
}

test('every tree is deterministic: the same variant paints the same pixels', () => {
  for (let i = 0; i < TREE_VARIANTS; i++) {
    const broad = treeVariant('broadleaf', i);
    assert.equal(fingerprint(paintTrunk(broad)), fingerprint(paintTrunk(treeVariant('broadleaf', i))));
    assert.equal(
      fingerprint(paintBroadleaf(broad, VALE_LEAF).art),
      fingerprint(paintBroadleaf(treeVariant('broadleaf', i), VALE_LEAF).art),
    );
    const pine = treeVariant('pine', i);
    assert.equal(fingerprint(paintPine(pine, PINE_FOREST).art), fingerprint(paintPine(pine, PINE_FOREST).art));
  }
});

test('every painted pixel uses a named palette color (no runtime tints)', () => {
  for (const ramp of RAMPS) {
    for (let i = 0; i < TREE_VARIANTS; i++) {
      const broad = paintBroadleaf(treeVariant('broadleaf', i), ramp).art;
      const pine = paintPine(treeVariant('pine', i), ramp).art;
      for (const color of [...colorsOf(broad), ...colorsOf(pine)]) {
        assert.ok(PALETTE_COLORS.has(color), 'màu ngoài bảng: ' + color.toString(16));
      }
    }
  }
  for (let i = 0; i < TREE_VARIANTS; i++) {
    for (const color of colorsOf(paintTrunk(treeVariant('pine', i)))) {
      assert.ok(PALETTE_COLORS.has(color), 'thân ngoài bảng: ' + color.toString(16));
    }
  }
});

test('trees stand 80 to 120 art pixels tall, with the trunk base on the bottom row', () => {
  for (let i = 0; i < TREE_VARIANTS; i++) {
    for (const kind of ['broadleaf', 'pine'] as const) {
      const variant = treeVariant(kind, i);
      const trunk = paintTrunk(variant);
      const canopy = kind === 'pine' ? paintPine(variant, RAMPS[1]) : paintBroadleaf(variant, RAMPS[0]);
      const total = trunk.h + canopy.art.h;
      assert.ok(total >= 80 && total <= 120, kind + ' ' + i + ' cao ' + total);
      assert.ok(trunk.has(TRUNK_PIVOT_X, trunk.h - 1), 'đáy thân phải chạm hàng cuối');
      assert.ok(canopy.art.has(canopy.pivotX, canopy.art.h - 1), 'chân tán phải nằm trên đỉnh thân');
    }
  }
});

test('six broadleaf variants differ in height or crown size, and pines have several tiers', () => {
  const shapes = new Set<string>();
  for (let i = 0; i < TREE_VARIANTS; i++) {
    const v = treeVariant('broadleaf', i);
    shapes.add(v.trunk + '/' + v.size);
    assert.ok(paintBroadleaf(v, VALE_LEAF).art.w > 0);
  }
  assert.ok(shapes.size >= 6, 'cần ít nhất 6 hình khác nhau, được ' + shapes.size);
  for (let i = 0; i < TREE_VARIANTS; i++) assert.ok(treeVariant('pine', i).tiers >= 4);
});

test('the canopy stays inside its own frame and the pine has no stray pixels above its apex', () => {
  const pine = treeVariant('pine', 0);
  const canopy = paintPine(pine, PINE_FOREST);
  const top = canopy.art.bounds();
  assert.ok(top !== null);
  assert.equal(top.minY, 0);
  assert.ok(canopy.art.h <= pine.size + 4);
});
