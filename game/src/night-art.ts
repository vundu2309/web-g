import {palette} from './data/palette';
/** Ground plants painted once into world chunks. */
type C = CanvasRenderingContext2D;
function box(c: C, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, w, h);
}
export function paintFerns(c: C) {
  for (let i = 0; i < 10; i++) {
    const x = i * 89 + 6;
    box(c, x, 9, 1, 11, palette.legacy050);
    for (let k = 0; k < 4; k++) {
      box(c, x - 4 - k, 10 + k * 2, 4 + k, 1, k % 2 ? palette.legacy051 : palette.legacy052);
      box(c, x + 1, 9 + k * 2, 4 + k, 1, palette.legacy053);
    }
    if (i % 3 === 0) {
      box(c, x + 16, 13, 2, 7, palette.legacy054);
      box(c, x + 12, 11, 10, 3, palette.legacy055);
      box(c, x + 14, 9, 6, 2, palette.legacy056);
      box(c, x + 14, 12, 2, 1, palette.legacy057);
    }
    if (i % 4 === 0) {
      box(c, x + 31, 14, 1, 6, palette.legacy058);
      box(c, x + 29, 12, 5, 2, palette.legacy059);
      box(c, x + 31, 11, 1, 4, palette.legacy060);
    }
  }
}
/** Cached sky for the day/night renderer; never painted inside the frame loop. */
export function paintNightSky(c: C) {
  const gradient = c.createLinearGradient(0, 0, 0, 900);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(0.65, palette.skyHorizon);
  gradient.addColorStop(1, palette.skyWarm);
  c.fillStyle = gradient;
  c.fillRect(0, 0, 512, 900);
}
export function paintStars(c: C) {
  for (let i = 0; i < 70; i++) {
    const x = (i * 131 + 23) % 512;
    const y = (i * 73 + 19) % 420;
    box(c, x, y, i % 7 ? 1 : 2, 1, palette.star);
  }
}
