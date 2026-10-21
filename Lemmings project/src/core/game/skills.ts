import type { Lemming } from './Lemming';

export type SkillType = 'CLIMBER' | 'FLOATER' | 'BOMBER' | 'BLOCKER' | 'BUILDER' | 'BASHER' | 'MINER' | 'DIGGER';

export const SKILL_NAMES: Record<SkillType, string> = {
  CLIMBER: 'Trepar', FLOATER: 'Flotar', BOMBER: 'Explotar', BLOCKER: 'Bloquear',
  BUILDER: 'Construir', BASHER: 'Golpear', MINER: 'Minar', DIGGER: 'Cavar',
};

export function executeSkill(engine: any, lemmingId: number, skill: SkillType): void {
  const l = engine.getLemming(lemmingId);
  if (!l) return;

  if (skill === 'CLIMBER') l.isClimber = true;
  else if (skill === 'FLOATER') l.isFloater = true;
  else if (skill === 'BOMBER') { l.state = 'BOMBING'; l.timer = 85; }
  else if (skill === 'BLOCKER') { l.state = 'BLOCKING'; }
  else if (skill === 'BUILDER') { l.state = 'BUILDING'; l.timer = 0; l.stepsLeft = 12; }
  else if (skill === 'BASHER') { l.state = 'BASHING'; l.timer = 0; }
  else if (skill === 'MINER') { l.state = 'MINING'; l.timer = 0; }
  else if (skill === 'DIGGER') { l.state = 'DIGGING'; l.timer = 0; }
}

export function updateSkillState(engine: any, l: Lemming): boolean {
  if (l.state === 'DIGGING') {
    l.timer = (l.timer || 0) + 1;
    if (l.timer % 4 === 0) {
      const cx = Math.floor(l.x + 4);
      const cy = Math.floor(l.y + 10);
      if (engine.destroyTerrain(cx, cy, 4, 2)) l.y += 1;
      else l.state = 'WALKING';
    }
    return true;
  }

  if (l.state === 'BUILDING') {
    l.timer = (l.timer || 0) + 1;
    if (l.timer % 6 === 0) {
      if (l.stepsLeft && l.stepsLeft <= 0) { l.state = 'WALKING'; return true; }
      const bx = l.facing > 0 ? l.x + 4 : l.x - 6;
      const by = l.y + 9;
      engine.addTerrain(bx, by); engine.addTerrain(bx + 1, by);
      engine.addTerrain(bx, by + 1); engine.addTerrain(bx + 1, by + 1);
      l.y -= 1; l.x += l.facing * 1;
      if (l.stepsLeft) l.stepsLeft--;
    }
    return true;
  }

  if (l.state === 'BASHING') {
    l.timer = (l.timer || 0) + 1;
    if (l.timer % 6 === 0) {
      const bx = l.facing > 0 ? Math.floor(l.x + 8) : Math.floor(l.x - 2);
      const by = Math.floor(l.y + 4);
      if (engine.destroyTerrain(bx, by, 2, 6)) l.x += l.facing * 1;
      else l.state = 'WALKING';
    }
    return true;
  }

  if (l.state === 'MINING') {
    l.timer = (l.timer || 0) + 1;
    if (l.timer % 6 === 0) {
      const bx = l.facing > 0 ? Math.floor(l.x + 6) : Math.floor(l.x - 2);
      const by = Math.floor(l.y + 8);
      if (engine.destroyTerrain(bx, by, 3, 3)) {
        l.x += l.facing * 1;
        l.y += 1;
      } else l.state = 'WALKING';
    }
    return true;
  }

  if (l.state === 'BOMBING') {
    l.timer = (l.timer || 0) - 1;
    if (l.timer <= 0) {
      engine.explode(l.x + 4, l.y + 5);
      l.state = 'DEAD';
    }
    return true;
  }

  if (l.state === 'BLOCKING') {
    return true; // El bloqueo se maneja en GameEngine para afectar a otros
  }

  return false;
}