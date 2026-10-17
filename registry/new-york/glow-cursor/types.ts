import type { CSSProperties } from 'vue';

export type GlowCursorQuality = 'low' | 'medium' | 'high';
export type GlowCursorTheme = 'dark' | 'light';

export interface GlowCursorProps {
  /** Color of the light where it is freshly drawn. */
  color?: string;
  /** Color the light cools to as it drifts. Leave it out for a deeper shade of the main color. */
  secondaryColor?: string;
  /** Brightness of the light. */
  intensity?: number;
  /** Thickness of the light where it is drawn, in pixels. */
  trailWidth?: number;
  /** Seconds the light stays visible before it fades. */
  linger?: number;
  /** Strength of the soft glow around the light. */
  glow?: number;
  /** Strength of the white-hot core near the cursor. */
  hotspot?: number;
  /** How tightly the light follows the cursor, from 0 to 1. */
  followSpeed?: number;
  /** Amount of film grain in the light. */
  grain?: number;
  /** Releases a burst of light when you click. */
  clickBurst?: boolean;
  /** Resolution of the simulation. Lower it for weaker devices. */
  quality?: GlowCursorQuality;
  /** Use light on light backgrounds for an ink-like look. */
  theme?: GlowCursorTheme;
  /** CSS blend mode of the canvas. Defaults to screen in dark and normal in light. */
  blendMode?: CSSProperties['mixBlendMode'];
  /** Maximum pixel density of the canvas. */
  maxDevicePixelRatio?: number;
  /** Stops drawing new light while keeping what is already there. */
  enabled?: boolean;
  /** Extra classes merged on the root element. */
  class?: string;
}

export interface GlowCursorSettings {
  color: string;
  secondaryColor: string;
  intensity: number;
  trailWidth: number;
  linger: number;
  glow: number;
  hotspot: number;
  followSpeed: number;
  grain: number;
  clickBurst: boolean;
  quality: GlowCursorQuality;
  theme: GlowCursorTheme;
  maxDevicePixelRatio: number;
  enabled: boolean;
  reducedMotion: boolean;
}

export interface GlowCursorEngine {
  wake: () => void;
  destroy: () => void;
}
