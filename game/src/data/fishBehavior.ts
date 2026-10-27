export interface FishBehavior {
  speed: number;
  shy: number;
  depth: number;
  shape: 'round' | 'slender' | 'long';
  stripes: boolean;
}
/** Đặc tính theo loài: tốc độ, khoảng cách chạy trốn và tầng nước ưa thích. */
const PROFILES: Record<string, FishBehavior> = {
  perch: {speed: 27, shy: 100, depth: 0.45, shape: 'round', stripes: true},
  tilapia: {speed: 24, shy: 85, depth: 0.55, shape: 'round', stripes: true},
  carp: {speed: 22, shy: 105, depth: 0.65, shape: 'round', stripes: false},
  crucian: {speed: 21, shy: 75, depth: 0.4, shape: 'round', stripes: false},
  catfish: {speed: 18, shy: 60, depth: 0.88, shape: 'long', stripes: false},
  trout: {speed: 42, shy: 135, depth: 0.4, shape: 'slender', stripes: true},
  snakehead: {speed: 35, shy: 90, depth: 0.75, shape: 'long', stripes: true},
  goby: {speed: 20, shy: 65, depth: 0.9, shape: 'round', stripes: true},
  bass: {speed: 38, shy: 130, depth: 0.5, shape: 'slender', stripes: true},
  koi: {speed: 23, shy: 75, depth: 0.35, shape: 'round', stripes: false},
  sturgeon: {speed: 25, shy: 115, depth: 0.8, shape: 'long', stripes: true},
  golden: {speed: 33, shy: 150, depth: 0.6, shape: 'slender', stripes: false},
  mackerel: {speed: 48, shy: 140, depth: 0.28, shape: 'slender', stripes: true},
  snapper: {speed: 32, shy: 110, depth: 0.55, shape: 'round', stripes: false},
  grouper: {speed: 19, shy: 80, depth: 0.85, shape: 'round', stripes: true},
};
const DEFAULT: FishBehavior = {speed: 29, shy: 100, depth: 0.5, shape: 'slender', stripes: false};
export const fishBehavior = (species: string): FishBehavior => PROFILES[species] ?? DEFAULT;
