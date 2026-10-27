import {test} from 'node:test';
import assert from 'node:assert/strict';
import {luminance, contrastRatio} from './contrast.ts';

test('WCAG sRGB: đen/trắng 21:1, màu giống nhau 1:1, đối xứng', () => {
  assert.equal(luminance('#000000'), 0);
  assert.equal(luminance('#ffffff'), 1);
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#263d31', '#263d31'), 1);
  assert.equal(contrastRatio('#263d31', '#ddd0a6'), contrastRatio('#ddd0a6', '#263d31'));
  assert.throws(() => luminance('#fff3'), /sáu/);
});
