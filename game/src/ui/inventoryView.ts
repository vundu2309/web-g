import {gear, slots, fishSpecies, type Slot} from '../data/catalog';
import type {Save} from '../domain/camping';
const $ = (id: string) => document.getElementById(id)!;
export function renderInventory(state: Save, portrait: string, inventoryMenu: HTMLDialogElement) {
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.gear : undefined;
  ($('camper-preview') as HTMLImageElement).src = portrait;
  $('inventory-summary').textContent = state.wood + ' gỗ · ' + state.stone + ' đá · Cần câu & bộ dụng cụ cắm trại';
  $('material-grid').innerHTML =
    '<div class="material-cell"><svg class="pixel-icon" viewBox="0 0 16 16"><use href="#px-wood"/></svg><b>' +
    state.wood +
    '</b><span>Gỗ</span></div>' +
    '<div class="material-cell"><svg class="pixel-icon" viewBox="0 0 16 16"><use href="#px-stone"/></svg><b>' +
    state.stone +
    '</b><span>Đá</span></div>';
  $('gear-list').innerHTML = (Object.keys(slots) as Slot[])
    .map(
      (slot) =>
        '<section class="gear-slot"><h3>' +
        slots[slot] +
        '</h3><div class="gear-options">' +
        gear
          .filter((g) => g.slot === slot && state.owned.includes(g.id))
          .map(
            (g) =>
              '<button title="' +
              g.name +
              '" data-detail="' +
              g.name +
              ' · ' +
              (state.equipped[slot] === g.id ? 'Đang mặc' : 'Chọn để trang bị') +
              '" aria-label="' +
              g.name +
              '" data-gear="' +
              g.id +
              '" aria-pressed="' +
              (state.equipped[slot] === g.id) +
              '"><i class="gear-icon gear-' +
              slot +
              '" style="--swatch:' +
              g.color +
              '"></i><span>' +
              g.name +
              '</span><small>' +
              (state.equipped[slot] === g.id ? 'Đang mặc' : 'Trang bị') +
              '</small></button>',
          )
          .join('') +
        '</div></section>',
    )
    .join('');
  $('fish-list').innerHTML = fishSpecies
    .map((f) => {
      const own = state.fish[f.id];
      return (
        '<button type="button" data-detail="' +
        (own
          ? f.name + ' · ' + f.rarity + ' · Lớn nhất ' + own.largest + ' cm'
          : '??? · ' + f.rarity + ' · Chưa khám phá') +
        '" class="fish-entry ' +
        (own ? 'caught' : '') +
        '"><span class="fish-icon" style="--fish:' +
        f.color +
        '"><svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-fish"/></svg></span><div><strong>' +
        (own ? f.name : '???') +
        '</strong><small>' +
        f.rarity +
        (own ? ' · Lớn nhất ' + own.largest + ' cm' : ' · Chưa khám phá') +
        '</small></div><b>×' +
        state.fishBag.filter((fish) => fish.id === f.id).length +
        '</b></button>'
      );
    })
    .join('');
  if (focused) {
    const item = Array.from(inventoryMenu.querySelectorAll<HTMLButtonElement>('[data-gear]')).find(
      (button) => button.dataset.gear === focused,
    );
    item?.focus();
  }
  const counts = state.fishBag.length;
  $('fish-summary').textContent =
    counts + ' cá · ' + Object.keys(state.fish).length + '/' + fishSpecies.length + ' loài';
}
