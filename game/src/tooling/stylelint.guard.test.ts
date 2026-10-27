import {test} from 'node:test';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';
import config from '../../stylelint.config.js';

async function rejects(code: string, file = '/virtual/src/ui/styles/base.css') {
  const result = await stylelint.lint({code: code.replaceAll('; ', ';\n'), codeFilename: file, config});
  return result.results.flatMap((r) => r.warnings).filter((w) => w.severity === 'error');
}

test('CSS guard chặn màu hex, rgb/hsl và kích thước cứng ngoài tokens', async () => {
  for (const value of ['#ffffff', 'rgb(0 0 0)', 'hsl(0 0% 0%)', 'oklch(50% 0.2 20)']) {
    assert.ok((await rejects(`a { color: ${value}; }`)).some((w) => w.rule === 'pixel-forest/tokens'));
  }
  assert.ok((await rejects('a { padding: 12px; }')).length);
  assert.ok((await rejects('a { z-index: 3; }')).length);
});

test('CSS guard chặn gradient, góc tròn và bóng blur kể cả ẩn trong token', async () => {
  assert.ok((await rejects('a { background: linear-gradient(red, blue); }')).length);
  assert.ok((await rejects('a { border-radius: 50%; }')).length);
  assert.ok((await rejects('a { border-top-left-radius: 50%; }')).length);
  assert.ok((await rejects(':root { --shadow-soft: 0 0 8px #ffffff; }', '/virtual/tokens.css')).length);
  assert.ok(
    (await rejects(':root { --blur: 8px; --shadow-soft: 0 0 var(--blur) #ffffff; }', '/virtual/tokens.css')).length,
  );
});

test('CSS guard cho phép token, bóng cứng, media và descriptor font', async () => {
  assert.deepEqual(await rejects('a { color: var(--ink); padding: var(--space-12); z-index: var(--z-hud); }'), []);
  assert.deepEqual(await rejects(':root { --shadow-hard: 4px 4px 0 #ffffff; }', '/virtual/tokens.css'), []);
  assert.deepEqual(await rejects('@media (max-width: 600px) { a { margin: 0; } }'), []);
});
