/**
 * Đổi trang bị của save thành `RigOutfit`: hình dáng theo bốn hình dáng có sẵn, màu theo món đang mặc.
 * Món mua thêm (thám hiểm, đỉnh núi) không có hình riêng nên mượn hình dáng gốc cùng slot; màu vẫn là của món.
 * Thuần, không Phaser.
 */
import type {RigOutfit, RigPiece} from './types.ts';

export type WearSlot = 'hat' | 'shirt' | 'pants' | 'backpack';

export interface WearItem {
  readonly id: string;
  readonly slot: WearSlot;
  readonly color: string;
}

/** Hai hình dáng gốc của mỗi slot, khớp `camperRig` (hình dáng hat-ranger/hat-knit, v.v.). */
export const STARTER_SHAPES: Readonly<Record<WearSlot, readonly [string, string]>> = {
  hat: ['hat-ranger', 'hat-knit'],
  shirt: ['shirt-linen', 'shirt-pine'],
  pants: ['pants-trail', 'pants-denim'],
  backpack: ['bag-canvas', 'bag-moss'],
};

/** Hình dáng của một món: món gốc giữ nguyên; món mua thêm "đỉnh núi" dùng hình thứ hai, còn lại dùng hình thứ nhất. */
export function shapeOf(slot: WearSlot, id: string): string {
  const [first, second] = STARTER_SHAPES[slot];
  if (id === first || id === second) return id;
  return id.endsWith('-summit') ? second : first;
}

/** Trang bị đang mặc thành bộ xương; thiếu món thì rơi về món gốc đầu tiên của slot. */
export function outfitOf(equipped: Readonly<Record<WearSlot, string>>, items: readonly WearItem[]): RigOutfit {
  const piece = (slot: WearSlot): RigPiece => {
    const item = items.find((entry) => entry.slot === slot && entry.id === equipped[slot]);
    const fallback = items.find((entry) => entry.slot === slot && entry.id === STARTER_SHAPES[slot][0]);
    const picked = item ?? fallback;
    if (!picked) throw new Error('camperRig: thiếu món gốc cho ' + slot);
    return {id: shapeOf(slot, picked.id), color: picked.color};
  };
  return {hat: piece('hat'), shirt: piece('shirt'), pants: piece('pants'), bag: piece('backpack')};
}

/** Mọi tổ hợp của bốn hình dáng gốc (2 × 2 × 2 × 2 = 16), mỗi món lấy màu từ `items`; bỏ qua tổ hợp thiếu món. */
export function starterOutfits(items: readonly WearItem[]): RigOutfit[] {
  const pick = (slot: WearSlot) => items.filter((item) => item.slot === slot && STARTER_SHAPES[slot].includes(item.id));
  const outfits: RigOutfit[] = [];
  for (const hat of pick('hat'))
    for (const shirt of pick('shirt'))
      for (const pants of pick('pants'))
        for (const bag of pick('backpack'))
          outfits.push({
            hat: {id: hat.id, color: hat.color},
            shirt: {id: shirt.id, color: shirt.color},
            pants: {id: pants.id, color: pants.color},
            bag: {id: bag.id, color: bag.color},
          });
  return outfits;
}
