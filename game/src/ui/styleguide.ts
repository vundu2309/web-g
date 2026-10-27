import {palette} from '../data/palette';
import {vegetationPalette} from '../data/palette/vegetation';
import {uiPalette} from '../data/palette/ui';
import {camperRigPalette} from '../data/palette/camperRig';
import * as backdrop from '../data/backdropTones';
import tokens from './styles/tokens.css?raw';
import {prepareSamples, sampleFrame} from './styleguideFrame';
import {mountFishingMeters} from './styleguideMeters';
import {mountTileAtlas} from './styleguideTiles';
import './styles/gallery.css';

const MARKER = 'PIXEL_FOREST_STYLEGUIDE_DEV_ONLY';
/** Mẫu từ nguồn thật, tên và màu đều là text node; không có CSS riêng hoặc logic gameplay. */
function swatches(host: HTMLElement, title: string, entries: [string, string][]) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = `${title} · ${entries.length} màu`;
  details.append(summary);
  for (const [name, color] of entries) {
    const row = document.createElement('div');
    row.className = 'trade-row';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.classList.add('pixel-icon');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('aria-hidden', 'true');
    const rect = document.createElementNS(icon.namespaceURI, 'rect');
    rect.setAttribute('width', '16');
    rect.setAttribute('height', '16');
    rect.setAttribute('fill', color);
    icon.append(rect);
    const label = document.createElement('span');
    label.textContent = `${name} · ${color}`;
    row.append(icon, label);
    details.append(row);
  }
  host.append(details);
}

function backdropEntries(): [string, string][] {
  const out: [string, string][] = [];
  const visit = (name: string, value: unknown) => {
    if (typeof value === 'number') out.push([name, '#' + value.toString(16).padStart(6, '0')]);
    else if (Array.isArray(value)) value.forEach((v: unknown, i: number) => visit(name + '[' + i + ']', v));
  };
  for (const [name, value] of Object.entries(backdrop)) {
    if (Array.isArray(value)) visit(name, value);
  }
  return out;
}

export function openStyleguide() {
  const samples = prepareSamples();
  for (const child of Array.from(document.body.children)) {
    if (child instanceof HTMLElement) child.hidden = true;
  }
  document.documentElement.classList.add('sprite-review-root');
  document.body.classList.add('sprite-review-page');
  document.title = 'Pixel Forest · Sổ tay giao diện';
  const root = document.createElement('main');
  root.className = 'sprite-review';
  root.dataset.devMarker = MARKER;
  root.innerHTML = `<header class="review-heading"><div><small>PIXEL FOREST / SỔ TAY GIAO DIỆN</small>
    <h1>Cùng một khu rừng.</h1><p>Token, bảng màu và thành phần thật · chỉ trong bản phát triển.</p></div>
    <nav><a href="./">Về game</a> · <a href="?gallery">Xưởng pixel →</a></nav></header>
    <article class="camp-dialog"><section class="review-toolbar"><button class="primary">Nút chính</button><button>Nút phụ</button>
    <button class="quiet">Nút nhẹ</button><button disabled>Đã khóa</button>
    <button aria-pressed="true">Đang chọn</button><button class="held">Đang nhấn</button></section></article>
    <p class="review-spec">Di chuột để xem hover. Nhấn Tab để xem focus-visible, giữ chuột để xem pressed.
    Nút nguy hiểm, biểu mẫu tài khoản và phòng co-op mới là quy ước trong DESIGN, chưa có component riêng.</p>
    <article class="camp-dialog"><h1>Tiêu đề lớn</h1><h2>Một ngày bên hồ</h2><h3>Trang bị của bạn</h3>
    <p>Gỗ · Đá · câu cá · ế ệ ễ ự — Nunito có dấu tiếng Việt.</p><small>CHÚ THÍCH</small></article>
    <h2>Bảng màu theo vai trò</h2><div data-colors></div>
    <h2>Thành phần DOM thật</h2><p class="review-spec">Khung dưới giữ class, ID và stylesheet của game.
    Nút trong mẫu không giao dịch hoặc lưu dữ liệu. Esc đóng hộp thoại của mẫu.</p><section data-samples></section>
    <h2>Thanh câu cá trong canvas</h2><p class="review-spec">Trên: dây bình thường. Dưới: cảnh báo căng dây. Thanh xanh là tiến độ kéo.</p><section data-meters></section>
    <h2>Ô 16 × 16 và autotile</h2><p class="review-spec">Mask: trên 1, dưới 2, trái 4, phải 8.
    Mỗi loại có đủ 16 tổ hợp; cuộn ngang để xem. Air trong suốt là chủ ý.</p><section data-atlas></section>
    <footer class="review-footer"><p><a href="?gallery">Duyệt nhân vật, neo và công trình thân/glow →</a></p>
    <p>Mẫu canvas theo CampRenderer.drawTension; vị trí theo neo xem trong game thật. Quy tắc ở docs/STYLE.md và docs/DESIGN.md.</p></footer>`;
  document.body.append(root);
  const host = root.querySelector<HTMLElement>('[data-colors]')!;
  const computed = getComputedStyle(document.documentElement);
  const cssColors = [...tokens.matchAll(/(--[\w-]+):/g)]
    .map((m) => [m[1], computed.getPropertyValue(m[1]).trim()] as [string, string])
    .filter(([, value]) => /^(?:#|rgba?\()/i.test(value));
  swatches(host, 'Token màu CSS (kể cả alpha và alias)', cssColors);
  const entries = Object.entries(palette);
  const groups: [string, (name: string) => boolean][] = [
    ['Ô, đất, nước và quặng', (n) => /^(terrain|ore|crystal|water)/.test(n)],
    ['Nền theo giờ và năm vùng', (n) => n.startsWith('bg') || n.startsWith('soil')],
    ['Thực vật', (n) => Object.hasOwn(vegetationPalette, n)],
    ['Nhân vật', (n) => n.startsWith('camper') || n.startsWith('rod') || n.startsWith('gear')],
    ['Công trình', (n) => n.startsWith('struct')],
    ['Ánh sáng', (n) => n.startsWith('light')],
  ];
  const covered = new Set<string>();
  for (const [title, matches] of groups) {
    const subset = entries.filter(([name]) => matches(name));
    subset.forEach(([name]) => covered.add(name));
    swatches(host, title, subset);
  }
  swatches(
    host,
    'UI và màu gốc/legacy còn giữ',
    entries.filter(([name]) => !covered.has(name)),
  );
  swatches(host, 'Vai trò bộ xương', Object.entries(camperRigPalette));
  swatches(host, 'Công cụ xem mẫu', Object.entries(uiPalette));
  swatches(host, 'Bảng phối nền ngày / hoàng hôn / đêm', backdropEntries());
  sampleFrame(root.querySelector<HTMLElement>('[data-samples]')!, samples);
  mountFishingMeters(root.querySelector<HTMLElement>('[data-meters]')!);
  mountTileAtlas(root.querySelector<HTMLElement>('[data-atlas]')!);
  return root;
}
