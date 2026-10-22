import {clockText} from '../domain/dayTime';
import {gear, slots, fishSpecies, recipes, type Save, type Slot, type BuildingKind} from '../camping';
import type {Quality} from '../game/rendering/resolution';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing game UI element: ' + id);
  return element as T;
};
export type Panel = 'settings' | 'inventory' | 'build' | 'activity';
export type GameStatus = 'ready' | 'play' | 'pause';
export interface UIActions {
  start(): void;
  pause(): void;
  home(): void;
  panel(panel: Panel): void;
  closePanel(panel: Panel): void;
  interact(): void;
  activity(command: string): void;
  easyFishing(value: boolean): void;
  cancel(): void;
  quality(q: Quality): void;
  fullscreen(): void;
  equip(id: string): void;
  selectBuilding(kind: BuildingKind): void;
}
export interface HUDModel {
  state: Save;
  status: GameStatus;
  location: string;
  actionLabel: string;
  bite: boolean;
  cancelVisible: boolean;
}
/** DOM only. Receives state snapshots and emits commands; knows nothing about Phaser. */
export class GameUI {
  private abort = new AbortController();
  private toastTimer = 0;
  private status?: GameStatus;
  private portrait = '';
  private setText(id: string, text: string) {
    const node = $(id);
    if (node.textContent !== text) node.textContent = text;
  }
  readonly pauseMenu = $<HTMLDialogElement>('pause-menu');
  readonly settingsMenu = $<HTMLDialogElement>('settings-menu');
  readonly inventoryMenu = $<HTMLDialogElement>('inventory-menu');
  readonly buildMenu = $<HTMLDialogElement>('build-menu');
  readonly activityMenu = $<HTMLDialogElement>('activity-menu');
  get modalOpen() {
    return [this.pauseMenu, this.settingsMenu, this.inventoryMenu, this.buildMenu, this.activityMenu].some(
      (dialog) => dialog.open,
    );
  }
  bind(actions: UIActions) {
    const on = (id: string, type: string, fn: (event: Event) => void) =>
      $(id).addEventListener(type, fn, {signal: this.abort.signal});
    for (const [id, action] of Object.entries({
      start: actions.start,
      pause: actions.pause,
      resume: actions.pause,
      restart: actions.home,
      inventory: () => actions.panel('inventory'),
      build: () => actions.panel('build'),

      'cancel-action': actions.cancel,
      fullscreen: actions.fullscreen,
      'quality-low': () => actions.quality('low'),
      'quality-high': () => actions.quality('high'),
    }))
      on(id, 'click', () => action());
    for (const id of ['settings', 'welcome-settings', 'pause-settings'])
      on(id, 'click', () => actions.panel('settings'));
    for (const panel of ['settings', 'inventory', 'build', 'activity'] as const) {
      for (const id of ['close-' + panel, 'done-' + panel]) on(id, 'click', () => actions.closePanel(panel));
      on(panel + '-menu', 'cancel', (event) => {
        event.preventDefault();
        actions.closePanel(panel);
      });
    }
    on('pause-menu', 'cancel', (event) => {
      event.preventDefault();
      actions.pause();
    });
    on('inventory-menu', 'click', (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-gear]');
      if (button && !button.disabled) actions.equip(button.dataset.gear!);
    });
    on('action', 'click', (event) => {
      if (event instanceof MouseEvent && event.detail === 0) actions.interact();
    });
    on('easy-fishing', 'change', () => actions.easyFishing($<HTMLInputElement>('easy-fishing').checked));
    on('activity-menu', 'click', (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-command]');
      if (button && !button.disabled) actions.activity(button.dataset.command!);
    });
    on('build-menu', 'click', (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-build]');
      const kind = button?.dataset.build;
      if (button && !button.disabled && kind && Object.hasOwn(recipes, kind))
        actions.selectBuilding(kind as BuildingKind);
    });
  }
  closeAll() {
    for (const dialog of [this.pauseMenu, this.settingsMenu, this.inventoryMenu, this.buildMenu, this.activityMenu])
      dialog.close();
  }
  showPanel(panel: Panel) {
    this.closeAll();
    $<HTMLDialogElement>(panel + '-menu').showModal();
  }
  closePanel(panel: Panel) {
    $<HTMLDialogElement>(panel + '-menu').close();
  }
  showWelcome(visible: boolean) {
    $('welcome').hidden = !visible;
  }
  setPortrait(image: string) {
    this.portrait = image;
    $<HTMLImageElement>('hud-avatar').src = image;
  }
  get portraitImage() {
    return this.portrait;
  }
  setQuality(quality: Quality) {
    $('quality-low').setAttribute('aria-pressed', String(quality === 'low'));
    $('quality-high').setAttribute('aria-pressed', String(quality === 'high'));
    document.body.dataset.quality = quality;
  }
  toast(message: string) {
    this.setText('toast', message);
    $('toast').hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => ($('toast').hidden = true), 4200);
  }
  renderHUD(model: HUDModel) {
    const {state, status} = model,
      total = state.fishBag.length;
    this.setText('hud-wood', String(state.wood));
    this.setText('hud-stone', String(state.stone));
    this.setText('hud-coin', state.coin + ' xu');
    this.setText('hud-time', clockText(state.time));
    this.setText(
      'effects',
      status === 'pause' ? 'TẠM DỪNG' : total + ' cá · ' + state.buildings.length + ' công trình',
    );
    const label = $('chapter').querySelector('span')!;
    if (label.textContent !== model.location) label.textContent = model.location;
    if (this.status !== status) {
      this.status = status;
      const pause = $<HTMLButtonElement>('pause');
      pause.disabled = status === 'ready';
      pause.innerHTML =
        status === 'pause'
          ? '<svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3 1h2v2h3v2h3v2h3v2h-3v2H8v2H5v2H3z"/></svg>'
          : '<svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true"><use href="#px-pause"/></svg>';
      pause.setAttribute('aria-label', status === 'pause' ? 'Tiếp tục game' : 'Tạm dừng game');
    }
    this.setText('action-label', model.actionLabel);
    $('action').classList.toggle('bite', model.bite);
    $('cancel-action').hidden = !model.cancelVisible;
  }
  renderInventory(state: Save, portrait: string) {
    ($('camper-preview') as HTMLImageElement).src = portrait;
    $('inventory-summary').textContent = state.wood + ' gỗ · ' + state.stone + ' đá · Cần câu & bộ dụng cụ cắm trại';
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
                '<button data-gear="' +
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
          '<div class="fish-entry ' +
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
          '</b></div>'
        );
      })
      .join('');
    const counts = state.fishBag.length;
    $('fish-summary').textContent =
      counts + ' cá · ' + Object.keys(state.fish).length + '/' + fishSpecies.length + ' loài';
  }
  renderRecipes(state: Save, images: Record<BuildingKind, string>) {
    $('build-resources').textContent = 'Bạn có ' + state.wood + ' gỗ · ' + state.stone + ' đá';
    $('recipe-list').innerHTML = (Object.keys(recipes) as BuildingKind[])
      .map((kind) => {
        const r = recipes[kind],
          enough = state.wood >= r.wood && state.stone >= r.stone;
        return (
          '<button class="recipe" data-build="' +
          kind +
          '" ' +
          (enough ? '' : 'disabled') +
          '><img src="' +
          images[kind] +
          '" alt=""><div><strong>' +
          r.name +
          '</strong><p>' +
          r.description +
          '</p><small>' +
          r.wood +
          ' gỗ · ' +
          r.stone +
          ' đá</small></div><span>' +
          (enough ? 'Đặt →' : 'Thiếu') +
          '</span></button>'
        );
      })
      .join('');
  }
  dispose() {
    this.abort.abort();
    window.clearTimeout(this.toastTimer);
    this.closeAll();
  }
}
