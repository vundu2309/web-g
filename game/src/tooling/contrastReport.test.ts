import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contrastRows} from './contrastReport.ts';

test('bảng tương phản trong DESIGN không lệch màu token thực tế', () => {
  const css = readFileSync(new URL('../ui/styles/tokens.css', import.meta.url), 'utf8');
  const doc = readFileSync(new URL('../../docs/DESIGN.md', import.meta.url), 'utf8');
  for (const row of contrastRows(css)) {
    const line = doc.split('\n').find((line) => line.split('|')[1]?.trim() === row.label);
    assert.ok(line?.includes(row.ratio.toFixed(2) + ':1'), row.label);
    assert.equal(line?.includes('**Dưới 4,5**'), row.ratio < 4.5);
  }
});
