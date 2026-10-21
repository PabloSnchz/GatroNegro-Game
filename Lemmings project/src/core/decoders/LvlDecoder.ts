import type { LevelModel, SkillInventory } from '../level/LevelModel';

export function decodeLvl(buffer: ArrayBuffer, fileName: string): LevelModel {
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  if (buffer.byteLength < 1024) {
    throw new Error("El archivo es demasiado pequeño para ser un .lvl válido.");
  }

  const releaseRate = uint8[4] ?? 50;
  const totalLemmings = uint8[5] ?? 10;
  const toSave = uint8[6] ?? 5;
  const timeLimitMins = uint8[7] ?? 3;
  
  const skills: SkillInventory = {
    climber: uint8[8] ?? 0,
    floater: uint8[9] ?? 0,
    bomber: uint8[10] ?? 0,
    blocker: uint8[11] ?? 0,
    builder: uint8[12] ?? 0,
    basher: uint8[13] ?? 0,
    miner: uint8[14] ?? 0,
    digger: uint8[15] ?? 0,
  };

  const W = 1600, H = 160;
  const terrain = new Uint8Array(W * H);
  
  for (let y = 120; y < H; y++) {
    for (let x = 0; x < W; x++) {
      terrain[y * W + x] = 1;
    }
  }

  return {
    id: `custom-${Date.now()}`,
    packId: 'custom',
    packName: 'Mis Niveles Cargados',
    rating: 'Fun',
    levelNumber: 1,
    title: fileName.replace('.lvl', ''),
    width: W,
    height: H,
    terrain,
    objects: [
      { type: 'entrance', x: 100, y: 60, w: 32, h: 40 },
      { type: 'exit',     x: 1450, y: 100, w: 32, h: 20 },
    ],
    steel: [],
    totalLemmings: totalLemmings,
    toSave: toSave,
    releaseRate: releaseRate,
    timeLimit: timeLimitMins * 60,
    skills: skills,
    graphicSetId: 'dirt',
  };
}