import {palette} from '../data/palette';
import Phaser from 'phaser';
import {
  SpriteGalleryScene,
  galleryLayout,
  poseNames,
  poseLabels,
  type GalleryMode,
} from '../game/rendering/SpriteGalleryScene';
import './styles/gallery.css';
const stateOptions = () =>
  ['<option value="all">Tất cả</option>']
    .concat(poseNames.map((name) => `<option value="${name}">${poseLabels[name]}</option>`))
    .join('');
/** Dev-only review page behind import.meta.env.DEV; the production build never imports this module. */
export function openSpriteGallery() {
  for (const child of Array.from(document.body.children)) {
    if (child instanceof HTMLElement) child.hidden = true;
  }
  document.documentElement.classList.add('sprite-review-root');
  document.body.classList.add('sprite-review-page');
  document.title = 'Pixel Forest · Xưởng pixel';
  const root = document.createElement('main');
  root.className = 'sprite-review';
  root.innerHTML = `
    <header class="review-heading"><div><small>PIXEL FOREST / XƯỞNG PIXEL</small>
      <h1>Một người bạn đường.</h1>
      <p>Nhân vật 24 × 32 pixel nghệ thuật · công trình và tài nguyên cùng lưới</p></div>
      <a href="./">← Trở lại game</a>
    </header>
    <section class="review-toolbar" aria-label="Điều khiển xem trước">
      <label>Hiển thị <select id="review-mode">
        <option value="camper">Nhân vật</option>
        <option value="props">Công trình và tài nguyên</option></select></label>
      <label>Mật độ pixel <select id="review-density"><option value="standard">24 × 32 · chuẩn</option>
        <option value="detail">48 × 64 · so sánh</option></select></label>
      <label>Trạng thái <select id="review-state">${stateOptions()}</select></label>
      <label>Tốc độ <select id="review-speed"><option value="0.5">0,5×</option>
        <option value="1" selected>1×</option>
        <option value="2">2×</option></select></label>
      <label>Bộ trang bị <select id="review-outfit"><option value="0">Màu đất trước</option>
        <option value="1">Màu rừng trước</option></select></label>
      <button id="review-pause" aria-pressed="false">Tạm dừng</button><button id="review-flip">Đổi hướng</button>
    </section>
    <p class="review-spec" id="review-spec"></p>
    <div id="sprite-review-stage" aria-label="Xem trước sprite và animation"></div>
    <footer class="review-footer"><b>Xưởng pixel · chỉ có trong bản phát triển</b><p>Bản phát triển dùng để duyệt hình. Trò chơi thật không tải trang này.</p></footer>`;
  document.body.append(root);
  const host = root.querySelector<HTMLElement>('#sprite-review-stage')!;
  const spec = root.querySelector<HTMLElement>('#review-spec')!;
  const stageWidth = () => {
    const measured = host.clientWidth || root.clientWidth - 32 || window.innerWidth - 32;
    return Math.max(280, Math.floor(Math.min(1120, measured)));
  };
  const width = stageWidth();
  const mode: GalleryMode = 'camper';
  const applyHeight = (height: number) => {
    host.style.height = height + 'px';
  };
  applyHeight(galleryLayout(mode, width).height);
  const scene = new SpriteGalleryScene();
  scene.onLayout = applyHeight;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width,
    height: galleryLayout(mode, width).height,
    backgroundColor: palette.ink,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {mode: Phaser.Scale.NONE},
    scene,
  });
  const updateSpec = () => {
    spec.textContent =
      scene.mode === 'camper'
        ? 'Chuẩn 24 × 32: mỗi ô vuông là 2 đơn vị · 48 × 64 chỉ để so sánh, không dùng trong trò chơi.'
        : 'Công trình 55 × 37 ô (110 × 74 đơn vị) · gỗ và đá 16 × 12 ô · cùng lưới pixel với nhân vật.';
  };
  updateSpec();
  const abort = new AbortController();
  const on = (id: string, type: string, callback: (event: Event) => void) =>
    root.querySelector('#' + id)!.addEventListener(type, callback, {signal: abort.signal});
  on('review-mode', 'change', (event) => {
    scene.mode = (event.target as HTMLSelectElement).value === 'props' ? 'props' : 'camper';
    scene.state = 'all';
    scene.build();
    updateSpec();
  });
  on('review-density', 'change', (event) => {
    scene.detailed = (event.target as HTMLSelectElement).value === 'detail';
    scene.refreshOutfits();
  });
  on('review-state', 'change', (event) => {
    const state = (event.target as HTMLSelectElement).value;
    scene.state = state === 'all' ? 'all' : (poseNames.find((name) => name === state) ?? 'all');
  });
  on('review-speed', 'change', (event) => {
    scene.speed = Number((event.target as HTMLSelectElement).value);
  });
  on('review-outfit', 'change', (event) => {
    scene.outfit = Number((event.target as HTMLSelectElement).value);
    scene.refreshOutfits();
  });
  on('review-pause', 'click', () => {
    scene.paused = !scene.paused;
    const button = root.querySelector('#review-pause')!;
    button.textContent = scene.paused ? 'Tiếp tục' : 'Tạm dừng';
    button.setAttribute('aria-pressed', String(scene.paused));
  });
  on('review-flip', 'click', () => scene.flip());
  window.addEventListener(
    'pagehide',
    () => {
      abort.abort();
      game.destroy(true);
    },
    {once: true},
  );
  return game;
}
