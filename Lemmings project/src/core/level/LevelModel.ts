export type Rating =
  | 'Fun' | 'Tricky' | 'Taxing' | 'Mayhem'
  | 'Tame' | 'Crazy' | 'Wild' | 'Wicked' | 'Havoc';

export type ObjectType = 'entrance' | 'exit' | 'trap' | 'water' | 'fire' | 'oneway';

export interface LevelObject {
  type: ObjectType;
  x: number; y: number; w: number; h: number;
}

export interface SteelArea { x: number; y: number; w: number; h: number; }

export interface SkillInventory {
  climber: number; floater: number; bomber: number; blocker: number;
  builder: number; basher: number; miner: number; digger: number;
}

/** 0 = aire, 1 = terreno destructible, 2 = acero (indestructible) */
export type TerrainCell = 0 | 1 | 2;

export interface LevelModel {
  id: string;
  packId: string;
  packName: string;
  rating: Rating;
  levelNumber: number;
  title: string;
  width: number;
  height: number;
  terrain: Uint8Array;
  objects: LevelObject[];
  steel: SteelArea[];
  totalLemmings: number;
  toSave: number;
  releaseRate: number;
  timeLimit: number;
  skills: SkillInventory;
  graphicSetId: string;
}

export function terrainIndex(level: LevelModel, x: number, y: number): number {
  return y * level.width + x;
}

export function isSolid(level: LevelModel, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return true;
  return level.terrain[terrainIndex(level, x, y)] !== 0;
}
