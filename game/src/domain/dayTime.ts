export const DAY_SECONDS = 480;
export type Period = 'dawn' | 'day' | 'dusk' | 'night';
export function periodAt(time: number): Period {
  const hour = ((time % DAY_SECONDS) / DAY_SECONDS) * 24;
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}
export function clockText(time: number) {
  const minutes = Math.floor((time % DAY_SECONDS) * 3);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function nightAmount(time: number) {
  const hour = ((time % DAY_SECONDS) / DAY_SECONDS) * 24;
  if (hour < 5 || hour >= 20) return 1;
  if (hour < 7) return (7 - hour) / 2;
  if (hour >= 17) return (hour - 17) / 3;
  return 0;
}
