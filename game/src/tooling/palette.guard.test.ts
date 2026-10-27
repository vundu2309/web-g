import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import ts from 'typescript';
import {palette} from '../data/palette.ts';

const root = resolve(import.meta.dirname, '../..');
function files(path: string): string[] {
  return readdirSync(path, {withFileTypes: true}).flatMap((entry) => {
    const name = resolve(path, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}
// Không có ngoại lệ TS ngoài palette và backdropTones; test được phép dùng màu làm dữ liệu thử.
function allowed(path: string) {
  return /^src\/data\/(?:palette\.ts|palette\/[^/]+\.ts|backdropTones\.ts)$/.test(path) || path.endsWith('.test.ts');
}

test('TS không chứa chuỗi màu hex ngoài bảng màu được phép', () => {
  const violations: string[] = [];
  for (const path of files(resolve(root, 'src')).filter((path) => path.endsWith('.ts'))) {
    const name = relative(root, path);
    if (allowed(name)) continue;
    const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      true,
      ts.LanguageVariant.Standard,
      readFileSync(path, 'utf8'),
    );
    let token = scanner.scan();
    while (token !== ts.SyntaxKind.EndOfFileToken) {
      if (
        [
          ts.SyntaxKind.StringLiteral,
          ts.SyntaxKind.NoSubstitutionTemplateLiteral,
          ts.SyntaxKind.TemplateHead,
          ts.SyntaxKind.TemplateMiddle,
          ts.SyntaxKind.TemplateTail,
        ].includes(token) &&
        /#[\da-f]{3,8}\b/i.test(scanner.getTokenText())
      )
        violations.push(name + ':' + scanner.getTokenText());
      token = scanner.scan();
    }
  }
  assert.deepEqual(violations, []);
});

test('bảy màu nhận diện CSS và TS khớp chính xác, không thêm nguồn màu âm thầm', () => {
  const css = readFileSync(resolve(root, 'src/ui/styles/tokens.css'), 'utf8');
  for (const key of ['ink', 'pine', 'cream', 'gold', 'paper', 'wood', 'moss'] as const) {
    assert.equal(css.match(new RegExp('--' + key + ':\\s*(#[\\da-f]+);', 'i'))?.[1], palette[key], key);
  }
});

test('CSS chỉ tham chiếu token đã khai báo hoặc hai màu động từ catalog', () => {
  const cssFiles = files(resolve(root, 'src')).filter((path) => path.endsWith('.css'));
  const all = cssFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
  const declared = new Set([...all.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
  declared.add('--swatch');
  declared.add('--fish');
  for (const match of all.matchAll(/var\((--[\w-]+)/g)) assert.ok(declared.has(match[1]), match[1]);
});
