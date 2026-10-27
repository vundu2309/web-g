/** Hình chữ nhật theo đơn vị thế giới (gốc trên-trái). Không phụ thuộc Phaser. */
export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Độ mờ của nhãn thế giới khi chồng lên HUD câu cá. */
export const DIMMED_ALPHA = 0.25;
/** Khoảng đệm quanh HUD câu cá khi xét chồng, để hai nhãn sát nhau cũng được mờ. */
const OVERLAP_GAP = 4;
/** Hằng số thời gian (giây game) của việc mờ dần: đủ mượt, không nhấp nháy khi đi qua mép chồng. */
const FADE_SECONDS = 0.18;

export function boxesOverlap(a: LabelBox, b: LabelBox, gap = 0) {
  return (
    a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap
  );
}

/**
 * Alpha đích của một nhãn thế giới: mờ khi chồng lên bất kỳ khối HUD câu cá nào (nhãn, thanh lực), bằng 1 khi không.
 * Không HUD (không câu) thì luôn bằng 1. Chỉ xét chồng thật, nên nhãn xa nhân vật không đổi.
 */
export function worldLabelTarget(label: LabelBox, fishingHud: readonly LabelBox[]) {
  for (const box of fishingHud) if (boxesOverlap(label, box, OVERLAP_GAP)) return DIMMED_ALPHA;
  return 1;
}

/** Tiến alpha hiện tại về đích theo hàm mũ; dt là giây game đã trôi qua từ khung trước. */
export function approachAlpha(current: number, target: number, dt: number) {
  if (!(dt > 0)) return current;
  const step = 1 - Math.exp(-dt / FADE_SECONDS);
  return current + (target - current) * step;
}

/** Khoảng cách (đơn vị thế giới) từ đỉnh mũ tới đáy nhãn câu cá đặt phía trên đầu. */
export const LABEL_GAP = 14;

/** Đáy nhãn câu cá: đặt LABEL_GAP phía trên đỉnh mũ của frame hiện tại, nên nhãn theo đúng mũ đang đội. */
export function fishLabelBottom(headTopY: number) {
  return headTopY - LABEL_GAP;
}
