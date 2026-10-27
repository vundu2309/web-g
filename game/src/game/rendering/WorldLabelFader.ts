import type Phaser from 'phaser';
import {approachAlpha, worldLabelTarget, type LabelBox} from '../../domain/fishingLabels.ts';

/** Nhãn chữ trong thế giới (tên vùng, tên hồ) mờ dần khi chồng lên HUD câu cá; không nhấp nháy. */
export class WorldLabelFader {
  private readonly alphas: number[];

  constructor(private readonly labels: readonly Phaser.GameObjects.Text[]) {
    this.alphas = labels.map(() => 1);
  }

  /** `hud` là các khối HUD câu cá đang hiện (rỗng khi không câu); `dt` là giây game từ khung trước. */
  update(hud: readonly LabelBox[], dt: number) {
    this.labels.forEach((label, i) => {
      const bounds = label.getBounds();
      const next = approachAlpha(this.alphas[i], worldLabelTarget(bounds, hud), dt);
      this.alphas[i] = next;
      label.setAlpha(next);
    });
  }
}
