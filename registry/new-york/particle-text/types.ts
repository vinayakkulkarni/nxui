export type ParticleTextHighlightMode = 'motion' | 'gradient';
export type ParticleTextShape = 'circle' | 'square' | 'line';
export type ParticleTextIntro = 'gather' | 'rain' | 'spiral' | 'scan';
export type ParticleTextTrigger = 'mount' | 'hover' | 'click';

export interface ParticleTextProps {
  /** The words sampled into particle targets. */
  text?: string;
  /** Rendered size of each particle in CSS pixels. */
  particleSize?: number;
  /** Pixel sampling step for the glyph canvas. Lower values create more particles. */
  density?: number;
  /** Particle color at rest. `currentColor` follows the surrounding text color. */
  color?: string;
  /** Color particles take on while they fly in or get pushed around. Also colors the glow and scan line. */
  highlightColor?: string;
  /** `motion` lights moving particles; `gradient` blends the highlight left to right. */
  highlightMode?: ParticleTextHighlightMode;
  /** How each particle is drawn. */
  shape?: ParticleTextShape;
  /** How the text forms. */
  intro?: ParticleTextIntro;
  /** How far particles begin from their final spots (gather and spiral intros). */
  scatter?: number;
  /** Milliseconds for the intro to form the text. */
  gatherDuration?: number;
  /** Maximum per-particle delay in milliseconds. */
  stagger?: number;
  /** Clicking blows particles away from the click point, then they spring back. */
  clickBurst?: boolean;
  /** How hard and how wide a click burst pushes. */
  burstStrength?: number;
  /** Strength of the cursor pushback. */
  pointerRepel?: number;
  /** Cursor influence radius in pixels. */
  repelRadius?: number;
  /** Subtle resting motion after the text has formed. */
  idleDrift?: number;
  /** When the intro plays again after the first formation. */
  trigger?: ParticleTextTrigger;
  /** Canvas text size used for glyph sampling (px number or any CSS length). */
  fontSize?: number | string;
  /** Font weight used for sampling. */
  fontWeight?: number | string;
  /** Font family used for sampling. `inherit` uses the surrounding font. */
  fontFamily?: string;
  /** Soft bloom in the highlight color around highlighted particles. */
  glow?: boolean;
  class?: string;
}

export type ParticleTextSettings = Readonly<
  Required<Omit<ParticleTextProps, 'class'>>
>;

export interface ParticleTextParticle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  weight: number;
  tone: number;
  seed: number;
  depth: number;
  delay: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  angle: number;
  length: number;
  radius: number;
  heading: number;
  startRadius: number;
  swirl: number;
}

export interface ParticleTextRgb {
  r: number;
  g: number;
  b: number;
}

export interface ParticleTextTarget {
  x: number;
  y: number;
  alpha: number;
}

export interface ParticleTextEngine {
  wake: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  pointerEnter: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: () => void;
  pointerDown: (event: PointerEvent) => void;
  click: () => void;
  destroy: () => void;
}
