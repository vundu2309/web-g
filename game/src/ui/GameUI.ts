import {renderInventory} from './inventoryView';
import {clockText} from '../domain/dayTime';
import {recipes, type Save, type BuildingKind} from '../camping';
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
  aquatic?: {near: boolean; active: boolean; air: number; surfacing: boolean};
  anchor?: {x: number; y: number};
}
/** DOM only. Receives state snapshots and emits commands; knows nothing about Phaser. */
export class GameUI {
  private abort = new AbortController();
  private toastTimer = 0;
  private status?: GameStatus;
  private returnFocus?: HTMLElement;
  private anchorX = Number.NaN;
  private anchorY = Number.NaN;
  private regionTimer = 0;
  private location = '';
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
    for (const id of ['welcome-settings', 'pause-settings']) on(id, 'click', () => actions.panel('settings'));
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
    on('inventory-menu', 'focusin', (event) => {
      const item = (event.target as Element).closest<HTMLElement>('[data-detail]');
      if (item) this.setText('item-detail', item.dataset.detail!);
    });
    on('inventory-menu', 'click', (event) => {
      const item = (event.target as Element).closest<HTMLElement>('[data-detail]');
      if (item) this.setText('item-detail', item.dataset.detail!);
      const tab = (event.target as Element).closest<HTMLButtonElement>('[data-inventory-tab]');
      if (tab) {
        for (const button of Array.from(this.inventoryMenu.querySelectorAll<HTMLButtonElement>('[data-inventory-tab]')))
          button.setAttribute('aria-pressed', String(button === tab));
        this.setText(
          'item-detail',
          tab.dataset.inventoryTab === 'materials'
            ? 'Gỗ và đá dùng để dựng trại.'
            : 'Chọn một vật phẩm để xem chi tiết.',
        );
        for (const name of ['materials', 'equipment', 'fish'])
          $(name + '-panel').hidden = name !== tab.dataset.inventoryTab;
      }
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
    for (const id of ['inventory', 'build']) $(id).setAttribute('aria-expanded', 'false');
    for (const dialog of [this.pauseMenu, this.settingsMenu, this.inventoryMenu, this.buildMenu, this.activityMenu])
      dialog.close();
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = undefined;
  }
  showPanel(panel: Panel) {
    this.closeAll();
    this.returnFocus = $(
      panel === 'inventory' || panel === 'build' ? panel : this.status === 'ready' ? 'welcome-settings' : 'pause',
    );
    if (panel === 'inventory' || panel === 'build') $(panel).setAttribute('aria-expanded', 'true');
    $<HTMLDialogElement>(panel + '-menu').showModal();
  }
  closePanel(panel: Panel) {
    if (panel === 'inventory' || panel === 'build') $(panel).setAttribute('aria-expanded', 'false');
    $<HTMLDialogElement>(panel + '-menu').close();
    if (this.status === 'ready') this.returnFocus?.focus();
  }
  showWelcome(visible: boolean) {
    $('welcome').hidden = !visible;
  }
  setPortrait(image: string) {
    $<HTMLImageElement>('hud-avatar').src = image;
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
    const aquatic = model.aquatic;
    $('dive').hidden = !aquatic?.near || status !== 'play';
    const jumpLabel = aquatic?.active ? 'Nổi lên' : 'Nhảy';
    $('jump').querySelector('span')!.textContent = jumpLabel;
    $('jump').setAttribute('aria-label', aquatic?.active ? 'Giữ để bơi lên, nhấn ở mặt nước để nhảy ra' : 'Nhảy');
    $('water-status').hidden = !aquatic?.near || status !== 'play' || !$('toast').hidden;
    this.setText(
      'water-status',
      aquatic?.active
        ? aquatic.surfacing
          ? 'Hết hơi · Đang tự nổi lên!'
          : 'Bơi · Hơi thở ' + Math.ceil(aquatic.air) + ' giây · W / ↑ nổi · S / ↓ lặn'
        : 'Giữ S / ↓ hoặc nút Lặn để xuống nước',
    );
    this.setText(
      'effects',
      status === 'pause' ? 'TẠM DỪNG' : total + ' cá · ' + state.buildings.length + ' công trình',
    );
    if (this.location !== model.location && status === 'play') {
      this.location = model.location;
      $('chapter').hidden = false;
      window.clearTimeout(this.regionTimer);
      this.regionTimer = window.setTimeout(() => ($('chapter').hidden = true), 2600);
    }
    if (aquatic?.near && status === 'play') $('chapter').hidden = true;
    if (model.anchor) {
      if (this.anchorX !== model.anchor.x) {
        this.anchorX = model.anchor.x;
        document.documentElement.style.setProperty('--hud-context-x', model.anchor.x + '%');
      }
      if (this.anchorY !== model.anchor.y) {
        this.anchorY = model.anchor.y;
        document.documentElement.style.setProperty('--hud-context-y', model.anchor.y + '%');
      }
    }
    $('context-action').classList.toggle('unavailable', model.actionLabel === 'Tương tác');
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
    $<HTMLButtonElement>('action').disabled = Boolean(aquatic?.active);
    $('action').classList.toggle('bite', model.bite);
    $('cancel-action').hidden = !model.cancelVisible;
  }
  renderInventory(state: Save, portrait: string) {
    renderInventory(state, portrait, this.inventoryMenu);
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
    window.clearTimeout(this.regionTimer);
    this.closeAll();
  }
}
