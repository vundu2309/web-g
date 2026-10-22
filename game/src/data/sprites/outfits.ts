import {gear} from '../catalog.ts';
import type {SpritePalette} from '../../domain/sprite.ts';
export const reviewOutfits = [
  {name: 'Vải bố · màu đất', items: ['hat-ranger', 'shirt-linen', 'pants-trail', 'bag-canvas']},
  {name: 'Mũ len · rừng thông', items: ['hat-knit', 'shirt-pine', 'pants-denim', 'bag-moss']},
] as const;
export function outfitColors(index: number): SpritePalette {
  const outfit = reviewOutfits[index] ?? reviewOutfits[0];
  const colors: Record<string, string> = {};
  for (const id of outfit.items) {
    const item = gear.find((entry) => entry.id === id)!;
    colors[item.slot === 'backpack' ? 'bag' : item.slot] = item.color;
  }
  return colors;
}
