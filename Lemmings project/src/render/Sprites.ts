export const LEMMING_PALETTE: Record<string, string> = {
  'G': '#22aa22', // Pelo verde
  'S': '#ffccaa', // Piel
  'B': '#2233aa', // Camiseta azul
  'W': '#ffffff', // Ojos
  'K': '#000000', // Botas / Contorno
  'R': '#aa2222', // Boca / Paraguas (Floater)
  'T': '#888888'  // Pico (Basher/Miner)
};

// Matriz de 8x10 para el lemming caminando (Frame 1)
export const LEMMING_WALK_1 = [
  "  GGGG  ",
  " GGGGGG ",
  " GGSSGG ",
  " GSWWSS ",
  " GSSSSS ",
  "  SSSS  ",
  "  BBBB  ",
  " BBBBBB ",
  "  B  B  ",
  "  K  K  "
];

// Matriz de 8x10 para el lemming caminando (Frame 2 - piernas cambiadas)
export const LEMMING_WALK_2 = [
  "  GGGG  ",
  " GGGGGG ",
  " GGSSGG ",
  " GSWWSS ",
  " GSSSSS ",
  "  SSSS  ",
  "  BBBB  ",
  " BBBBBB ",
  " B    B ",
  " K    K "
];

// Matriz de 8x10 para caer (brazos arriba)
export const LEMMING_FALL = [
  "  GGGG  ",
  " GGGGGG ",
  " GGSSGG ",
  " GSWWSS ",
  " GSSSSS ",
  "B SSSS B",
  "B BBBB B",
  " BBBBBB ",
  "  B  B  ",
  "  K  K  "
];

// Matriz de 8x10 para cavar (agachado)
export const LEMMING_DIG = [
  "        ",
  "  GGGG  ",
  " GGGGGG ",
  " GGSSGG ",
  " GSWWSS ",
  " GSSSSS ",
  "  SSSS  ",
  " BBBBBB ",
  "  BBBB  ",
  "  K  K  "
];

export function getLemmingFrame(state: string, tick: number): string[] {
  if (state === 'FALLING') return LEMMING_FALL;
  if (state === 'DIGGING') return LEMMING_DIG;
  
  // Animación de caminar (alterna cada 8 ticks)
  if (state === 'WALKING' || state === 'BUILDING' || state === 'MINING' || state === 'BASHING') {
    return Math.floor(tick / 8) % 2 === 0 ? LEMMING_WALK_1 : LEMMING_WALK_2;
  }
  return LEMMING_WALK_1;
}