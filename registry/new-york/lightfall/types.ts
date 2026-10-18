import type { CSSProperties } from 'vue';

export interface LightfallProps {
  /** Colors of the falling streaks, up to 8. Each streak picks one. */
  colors?: string[];
  /** Color of the soft light glowing at the top, where the streaks come from. */
  backgroundColor?: string;
  /** How fast the streaks fall. */
  speed?: number;
  /** Layers of streaks, from 1 to 16. */
  streakCount?: number;
  /** Thickness of the streaks. */
  streakWidth?: number;
  /** Length of the glowing tails. */
  streakLength?: number;
  /** Overall brightness. */
  glow?: number;
  /** How closely the streaks follow each other down the tunnel. */
  density?: number;
  /** How much the streaks flicker, from 0 to 1. */
  twinkle?: number;
  /** Field of view into the tunnel. Higher values zoom further in. */
  zoom?: number;
  /** Brightness of the soft light at the top. 0 turns it off. */
  backgroundGlow?: number;
  /** How white-hot the leading tips burn, from 0 to 1. */
  headGlow?: number;
  /** Dims streaks deep in the tunnel so the near ones stand out. */
  depth?: number;
  /** Soft glow around the brightest tips. */
  bloom?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** The cursor bends the falling light and brightens nearby streaks. */
  mouseInteraction?: boolean;
  /** How much the cursor brightens nearby streaks. */
  mouseStrength?: number;
  /** Reach of the cursor light. */
  mouseRadius?: number;
  /** Seconds the cursor light takes to catch up. 0 follows instantly. */
  mouseDampening?: number;
  /** How strongly the cursor bends the streaks, from 0 to 1. */
  lens?: number;
  /** Holding the pointer down speeds the streaks up into warp trails. */
  holdToWarp?: boolean;
  /** The light arrives at warp speed and slows to a steady fall. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Draws the streaks as colored light on a white background. */
  lightMode?: boolean;
  /** CSS blend mode for the container, such as screen or lighten. */
  mixBlendMode?: CSSProperties['mixBlendMode'];
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface LightfallSettings {
  colors: string[];
  backgroundColor: string;
  speed: number;
  streakCount: number;
  streakWidth: number;
  streakLength: number;
  glow: number;
  density: number;
  twinkle: number;
  zoom: number;
  backgroundGlow: number;
  headGlow: number;
  depth: number;
  bloom: number;
  opacity: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  mouseRadius: number;
  mouseDampening: number;
  lens: number;
  holdToWarp: boolean;
  intro: boolean;
  fade: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface LightfallEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: () => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
