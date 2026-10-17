export type FaultyTerminalGlyphs = 'blocks' | 'dots' | 'characters';

export type FaultyTerminalClickEffect = 'glitch' | 'degauss' | 'none';

export type FaultyTerminalPreset =
  | 'phosphor'
  | 'classic'
  | 'terminal'
  | 'amber'
  | 'ice'
  | 'meltdown'
  | 'data';

/** The visual props a preset sets. */
export interface FaultyTerminalLook {
  tint: string;
  glyphs: FaultyTerminalGlyphs;
  scale: number;
  digitSize: number;
  timeScale: number;
  brightness: number;
  glow: number;
  persistence: number;
  mouseStrength: number;
  mouseGlow: number;
  scramble: number;
  scanlineIntensity: number;
  glitchAmount: number;
  flickerAmount: number;
  noiseAmp: number;
  chromaticAberration: number;
  curvature: number;
  vignette: number;
  clickEffect: FaultyTerminalClickEffect;
  lightMode: boolean;
}

export interface FaultyTerminalProps {
  /** Zoom of the pattern. Higher values show more, smaller glyphs. */
  scale?: number;
  /** Glyph density across and down, multiplied with scale. */
  gridMul?: [number, number];
  /** Space around each glyph. 1 packs them edge to edge. */
  digitSize?: number;
  /** Speed of the animation. */
  timeScale?: number;
  /** Freezes the animation. The cursor still lights up glyphs. */
  pause?: boolean;
  /** Strength of the soft halo and the rolling bright band. */
  scanlineIntensity?: number;
  /** How far the faulty bands shift sideways. */
  glitchAmount?: number;
  /** How often the faulty bands appear. */
  flickerAmount?: number;
  /** Strength of the swirling pattern that decides which glyphs light up. */
  noiseAmp?: number;
  /** Splits the red and blue channels apart, in pixels. */
  chromaticAberration?: number;
  /** Fine noise that smooths color banding. */
  dither?: number | boolean;
  /** Bulge of the screen, like the glass of an old tube. */
  curvature?: number;
  /** Phosphor color of the glyphs. */
  tint?: string;
  /** Lights up the glyphs around the cursor. */
  mouseReact?: boolean;
  /** How many glyphs the cursor lights up around it. */
  mouseStrength?: number;
  /** Switches the glyphs on one by one on mount. */
  pageLoadAnimation?: boolean;
  /** Overall brightness, or ink strength in light mode. */
  brightness?: number;
  /** What each cell draws. */
  glyphs?: FaultyTerminalGlyphs;
  /** Phosphor bloom around the glyphs. */
  glow?: number;
  /** How long glyphs keep glowing after they switch off. */
  persistence?: number;
  /** How fast characters change near the cursor (characters only). */
  scramble?: number;
  /** How much glyphs under the cursor heat up toward white. */
  mouseGlow?: number;
  /** Darkens the edges of the screen. */
  vignette?: number;
  /** What a click does. */
  clickEffect?: FaultyTerminalClickEffect;
  /** Picks a fixed pattern. Leave it out for a different one on every mount. */
  variation?: number;
  /** Prints the glyphs as crisp ink on a light page. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

/** Normalised values the renderer reads every frame. */
export interface FaultyTerminalSettings {
  scale: number;
  gridX: number;
  gridY: number;
  digitSize: number;
  timeScale: number;
  pause: boolean;
  scanlineIntensity: number;
  glitchAmount: number;
  flickerAmount: number;
  noiseAmp: number;
  chromaticAberration: number;
  dither: number;
  curvature: number;
  tint: [number, number, number];
  mouseReact: boolean;
  mouseStrength: number;
  pageLoadAnimation: boolean;
  brightness: number;
  glyphs: number;
  glow: number;
  persistence: number;
  scramble: number;
  mouseGlow: number;
  vignette: number;
  clickEffect: number;
  clickSeconds: number;
  lightMode: boolean;
  dpr: number | undefined;
}

export interface FaultyTerminalEngine {
  /** Advances one frame. Returns false once the picture has gone idle. */
  frame: (now: number, reduce: boolean) => boolean;
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  pointerMove: (x: number, y: number, inside: boolean) => boolean;
  pointerLeave: () => void;
  click: (x: number, y: number, reduce: boolean) => boolean;
  /** Marks the picture busy; resets the frame clock when the loop was stopped. */
  wake: (stopped: boolean) => void;
  dispose: () => void;
}
