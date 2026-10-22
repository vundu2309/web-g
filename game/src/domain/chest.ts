import type {Save, Catch, Food} from './saveTypes.ts';
export type StorageItem =
  | {kind: 'wood'; count: number}
  | {kind: 'stone'; count: number}
  | {kind: 'fish'; count: number; fish: Catch}
  | {kind: 'food'; count: number; food: Food};
export const CHEST_SLOTS = 20;
export function itemKey(item: StorageItem) {
  if (item.kind === 'fish') return `fish:${item.fish.id}:${item.fish.length}`;
  if (item.kind === 'food') return `food:${item.food.meal}:${item.food.id}:${item.food.length}`;
  return item.kind;
}
export function backpackItems(save: Save): StorageItem[] {
  const items: StorageItem[] = [];
  if (save.wood) items.push({kind: 'wood', count: save.wood});
  if (save.stone) items.push({kind: 'stone', count: save.stone});
  for (const fish of save.fishBag) add(items, {kind: 'fish', fish: {...fish}, count: 1}, Infinity);
  for (const food of save.food) add(items, {kind: 'food', food: {...food}, count: 1}, Infinity);
  return items;
}
function add(items: StorageItem[], item: StorageItem, slots: number) {
  const own = items.find((entry) => itemKey(entry) === itemKey(item));
  if (own) {
    own.count += item.count;
    return true;
  }
  if (items.length >= slots) return false;
  items.push(structuredClone(item));
  return true;
}
function writeBackpack(save: Save, items: StorageItem[]) {
  save.wood = 0;
  save.stone = 0;
  save.fishBag = [];
  save.food = [];
  for (const item of items) {
    if (item.kind === 'wood' || item.kind === 'stone') save[item.kind] = item.count;
    if (item.kind === 'fish') {
      for (let i = 0; i < item.count; i++) save.fishBag.push({...item.fish});
    }
    if (item.kind === 'food') {
      for (let i = 0; i < item.count; i++) save.food.push({...item.food});
    }
  }
}
/** Clone, validate full transfer, then commit both inventories together. Index -1 transfers everything. */
export function transfer(save: Save, chestId: string, direction: 'deposit' | 'withdraw', index: number) {
  if (!save.buildings.some((b) => b.id === chestId && b.kind === 'chest')) return false;
  const chest = structuredClone(save.chests[chestId] ?? []);
  const bag = backpackItems(save);
  const source = direction === 'deposit' ? bag : chest;
  const target = direction === 'deposit' ? chest : bag;
  if (!Number.isInteger(index) || index < -1 || !source.length || index >= source.length) return false;
  const moving = index === -1 ? [...source] : [source[index]];
  for (const item of moving) {
    if (!add(target, item, direction === 'deposit' ? CHEST_SLOTS : Infinity)) return false;
  }
  if (bag.some((item) => item.count > (item.kind === 'wood' || item.kind === 'stone' ? 9999 : 120000))) return false;
  if (chest.some((item) => item.count > 9999)) return false;
  for (const item of moving) source.splice(source.indexOf(item), 1);
  writeBackpack(save, bag);
  save.chests[chestId] = chest;
  return true;
}
