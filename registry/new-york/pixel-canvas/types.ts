export interface PixelCanvasPixel {
  x: number;
  y: number;
  size: number;
  intensity: number;
  targetIntensity: number;
  colorPhase: number;
}

export type PixelCanvasVariant = 'default' | 'trail' | 'glow';
