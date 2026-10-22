import {ART_PIXEL} from '../../data/palette.ts';
import {readQuality} from '../../storage/preferences.ts';
export type Quality = 'low' | 'high';
/** Visible height aim in art pixels; the accepted band is wider so that the integer scale always fits. */
export const TARGET_ART_HEIGHT = 270;
export const MIN_ART_HEIGHT = 240;
export const MAX_ART_HEIGHT = 330;
/** Width bounds in art pixels: 144 to 1,600 world units, so 1:3 windows are covered without bars. */
export const MIN_ART_WIDTH = 72;
export const MAX_ART_WIDTH = 800;
export const MAX_PIXEL_SCALE = 16;
export interface PixelFrame {
  /** Device pixels per art pixel; always an integer, so every art pixel is an equal square. */
  pixelScale: number;
  /** Visible size in art pixels. Multiply by ART_PIXEL to get world units. */
  artWidth: number;
  artHeight: number;
  /** Backing store in device pixels, exactly artWidth × pixelScale by artHeight × pixelScale. */
  canvasWidth: number;
  canvasHeight: number;
  /** Camera zoom: device pixels per world unit. */
  zoom: number;
  /** Device density used for the canvas. Quality low renders at 1 regardless of the screen. */
  density: number;
}
/** Picks the integer scale whose visible height is closest to the target, measured on a log scale. */
export function chooseScale(deviceHeight: number) {
  let best = 1;
  let bestError = Infinity;
  for (let scale = 1; scale <= MAX_PIXEL_SCALE; scale++) {
    const error = Math.abs(Math.log(deviceHeight / (scale * TARGET_ART_HEIGHT)));
    if (error < bestError) {
      best = scale;
      bestError = error;
    }
  }
  return best;
}
/** Computes the whole pixel-art frame from the host size in CSS pixels and the screen density. */
export function pixelFrame(cssWidth: number, cssHeight: number, dpr: number, quality: Quality): PixelFrame {
  const density = quality === 'high' ? Math.min(Math.max(1, dpr), 3) : 1;
  const deviceWidth = Math.max(1, Math.floor(cssWidth * density));
  const deviceHeight = Math.max(1, Math.floor(cssHeight * density));
  const pixelScale = chooseScale(deviceHeight);
  const artHeight = Math.max(1, Math.floor(deviceHeight / pixelScale));
  const artWidth = Math.min(MAX_ART_WIDTH, Math.max(MIN_ART_WIDTH, Math.floor(deviceWidth / pixelScale)));
  return {
    pixelScale,
    artWidth,
    artHeight,
    canvasWidth: artWidth * pixelScale,
    canvasHeight: artHeight * pixelScale,
    zoom: pixelScale / ART_PIXEL,
    density,
  };
}
export function initialQuality(): Quality {
  const saved = readQuality();
  if (saved) return saved;
  return matchMedia('(pointer:coarse)').matches ? 'low' : 'high';
}
