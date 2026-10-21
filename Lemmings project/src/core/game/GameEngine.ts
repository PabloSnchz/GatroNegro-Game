import type { LevelModel } from '../level/LevelModel';
import { isSolid } from '../level/LevelModel';
import type { Lemming } from './Lemming';
import {
  TICK_MS, LEMMING_W, LEMMING_H, WALK_SPEED,
  FALL_SPEED_INITIAL, FALL_SPEED_MAX, FATAL_FALL_PX,
} from './constants';
import type { SkillType } from './skills';
import { executeSkill, updateSkillState } from './skills';
import { soundManager } from './SoundManager';

export interface EngineSnapshot {
  lemmings: readonly Lemming[];
  spawned: number; total: number; dead: number; saved: number; toSave: number;
  skills: Record<SkillType, number>;
  selectedSkill: SkillType | null;
  terrainDirty: boolean;
}

interface Rect { x: number; y: number; w: number; h: number; }

export class GameEngine {
  readonly level: LevelModel;
  private lemmings: Lemming[] = [];
  private nextId = 1;
  private accumulator = 0;
  private spawned = 0;
  private dead = 0;
  private saved = 0;
  private spawnAccumulator = 0;
  private readonly spawnIntervalTicks: number;
  private readonly entrance: Rect;
  private readonly exits: Rect[];

  public skills: Record<SkillType, number>;
  public selectedSkill: SkillType | null = null;
  public terrainDirty = false;
  
  public onParticleEffect?: (x: number, y: number, type: 'dig' | 'explode' | 'build') => void;

  constructor(level: LevelModel) {
    this.level = level;
    const entrance = level.objects.find(o => o.type === 'entrance');
    if (!entrance) throw new Error('Level has no entrance');
    this.entrance = entrance;
    this.exits = level.objects.filter(o => o.type === 'exit');
    this.spawnIntervalTicks = Math.max(2, 100 - level.releaseRate);
    
    this.skills = {
      CLIMBER: level.skills.climber, FLOATER: level.skills.floater,
      BOMBER: level.skills.bomber, BLOCKER: level.skills.blocker,
      BUILDER: level.skills.builder, BASHER: level.skills.basher,
      MINER: level.skills.miner, DIGGER: level.skills.digger,
    };
  }

  tick(deltaMs: number): void {
    this.accumulator += deltaMs;
    let steps = 0;
    while (this.accumulator >= TICK_MS && steps < 30) { // Aumentado a 30 para soportar 3x
      this.stepTick();
      this.accumulator -= TICK_MS;
      steps++;
    }
  }

  selectSkill(skill: SkillType): void {
    if (this.skills[skill] > 0) {
      this.selectedSkill = this.selectedSkill === skill ? null : skill;
      soundManager.click();
    }
  }

  applySkillToLemming(lemmingId: number): void {
    if (!this.selectedSkill || this.skills[this.selectedSkill] <= 0) return;
    const l = this.getLemming(lemmingId);
    if (!l || ['DEAD', 'EXITED', 'BLOCKING'].includes(l.state)) return;

    executeSkill(this, lemmingId, this.selectedSkill);
    this.skills[this.selectedSkill]--;
    if (this.skills[this.selectedSkill] === 0) this.selectedSkill = null;
    soundManager.click();
  }

  getLemming(id: number): Lemming | undefined { return this.lemmings.find(l => l.id === id); }

  findLemmingAt(x: number, y: number): Lemming | undefined {
    return this.lemmings.find(l =>
      x >= l.x - 4 && x <= l.x + LEMMING_W + 4 &&
      y >= l.y - 4 && y <= l.y + LEMMING_H + 4 &&
      !['DEAD', 'EXITED'].includes(l.state)
    );
  }

  destroyTerrain(cx: number, cy: number, rw: number, rh: number, isExplosion = false): boolean {
    let destroyed = false;
    for (let y = cy; y < cy + rh; y++) {
      for (let x = cx; x < cx + rw; x++) {
        if (x < 0 || y < 0 || x >= this.level.width || y >= this.level.height) continue;
        const idx = y * this.level.width + x;
        if (this.level.terrain[idx] === 1) {
          this.level.terrain[idx] = 0; destroyed = true; this.terrainDirty = true;
        } else if (this.level.terrain[idx] === 2) return false;
      }
    }
    // Solo emitimos sonido y partículas de excavación si NO es una explosión
    if (destroyed && !isExplosion && Math.random() < 0.3) {
      soundManager.dig();
      if (this.onParticleEffect) this.onParticleEffect(cx + rw/2, cy + rh/2, 'dig');
    }
    return destroyed;
  }

  addTerrain(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.level.width || y >= this.level.height) return;
    const idx = y * this.level.width + x;
    if (this.level.terrain[idx] === 0) { 
      this.level.terrain[idx] = 1; 
      this.terrainDirty = true; 
    }
  }

  explode(cx: number, cy: number): void {
    soundManager.explode();
    if (this.onParticleEffect) this.onParticleEffect(cx, cy, 'explode');
    
    const radius = 15;
    for (let y = cy - radius; y <= cy + radius; y++)
      for (let x = cx - radius; x <= cx + radius; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) this.destroyTerrain(x, y, 1, 1, true);
  }

  private stepTick(): void {
    if (this.spawned < this.level.totalLemmings) {
      this.spawnAccumulator += 1;
      if (this.spawnAccumulator >= this.spawnIntervalTicks) {
        this.spawnAccumulator = 0;
        this.spawnLemming();
      }
    }

    const blockers = this.lemmings.filter(l => l.state === 'BLOCKING');

    for (const l of this.lemmings) {
      if (updateSkillState(this, l)) continue;

      if (l.state === 'WALKING') this.updateWalker(l, blockers);
      else if (l.state === 'FALLING') this.updateFaller(l);

      if (l.state === 'WALKING') {
        for (const ex of this.exits) {
          if (this.overlapsExit(l, ex)) { 
            l.state = 'EXITED'; 
            soundManager.exit();
            break; 
          }
        }
      }
    }

    for (const l of this.lemmings) {
      if (l.state === 'DEAD') { this.dead++; soundManager.death(); }
      else if (l.state === 'EXITED') this.saved++;
    }
    this.lemmings = this.lemmings.filter(l => l.state !== 'DEAD' && l.state !== 'EXITED');
  }

  private spawnLemming(): void {
    const x = Math.floor(this.entrance.x + this.entrance.w / 2 - LEMMING_W / 2);
    const y = this.entrance.y + this.entrance.h - LEMMING_H;
    this.lemmings.push({
      id: this.nextId++, x, y, facing: 1,
      state: 'WALKING', fallDistance: 0, fallSpeed: FALL_SPEED_INITIAL,
    });
    this.spawned++;
    soundManager.spawn();
  }

  private updateWalker(l: Lemming, blockers: Lemming[]): void {
    const dir = l.facing;
    const wallX = dir > 0 ? l.x + LEMMING_W : l.x - 1;
    const wallY = l.y + 4;

    for (const b of blockers) {
      if (b.id === l.id) continue;
      if (Math.abs(l.x - b.x) < LEMMING_W && Math.abs(l.y - b.y) < LEMMING_H) {
        if (dir > 0 && l.x < b.x) { l.facing = -1; return; }
        if (dir < 0 && l.x > b.x) { l.facing = 1; return; }
      }
    }

    if (isSolid(this.level, wallX, wallY)) {
      if (l.isClimber) { l.state = 'CLIMBING'; return; }
      l.facing = (-dir) as -1 | 1;
      return;
    }
    l.x += dir * WALK_SPEED;
    const footX = Math.floor(l.x + LEMMING_W / 2);
    const footY = l.y + LEMMING_H;
    if (!isSolid(this.level, footX, footY)) {
      l.state = 'FALLING';
      l.fallDistance = 0;
      l.fallSpeed = l.isFloater ? 1 : FALL_SPEED_INITIAL;
    }
  }

  private updateFaller(l: Lemming): void {
    const speed = l.isFloater ? 1 : l.fallSpeed;
    for (let i = 0; i < speed; i++) {
      const nextY = l.y + 1;
      const footX = Math.floor(l.x + LEMMING_W / 2);
      const footY = nextY + LEMMING_H;
      if (isSolid(this.level, footX, footY)) {
        if (!l.isFloater && l.fallDistance > FATAL_FALL_PX) l.state = 'DEAD';
        else { l.state = 'WALKING'; l.fallDistance = 0; }
        return;
      }
      l.y = nextY;
      l.fallDistance += 1;
    }
    if (!l.isFloater) l.fallSpeed = Math.min(FALL_SPEED_MAX, l.fallSpeed + 1);
  }

  private overlapsExit(l: Lemming, ex: Rect): boolean {
    return l.x < ex.x + ex.w && l.x + LEMMING_W > ex.x
        && l.y < ex.y + ex.h && l.y + LEMMING_H > ex.y;
  }

  snapshot(): EngineSnapshot {
    return {
      lemmings: this.lemmings, spawned: this.spawned, total: this.level.totalLemmings,
      dead: this.dead, saved: this.saved, toSave: this.level.toSave,
      skills: this.skills, selectedSkill: this.selectedSkill,
      terrainDirty: this.terrainDirty,
    };
  }

  clearDirty(): void { this.terrainDirty = false; }
}