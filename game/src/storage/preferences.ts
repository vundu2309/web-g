import type {Quality} from '../game/rendering/resolution';
const QUALITY_KEY = 'forest-quality';
export function readQuality(): Quality | null {
  try {
    const value = localStorage.getItem(QUALITY_KEY);
    return value === 'low' || value === 'high' ? value : null;
  } catch {
    return null;
  }
}
export function writeQuality(quality: Quality) {
  try {
    localStorage.setItem(QUALITY_KEY, quality);
  } catch {}
}
