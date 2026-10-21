import type { LevelModel, SkillInventory } from './LevelModel';

const W = 1600, H = 160;

const ALL_SKILLS: SkillInventory = { 
  climber: 10, floater: 10, bomber: 10, blocker: 10, 
  builder: 10, basher: 10, miner: 10, digger: 10 
};

const LIMITED_SKILLS: SkillInventory = { 
  climber: 2, floater: 2, bomber: 3, blocker: 2, 
  builder: 5, basher: 2, miner: 2, digger: 3 
};

const PUZZLE_SKILLS: SkillInventory = { 
  climber: 1, floater: 1, bomber: 2, blocker: 1, 
  builder: 3, basher: 1, miner: 1, digger: 2 
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

function level04(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  // Plataforma elevada
  fillRect(terrain, W, 300, 80, 200, 10, 1);
  fillRect(terrain, W, 900, 60, 150, 10, 1);
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-04', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Fun', levelNumber: 3, title: 'Alturas',
    width: W, height: H, terrain,
    objects: [
      { type: 'entrance', x: 100, y: 60, w: 32, h: 40 },
      { type: 'exit', x: 950, y: 40, w: 32, h: 20 }
    ],
    steel: [], totalLemmings: 15, toSave: 10, releaseRate: 70, timeLimit: 150,
    skills: { ...LIMITED_SKILLS }, graphicSetId: 'demo',
  };
}

function level05(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  // Laberinto de paredes
  fillRect(terrain, W, 400, 60, 10, 60, 1);
  fillRect(terrain, W, 800, 60, 10, 60, 1);
  fillRect(terrain, W, 1100, 60, 10, 60, 1);
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-05', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Tricky', levelNumber: 2, title: 'Laberinto',
    width: W, height: H, terrain,
    objects: [
      { type: 'entrance', x: 50, y: 60, w: 32, h: 40 },
      { type: 'exit', x: 1500, y: 100, w: 32, h: 20 }
    ],
    steel: [], totalLemmings: 20, toSave: 15, releaseRate: 60, timeLimit: 180,
    skills: { ...PUZZLE_SKILLS }, graphicSetId: 'demo',
  };
}

function level06(): LevelModel {
  const terrain = new Uint8Array(W * H);
  fillRect(terrain, W, 0, 120, W, 40, 1);
  // Caverna con techo bajo
  fillRect(terrain, W, 500, 40, 600, 80, 1);
  fillRect(terrain, W, 0, 0, 20, H, 1);
  return {
    id: 'demo-06', packId: 'demo', packName: 'LWPE Demo Pack',
    rating: 'Taxing', levelNumber: 1, title: 'Caverna',
    width: W, height: H, terrain,
    objects: [
      { type: 'entrance', x: 100, y: 60, w: 32, h: 40 },
      { type: 'exit', x: 1450, y: 100, w: 32, h: 20 }
    ],
    steel: [], totalLemmings: 12, toSave: 8, releaseRate: 75, timeLimit: 120,
    skills: { ...LIMITED_SKILLS }, graphicSetId: 'demo',
  };
}

export function buildTestPack(): LevelModel[] {
  return [level01(), level02(), level03(), level04(), level05(), level06()];
}