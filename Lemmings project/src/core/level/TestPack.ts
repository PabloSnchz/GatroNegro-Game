import type { LevelModel, SkillInventory } from './LevelModel';

const W = 1600, H = 160;

// Ahora damos 10 de cada habilidad para pruebas
const ALL_SKILLS: SkillInventory = { 
  climber: 10, floater: 10, bomber: 10, blocker: 10, 
  builder: 10, basher: 10, miner: 10, digger: 10 
};

function fillRect(t: Uint8Array, w: number, x: number, y: number, rw: number, rh: number, v: 0 | 1 | 2): void {
  for (let yy = y; yy < y + rh; yy++)
    for (let xx = x; xx < x + rw; xx++)
      if (xx >= 0 && yy >= 0 && xx < w && yy < H) t[yy * w + xx] = v;
}

function level01(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-01', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Fun', levelNumber: 1, title: 'Caminata',
    width: W, height: H, terrain,
    objects: [{ type: 'entrance', x: 100, y: 60, w: 32, h: 40 }, { type: 'exit', x: 1400, y: 100, w: 32, h: 20 }],
    steel: [], totalLemmings: 10, toSave: 5, releaseRate: 80, timeLimit: 120,
    skills: { ...ALL_SKILLS }, graphicSetId: 'demo',
  };
}

function level02(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  fillRect(terrain, W, 700, 120, 10, 40, 0); // Foso
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-02', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Fun', levelNumber: 2, title: 'El foso',
    width: W, height: H, terrain,
    objects: [{ type: 'entrance', x: 100, y: 60, w: 32, h: 40 }, { type: 'exit', x: 1450, y: 100, w: 32, h: 20 }],
    steel: [], totalLemmings: 10, toSave: 8, releaseRate: 80, timeLimit: 90,
    skills: { ...ALL_SKILLS }, graphicSetId: 'demo',
  };
}

function level03(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  fillRect(terrain, W, 600, 80, 40, 40, 1); // Muro
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-03', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Tricky', levelNumber: 1, title: 'El muro',
    width: W, height: H, terrain,
    objects: [{ type: 'entrance', x: 100, y: 60, w: 32, h: 40 }, { type: 'exit', x: 1450, y: 100, w: 32, h: 20 }],
    steel: [], totalLemmings: 10, toSave: 5, releaseRate: 80, timeLimit: 90,
    skills: { ...ALL_SKILLS }, graphicSetId: 'demo',
  };
}

export function buildTestPack(): LevelModel[] {
  return [level01(), level02(), level03()];
}