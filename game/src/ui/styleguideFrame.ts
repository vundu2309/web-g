import {newSave} from '../domain/camping';
import {outfitOf} from '../domain/camperRig/wear';
import {buildCamperFrames} from '../domain/camperRig/build';
import {PORTRAIT_CROP} from '../data/portrait';
import {frameDataUrl} from '../game/rendering/frameImage';
import {spriteLayersDataUrl} from '../game/rendering/spriteImage';
import {buildingSprites, buildingGlows} from '../data/sprites/buildings';
import {gear, type BuildingKind} from '../data/catalog';
import {GameUI} from './GameUI';
import {activityMarkup} from './ActivityUI';
import {chestMarkup} from './ChestUI';

/** Chuẩn bị bằng GameUI thật trước khi ẩn DOM; iframe dùng nguyên HTML + CSS, không nạp game hoặc lưu tiến trình. */
export function prepareSamples() {
  const state = newSave();
  state.fishBag = [{id: 'carp', length: 40}];
  const frame = buildCamperFrames(outfitOf(state.equipped, gear)).frames.idle[0];
  const ui = new GameUI();
  ui.setPortrait(frameDataUrl(frame, 3, PORTRAIT_CROP));
  ui.renderInventory(state, frameDataUrl(frame, 8));
  const images = {} as Record<BuildingKind, string>;
  for (const kind of Object.keys(buildingSprites) as BuildingKind[]) {
    const layers = [{def: buildingSprites[kind], frame: 0}];
    const glow = buildingGlows[kind];
    if (glow) layers.push({def: glow, frame: 0});
    images[kind] = spriteLayersDataUrl(layers, {}, 8);
  }
  ui.renderRecipes(state, images);
  ui.renderHUD({
    state,
    status: 'play',
    location: 'THUNG LŨNG AO SEN',
    actionLabel: 'Tương tác',
    bite: false,
    cancelVisible: false,
  });
  const html = document.body.innerHTML.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  ui.dispose();
  return {html, state};
}

export function sampleFrame(host: HTMLElement, samples: ReturnType<typeof prepareSamples>) {
  const iframe = document.createElement('iframe');
  iframe.title = 'Mẫu UI thật · không lưu tiến trình';
  iframe.style.width = '100%';
  iframe.style.height = '680px';
  iframe.style.border = 'var(--border)';
  // Chỉ cùng origin để thao tác mẫu, không có script trong srcdoc.
  iframe.srcdoc = `<!doctype html><html lang="vi"><head><link rel="stylesheet" href="/src/style.css"></head>
    <body>${samples.html}</body></html>`;
  const toolbar = document.createElement('nav');
  toolbar.className = 'review-toolbar';
  const names = [
    'Màn chào',
    'HUD',
    'Kho đồ',
    'Dựng trại',
    'Tạm dừng',
    'Cài đặt',
    'Cửa hàng',
    'Nấu ăn',
    'Rương',
    'Toast',
  ];
  const show = (index: number) => {
    const doc = iframe.contentDocument;
    if (!doc) return;
    for (const dialog of Array.from(doc.querySelectorAll('dialog'))) dialog.close();
    const get = (id: string) => doc.getElementById(id)!;
    get('welcome').hidden = index !== 0;
    get('toast').hidden = index !== 9;
    get('toast').textContent = 'Đã chuyển vật phẩm.';
    if (index >= 2 && index <= 5) {
      const id = ['inventory', 'build', 'pause', 'settings'][index - 2];
      (get(id + '-menu') as HTMLDialogElement).showModal();
    }
    if (index >= 6 && index <= 8) {
      get('activity-title').textContent = names[index];
      get('activity-body').innerHTML =
        index === 8
          ? chestMarkup(samples.state, 'sample')
          : activityMarkup(samples.state, index === 6 ? 'shop' : 'cook', true, 'sell');
      (get('activity-menu') as HTMLDialogElement).showModal();
    }
  };
  names.forEach((name, index) => {
    const button = document.createElement('button');
    button.textContent = name;
    button.addEventListener('click', () => show(index));
    toolbar.append(button);
  });
  iframe.addEventListener('load', () => {
    const doc = iframe.contentDocument;
    doc?.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !('closest' in target) || typeof target.closest !== 'function') return;
      const tab = target.closest('[data-inventory-tab]') as HTMLButtonElement | null;
      if (!tab) return;
      for (const button of Array.from(doc.querySelectorAll<HTMLButtonElement>('[data-inventory-tab]')))
        button.setAttribute('aria-pressed', String(button === tab));
      for (const name of ['materials', 'equipment', 'fish'])
        doc.getElementById(name + '-panel')!.hidden = name !== tab.dataset.inventoryTab;
    });
    show(1);
  });
  host.append(toolbar, iframe);
}
