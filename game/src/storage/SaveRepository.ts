import {decodeSave, newSave, SAVE_KEY, type Save} from '../camping.ts';
export interface SaveRepository {
  load(): Save;
  save(state: Save): boolean;
}
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
/** The scene depends on this interface, so cloud saves can be added separately. */
export class LocalSaveRepository implements SaveRepository {
  private readonly getStore: () => KeyValueStore;
  constructor(getStore: () => KeyValueStore = () => localStorage) {
    this.getStore = getStore;
  }
  load(): Save {
    try {
      return decodeSave(this.getStore().getItem(SAVE_KEY));
    } catch {
      return newSave();
    }
  }
  save(state: Save): boolean {
    try {
      this.getStore().setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }
}
