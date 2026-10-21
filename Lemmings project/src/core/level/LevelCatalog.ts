import type { LevelModel, Rating } from './LevelModel';

export interface PackSummary {
  packId: string;
  packName: string;
  ratings: Rating[];
  levelsByRating: Map<Rating, LevelModel[]>;
}

export class LevelCatalog {
  private levels = new Map<string, LevelModel>();

  add(level: LevelModel): void {
    if (this.levels.has(level.id)) throw new Error(`Duplicate level id ${level.id}`);
    this.levels.set(level.id, level);
  }

  get(id: string): LevelModel | undefined { return this.levels.get(id); }

  packs(): PackSummary[] {
    const byPack = new Map<string, PackSummary>();
    for (const lvl of this.levels.values()) {
      let pack = byPack.get(lvl.packId);
      if (!pack) {
        pack = { packId: lvl.packId, packName: lvl.packName, ratings: [], levelsByRating: new Map() };
        byPack.set(lvl.packId, pack);
      }
      let list = pack.levelsByRating.get(lvl.rating);
      if (!list) { list = []; pack.levelsByRating.set(lvl.rating, list); pack.ratings.push(lvl.rating); }
      list.push(lvl);
    }
    for (const pack of byPack.values()) {
      for (const list of pack.levelsByRating.values()) list.sort((a, b) => a.levelNumber - b.levelNumber);
    }
    return [...byPack.values()];
  }
}
