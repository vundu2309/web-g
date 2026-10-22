import {craft, type BuildingKind, type Save} from '../../camping.ts';
export interface BuildingTerrain {
  width: number;
  heightAt(x: number): number;
  isWet(x: number): boolean;
  resources: readonly {id: string; x: number}[];
}
export class ConstructionSystem {
  selected: BuildingKind | null = null;
  private readonly terrain: BuildingTerrain;
  constructor(terrain: BuildingTerrain) {
    this.terrain = terrain;
  }
  position(playerX: number, facingLeft: boolean) {
    return Math.round((playerX + (facingLeft ? -80 : 80)) / 32) * 32;
  }
  error(state: Save, x: number) {
    const t = this.terrain;
    if (x < 65 || x > t.width - 65) return 'Quá gần biên bản đồ';
    if ([x - 55, x, x + 55].some((p) => t.isWet(p))) return 'Chọn đất khô, cách xa bờ nước';
    if (t.heightAt(x - 52) !== t.heightAt(x + 52)) return 'Cần một khoảng đất bằng';
    if (state.buildings.some((b) => Math.abs(b.x - x) < 112)) return 'Quá gần công trình khác';
    if (t.resources.some((n) => !state.harvested.includes(n.id) && Math.abs(n.x - x) < 58))
      return 'Thu thập vật liệu ở đây trước';
    return '';
  }
  place(state: Save, x: number) {
    if (!this.selected) return {ok: false as const, message: 'Chưa chọn công trình'};
    const error = this.error(state, x);
    if (error) return {ok: false as const, message: error};
    const kind = this.selected;
    if (kind === 'stove' && !state.buildings.some((b) => b.kind === 'fire' && Math.abs(b.x - x) < 300)) {
      return {ok: false as const, message: 'Dựng bếp nấu trong 300 bước từ bếp lửa để nâng cấp khu bếp.'};
    }
    if (!craft(state, kind, x)) return {ok: false as const, message: 'Chưa đủ gỗ/đá hoặc trại đã đủ 80 công trình.'};
    this.selected = null;
    return {ok: true as const, kind};
  }
}
