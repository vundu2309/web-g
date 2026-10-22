import type Phaser from 'phaser';
import {ART_PIXEL} from './SpriteLoader.ts';
/** Every stroke snaps to the art grid so rods, lines and bobbers stay as thin as one art pixel. */
export function snapToArt(value: number) {
  return Math.round(value / ART_PIXEL) * ART_PIXEL;
}
/** Draws a stepped line of art-pixel squares between two world points; allocates nothing. */
export function pixelLine(
  graphics: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  alpha = 1,
) {
  const steps = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / ART_PIXEL));
  graphics.fillStyle(color, alpha);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    graphics.fillRect(snapToArt(x0 + (x1 - x0) * t), snapToArt(y0 + (y1 - y0) * t), ART_PIXEL, ART_PIXEL);
  }
}
