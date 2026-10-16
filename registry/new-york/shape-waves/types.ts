export type ShapeWavesShapes = 'mixed' | 'squares' | 'circles' | 'triangles';

export interface ShapeWavesProps {
  /** Optional text carved out of the field. Cells under the glyphs stay empty and the waves flow around them. */
  text?: string;
  /** CSS font family used to draw the text cutout. */
  fontFamily?: string;
  /** Font weight of the text cutout. */
  fontWeight?: string | number;
  /** Text height as a fraction of the container height. Long text shrinks to fit the width. */
  textSize?: number;
  /** 'mixed' draws dark bands as triangles, mid bands as circles and bright bands as squares. A single shape varies its size per band instead. */
  shapes?: ShapeWavesShapes;
  /** Size of one grid cell in CSS pixels. */
  cellSize?: number;
  /** Glyph size as a fraction of the cell. */
  dotSize?: number;
  /** Glyph color. One flat color for the whole field. */
  color?: string;
  /** Color the glyphs step towards inside a splash. */
  hoverColor?: string;
  /** Background color behind the glyphs. */
  backgroundColor?: string;
  /** How fast the wave bands morph over time. 0 freezes them. */
  speed?: number;
  /** Size of the wave bands. Larger values give broader, calmer swells. */
  scale?: number;
  /** How sharply the field is cut into its three bands. */
  contrast?: number;
  /** Shifts the balance between dark, mid and bright bands. */
  brightness?: number;
  /** Drift speed of the field in cells per second. 0 evolves in place. */
  flow?: number;
  /** Drift direction in degrees, used when flow is above 0. */
  direction?: number;
  /** Strength of the radial fade into the background towards the edges. 0 disables it. */
  fade?: number;
  /** Lets the cursor splash into the field, sending ripples that cycle the glyphs and light them up. */
  interactive?: boolean;
  /** Size of a cursor splash in CSS pixels. */
  splashRadius?: number;
  /** How much energy a splash drops in. Higher values throw wider, brighter ripples. */
  splashStrength?: number;
  /** Bloom on lit glyphs. 0 disables the glow pass entirely. */
  glow?: number;
  /** Plays a spawn animation on mount: the shapes pop in along a wave from the centre to the corners. */
  intro?: boolean;
  /** Length of the intro wave in seconds. */
  introDuration?: number;
  /** Change this value to replay the intro wave without remounting. */
  introKey?: string | number;
  /** Freezes the wave motion. Splashes keep working. */
  paused?: boolean;
  /** Extra classes for the root element. */
  class?: string;
}

export interface ShapeWavesSettings {
  text: string;
  fontFamily: string;
  fontWeight: string | number;
  textSize: number;
  shapes: ShapeWavesShapes;
  cellSize: number;
  dotSize: number;
  color: string;
  hoverColor: string;
  backgroundColor: string;
  speed: number;
  scale: number;
  contrast: number;
  brightness: number;
  flow: number;
  direction: number;
  fade: number;
  interactive: boolean;
  splashRadius: number;
  splashStrength: number;
  glow: number;
  intro: boolean;
  introDuration: number;
  paused: boolean;
}

export interface ShapeWavesEngineOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => ShapeWavesSettings;
  isHidden: () => boolean;
  prefersReducedMotion: () => boolean;
  onReady: () => void;
  onError: (error: Error) => void;
}

export interface ShapeWavesEngine {
  applySettings: () => void;
  applyMask: () => void;
  replayIntro: () => void;
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (clientX: number, clientY: number) => void;
  invalidateBounds: () => void;
  dispose: () => void;
}
