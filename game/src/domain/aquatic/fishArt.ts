import {Art} from '../vegetation/art.ts';
import {colorNumber, palette} from '../../data/palette.ts';
import {fishBehavior} from '../../data/fishBehavior.ts';
import {toneRamp} from '../tone.ts';
import type {fishSpecies} from '../../data/catalog.ts';

/** Bốn frame vẫy đuôi, hình thân/vây/hoa văn theo loài; một pixel art luôn là hai đơn vị thế giới. */
export function fishFrame(species: (typeof fishSpecies)[number], frame: number) {
  const art = new Art(28, 18);
  const profile = fishBehavior(species.id);
  const tones = toneRamp(species.color);
  const base = colorNumber(tones.base);
  const deep = colorNumber(tones.deep);
  const hi = colorNumber(tones.hi);
  const radius = profile.shape === 'round' ? 5 : profile.shape === 'long' ? 2 : 3;
  for (let x = 8; x <= 24; x++) {
    const height = Math.max(1, Math.round(radius * Math.sqrt(Math.max(0, 1 - ((x - 16) / 9) ** 2))));
    for (let dy = -height; dy <= height; dy++) {
      const striped = profile.stripes && x % 4 === 0 && dy >= -1;
      art.put(x, 9 + dy, dy === -height ? deep : striped ? deep : dy < 0 ? base : hi);
    }
  }
  const sway = [0, 1, 0, -1][frame % 4];
  for (let x = 2; x < 9; x++) {
    const width = Math.max(1, Math.floor((9 - x) / 2));
    for (let dy = -width; dy <= width; dy++) art.put(x, 9 + dy + sway, dy < 0 ? deep : base);
  }
  for (let x = 12; x < 18; x++) {
    art.put(x, 9 - radius - 1, deep);
    art.put(x + sway, 10 + radius, base);
  }
  art.put(21, 7, colorNumber(palette.cream));
  art.put(22, 8, colorNumber(palette.eye));
  art.put(24, 10, deep);
  if (profile.shape === 'long') {
    art.put(25, 11, hi);
    art.put(26, 12, hi);
  }
  return art;
}
