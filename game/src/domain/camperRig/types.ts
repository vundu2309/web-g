/** Bộ xương nhân vật: kích thước khung, tham số tư thế và kiểu dữ liệu frame. Thuần, không Phaser. */
import type {FaceVariant} from '../../data/camperHead.ts';

export const FRAME_W = 36;
export const FRAME_H = 48;
/** Hàng đáy của giày khi nhân vật đứng trên mặt đất (chỉ số hàng, tính từ 0). */
export const GROUND_ROW = 45;
/** Cột hông: nhân vật đứng giữa khung, hướng về bên phải. */
export const CENTER_X = 17;

export const RIG_STATES = [
  'idle',
  'run',
  'jump',
  'fall',
  'land',
  'cast',
  'fish-wait',
  'bite',
  'reel',
  'gather',
  'build',
  'swim',
  'dive',
] as const;
export type RigState = (typeof RIG_STATES)[number];

/** Số frame mỗi trạng thái, khớp `PoseMachine` (tổng 46). */
export const RIG_FRAME_COUNTS: Readonly<Record<RigState, number>> = {
  idle: 4,
  run: 8,
  jump: 2,
  fall: 2,
  land: 2,
  cast: 4,
  'fish-wait': 3,
  bite: 3,
  reel: 4,
  gather: 3,
  build: 3,
  swim: 4,
  dive: 4,
};

/** Vai trò màu cố định của nhân vật; mỗi vai trò map sang một tên trong `data/palette/camperRig.ts`. */
export const FIXED_ROLES = [
  'skin0',
  'skin1',
  'skin2',
  'skin3',
  'hair0',
  'hair1',
  'hair2',
  'hair3',
  'boot0',
  'boot1',
  'boot2',
  'boot3',
  'sole',
  'eye',
  'mouth',
  'blush',
  'leather',
  'gold',
  'glint',
  'pom',
  'rod0',
  'rod1',
  'rod2',
  'rodTip',
] as const;
/** Bốn tông (0 sáng nhất … 3 tối nhất) cho mỗi món trang bị, suy từ màu `gear` qua `toneRamp`. */
export const OUTFIT_ROLES = [
  'hat0',
  'hat1',
  'hat2',
  'hat3',
  'shirt0',
  'shirt1',
  'shirt2',
  'shirt3',
  'pants0',
  'pants1',
  'pants2',
  'pants3',
  'bag0',
  'bag1',
  'bag2',
  'bag3',
] as const;
export const RIG_ROLES = [...FIXED_ROLES, ...OUTFIT_ROLES] as const;
export type RigRole = (typeof RIG_ROLES)[number];
export type RigPalette = Readonly<Record<RigRole, string>>;

/** Trang bị bốn slot, mỗi slot là một màu hex trong `gear`. */
export interface RigPiece {
  /** Id trong `gear`, quyết định HÌNH DÁNG. */
  readonly id: string;
  /** Màu hex trong `gear`, quyết định TÔNG. */
  readonly color: string;
}

export interface RigOutfit {
  readonly hat: RigPiece;
  readonly shirt: RigPiece;
  readonly pants: RigPiece;
  readonly bag: RigPiece;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Góc đo từ phương thẳng đứng (dương = về phía trước), đơn vị độ. */
export interface LimbPose {
  /** Góc đùi (hoặc góc vai). */
  readonly t: number;
  /** Độ gập gối (hoặc khuỷu): cẳng = t - f. */
  readonly f: number;
}
export interface ArmPose {
  readonly a: number;
  readonly f: number;
}

/** Góc cần đo từ phương ngang (dương = lên, âm = xuống), chiều dài tính bằng pixel nghệ thuật. */
export interface RodPose {
  readonly angle: number;
  readonly length: number;
}

/** Biến thể mặt: mỗi biến thể có lưới đầu riêng trong `data/camperHead.ts`. */
export type FacePose = FaceVariant;

export interface PoseParams {
  /** Độ nghiêng thân, dương = về phía trước. */
  readonly lean: number;
  /** Lệch thân trên theo chiều dọc (px, âm = lên); chân không đổi. */
  readonly chest: number;
  /** Lệch đầu so với vị trí tính từ vai (px). */
  readonly head: readonly [number, number];
  readonly legNear: LimbPose;
  readonly legFar: LimbPose;
  readonly armNear: ArmPose;
  readonly armFar: ArmPose;
  /** Độ cao khi không chạm đất (px nguyên). */
  readonly lift: number;
  readonly grounded: boolean;
  readonly rod: RodPose | null;
  readonly face: FacePose;
}

export interface Anchors {
  /** Tâm bàn tay gần (pixel chứa tâm). */
  readonly hand: Point;
  /** Đầu cần câu; null khi không cầm cần. */
  readonly rodTip: Point | null;
  /** Tâm đầu. */
  readonly head: Point;
  /** Pixel đỉnh mũ (hoặc đỉnh đầu). */
  readonly headTop: Point;
  /** Cổ chân gần và xa, theo thứ tự [gần, xa]. */
  readonly feet: readonly [Point, Point];
  /** Hàng mặt đất. */
  readonly ground: number;
}

export interface Frame {
  readonly state: RigState;
  readonly index: number;
  readonly width: number;
  readonly height: number;
  /** RGBA, bốn byte mỗi pixel, hàng trên xuống, cột trái sang phải. */
  readonly rgba: Uint8ClampedArray;
  readonly anchors: Anchors;
}

/** Độ dài các đoạn xương và bán kính (px nghệ thuật), gốc từ bản phác phương án A. */
export const BONE = {
  torso: 10,
  thigh: 8,
  shin: 8,
  upperArm: 5.5,
  forearm: 5,
  legR: 1.7,
  armR: 1.45,
  torsoR: [3.1, 3.6] as const,
  headR: [4.3, 4.7] as const,
  brim: 6.6,
  crown: [3.9, 2.9] as const,
  /** Khoảng cách từ vai đến tâm đầu. */
  neck: 5.3,
  /** Khoảng cách ngang từ tâm hông đến gốc đùi trước/sau. */
  hipOffset: 0.7,
  /** Khoảng cách từ vai đến gốc tay. */
  shoulderX: 0.6,
  shoulderY: 1.1,
} as const;
