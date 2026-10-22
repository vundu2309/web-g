export interface SpriteAnimation {
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}
export interface SpriteDefinition {
  name: string;
  width: number;
  height: number;
  colors: Readonly<Record<string, string>>;
  frames: readonly (readonly string[])[];
  animations: Readonly<Record<string, SpriteAnimation>>;
}
export interface CompiledSprite {
  width: number;
  height: number;
  frames: Uint8ClampedArray[];
}
export type SpritePalette = Readonly<Record<string, string>>;
function rgba(value: string, context: string) {
  if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(value)) throw new Error(context + ': màu không hợp lệ ' + value);
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
    value.length === 9 ? parseInt(value.slice(7, 9), 16) : 255,
  ];
}
/** Pure grid compiler. Dots are transparent; all nontransparent glyphs resolve through named palette roles. */
export function compileSprite(
  def: SpriteDefinition,
  palette: SpritePalette,
  slotColors: SpritePalette = {},
): CompiledSprite {
  if (!Number.isInteger(def.width) || !Number.isInteger(def.height) || def.width <= 0 || def.height <= 0) {
    throw new Error(def.name + ': kích thước phải là số nguyên dương');
  }
  if (!def.frames.length) throw new Error(def.name + ': chưa có frame');
  const frames = def.frames.map((rows, frame) => {
    const context = def.name + ', frame ' + (frame + 1);
    if (rows.length !== def.height) throw new Error(context + ': sai số dòng');
    const pixels = new Uint8ClampedArray(def.width * def.height * 4);
    rows.forEach((row, y) => {
      const location = context + ', dòng ' + (y + 1);
      if (row.length !== def.width) throw new Error(location + ': cần ' + def.width + ' cột, có ' + row.length);
      for (let x = 0; x < def.width; x++) {
        const glyph = row[x];
        if (glyph === '.') continue;
        const role = def.colors[glyph];
        if (!role) throw new Error(location + ', cột ' + (x + 1) + ': ký tự lạ "' + glyph + '"');
        const color = slotColors[role] ?? palette[role];
        if (!color) throw new Error(location + ': không có màu palette "' + role + '"');
        pixels.set(rgba(color, location), (y * def.width + x) * 4);
      }
    });
    return pixels;
  });
  for (const [name, animation] of Object.entries(def.animations)) {
    if (!animation.frames.length || !Number.isFinite(animation.frameRate) || animation.frameRate <= 0) {
      throw new Error(def.name + ': animation không hợp lệ ' + name);
    }
    for (const frame of animation.frames) {
      if (!Number.isInteger(frame) || frame < 0 || frame >= frames.length) {
        throw new Error(def.name + ': animation ' + name + ' trỏ tới frame không có ' + frame);
      }
    }
  }
  return {width: def.width, height: def.height, frames};
}
export function animationFrame(animation: SpriteAnimation, clock: number) {
  const index = Math.max(0, Math.floor(clock * animation.frameRate));
  const length = animation.frames.length;
  return animation.frames[animation.repeat < 0 ? index % length : Math.min(index, length - 1)];
}
