/** Độ chói tương đối sRGB (WCAG), đầu vào RGB đục; không suy màu ngầm. */
export function luminance(hex: string): number {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error('Cần màu RGB đục sáu chữ số.');
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
