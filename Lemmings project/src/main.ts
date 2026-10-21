import { LevelCatalog } from './core/level/LevelCatalog';
import { buildTestPack } from './core/level/TestPack';
import { LevelRenderer } from './render/LevelRenderer';
import { LemmingRenderer } from './render/LemmingRenderer';
import { GameEngine } from './core/game/GameEngine';
import type { SkillType } from './core/game/skills';
import { SKILL_NAMES } from './core/game/skills';
import type { LevelModel } from './core/level/LevelModel';
import { decodeLvl } from './core/decoders/LvlDecoder';
import { ParticleSystem } from './render/ParticleSystem';
import { soundManager } from './core/game/SoundManager';

const status = document.getElementById('status')!;
const host = document.getElementById('canvas-host')!;

let catalog: LevelCatalog;
let renderer: LevelRenderer;
let lemmingRenderer: LemmingRenderer;
let particleSystem: ParticleSystem;
let engine: GameEngine | null = null;
let currentLevel: LevelModel | null = null;
let timeRemaining = 0;
let gameState: 'MENU' | 'PLAYING' | 'WON' | 'LOST' = 'MENU';
let gameSpeed = 1;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastPointerX = 0;
let lastPointerY = 0;

const uiLayer = document.createElement('div');
uiLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:flex; flex-direction:column; justify-content:space-between; z-index: 10; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;';

const topBar = document.createElement('div');
topBar.style.cssText = 'display: flex; justify-content: center; align-items: flex-start; width: 100%; padding: 20px; gap: 20px; pointer-events: none;';
uiLayer.appendChild(topBar);

const hud = document.createElement('div');
// Añadido pointer-events: auto
hud.style.cssText = 'background:rgba(15,23,42,0.85); border:2px solid #334155; color:#38bdf8; font-family:"Courier New",monospace; font-weight:bold; padding:12px 20px; border-radius:12px; font-size:20px; display:none; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(4px); pointer-events: auto;';
topBar.appendChild(hud);

const speedBtn = document.createElement('button');
// Añadido pointer-events: auto
speedBtn.style.cssText = 'padding:12px 20px; background:#1e293b; color:#38bdf8; border:2px solid #334155; border-radius:12px; cursor:pointer; font-weight:bold; font-family:"Courier New",monospace; font-size:20px; box-shadow: 0 4px 0 #0f172a; display:none; backdrop-filter: blur(4px); pointer-events: auto; transition: all 0.1s;';
speedBtn.textContent = '1x';
speedBtn.onmouseover = () => speedBtn.style.background = '#334155';
speedBtn.onmouseout = () => speedBtn.style.background = '#1e293b';
topBar.appendChild(speedBtn);

const skillBar = document.createElement('div');
skillBar.style.cssText = 'margin:20px auto 40px auto; display:none; gap:10px; background:rgba(15,23,42,0.9); padding:12px 20px; border-radius:16px; border:2px solid #334155; pointer-events:auto; box-shadow: 0 -10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(4px);';
uiLayer.appendChild(skillBar);

const overlay = document.createElement('div');
overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(10,25,47,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:auto; color:#fff;';
uiLayer.appendChild(overlay);

async function boot(): Promise<void> {
  catalog = new LevelCatalog();
  for (const lvl of buildTestPack()) catalog.add(lvl);

  renderer = await LevelRenderer.create(host);
  lemmingRenderer = new LemmingRenderer(renderer.getLemmingLayer());
  particleSystem = new ParticleSystem(renderer.world);
  
  host.appendChild(uiLayer);

  const packs = catalog.packs();
  status.textContent = packs.map(p => `${p.packName}`).join(' · ');

  showMenu();
  setupInput();

  renderer.app.ticker.add((ticker) => {
    if (gameState !== 'PLAYING' || !engine || !currentLevel) return;
    
    const scaledDelta = ticker.deltaMS * gameSpeed;
    
    lemmingRenderer.updateTick(gameSpeed);
    particleSystem.update(scaledDelta);
    timeRemaining -= scaledDelta;
    
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      endGame(false, '¡Tiempo agotado!');
      return;
    }
    
    engine.tick(scaledDelta);
    const snap = engine.snapshot();
    if (snap.terrainDirty) {
      renderer.updateTerrain(currentLevel);
      engine.clearDirty();
    }
    lemmingRenderer.sync(snap.lemmings);
    updateHUD();
    checkWinLose(snap);
  });
}

function setupInput() {
  const canvas = renderer.app.canvas;
  
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    const dist = Math.sqrt(Math.pow(e.clientX - dragStartX, 2) + Math.pow(e.clientY - dragStartY, 2));
    if (dist > 5) isDragging = true;
    
    if (isDragging) {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      renderer.pan(dx, dy);
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    canvas.releasePointerCapture(e.pointerId);
    
    if (!isDragging && gameState === 'PLAYING' && engine && engine.selectedSkill) {
      const rect = canvas.getBoundingClientRect();
      const screenX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const screenY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      const worldX = (screenX - renderer.world.x) / renderer.world.scale.x;
      const worldY = (screenY - renderer.world.y) / renderer.world.scale.y;
      
      const target = engine.findLemmingAt(worldX, worldY);
      if (target) {
        engine.applySkillToLemming(target.id);
        updateHUD();
      }
    }
    isDragging = false;
  });
}

function showMenu() {
  gameState = 'MENU';
  hud.style.display = 'none';
  speedBtn.style.display = 'none';
  skillBar.style.display = 'none';
  overlay.style.display = 'flex';
  overlay.innerHTML = '';

  const title = document.createElement('h1');
  title.textContent = 'Lemmings';
  title.style.cssText = 'font-family: Impact, Arial Black, sans-serif; font-size:7rem; margin-bottom:0; color:#22c55e; text-transform:uppercase; letter-spacing:2px; text-shadow: 0 5px 0 #166534, 0 10px 20px rgba(0,0,0,0.8); -webkit-text-stroke: 2px #000;';
  overlay.appendChild(title);
  
  const subtitle = document.createElement('h2');
  subtitle.textContent = 'LWPE Edition';
  subtitle.style.cssText = 'margin-top:-10px; margin-bottom:50px; color:#94a3b8; font-size:1.5rem; letter-spacing: 5px; text-transform: uppercase;';
  overlay.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex; gap:20px; flex-wrap:wrap; justify-content:center; max-width:800px;';

  for (const pack of catalog.packs()) {
    for (const [rating, levels] of pack.levelsByRating) {
      for (const lvl of levels) {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding:20px 30px; background:#1e293b; color:#fff; border:none; border-radius:16px; cursor:pointer; font-size:20px; min-width:200px; transition: all 0.1s; box-shadow: 0 8px 0 #0f172a, 0 10px 20px rgba(0,0,0,0.5);';
        btn.onmouseover = () => { btn.style.background = '#334155'; btn.style.transform = 'translateY(4px)'; btn.style.boxShadow = '0 4px 0 #0f172a, 0 5px 10px rgba(0,0,0,0.5)'; };
        btn.onmouseout = () => { btn.style.background = '#1e293b'; btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 8px 0 #0f172a, 0 10px 20px rgba(0,0,0,0.5)'; };
        btn.innerHTML = `<strong style="color:#22c55e; font-size:1.4rem; text-shadow: 1px 1px 2px #000;">${lvl.title}</strong><br/><span style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${rating} - Nvl ${lvl.levelNumber}</span>`;
        btn.onclick = () => {
          soundManager.init();
          soundManager.click();
          startLevel(lvl);
        };
        grid.appendChild(btn);
      }
    }
  }
  overlay.appendChild(grid);
}

function startLevel(level: LevelModel) {
  currentLevel = level;
  currentLevel.terrain = new Uint8Array(level.terrain); 
  engine = new GameEngine(currentLevel);
  
  engine.onParticleEffect = (x, y, type) => {
    if (type === 'dig') particleSystem.emit(x, y, 0xd97706, 8); 
    if (type === 'explode') particleSystem.emit(x, y, 0xff4500, 50); 
  };

  timeRemaining = level.timeLimit * 1000;
  gameSpeed = 1;
  
  // Actualizar estilo del botón al iniciar nivel
  speedBtn.textContent = '1x';
  speedBtn.style.boxShadow = '0 4px 0 #0f172a';
  speedBtn.style.transform = 'translateY(0)';
  
  renderer.load(currentLevel);
  lemmingRenderer.clear();
  particleSystem.clear();
  
  overlay.style.display = 'none';
  hud.style.display = 'block';
  speedBtn.style.display = 'block';
  skillBar.style.display = 'flex';
  
  buildSkillBar();
  gameState = 'PLAYING';
}

function endGame(won: boolean, message: string) {
  gameState = won ? 'WON' : 'LOST';
  hud.style.display = 'none';
  speedBtn.style.display = 'none';
  skillBar.style.display = 'none';
  
  overlay.style.display = 'flex';
  overlay.innerHTML = '';

  const msg = document.createElement('h1');
  msg.textContent = message;
  msg.style.cssText = `font-family: Impact, sans-serif; font-size:5rem; text-transform: uppercase; text-shadow: 0 5px 0 #000, 0 10px 20px rgba(0,0,0,0.8); color: ${won ? '#22c55e' : '#ef4444'}; -webkit-text-stroke: 2px #000;`;
  overlay.appendChild(msg);

  const menuBtn = document.createElement('button');
  menuBtn.textContent = 'Volver al Menú';
  menuBtn.style.cssText = 'margin-top:40px; padding:20px 40px; font-size:24px; font-weight:bold; cursor:pointer; border-radius:16px; background:#1e293b; color:#fff; border:none; box-shadow: 0 8px 0 #0f172a;';
  menuBtn.onmouseover = () => { menuBtn.style.transform = 'translateY(4px)'; menuBtn.style.boxShadow = '0 4px 0 #0f172a'; };
  menuBtn.onmouseout = () => { menuBtn.style.transform = 'translateY(0)'; menuBtn.style.boxShadow = '0 8px 0 #0f172a'; };
  menuBtn.onclick = () => { soundManager.click(); showMenu(); };
  overlay.appendChild(menuBtn);
}

function checkWinLose(snap: any) {
  const finishedSpawning = snap.spawned === snap.total;
  const noMoreLemmings = snap.lemmings.length === 0;
  if (snap.saved >= snap.toSave) endGame(true, '¡Nivel Completado!');
  else if (finishedSpawning && noMoreLemmings) endGame(false, '¡Has Fracasado!');
}

function buildSkillBar() {
  skillBar.innerHTML = '';
  const skillList: SkillType[] = ['DIGGER', 'BUILDER', 'BOMBER', 'CLIMBER', 'FLOATER', 'BLOCKER', 'BASHER', 'MINER'];
  for (const skill of skillList) {
    const btn = document.createElement('button');
    btn.dataset.skill = skill;
    btn.style.cssText = 'padding:12px 18px; min-width:90px; background:#334155; color:#e2e8f0; border:none; border-radius:12px; cursor:pointer; font-weight:bold; font-size:14px; box-shadow: 0 6px 0 #0f172a; transition:all 0.1s; pointer-events:auto; display:flex; flex-direction:column; align-items:center; justify-content:center;';
    btn.onclick = () => {
      if (engine) engine.selectSkill(skill);
      updateHUD();
    };
    skillBar.appendChild(btn);
  }
}

function updateHUD() {
  if (!engine) return;
  const snap = engine.snapshot();
  const mins = Math.floor(timeRemaining / 60000);
  const secs = Math.floor((timeRemaining % 60000) / 1000);
  
  hud.innerHTML = `
    <span style="color:#fff">TIME</span> ${mins}:${secs.toString().padStart(2, '0')} &nbsp;&nbsp;|&nbsp;&nbsp; 
    <span style="color:#fff">SAVED</span> <span style="color:${snap.saved >= snap.toSave ? '#22c55e' : '#facc15'}">${snap.saved}/${snap.toSave}</span> &nbsp;&nbsp;|&nbsp;&nbsp; 
    <span style="color:#fff">ALIVE</span> ${snap.lemmings.length} &nbsp;&nbsp;|&nbsp;&nbsp; 
    <span style="color:#fff">DEAD</span> <span style="color:#ef4444">${snap.dead}</span>
  `;

  for (const btn of Array.from(skillBar.children) as HTMLButtonElement[]) {
    const skill = btn.dataset.skill as SkillType;
    const count = snap.skills[skill];
    
    let iconColor = count > 0 ? '#22c55e' : '#475569';
    
    btn.innerHTML = `<span style="font-size:12px; letter-spacing:1px; margin-bottom:4px; color:#94a3b8">${SKILL_NAMES[skill].toUpperCase()}</span><span style="font-size:24px; color:${iconColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${count}</span>`;
    btn.disabled = count === 0 && snap.selectedSkill !== skill;
    
    if (snap.selectedSkill === skill) {
      btn.style.background = '#065f46';
      btn.style.boxShadow = 'inset 0 4px 8px rgba(0,0,0,0.5)';
      btn.style.transform = 'translateY(6px)';
    } else if (count === 0) {
      btn.style.background = '#0f172a';
      btn.style.boxShadow = 'none';
      btn.style.transform = 'translateY(6px)';
      btn.style.opacity = '0.5';
    } else {
      btn.style.background = '#334155';
      btn.style.boxShadow = '0 6px 0 #0f172a';
      btn.style.transform = 'translateY(0)';
      btn.style.opacity = '1';
    }
  }
}

speedBtn.onclick = () => {
  gameSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1;
  speedBtn.textContent = `${gameSpeed}x`;
  
  // Efecto visual 3D al hacer clic
  speedBtn.style.transform = 'translateY(4px)';
  speedBtn.style.boxShadow = '0 0px 0 #0f172a';
  setTimeout(() => {
    speedBtn.style.transform = 'translateY(0)';
    speedBtn.style.boxShadow = '0 4px 0 #0f172a';
  }, 100);

  soundManager.click();
};

const dz = document.getElementById('dropzone')!;
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', async e => {
  e.preventDefault(); dz.classList.remove('dragover');
  const files = [...(e.dataTransfer?.files ?? [])];
  let loaded = 0;

  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.lvl')) {
      try {
        const buffer = await file.arrayBuffer();
        const level = decodeLvl(buffer, file.name);
        catalog.add(level);
        loaded++;
      } catch (err) {
        console.error(`Error cargando ${file.name}:`, err);
        status.textContent = `Error al decodificar ${file.name}.`;
      }
    }
  }

  if (loaded > 0) {
    status.textContent = `¡${loaded} nivel(es) cargados!`;
    showMenu();
  } else {
    status.textContent = 'No se encontraron archivos .lvl válidos.';
  }
});

boot();