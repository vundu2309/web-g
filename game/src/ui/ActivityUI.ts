import {rods} from '../data/rods';
import {gear, fishSpecies, meals, type MealId} from '../data/catalog';
import type {Save} from '../domain/saveTypes';
import {fishPrice, foodPrice} from '../domain/economy';
export type Activity = 'shop' | 'cook';
const button = (command: string, label: string, disabled = false) =>
  `<button data-command="${command}" ${disabled ? 'disabled' : ''}>${label}</button>`;
export function activityMarkup(state: Save, activity: Activity, stove: boolean, tab: string) {
  const fishName = (id: string) => fishSpecies.find((fish) => fish.id === id)!.name;
  const fishRows = state.fishBag
    .map((fish, index) => {
      const name = `${fishName(fish.id)} · ${fish.length} cm`;
      if (activity === 'shop') return button('sell:' + index, `${name} — ${fishPrice(fish)} xu`);
      return `<section class="trade-row"><b>${name}</b>${button('grilled:' + index, 'Nướng')}
      ${button('soup:' + index, 'Nấu canh', !stove)}</section>`;
    })
    .join('');
  const foodRows = state.food
    .map(
      (food, index) => `<section class="trade-row">
    <b>${meals[food.meal].name} · ${fishName(food.id)}</b>
    ${activity === 'shop' ? button('food:' + index, `Bán ${foodPrice(food)} xu`) : ''}
    ${button('eat:' + index, 'Ăn · chạy +10% / 120 giây')}</section>`,
    )
    .join('');
  if (activity === 'cook')
    return `<p>Nướng tại lửa; nấu canh cần bếp nấu. Không tốn thêm vật liệu.</p>
    ${fishRows || '<p>Chưa có cá trong túi.</p>'}${foodRows}`;
  const tabs = `<nav class="trade-tabs">${button('tab:sell', 'Bán', tab === 'sell')}
    ${button('tab:buy', 'Mua', tab === 'buy')}</nav><p>${state.coin} xu</p>`;
  if (tab === 'buy')
    return (
      tabs +
      rods
        .map((rod) =>
          button(
            (state.ownedRods.includes(rod.id) ? 'equiprod:' : 'rod:') + rod.id,
            `${rod.name} — ${rod.price} xu · ${rod.wood} gỗ · ${rod.stone} đá${state.rod === rod.id ? ' · Đang dùng' : ''}`,
            state.rod === rod.id ||
              (!state.ownedRods.includes(rod.id) &&
                (state.coin < rod.price || state.wood < rod.wood || state.stone < rod.stone)),
          ),
        )
        .join('') +
      gear
        .filter((item) => item.price > 0)
        .map((item) =>
          button(
            'buy:' + item.id,
            `${item.name} — ${item.price} xu`,
            state.owned.includes(item.id) || state.coin < item.price,
          ),
        )
        .join('')
    );
  return (
    tabs +
    button('all:0', 'Bán tất cả trừ cá kỷ lục', state.fishBag.length === 0) +
    (fishRows || '<p>Chưa có cá để bán.</p>') +
    foodRows
  );
}
export function mealCommand(command: string): MealId | null {
  return command === 'grilled' || command === 'soup' ? command : null;
}
