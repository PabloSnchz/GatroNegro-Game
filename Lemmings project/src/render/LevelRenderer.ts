import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { LevelModel } from '../core/level/LevelModel';

export class LevelRenderer {
  readonly app: Application;
  public world = new Container();
  private bgLayer = new Container();
  private terrainLayer = new Container();
  private objectsLayer = new Container();
  private lemmingLayer = new Container();
  
  private terrainCanvas: HTMLCanvasElement | null = null;
  private terrainTexture: Texture | null = null;
  private currentLevel: LevelModel | null = null;
  
  public scaleFactor = 2.5;

  private constructor(app: Application) { this.app = app; }

  static async create(host: HTMLElement): Promise<LevelRenderer> {
    const app = new Application();
    // Fondo base oscuro (azul noche)
    await app.init({ background: '#0a192f', resizeTo: host, antialias: true });
    host.appendChild(app.canvas);
    
    const r = new LevelRenderer(app);
    r.world.addChild(r.bgLayer, r.terrainLayer, r.objectsLayer, r.lemmingLayer);
    app.stage.addChild(r.world);
    
    window.addEventListener('resize', () => r.resize());
    return r;
  }

  getLemmingLayer(): Container { return this.lemmingLayer; }

  load(level: LevelModel): void {
    this.currentLevel = level;
    this.bgLayer.removeChildren().forEach(c => c.destroy());
    this.terrainLayer.removeChildren().forEach(c => c.destroy({ children: true }));
    this.objectsLayer.removeChildren().forEach(c => c.destroy({ children: true }));
    this.lemmingLayer.removeChildren().forEach(c => c.destroy({ children: true }));

    this.createBackground();

    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = level.width; 
    this.terrainCanvas.height = level.height;
    
    this.terrainTexture = Texture.from(this.terrainCanvas);
    this.terrainLayer.addChild(new Sprite(this.terrainTexture));

    // Dibujar Entrada y Salida con estilo "Glossy"
    for (const obj of level.objects) {
      const g = new Graphics();
      if (obj.type === 'entrance') {
        // Base metálica
        g.roundRect(obj.x - 4, obj.y + 20, obj.w + 8, obj.h - 10, 4).fill(0x475569);
        g.roundRect(obj.x - 4, obj.y + 20, obj.w + 8, 4, 2).fill(0x94a3b8); // Brillo
        // Portal azul
        g.roundRect(obj.x + 4, obj.y + 4, obj.w - 8, obj.h - 4, 4).fill(0x1e3a8a);
        g.roundRect(obj.x + 6, obj.y + 6, obj.w - 12, obj.h - 10, 4).fill(0x3b82f6);
      } else if (obj.type === 'exit') {
        // Base metálica
        g.roundRect(obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8, 4).fill(0x475569);
        // Portal verde brillante
        g.roundRect(obj.x + 2, obj.y + 2, obj.w - 4, obj.h - 4, 4).fill(0x065f46);
        g.roundRect(obj.x + 4, obj.y + 4, obj.w - 8, obj.h - 8, 4).fill(0x22c55e);
        // Luz interior
        g.roundRect(obj.x + 8, obj.y + 8, obj.w - 16, obj.h - 16, 2).fill(0xa7f3d0);
      }
      this.objectsLayer.addChild(g);
    }

    this.updateTerrain(level);
    this.resetCamera();
  }

  private createBackground(): void {
    if (!this.currentLevel) return;
    const grid = new Graphics();
    const step = 40;
    for (let x = 0; x < this.currentLevel.width; x += step) {
      grid.moveTo(x, 0).lineTo(x, this.currentLevel.height).stroke({ color: 0x1e293b, width: 2 });
    }
    for (let y = 0; y < this.currentLevel.height; y += step) {
      grid.moveTo(0, y).lineTo(this.currentLevel.width, y).stroke({ color: 0x1e293b, width: 2 });
    }
    this.bgLayer.addChild(grid);
  }

  resetCamera(): void {
    if (!this.currentLevel) return;
    const availableH = this.app.screen.height - 250;
    this.scaleFactor = Math.max(1.5, availableH / this.currentLevel.height);
    this.world.scale.set(this.scaleFactor);
    
    const entrance = this.currentLevel.objects.find(o => o.type === 'entrance');
    if (entrance) {
      this.world.x = -(entrance.x * this.scaleFactor) + (this.app.screen.width / 2);
    } else {
      this.world.x = 0;
    }
    this.world.y = (this.app.screen.height - this.currentLevel.height * this.scaleFactor) / 2 + 50;
    this.clampCamera();
  }

  resize(): void { this.clampCamera(); }

  pan(dx: number, dy: number): void {
    if (!this.currentLevel) return;
    this.world.x += dx;
    this.world.y += dy;
    this.clampCamera();
  }

  clampCamera(): void {
    if (!this.currentLevel) return;
    const scaledW = this.currentLevel.width * this.scaleFactor;
    const scaledH = this.currentLevel.height * this.scaleFactor;
    
    if (scaledW <= this.app.screen.width) {
      this.world.x = (this.app.screen.width - scaledW) / 2;
    } else {
      const minX = this.app.screen.width - scaledW - 50;
      const maxX = 50;
      this.world.x = Math.min(maxX, Math.max(minX, this.world.x));
    }

    const minY = this.app.screen.height - scaledH - 150;
    const maxY = 150;
    this.world.y = Math.min(maxY, Math.max(minY, this.world.y));
  }

  updateTerrain(level: LevelModel): void {
    if (!this.terrainCanvas || !this.terrainTexture) return;
    const ctx = this.terrainCanvas.getContext('2d')!;
    const img = ctx.createImageData(level.width, level.height);
    
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const idx = y * level.width + x;
        const t = level.terrain[idx];
        const o = idx * 4;

        if (t === 1) {
          // Detectar si es la superficie (arriba del todo)
          const isSurface = y > 0 && level.terrain[(y - 1) * level.width + x] === 0;
          const isEdge = y > 4 && level.terrain[(y - 4) * level.width + x] === 0;

          if (isSurface) {
            // Corteza iluminada (Naranja claro)
            img.data[o] = 255; img.data[o + 1] = 200; img.data[o + 2] = 100;
          } else if (isEdge) {
            // Transición (Naranja medio)
            img.data[o] = 230; img.data[o + 1] = 140; img.data[o + 2] = 60;
          } else {
            // Profundidad (Marrón rojizo con ruido para simular roca)
            const noise = ((x * 17 + y * 11) % 30) - 15;
            img.data[o] = 160 + noise; img.data[o + 1] = 70 + noise; img.data[o + 2] = 40 + noise;
          }
          img.data[o + 3] = 255;
        } 
        else if (t === 2) {
          // Acero con brillo superior
          const isTop = y > 0 && level.terrain[(y - 1) * level.width + x] === 0;
          img.data[o] = isTop ? 255 : 100; 
          img.data[o + 1] = isTop ? 255 : 110; 
          img.data[o + 2] = isTop ? 255 : 120; 
          img.data[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    this.terrainTexture.source.update(); 
  }
}