import type {Habitat} from '../../data/catalog.ts';
export interface WaterColumn {
  top: number;
  bed: number;
}
export type WaterProbe = (x: number) => WaterColumn | null;
export interface WaterArea {
  id: string;
  x: number;
  width: number;
  habitat: Habitat;
}
