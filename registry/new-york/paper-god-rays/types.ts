export type PaperGodRaysFit = 'none' | 'contain' | 'cover';

export interface PaperGodRaysProps {
  /** Bloom highlight color blended at ray peaks. */
  colorBloom?: string;
  /** Background color filling the gaps between rays. */
  colorBack?: string;
  /** Up to 10 ray colors blending along the ray field. */
  colors?: string[];
  /** Ray density / count (0 to 1). */
  density?: number;
  /** How spotty / irregular the rays appear (0 to 1). */
  spotty?: number;
  /** Strength of the mid-ray intensity (0 to 1). */
  midIntensity?: number;
  /** Size of the mid-ray region (0 to 1). */
  midSize?: number;
  /** Overall ray intensity (0 to 1). */
  intensity?: number;
  /** Bloom strength applied to bright peaks (0 to 1). */
  bloom?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperGodRaysFit;
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
