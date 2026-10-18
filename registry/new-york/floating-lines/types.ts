import type { CSSProperties } from 'vue';

export type FloatingLinesWave = 'top' | 'middle' | 'bottom';

export type FloatingLinesStyle = 'solid' | 'dotted' | 'dashed';

export interface FloatingLinesWavePosition {
  /** Offset of the wave along its length. */
  x: number;
  /** Height of the wave. */
  y: number;
  /** Curl of the wave. */
  rotate: number;
}

export interface FloatingLinesProps {
  /** Up to 8 colors blended across the lines of each wave. */
  linesGradient?: string[];
  /** Which waves to show. */
  enabledWaves?: FloatingLinesWave[];
  /** Lines per wave, from 1 to 24. An array sets each enabled wave separately. */
  lineCount?: number | number[];
  /** Spacing between the lines of a wave. An array sets each enabled wave separately. */
  lineDistance?: number | number[];
  /** Offset, height and curl of the top wave. */
  topWavePosition?: Partial<FloatingLinesWavePosition>;
  /** Offset, height and curl of the middle wave. */
  middleWavePosition?: Partial<FloatingLinesWavePosition>;
  /** Offset, height and curl of the bottom wave. */
  bottomWavePosition?: Partial<FloatingLinesWavePosition>;
  /** Speed of the wave motion. */
  animationSpeed?: number;
  /** Height of the waves. */
  amplitude?: number;
  /** Width of each line in pixels. */
  lineWidth?: number;
  /** Draws the lines as solid strands, rows of dots or dashes. */
  lineStyle?: FloatingLinesStyle;
  /** Strength of the glow around the lines. */
  glow?: number;
  /** Overall brightness of the lines. */
  brightness?: number;
  /** How much the waves in the back soften out of focus, from 0 to 1. */
  depthOfField?: number;
  /** Fades the lines out toward the left and right edges, from 0 to 1. */
  edgeFade?: number;
  /** Bends the lines around the cursor. */
  interactive?: boolean;
  /** Size of the area around the cursor that bends the lines. */
  bendRadius?: number;
  /** Negative values part the lines around the cursor, positive values pull them in. */
  bendStrength?: number;
  /** How smoothly the bend follows the cursor, from 0 (frozen) to 1 (instant). */
  mouseDamping?: number;
  /** Shifts the waves in depth as the cursor moves. */
  parallax?: boolean;
  /** Strength of the parallax shift. */
  parallaxStrength?: number;
  /** Clicking stirs the lines into a curl that slowly unwinds. */
  clickSwirl?: boolean;
  /** Swells the waves in from flat lines on mount. */
  intro?: boolean;
  /** CSS mix-blend-mode of the container in dark mode. */
  mixBlendMode?: CSSProperties['mixBlendMode'];
  /** Paints an opaque background behind the lines. Unset = transparent canvas. */
  backgroundColor?: string;
  /** Draws the lines as ink for light backgrounds. */
  lightMode?: boolean;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface FloatingLinesWaveSettings {
  count: number;
  distance: number;
  position: FloatingLinesWavePosition;
}

export interface FloatingLinesSettings {
  stops: string[];
  waves: FloatingLinesWaveSettings[];
  animationSpeed: number;
  amplitude: number;
  lineWidth: number;
  style: number;
  glow: number;
  brightness: number;
  depthOfField: number;
  edgeFade: number;
  interactive: boolean;
  bendRadius: number;
  bendStrength: number;
  mouseDamping: number;
  parallax: boolean;
  parallaxStrength: number;
  clickSwirl: boolean;
  intro: boolean;
  backgroundColor: string | undefined;
  lightMode: boolean;
  opacity: number;
  dpr: number | undefined;
  reduce: boolean;
}

export type FloatingLinesPresetName =
  | 'signature'
  | 'classic'
  | 'mono'
  | 'lagoon'
  | 'ember'
  | 'dotted'
  | 'blueprint'
  | 'calm';

export interface FloatingLinesLook {
  linesGradient: string[];
  lineStyle: FloatingLinesStyle;
  lineCount: number;
  lineDistance: number;
  lineWidth: number;
  glow: number;
  brightness: number;
  animationSpeed: number;
  amplitude: number;
  depthOfField: number;
  edgeFade: number;
}

export interface FloatingLinesEngine {
  resize: () => void;
  refresh: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChange: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  destroy: () => void;
}
