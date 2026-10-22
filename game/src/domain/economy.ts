import {rods} from '../data/rods.ts';
import {fishSpecies, gear, meals, rarityPrices, type MealId} from '../data/catalog.ts';
import type {Catch, Food, Save} from './saveTypes.ts';
export function fishPrice(fish: Catch) {
  const species = fishSpecies.find((f) => f.id === fish.id);
  if (!species || !Number.isFinite(fish.length)) return 0;
  const ratio = Math.max(0, Math.min(1, (fish.length - species.min) / (species.max - species.min)));
  return Math.round(rarityPrices[species.rarity] * (1 + ratio));
}
export function foodPrice(food: Food) {
  return Math.round(fishPrice(food) * meals[food.meal].multiplier);
}
export function sellFish(save: Save, index: number) {
  if (!Number.isInteger(index) || !save.fishBag[index]) return false;
  const price = fishPrice(save.fishBag[index]);
  if (save.coin + price > 999999) return false;
  save.fishBag.splice(index, 1);
  save.coin += price;
  return true;
}
export function sellExceptRecords(save: Save) {
  const keep = new Set<string>();
  const retained: Catch[] = [];
  let price = 0;
  for (const fish of save.fishBag) {
    if (fish.length === save.fish[fish.id]?.largest && !keep.has(fish.id)) {
      keep.add(fish.id);
      retained.push(fish);
    } else price += fishPrice(fish);
  }
  if (!price || save.coin + price > 999999) return false;
  save.fishBag = retained;
  save.coin += price;
  return true;
}
export function buyGear(save: Save, id: string) {
  const item = gear.find((g) => g.id === id);
  if (!item || save.owned.includes(id) || save.coin < item.price) return false;
  save.coin -= item.price;
  save.owned.push(id);
  return true;
}
export function cook(save: Save, index: number, meal: MealId, stove: boolean) {
  const fish = save.fishBag[index];
  if (!Number.isInteger(index) || !fish || !Object.hasOwn(meals, meal) || (meal === 'soup' && !stove)) return false;
  save.fishBag.splice(index, 1);
  save.food.push({...fish, meal});
  return true;
}
export function sellFood(save: Save, index: number) {
  const food = save.food[index];
  if (!Number.isInteger(index) || !food) return false;
  const price = foodPrice(food);
  if (save.coin + price > 999999) return false;
  save.food.splice(index, 1);
  save.coin += price;
  return true;
}
export function eat(save: Save, index: number) {
  if (!Number.isInteger(index) || !save.food[index]) return false;
  save.food.splice(index, 1);
  save.speedBuff = 120;
  return true;
}

export function buyRod(save: Save, id: string) {
  const rod = rods.find((item) => item.id === id);
  if (
    !rod ||
    save.ownedRods.includes(rod.id) ||
    save.coin < rod.price ||
    save.wood < rod.wood ||
    save.stone < rod.stone
  ) {
    return false;
  }
  save.coin -= rod.price;
  save.wood -= rod.wood;
  save.stone -= rod.stone;
  save.ownedRods.push(rod.id);
  save.rod = rod.id;
  return true;
}
export function equipRod(save: Save, id: string) {
  const rod = rods.find((item) => item.id === id);
  if (!rod || !save.ownedRods.includes(rod.id)) return false;
  save.rod = rod.id;
  return true;
}
