import {WORLD_WIDTH} from '../data/worldLayout.ts';
import type {Period} from './dayTime.ts';
import {gear, fishSpecies, recipes, type FishId, type Habitat, type BuildingKind} from '../data/catalog.ts';
import type {Save} from './saveTypes.ts';
export type {Save, Building, Catch, Food} from './saveTypes.ts';
export {newSave, decodeSave, SAVE_KEY, migrateV1} from './saveCodec.ts';
export function equip(save: Save, id: string) {
  const item = gear.find((g) => g.id === id);
  if (!item || !save.owned.includes(id)) return false;
  save.equipped[item.slot] = id;
  return true;
}
export function adjustedWeight(weight: number, rarity: string, luck = 1) {
  const tier = ['Thường', 'Ít gặp', 'Hiếm', 'Rất hiếm'].indexOf(rarity);
  const safeLuck = Number.isFinite(luck) ? Math.max(1, Math.min(1.5, luck)) : 1;
  return weight * (1 + Math.max(0, tier) * (safeLuck - 1));
}
export function rollFish(
  habitat: Habitat,
  random = Math.random(),
  sizeRandom = Math.random(),
  luck = 1,
  period: Period = 'day',
) {
  const candidates = fishSpecies.filter(
    (f) => (f.habitats as readonly string[]).includes(habitat) && f.activeAt.includes(period),
  );
  let draw =
    Math.max(0, Math.min(0.999999, random)) *
    candidates.reduce((n, f) => n + adjustedWeight(f.weight, f.rarity, luck), 0);
  const species =
    candidates.find((f) => (draw -= adjustedWeight(f.weight, f.rarity, luck)) < 0) ?? candidates[candidates.length - 1];
  return {
    species,
    length: Math.round(species.min + Math.max(0, Math.min(1, sizeRandom)) * (species.max - species.min)),
  };
}
export function storeFish(save: Save, id: FishId, length: number) {
  const species = fishSpecies.find((f) => f.id === id);
  if (!species || !Number.isFinite(length)) return;
  length = Math.max(species.min, Math.min(species.max, Math.round(length)));
  const old = save.fish[id];
  save.fish[id] = {count: (old?.count ?? 0) + 1, largest: Math.max(old?.largest ?? 0, length)};
  save.fishBag.push({id, length});
}
export function craft(save: Save, kind: BuildingKind, x: number) {
  const recipe = recipes[kind];
  if (save.wood < recipe.wood || save.stone < recipe.stone || save.buildings.length >= 80) return false;
  if (!Number.isFinite(x) || x < 60 || x > WORLD_WIDTH - 60) return false;
  if (kind === 'stove' && !save.buildings.some((b) => b.kind === 'fire' && Math.abs(b.x - x) < 300)) return false;
  save.wood -= recipe.wood;
  save.stone -= recipe.stone;
  let index = save.buildings.length;
  while (save.buildings.some((b) => b.id === 'build-' + index)) index++;
  const id = 'build-' + index;
  save.buildings.push({id, kind, x});
  if (kind === 'chest') save.chests[id] = [];
  return true;
}
