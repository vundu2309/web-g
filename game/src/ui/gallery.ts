import {palette} from '../data/palette';
import Phaser from 'phaser';
import {SpriteGalleryScene, galleryLayout, type GalleryLayer} from '../game/rendering/SpriteGalleryScene';
import {mountRigGallery} from './CamperRigGallery';
import './styles/gallery.css';

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
      <p>Bộ xương nhân vật 36 × 48 pixel nghệ thuật · công trình (thân và lớp phát sáng) và tài nguyên cùng lưới</p></div>
      <nav><a href="./">← Trở lại game</a> · <a href="?styleguide">Sổ tay giao diện</a></nav>
    </header>
    <section class="review-toolbar" aria-label="Điều khiển xem trước">
      <label>Hiển thị <select id="review-mode">
        <option value="rig">Bộ xương nhân vật</option>
        <option value="props">Công trình và tài nguyên</option></select></label>
      <label>Tốc độ <select id="review-speed"><option value="0.5">0,5×</option>
        <option value="1" selected>1×</option>
        <option value="2">2×</option></select></label>
      <label>Phóng <select id="review-zoom"><option value="1">1×</option>
        <option value="3" selected>3×</option><option value="6">6×</option></select></label>
      <label>Lớp <select id="review-layer"><option value="both" selected>Ghép thân và sáng</option>
        <option value="body">Chỉ thân</option><option value="glow">Chỉ phần phát sáng</option></select></label>
      <label>Nền <select id="review-night"><option value="day" selected>Ngày</option>
        <option value="night">Đêm</option></select></label>
      <button id="review-pause" aria-pressed="false">Tạm dừng</button><button id="review-flip">Đổi hướng</button>
    </section>
    <div id="sprite-review-stage" aria-label="Xem trước công trình và animation"></div>
    <footer class="review-footer"><b>Xưởng pixel · chỉ có trong bản phát triển</b><p>Bản phát triển dùng để duyệt hình. Trò chơi thật không tải trang này.</p></footer>`;
  document.body.append(root);
  const host = root.querySelector<HTMLElement>('#sprite-review-stage')!;
  const stageWidth = () => {
    const measured = host.clientWidth || root.clientWidth - 32 || window.innerWidth - 32;
    return Math.max(280, Math.floor(Math.min(1120, measured)));
  };
  const width = stageWidth();
  const applyHeight = (height: number) => {
    host.style.height = height + 'px';
  };
  applyHeight(galleryLayout(width).height);
  const scene = new SpriteGalleryScene();
  scene.onLayout = applyHeight;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width,
    height: galleryLayout(width).height,
    backgroundColor: palette.ink,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {mode: Phaser.Scale.NONE},
    scene,
  });
  const abort = new AbortController();
  const on = (id: string, type: string, callback: (event: Event) => void) =>
    root.querySelector('#' + id)!.addEventListener(type, callback, {signal: abort.signal});
  const rig = mountRigGallery(root);
  const toolbar = root.querySelector<HTMLElement>('.review-toolbar')!;
  const modeSelect = root.querySelector<HTMLElement>('#review-mode')!;
  on('review-mode', 'change', (event) => {
    const rigMode = (event.target as HTMLSelectElement).value === 'rig';
    for (const child of Array.from(toolbar.children)) {
      (child as HTMLElement).hidden = rigMode && !child.contains(modeSelect);
    }
    host.hidden = rigMode;
    if (rigMode) return rig.show();
    rig.hide();
    scene.build();
  });
  modeSelect.dispatchEvent(new Event('change'));
  on('review-speed', 'change', (event) => {
    scene.speed = Number((event.target as HTMLSelectElement).value);
  });
  on('review-zoom', 'change', (event) => scene.setZoom(Number((event.target as HTMLSelectElement).value)));
  on('review-layer', 'change', (event) => {
    scene.setLayer((event.target as HTMLSelectElement).value as GalleryLayer);
  });
  on('review-night', 'change', (event) => scene.setNight((event.target as HTMLSelectElement).value === 'night'));
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
