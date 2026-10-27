/** Vùng thế giới rộng 3200 đơn vị; quanh mỗi ranh giới giá trị được nội suy trong 320 đơn vị mỗi bên. */
export const REGION_WIDTH = 3200;
export const REGION_BLEND = 320;
export const REGION_COUNT = 10;

/** Giá trị theo vùng tại x: đứng yên trong vùng, nội suy tuyến tính quanh ranh giới nên liên tục. */
export function regionValue(x: number, values: readonly number[]) {
  const clamped = Math.max(0, Math.min(REGION_WIDTH * values.length - 1, x));
  const zone = Math.floor(clamped / REGION_WIDTH);
  const local = clamped - zone * REGION_WIDTH;
  const span = 2 * REGION_BLEND;
  if (zone > 0 && local < REGION_BLEND) {
    return lerp(values[zone - 1], values[zone], (local + REGION_BLEND) / span);
  }
  if (zone < values.length - 1 && local > REGION_WIDTH - REGION_BLEND) {
    return lerp(values[zone], values[zone + 1], (local - (REGION_WIDTH - REGION_BLEND)) / span);
  }
  return values[zone];
}

/** Màu theo vùng từ ba mảng kênh đã tách (xem splitChannels); không cấp phát mảng. */
export function regionColor(x: number, red: readonly number[], green: readonly number[], blue: readonly number[]) {
  const r = Math.round(regionValue(x, red));
  const g = Math.round(regionValue(x, green));
  const b = Math.round(regionValue(x, blue));
  return (r << 16) | (g << 8) | b;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
