export interface TextStringProps {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  damping?: number;
  gravity?: number;
  constraintIterations?: number;
  collisionRadius?: number;
  class?: string;
}

export interface TextStringParticle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  restX: number;
  restY: number;
  width: number;
  char: string;
  locked: boolean;
  dragging: boolean;
  pointerId: number;
}
