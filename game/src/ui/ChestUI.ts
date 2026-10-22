import {fishSpecies, meals} from '../data/catalog';
import {backpackItems, type StorageItem} from '../domain/chest';
import type {Save} from '../domain/saveTypes';
function label(item: StorageItem) {
  if (item.kind === 'wood') return 'Gỗ';
  if (item.kind === 'stone') return 'Đá';
  const fish = item.kind === 'fish' ? item.fish : item.food;
  const name = fishSpecies.find((f) => f.id === fish.id)!.name;
  return (item.kind === 'food' ? meals[item.food.meal].name + ' · ' : '') + name + ` · ${fish.length} cm`;
}
function column(title: string, items: StorageItem[], direction: string) {
  const arrow = direction === 'deposit' ? '→' : '←';
  return `<section><h3>${title}</h3><button data-command="${direction}:-1" ${items.length ? '' : 'disabled'}>
    Chuyển tất cả ${arrow}</button><div class="chest-items">${
      items
        .map(
          (item, index) =>
            `<button data-command="${direction}:${index}">${label(item)} ×${item.count} ${arrow}</button>`,
        )
        .join('') || '<p>Chưa có vật phẩm</p>'
    }</div></section>`;
}
export function chestMarkup(save: Save, id: string) {
  const chest = save.chests[id] ?? [];
  return `<p>Rương: ${chest.length}/20 ô · Nhấp để chuyển cả chồng. Túi cá nhân chưa giới hạn.</p>
    <div class="chest-columns">${column('Kho cá nhân', backpackItems(save), 'deposit')}
    ${column('Rương gỗ', chest, 'withdraw')}</div>`;
}
