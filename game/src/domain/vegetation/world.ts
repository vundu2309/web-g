/** Khoảng theo x thế giới (đơn vị thế giới). */
export interface Span {
  x: number;
  width: number;
}

/** Dữ liệu thế giới mà thực vật cần, tách khỏi Phaser và khỏi data/world để test thuần. */
export interface VegetationWorld {
  width: number;
  zoneWidth: number;
  zones: number;
  pineZones?: readonly number[];
  spawnX: number;
  groundAt(x: number): number;
  /** Y của mặt nước tại x, hoặc null nếu không có nước. */
  waterTopAt(x: number): number | null;
  waterBedAt?(x: number): number;
  seaFrom?: number;
  coastFrom?: number;
  lakes: readonly Span[];
  /** Khoảng cấm cho cây và đá: thác, cổng vòm. */
  landmarks: readonly Span[];
  /** x của các nút tài nguyên (gỗ/đá nhặt được). */
  nodes: readonly number[];
}

export function inSpan(x: number, span: Span, margin = 0) {
  return x >= span.x - margin && x <= span.x + span.width + margin;
}

export function inAnySpan(x: number, spans: readonly Span[], margin = 0) {
  return spans.some((span) => inSpan(x, span, margin));
}

export function nearAny(x: number, xs: readonly number[], radius: number) {
  return xs.some((value) => Math.abs(value - x) < radius);
}

export function zoneOf(world: VegetationWorld, x: number) {
  return Math.max(0, Math.min(world.zones - 1, Math.floor(x / world.zoneWidth)));
}
