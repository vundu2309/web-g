import {chestMarkup} from '../ui/ChestUI';
import {transfer} from '../domain/chest';
import type {Save, Building} from '../domain/saveTypes';
import {buyGear, buyRod, equipRod, cook, eat, sellExceptRecords, sellFish, sellFood} from '../domain/economy';
import {activityMarkup, mealCommand, type Activity} from '../ui/ActivityUI';
export interface ActivityHost {
  state(): Save;
  open(): void;
  persist(): void;
  toast(message: string): void;
}
/** Coordinates paused transactions; domain rules own every mutation. */
export class CampActivities {
  private readonly host: ActivityHost;
  private chestId: string | null = null;
  private activity: Activity = 'shop';
  private stove = false;
  private tab = 'sell';
  constructor(host: ActivityHost) {
    this.host = host;
  }
  nearby(x: number): Building | undefined {
    let nearest: Building | undefined;
    let distance = 85;
    for (const building of this.host.state().buildings) {
      if (
        building.kind !== 'stall' &&
        building.kind !== 'fire' &&
        building.kind !== 'stove' &&
        building.kind !== 'chest'
      )
        continue;
      const delta = Math.abs(building.x - x);
      if (delta < distance) {
        nearest = building;
        distance = delta;
      }
    }
    return nearest;
  }
  interact(x: number) {
    const building = this.nearby(x);
    if (!building) return false;
    this.chestId = building.kind === 'chest' ? building.id : null;
    this.activity = building.kind === 'stall' ? 'shop' : 'cook';
    this.stove = this.host.state().buildings.some((b) => b.kind === 'stove' && Math.abs(b.x - x) < 150);
    this.tab = 'sell';
    this.host.open();
    this.render();
    return true;
  }
  command(value: string) {
    const [command, argument] = value.split(':');
    if (this.chestId && (command === 'deposit' || command === 'withdraw')) {
      const success = transfer(this.host.state(), this.chestId, command, Number(argument));
      const message = success ? 'Đã chuyển vật phẩm.' : 'Không chuyển được: rương đầy hoặc vượt giới hạn chồng.';
      this.host.toast(message);
      if (success) this.host.persist();
      this.render();
      return;
    }
    if (command === 'tab') {
      this.tab = argument === 'buy' ? 'buy' : 'sell';
      this.render();
      return;
    }
    const state = this.host.state();
    const index = Number(argument);
    const meal = mealCommand(command);
    let success = false;
    if (command === 'rod' && this.activity === 'shop') success = buyRod(state, argument);
    if (command === 'equiprod') success = equipRod(state, argument);
    if (command === 'buy' && this.activity === 'shop') success = buyGear(state, argument);
    if (command === 'sell' && this.activity === 'shop') success = sellFish(state, index);
    if (command === 'all' && this.activity === 'shop') success = sellExceptRecords(state);
    if (command === 'food' && this.activity === 'shop') success = sellFood(state, index);
    if (command === 'eat') success = eat(state, index);
    if (meal && this.activity === 'cook') success = cook(state, index, meal, this.stove);
    const message = success ? 'Đã hoàn tất · tiến trình được lưu.' : 'Chưa thể thực hiện. Kiểm tra xu và vật phẩm.';
    this.host.toast(message);
    if (success) this.host.persist();
    this.render();
  }
  private render() {
    if (this.chestId) {
      document.getElementById('activity-title')!.textContent = 'Rương gỗ';
      document.getElementById('activity-body')!.innerHTML = chestMarkup(this.host.state(), this.chestId);
      return;
    }
    document.getElementById('activity-title')!.textContent = this.activity === 'shop' ? 'Cửa hàng' : 'Nấu ăn';
    document.getElementById('activity-body')!.innerHTML = activityMarkup(
      this.host.state(),
      this.activity,
      this.stove,
      this.tab,
    );
  }
}
