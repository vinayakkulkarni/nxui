export type SignatureEraserEffect =
  | 'thanos-snap'
  | 'black-hole'
  | 'explosion'
  | 'wind-sweep'
  | 'rewind';

export type SignatureEraserTool = 'pen' | 'eraser';

export interface SignatureEraserProps {
  /** Initial points rendered as a signature. Defaults to a built-in cursive path. */
  signature?: SignatureEraserStroke[];
  /** Effect used when the signature is cleared. */
  effect?: SignatureEraserEffect;
  /** Pen stroke width in CSS pixels. */
  penWidth?: number;
  /** Eraser radius in CSS pixels. */
  eraserRadius?: number;
  /** Particle count multiplier (1 = one particle per sampled point). */
  particleDensity?: number;
  /** Automatically restore the signature shortly after an erase effect. */
  autoRestore?: boolean;
  /** Delay before auto-restore in milliseconds. */
  autoRestoreDelay?: number;
}

export interface SignatureEraserStroke {
  points: SignatureEraserPoint[];
}

export interface SignatureEraserPoint {
  x: number;
  y: number;
}

export interface SignatureEraserEmit {
  (e: 'cleared', effect: SignatureEraserEffect): void;
  (e: 'restored'): void;
  (e: 'change', strokeCount: number): void;
}
