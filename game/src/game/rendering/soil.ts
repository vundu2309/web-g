import {palette, colorNumber} from '../../data/palette.ts';
import {regionTone} from '../../data/parallax.ts';
const soils = [palette.soilForest, palette.soilPine, palette.soilRiver, palette.soilMoon, palette.soilRuins].map(
  colorNumber,
);
const STRIP = 16;
/** Ground tone at a world x; borders blend like the parallax layers instead of switching in one step. */
export function soilTone(worldX: number) {
  return regionTone(worldX, soils);
}
function cssColor(color: number) {
  return '#' + color.toString(16).padStart(6, '0');
}
/** Chunk-local strata, roots and stone seams, painted once. No change to collision geometry. */
export function paintSoil(c: CanvasRenderingContext2D, x: number, y: number, height: number, worldX: number) {
  for (let offset = 0; offset < 256; offset += STRIP) {
    c.fillStyle = cssColor(soilTone(worldX + offset + STRIP / 2));
    c.fillRect(x + offset, y, STRIP, height - y);
  }
  c.fillStyle = palette.root;
  c.fillRect(x, y + 14, 256, 20);
  c.fillStyle = palette.soilGrain;
  for (let band = 0; band < 5; band++) {
    c.globalAlpha = 0.34 - band * 0.045;
    c.fillRect(x, y + 36 + band * 32, 256, 18);
  }
  c.globalAlpha = 1;
  c.fillStyle = palette.grassEdge;
  c.fillRect(x, y, 256, 4);
  c.fillStyle = palette.grassShade;
  c.fillRect(x, y + 4, 256, 10);
  for (let i = 0; i < 6; i++) {
    const rootX = x + 12 + i * 44;
    c.fillStyle = palette.root;
    c.fillRect(rootX, y + 6, 4, 26 + (i % 3) * 8);
    c.fillRect(rootX - 8, y + 28 + (i % 3) * 8, 12, 2);
    c.fillRect(rootX - 8, y + 28 + (i % 3) * 8, 2, 12);
  }
  for (let i = 0; i < 100; i++) {
    const px = x + ((i * 46) % 252);
    const py = y + 48 + ((i * 32) % Math.max(2, height - y - 52));
    c.fillStyle = i % 7 ? palette.soilGrain : palette.soilStone;
    c.fillRect(px, py, 2 + (i % 3) * 2, 2);
    if (i % 13 === 0) {
      c.fillStyle = palette.soilStone;
      c.fillRect(px, py, 12, 4);
      c.fillRect(px + 2, py - 2, 8, 2);
    }
  }
}
