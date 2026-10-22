import {palette, colorNumber} from './palette.ts';
export const backgroundTones = {
  clouds: [palette.cream, palette.skyHorizon, palette.skyTop, palette.skyWarm, palette.mountainSnow],
  far: [palette.mountainSnow, palette.mountain, palette.skyTop, palette.soilMoon, palette.soilRuins],
  near: [palette.mountain, palette.forestShade, palette.soilRiver, palette.soilMoon, palette.soilPine],
  forest: [palette.forestLeaf, palette.pine, palette.forestShade, palette.soilMoon, palette.soilForest],
};
export type BackgroundLayer = keyof typeof backgroundTones;
const layerNumbers: Record<BackgroundLayer, readonly number[]> = {
  clouds: backgroundTones.clouds.map(colorNumber),
  far: backgroundTones.far.map(colorNumber),
  near: backgroundTones.near.map(colorNumber),
  forest: backgroundTones.forest.map(colorNumber),
};
export function mixColor(from: number, to: number, amount: number) {
  const t = Math.max(0, Math.min(1, amount));
  const channel = (shift: number) => Math.round(((from >> shift) & 255) * (1 - t) + ((to >> shift) & 255) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
/** Blend 320 units on either side of each 3200-unit region border; one tone per region, no allocations. */
export function regionTone(x: number, tones: readonly number[]) {
  x = Math.max(0, Math.min(15999, x));
  const zone = Math.floor(x / 3200);
  const local = x % 3200;
  if (zone > 0 && local < 320) return mixColor(tones[zone - 1], tones[zone], (local + 320) / 640);
  if (zone < 4 && local > 2880) return mixColor(tones[zone], tones[zone + 1], (local - 2880) / 640);
  return tones[zone];
}
export function regionColor(x: number, layer: BackgroundLayer) {
  return regionTone(x, layerNumbers[layer]);
}
