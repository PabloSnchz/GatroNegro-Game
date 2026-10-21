import { Container, Graphics } from 'pixi.js';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: number; size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private graphics = new Graphics();

  constructor(parent: Container) {
    parent.addChild(this.graphics);
  }

  emit(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 20;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40, // Sesgo hacia arriba
        life: 0.5 + Math.random() * 0.5, 
        maxLife: 1.0,
        color, 
        size: Math.random() * 3 + 2 // Partículas más grandes (2 a 5 px)
      });
    }
  }

  update(deltaMs: number) {
    this.graphics.clear();
    const dt = deltaMs / 1000; // Convertir a segundos

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;

      // Física basada en tiempo (independiente de los FPS)
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 150 * dt; // Gravedad normal
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.graphics.rect(p.x, p.y, p.size, p.size).fill({ color: p.color, alpha: Math.max(0, p.life) });
    }
  }

  clear() {
    this.particles = [];
    this.graphics.clear();
  }
}