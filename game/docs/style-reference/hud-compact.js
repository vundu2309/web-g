// Mockup độc lập: chỉ đổi bảng mẫu, không đọc/ghi localStorage hoặc gọi game.
const dialog = document.querySelector('.panel');
const content = document.querySelector('#panel-content');
const title = document.querySelector('#panel-title');
const names = {inventory: 'Kho đồ', build: 'Dựng trại', menu: 'Tạm dừng'};
let openedBy = null;

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#px-${name}"/></svg>`;
}

function inventory(tab) {
  const body = content.querySelector('.inventory-body');
  if (tab === 'equipment') {
    body.innerHTML = `<div class="equipment"><img src="./hud-compact-assets/figure.png" alt="Trang bị mặc định"/>
      <div><p>Mũ kiểm lâm</p><p>Áo vải dã ngoại</p><p>Quần leo núi</p><p>Balo vải bố</p></div></div>`;
    return;
  }
  if (tab === 'fish') {
    body.innerHTML = '<p>Chưa có cá trong túi.</p>';
    return;
  }
  const items = [
    ['wood', '24', 'Gỗ · 24'],
    ['stone', '16', 'Đá · 16'],
  ];
  body.innerHTML = `<div class="item-grid">${Array.from({length: 18}, (_, index) => {
    const item = items[index];
    return item
      ? `<button class="item" data-item="${item[2]}" aria-label="${item[2]}" aria-pressed="false">
      ${icon(item[0])}<b>${item[1]}</b></button>`
      : '<span class="item" aria-hidden="true"></span>';
  }).join('')}</div>`;
}

function openPanel(name, button) {
  if (dialog.open) dialog.close();
  openedBy = button;
  title.textContent = names[name];
  content.replaceChildren(document.querySelector('#' + name).content.cloneNode(true));
  if (name === 'inventory') inventory('materials');
  document
    .querySelectorAll('[data-panel]')
    .forEach((node) => node.setAttribute('aria-expanded', String(node === button)));
  dialog.showModal();
  dialog.querySelector('.close').focus();
}

document.querySelectorAll('[data-panel]').forEach((button) => {
  button.addEventListener('click', () => openPanel(button.dataset.panel, button));
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  document.querySelectorAll('[data-panel]').forEach((node) => node.setAttribute('aria-expanded', 'false'));
  openedBy?.focus();
});
content.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.classList.contains('resume')) dialog.close();
  if (button.dataset.tab) {
    content
      .querySelectorAll('[data-tab]')
      .forEach((node) => node.setAttribute('aria-pressed', String(node === button)));
    inventory(button.dataset.tab);
  }
  if (button.dataset.item) {
    content
      .querySelectorAll('[data-item]')
      .forEach((node) => node.setAttribute('aria-pressed', String(node === button)));
    content.querySelector('.panel-note').textContent = button.dataset.item;
  }
  if (button.dataset.demo === 'settings')
    content.querySelector('.panel-note').textContent = 'Bảng cài đặt chi tiết sẽ dùng giao diện game hiện có.';
  if (button.dataset.demo === 'region') {
    dialog.close();
    const region = document.querySelector('.region');
    region.hidden = false;
    window.setTimeout(() => {
      region.hidden = true;
    }, 2500);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.code !== 'KeyI' && event.code !== 'KeyB') return;
  event.preventDefault();
  const name = event.code === 'KeyI' ? 'inventory' : 'build';
  if (dialog.open && title.textContent === names[name]) dialog.close();
  else openPanel(name, document.querySelector(`[data-panel="${name}"]`));
});
for (const button of document.querySelectorAll('.touch-key')) {
  button.addEventListener('pointerdown', () => button.classList.add('held'));
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
    button.addEventListener(type, () => button.classList.remove('held'));
}
