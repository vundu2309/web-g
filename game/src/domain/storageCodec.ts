import {fishSpecies, type MealId} from '../data/catalog.ts';
import type {Building, Catch} from './saveTypes.ts';
import type {StorageItem} from './chest.ts';
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
function fish(value: unknown): Catch | null {
  const raw = object(value);
  const species = fishSpecies.find((item) => item.id === raw.id);
  if (!species || typeof raw.length !== 'number' || !Number.isFinite(raw.length)) return null;
  return {id: species.id, length: Math.max(species.min, Math.min(species.max, Math.floor(raw.length)))};
}
export function decodeChests(value: unknown, buildings: Building[]) {
  const raw = object(value);
  const result: Record<string, StorageItem[]> = {};
  for (const building of buildings) {
    if (building.kind !== 'chest') continue;
    const entries = raw[building.id];
    const items: StorageItem[] = [];
    if (Array.isArray(entries)) {
      for (const value of entries.slice(0, 20)) {
        const item = object(value);
        if (typeof item.count !== 'number' || !Number.isFinite(item.count)) continue;
        const count = Math.max(0, Math.min(9999, Math.floor(item.count)));
        if (!count) continue;
        if (item.kind === 'wood' || item.kind === 'stone') items.push({kind: item.kind, count});
        if (item.kind === 'fish') {
          const caught = fish(item.fish);
          if (caught) items.push({kind: 'fish', fish: caught, count});
        }
        if (item.kind === 'food') {
          const cooked = object(item.food);
          const caught = fish(cooked);
          if (caught && (cooked.meal === 'grilled' || cooked.meal === 'soup')) {
            items.push({kind: 'food', food: {...caught, meal: cooked.meal as MealId}, count});
          }
        }
      }
    }
    result[building.id] = items;
  }
  return result;
}
