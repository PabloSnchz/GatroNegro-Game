import { Container, Graphics } from 'pixi.js';
import type { Lemming } from '../core/game/Lemming';
import { LEMMING_W, LEMMING_H } from '../core/game/constants';

export class LemmingRenderer {
  private sprites = new Map<number, Container>();
  private tick = 0;

  constructor(private parent: Container) {}

  updateTick() { this.tick++; }

  private createLemmingGraphic(): Container {
    const c = new Container();
    
    // Sombra (Drop Shadow)
    const shadow = new Graphics();
    shadow.ellipse(4, 10, 5, 2).fill({ color: 0x000000, alpha: 0.4 });
    c.addChild(shadow);

    // Cuerpo (Gota azul)
    const body = new Graphics();
    body.moveTo(4, 1)
        .bezierCurveTo(8, 1, 8, 5, 8, 8)
        .bezierCurveTo(8, 10, 6, 10, 4, 10)
        .bezierCurveTo(2, 10, 0, 10, 0, 8)
        .bezierCurveTo(0, 5, 0, 1, 4, 1)
        .fill(0x3b82f6);
    // Brillo del cuerpo
    body.ellipse(2, 6, 1, 3).fill({ color: 0x60a5fa, alpha: 0.6 });
    c.addChild(body);

    // Pelo verde (Puntas)
    const hair = new Graphics();
    hair.moveTo(1, 2)
        .lineTo(2, -1).lineTo(3, 1)
        .lineTo(4, -2).lineTo(5, 1)
        .lineTo(6, -1).lineTo(7, 2)
        .fill(0x22c55e);
    c.addChild(hair);

    // Ojos (Grandes, blancos)
    const eyeL = new Graphics();
    eyeL.circle(2.5, 4, 1.5).fill(0xffffff);
    eyeL.circle(3, 4, 0.6).fill(0x000000); // Pupila
    c.addChild(eyeL);

    const eyeR = new Graphics();
    eyeR.circle(5.5, 4, 1.5).fill(0xffffff);
    eyeR.circle(6, 4, 0.6).fill(0x000000); // Pupila
    c.addChild(eyeR);

    // Manos y pies (Blancos)
    const limbs = new Graphics();
    limbs.name = 'limbs';
    c.addChild(limbs);

    return c;
  }

  sync(lemmings: readonly Lemming[]): void {
    const alive = new Set<number>();
    for (const l of lemmings) {
      alive.add(l.id);
      let c = this.sprites.get(l.id);
      
      if (!c) {
        c = this.createLemmingGraphic();
        this.parent.addChild(c);
        this.sprites.set(l.id, c);
      }

      // Posición y escala
      c.x = l.x;
      c.y = l.y;
      c.scale.x = l.facing === 1 ? 1 : -1;
      if (l.facing === -1) c.x += LEMMING_W;

      // Animación de las extremidades
      const limbs = c.getChildByName('limbs') as Graphics;
      limbs.clear();
      
      const isMoving = ['WALKING', 'BUILDING', 'MINING', 'BASHING'].includes(l.state);
      const swing = isMoving ? Math.sin(this.tick * 0.4) * 1.5 : 0;

      // Brazos
      limbs.roundRect(0, 5 + swing, 2, 3, 1).fill(0xffffff);
      limbs.roundRect(6, 5 - swing, 2, 3, 1).fill(0xffffff);

      // Piernas
      if (l.state === 'FALLING') {
        // Piernas abiertas si cae
        limbs.roundRect(1, 9, 2, 2, 1).fill(0xffffff);
        limbs.roundRect(5, 9, 2, 2, 1).fill(0xffffff);
      } else if (l.state !== 'DIGGING') {
        // Piernas caminando
        limbs.roundRect(1.5, 9 + swing, 2, 2, 1).fill(0xffffff);
        limbs.roundRect(4.5, 9 - swing, 2, 2, 1).fill(0xffffff);
      }

      // Efectos de estado
      if (l.state === 'BOMBING' && l.timer && l.timer % 10 < 5) {
        c.tint = 0xff0000;
      } else if (l.state === 'DIGGING') {
        c.tint = 0xcccccc;
      } else {
        c.tint = 0xffffff;
      }
    }
    
    for (const [id, sprite] of this.sprites) {
      if (!alive.has(id)) {
        sprite.destroy({ children: true });
        this.sprites.delete(id);
      }
    }
  }

  clear(): void {
    for (const s of this.sprites.values()) s.destroy({ children: true });
    this.sprites.clear();
  }
}