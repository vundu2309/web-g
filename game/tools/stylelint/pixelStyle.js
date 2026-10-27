import stylelint from 'stylelint';
import {readFileSync} from 'node:fs';

export const ruleName = 'pixel-forest/tokens';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (reason) => `Pixel Forest: ${reason}`,
});

/** Rule local, không dependency bổ sung; kiểm cả giá trị token để không giấu blur trong var(). */
/** @type {import('stylelint').Rule} */
const rule = (enabled) => (root, result) => {
  if (!enabled) return;
  const isTokens = /(?:^|[/\\])tokens\.css$/.test(root.source?.input.file ?? '');
  /** @param {import('postcss').Declaration} node @param {string} reason */
  const report = (node, reason) =>
    stylelint.utils.report({
      ruleName,
      result,
      node,
      message: messages.rejected(reason),
    });
  const shared = readFileSync(new URL('../../src/ui/styles/tokens.css', import.meta.url), 'utf8');
  const values = new Map([...shared.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
  root.walkDecls((d) => {
    if (d.prop.startsWith('--')) values.set(d.prop, d.value);
  });
  /** @param {string} value @param {number} depth @returns {string} */
  const resolve = (value, depth = 0) =>
    depth > 12
      ? value
      : value.replace(/var\((--[\w-]+)\)/g, (match, name) =>
          values.has(name) ? resolve(values.get(name) ?? match, depth + 1) : match,
        );
  root.walkDecls((decl) => {
    const {prop, value} = decl;
    const fontDescriptor = decl.parent?.type === 'atrule' && decl.parent.name === 'font-face';
    if (!isTokens && /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(value)) {
      report(decl, 'màu phải lấy từ tokens.css.');
    }
    if (prop === 'z-index' && !/^var\(--z-[\w-]+\)$/.test(value)) {
      report(decl, 'z-index phải dùng var(--z-*).');
    }
    if (!isTokens && !fontDescriptor && /(?<![\w-])[\d.]+(?:px|rem|ms|s)\b/.test(value)) {
      report(decl, 'kích thước/thời lượng phải dùng token.');
    }
    if (!isTokens && /^(?:font-weight|line-height|opacity)$/.test(prop) && !fontDescriptor && /^\d/.test(value)) {
      report(decl, 'chữ phải dùng thang token.');
    }
    if (
      (/^border(?:-[\w]+)*-radius$/.test(prop) || prop.startsWith('--radius-')) &&
      !/^(?:0|var\(--radius-square\))$/.test(resolve(value))
    ) {
      report(decl, 'chỉ dùng góc vuông (radius 0).');
    }
    if (prop === 'box-shadow' || prop.startsWith('--shadow-') || prop === '--edge') {
      // Tách các tầng, bỏ var() trước khi đọc độ dài; độ dài thứ ba là blur (phải bằng 0).
      for (const layer of resolve(value)
        .replace(/var\([^)]*\)/g, '')
        .split(',')) {
        const sizes = layer.match(/-?(?:\d*\.)?\d+(?:px|rem)?\b/g) ?? [];
        // Màu hex có thể chứa chữ số; bỏ màu trước khi đếm.
        const clean = layer.replace(/#[\da-f]{3,8}\b/gi, '');
        const lengths = clean.match(/-?(?:\d*\.)?\d+(?:px|rem)?\b/g) ?? [];
        if (sizes.length && lengths.length >= 3 && Number.parseFloat(lengths[2]) !== 0) {
          report(decl, 'bóng phải cứng, blur bằng 0.');
        }
      }
    }
  });
};
rule.ruleName = ruleName;
rule.messages = messages;
export default stylelint.createPlugin(ruleName, rule);
