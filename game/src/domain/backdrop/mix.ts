/** Trộn hai màu 0xRRGGBB theo tỉ lệ amount trong [0, 1]; thuần, không phụ thuộc Phaser. */
export function mixColor(from: number, to: number, amount: number) {
  const t = Math.max(0, Math.min(1, amount));
  const channel = (shift: number) => Math.round(((from >> shift) & 255) * (1 - t) + ((to >> shift) & 255) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Tách màu thành ba kênh để nội suy theo vùng từng kênh. */
export function splitChannels(colors: readonly number[]) {
  return {
    red: colors.map((c) => (c >> 16) & 255),
    green: colors.map((c) => (c >> 8) & 255),
    blue: colors.map((c) => c & 255),
  };
}
