import {tileAtlas} from '../domain/tilemap/atlas';

/** Atlas natif 16px, phóng nguyên 3×; cuộn cục bộ giống xưởng nhân vật. */
export function mountTileAtlas(host: HTMLElement) {
  const tiles = tileAtlas();
  for (let row = 0; row < 10; row++) {
    const group = tiles.slice(row * 16, (row + 1) * 16);
    if (!group.length) break;
    const heading = document.createElement('h3');
    heading.textContent = row < 7 ? group[0].name + ' · mask cạnh 0–15' : 'Tường nền và nước tầng 0–2';
    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    const canvas = document.createElement('canvas');
    canvas.width = group.length * 54;
    canvas.height = 48;
    const context = canvas.getContext('2d')!;
    context.imageSmoothingEnabled = false;
    const native = document.createElement('canvas');
    native.width = native.height = 16;
    const source = native.getContext('2d')!;
    group.forEach((tile, index) => {
      source.putImageData(new ImageData(new Uint8ClampedArray(tile.rgba), 16, 16), 0, 0);
      context.drawImage(native, index * 54, 0, 48, 48);
    });
    wrap.append(canvas);
    host.append(heading, wrap);
  }
}
