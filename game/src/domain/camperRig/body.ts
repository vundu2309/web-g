/** Hộp va chạm của bộ xương (pixel nghệ thuật): rộng 12 ô (24 đơn vị), cao 37 ô (74 đơn vị), đáy đúng hàng chân. Thuần. */
import {FRAME_W} from './types.ts';
import {FEET_EDGE} from './sheet.ts';

export const BODY_WIDTH = 12;
export const BODY_HEIGHT = 37;

export interface BodyBox {
  /** Lệch góc trên-trái của hộp so với góc khung, theo pixel nghệ thuật. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Hộp căn giữa khung theo trục thân, đáy nằm đúng bờ dưới hàng chân (`FEET_EDGE`). */
export function bodyBox(): BodyBox {
  return {x: (FRAME_W - BODY_WIDTH) / 2, y: FEET_EDGE - BODY_HEIGHT, width: BODY_WIDTH, height: BODY_HEIGHT};
}
