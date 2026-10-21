export type LemmingState = 
  | 'WALKING' | 'FALLING' | 'DEAD' | 'EXITED' 
  | 'DIGGING' | 'BUILDING' | 'BOMBING' 
  | 'BLOCKING' | 'BASHING' | 'MINING' | 'CLIMBING' | 'FLOATING';

export interface Lemming {
  id: number;
  x: number;
  y: number;
  facing: -1 | 1;
  state: LemmingState;
  fallDistance: number;
  fallSpeed: number;
  timer?: number;
  stepsLeft?: number;
  isClimber?: boolean;
  isFloater?: boolean;
}