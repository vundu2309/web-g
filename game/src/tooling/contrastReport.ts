import {readFileSync} from 'node:fs';
import {contrastRatio} from '../domain/design/contrast.ts';

const PAIRS = [
  ['Chữ chính / giấy', 'ink', 'paper'],
  ['Nút phụ', 'cream', 'pine'],
  ['Nút chính', 'ink', 'gold'],
  ['Mô tả / giấy', 'text-body', 'paper'],
  ['Chú thích / giấy', 'text-caption', 'paper'],
  ['Gợi ý / giấy', 'text-hint', 'paper'],
  ['Đã trang bị', 'text-gear-selected', 'gear-selected'],
  ['Gợi ý trang bị', 'text-gear-hint', 'surface-gear'],
  ['Cá chưa khám phá', 'text-undiscovered', 'surface-undiscovered'],
  ['Gợi ý cá', 'text-fish-hint', 'surface-undiscovered'],
  ['Tên vùng', 'text-region', 'surface-region'],
  ['Thông báo', 'text-toast', 'surface-toast'],
] as const;

/** Bảng WCAG lấy trực tiếp token; alias được giải, màu alpha phải đo riêng trên nền đã composite. */
export function contrastRows(css: string) {
  const values = new Map([...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const resolve = (name: string, seen = new Set<string>()): string => {
    if (seen.has(name)) throw new Error('Token vòng: ' + name);
    seen.add(name);
    const value = values.get(name);
    if (!value) throw new Error('Thiếu token: ' + name);
    const alias = value.match(/^var\(--([\w-]+)\)$/);
    return alias ? resolve(alias[1], seen) : value;
  };
  return PAIRS.map(([label, foreground, background]) => ({
    label,
    foreground,
    background,
    ratio: contrastRatio(resolve(foreground), resolve(background)),
  }));
}

if (process.argv[1]?.endsWith('/contrastReport.ts')) {
  const css = readFileSync(new URL('../ui/styles/tokens.css', import.meta.url), 'utf8');
  for (const row of contrastRows(css)) {
    process.stdout.write(`${row.label}: ${row.ratio.toFixed(2)}:1 · ${row.ratio >= 4.5 ? 'Đạt' : 'Dưới 4,5'}\n`);
  }
}
