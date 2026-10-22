import {decodeChests} from './storageCodec.ts';
import {rods} from '../data/rods.ts';
import {slots, gear, fishSpecies, recipes, meals, type Slot} from '../data/catalog.ts';
import type {Save, Catch} from './saveTypes.ts';
export const SAVE_KEY = 'forest-camping-v1';
export function newSave(): Save {
  return {
    time: 160,
    chests: {},
    rod: 'bamboo',
    ownedRods: ['bamboo'],
    easyFishing: false,
    version: 2,
    x: 120,
    wood: 24,
    stone: 16,
    coin: 0,
    equipped: {hat: 'hat-ranger', shirt: 'shirt-linen', pants: 'pants-trail', backpack: 'bag-canvas'},
    owned: gear.filter((item) => item.price === 0).map((item) => item.id),
    fish: {},
    fishBag: [],
    food: [],
    speedBuff: 0,
    buildings: [],
    harvested: [],
  };
}
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
export function number(value: unknown, max: number, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;
}
export function decodeCatch(raw: unknown): Catch | null {
  const item = record(raw);
  const species = fishSpecies.find((fish) => fish.id === item.id);
  if (!species || typeof item.length !== 'number' || !Number.isFinite(item.length)) return null;
  return {id: species.id, length: Math.max(species.min, number(item.length, species.max))};
}
/** v1 did not keep individual lengths: retain one record fish and minimum-size remaining fish. */
export function migrateV1(raw: Record<string, unknown>): Save {
  return sanitize(raw, true);
}
function sanitize(raw: Record<string, unknown>, legacy = false): Save {
  const clean = newSave();
  clean.x = Math.max(30, number(raw.x, 15960, 120));
  clean.wood = number(raw.wood, 9999);
  clean.stone = number(raw.stone, 9999);
  clean.time =
    typeof raw.time === 'number' && Number.isFinite(raw.time) ? Math.max(0, Math.min(479.999, raw.time)) : 160;
  clean.coin = number(raw.coin, 999999);
  if (Array.isArray(raw.ownedRods))
    clean.ownedRods = rods
      .filter((rod) => rod.id === 'bamboo' || (raw.ownedRods as unknown[]).includes(rod.id))
      .map((rod) => rod.id);
  const rod = rods.find((rod) => rod.id === raw.rod);
  if (rod && clean.ownedRods.includes(rod.id)) clean.rod = rod.id;
  clean.easyFishing = raw.easyFishing === true;
  clean.speedBuff =
    typeof raw.speedBuff === 'number' && Number.isFinite(raw.speedBuff) ? Math.max(0, Math.min(120, raw.speedBuff)) : 0;
  if (Array.isArray(raw.owned)) {
    clean.owned = [
      ...new Set([
        ...clean.owned,
        ...raw.owned.filter((id): id is string => typeof id === 'string' && gear.some((item) => item.id === id)),
      ]),
    ];
  }
  const equipped = record(raw.equipped);
  for (const slot of Object.keys(slots) as Slot[]) {
    const item = gear.find((g) => g.slot === slot && g.id === equipped[slot]);
    if (item && (clean.owned.includes(item.id) || legacy)) {
      clean.equipped[slot] = item.id;
      if (!clean.owned.includes(item.id)) clean.owned.push(item.id);
    }
  }
  const collection = record(raw.fish);
  for (const species of fishSpecies) {
    const entry = record(collection[species.id]);
    const count = number(entry.count, 9999);
    if (!count) continue;
    const largest = Math.max(species.min, number(entry.largest, species.max));
    clean.fish[species.id] = {count, largest};
    if (legacy) {
      for (let i = 0; i < count; i++) clean.fishBag.push({id: species.id, length: i === 0 ? largest : species.min});
    }
  }
  if (!legacy && Array.isArray(raw.fishBag)) {
    clean.fishBag = raw.fishBag
      .slice(0, 120000)
      .map(decodeCatch)
      .filter((item): item is Catch => item !== null);
  }
  if (Array.isArray(raw.food)) {
    for (const value of raw.food.slice(0, 120000)) {
      const item = record(value);
      const fish = decodeCatch(item);
      if (fish && (item.meal === 'grilled' || item.meal === 'soup') && Object.hasOwn(meals, item.meal)) {
        clean.food.push({...fish, meal: item.meal});
      }
    }
  }
  if (Array.isArray(raw.buildings)) {
    const ids = new Set<string>();
    for (const [index, value] of raw.buildings.slice(0, 80).entries()) {
      const item = record(value);
      const kind = Object.keys(recipes).find((key) => key === item.kind) as keyof typeof recipes | undefined;
      if (!kind || typeof item.x !== 'number' || !Number.isFinite(item.x) || item.x < 60 || item.x > 15940) continue;
      let id = typeof item.id === 'string' && /^build-[\w-]{1,60}$/.test(item.id) ? item.id : 'build-old-' + index;
      let suffix = 0;
      while (ids.has(id)) id = 'build-migrated-' + index + '-' + suffix++;
      ids.add(id);
      clean.buildings.push({id, kind, x: Math.round(item.x)});
    }
  }
  if (Array.isArray(raw.harvested)) {
    clean.harvested = [
      ...new Set(raw.harvested.filter((id): id is string => typeof id === 'string' && /^node-\d+$/.test(id))),
    ].slice(0, 200);
  }
  clean.chests = decodeChests(raw.chests, clean.buildings);
  return clean;
}
export function decodeSave(raw: string | null): Save {
  if (!raw) return newSave();
  try {
    const parsed: unknown = JSON.parse(raw);
    const value = record(parsed);
    if (value.version === 1) return migrateV1(value);
    return value.version === 2 ? sanitize(value) : newSave();
  } catch {
    return newSave();
  }
}
