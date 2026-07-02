export type PaperPerlinNoiseFit = 'none' | 'contain' | 'cover';

export interface PaperPerlinNoiseProps {
  /** Foreground color. */
  colorFront?: string;
  /** Background color. */
  colorBack?: string;
  /** Blend point between 2 colors, 0.5 = equal distribution (0 to 1). */
  proportion?: number;
  /** Color transition sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1). */
  softness?: number;
  /** Perlin noise octaves number, more octaves for more detailed patterns (1 to 8). */
  octaveCount?: number;
  /** Roughness, falloff between octaves (0.3 to 1). */
  persistence?: number;
  /** Frequency step, defines how compressed the pattern is (1.5 to 10). */
  lacunarity?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperPerlinNoiseFit;
  /** Overall zoom level (0.01 to 4). */
  scale?: number;
  /** Overall rotation angle in degrees (0 to 360). */
  rotation?: number;
  /** Horizontal origin for world positioning (0 to 1). */
  originX?: number;
  /** Vertical origin for world positioning (0 to 1). */
  originY?: number;
  /** Horizontal offset of the graphics center (-1 to 1). */
  offsetX?: number;
  /** Vertical offset of the graphics center (-1 to 1). */
  offsetY?: number;
  /** Virtual world width before canvas fitting. */
  worldWidth?: number;
  /** Virtual world height before canvas fitting. */
  worldHeight?: number;
  /** Additional CSS classes. */
  class?: string;
}
