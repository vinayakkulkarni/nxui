export type GrainientType = 'linear' | 'radial';

export interface GrainientProps {
  /** Two to eight colors, from the base to the highlight. Use your page background as the first color so the edges blend in. */
  colors?: string[];
  /** Linear runs the colors across the container. Radial puts the last color in the middle. */
  type?: GrainientType;
  /** Direction of a linear gradient in degrees, like CSS: 0 runs bottom to top, 90 left to right. */
  angle?: number;
  /** How many times the colors repeat back and forth, from 1 to 8. Higher values make stripes or rings. */
  bands?: number;
  /** Speed of the drifting waves. 0 holds them still. */
  speed?: number;
  /** How much the gradient bends into waves, from 0 (straight) to 3. Above 1 it starts to marble. */
  flow?: number;
  /** Size of the waves, from 0.25 to 3. */
  scale?: number;
  /** Blend between colors, from 0 (crisp, poster-like edges) to 1 (smooth). */
  softness?: number;
  /** Satin shading on the folds, from 0 to 1. Combine with bands for glossy ribbons. */
  silk?: number;
  /** Strength of the film grain, from 0 to 0.5. */
  grainAmount?: number;
  /** Size of the grain in pixels, from 0.5 to 4. */
  grainSize?: number;
  /** Shifts the grain every frame like film. When off, the grain stays fixed. */
  grainAnimated?: boolean;
  /** Contrast of the colors, from 0.2 to 2. */
  contrast?: number;
  /** Saturation of the colors, from 0 (grayscale) to 2. */
  saturation?: number;
  /** Picks a different pattern of waves. */
  variation?: number;
  /** Lets the cursor drag the colors around like paint. The trail settles back after a moment. */
  interactive?: boolean;
  /** How far the cursor drags the colors, from 0 to 2. */
  stir?: number;
  /** Clicking twists the colors into a swirl that slowly unwinds. */
  clickSwirl?: boolean;
  /** Blooms the colors out from the middle on mount. */
  intro?: boolean;
  /** Builds a light version of the palette: the first color becomes white and the others run in reverse, deepest last. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface GrainientSettings {
  colors: string[];
  type: number;
  angle: number;
  bands: number;
  speed: number;
  flow: number;
  scale: number;
  softness: number;
  silk: number;
  grainAmount: number;
  grainSize: number;
  grainAnimated: boolean;
  contrast: number;
  saturation: number;
  variation: number;
  interactive: boolean;
  stir: number;
  clickSwirl: boolean;
  intro: boolean;
  lightMode: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface GrainientEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
