import {mixColor} from '../../domain/backdrop/mix.ts';
import {SKY_BANDS, skyColor, skyLevel} from '../../domain/backdrop/sky.ts';
import {hash01} from '../../domain/tilemap/random.ts';
import type {BackdropPixels} from './backdropPixels.ts';

/** Trời: mỗi mức màu được tính một lần, từng điểm ảnh chỉ tra bảng và dither theo Bayer. */
export function paintSkyBands(px: BackdropPixels, top: number, mid: number, low: number) {
  const palette: number[] = [];
  for (let level = 0; level <= SKY_BANDS; level++) palette.push(skyColor(level, top, mid, low));
  for (let y = 0; y < px.height; y++) {
    for (let x = 0; x < px.width; x++) px.put(x, y, palette[skyLevel(x, y)]);
  }
}

/** Quầng sáng có độ mờ bậc hai ra ngoài; giữ alpha lớn nhất khi các quầng chồng nhau. */
export function paintGlow(px: BackdropPixels, cx: number, cy: number, reach: number, color: number, k: number) {
  for (let y = Math.floor(cy - reach); y <= cy + reach; y++) {
    for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= reach) continue;
      const alpha = Math.round(Math.pow(1 - d / reach, 2) * k * 255);
      if (alpha > px.alphaAt(x, y)) px.put(x, y, color, alpha);
    }
  }
}

function paintDisc(px: BackdropPixels, cx: number, cy: number, r: number, color: number) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) px.put(x, y, color);
    }
  }
}

/** Mặt trời lớn: quầng màu lõi, đĩa, và vầng sáng nhạt ở góc trên trái. */
export function paintSun(px: BackdropPixels, radius: number, core: number, highlight: number) {
  const cx = px.width / 2;
  const cy = px.height / 2;
  paintGlow(px, cx, cy, radius * 4.5, core, 0.45);
  paintDisc(px, cx, cy, radius, core);
  paintDisc(px, cx - 2, cy - 2, Math.max(2, radius - 4), highlight);
}

/** Trăng có hố, bóng ở mép dưới phải và quầng xanh nhạt. */
export function paintMoon(
  px: BackdropPixels,
  radius: number,
  colors: {body: number; crater: number; shade: number; glow: number},
) {
  const cx = px.width / 2;
  const cy = px.height / 2;
  paintGlow(px, cx, cy, radius * 4, colors.glow, 0.35);
  paintDisc(px, cx, cy, radius, colors.body);
  paintDisc(px, cx + 3, cy - 2, 2, colors.crater);
  paintDisc(px, cx - 3, cy + 3, 2, colors.crater);
  paintDisc(px, cx + 2, cy + 4, 1, colors.crater);
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius && dx + dy > radius * 0.8) px.put(x, y, colors.shade);
    }
  }
}

/** Sao cố định theo hash, sáng từ 50% đến 100%; khoảng 10% có thêm bốn điểm lân cận sáng xanh. */
export function paintStars(px: BackdropPixels, colors: readonly [number, number], rows: number) {
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(hash01(i, 1, 3) * px.width);
    const y = Math.floor(hash01(i, 2, 3) * rows);
    const bright = 0.5 + hash01(i, 3, 3) * 0.5;
    px.put(x, y, mixColor(0, colors[0], bright));
    if (hash01(i, 4, 3) <= 0.9) continue;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      px.put(x + dx, y + dy, mixColor(0, colors[1], bright));
    }
  }
}
