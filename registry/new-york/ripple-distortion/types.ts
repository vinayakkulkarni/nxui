import type { StyleValue } from 'vue';
import type { Texture } from 'ogl';

export type RippleTrigger = 'hover' | 'click' | 'both';

export type RippleQuality = 'low' | 'medium' | 'high';

export interface RippleDistortionProps {
  /** Image URL the ripples distort. Cover fitted to the container. */
  src?: string;
  /** Diameter of each ripple the pointer lays down, in px. */
  brushSize?: number;
  /** How far the image is pushed, as a fraction of its size. */
  strength?: number;
  /** Full turns the push direction sweeps through as a ripple builds. 0 gives a flat push, higher folds the image into caustics. */
  swirl?: number;
  /** Concentric swells inside each ripple. 0 is a single plain blob. */
  rings?: number;
  /** How many times its own size a ripple grows to before it dies. */
  spread?: number;
  /** How long a ripple survives, in seconds. */
  fade?: number;
  /** Pointer travel between ripples, in px. Higher leaves a sparser trail. */
  spacing?: number;
  /** Chromatic split between the red and blue channels as they refract. */
  dispersion?: number;
  /** Sheen riding the shoulders of each ripple. */
  glint?: number;
  /** Colour the disturbed water takes on. */
  tint?: string;
  /** How strongly the tint colours the disturbed water. */
  tintAmount?: number;
  /** Colour of the sheen. */
  highlightColor?: string;
  /** Drain the colour out of the image so the folds read on tone alone. */
  grayscale?: boolean;
  /** What disturbs the surface: motion, clicks, or both. */
  trigger?: RippleTrigger;
  /** How much larger a click ripple starts than a hover one. */
  clickStrength?: number;
  /** Resolution of the displacement buffer. Lower trades crispness for fill rate. */
  quality?: RippleQuality;
  /** Toggle the effect on or off. */
  enabled?: boolean;
  /** Extra classes for the root element. */
  class?: string;
  /** Inline styles for the container. */
  style?: StyleValue;
}

export interface WaveConfig {
  brushSize: number;
  spread: number;
  fade: number;
  spacing: number;
  clickStrength: number;
  trigger: RippleTrigger;
  enabled: boolean;
}

export interface Wave {
  x: number;
  y: number;
  scale: number;
  target: number;
  size: number;
  opacity: number;
}

export type Rgb = [number, number, number];

export type CompositeUniforms = {
  uTexture: { value: Texture };
  uDisplacement: { value: Texture };
  uResolution: { value: [number, number] };
  uTextureSize: { value: [number, number] };
  uTexel: { value: [number, number] };
  uTint: { value: Rgb };
  uHighlight: { value: Rgb };
  uStrength: { value: number };
  uSwirl: { value: number };
  uDispersion: { value: number };
  uGlint: { value: number };
  uTintAmount: { value: number };
  uGrayscale: { value: number };
};

export type WaveUniforms = {
  uRings: { value: number };
};

export interface RippleDistortionEngine {
  /** Re-measures the container and resizes the canvas and displacement buffer. */
  resize: (width: number, height: number) => void;
  /** Pointer moved anywhere on the page, in client px. */
  pointerMove: (clientX: number, clientY: number) => void;
  /** Pointer pressed anywhere on the page, in client px. */
  pointerDown: (clientX: number, clientY: number) => void;
  /** Pushes the latest look props into the shader uniforms. */
  updateUniforms: () => void;
  /** Pauses the loop while the canvas is offscreen or the tab is hidden. */
  setVisible: (visible: boolean) => void;
  /** Stops the loop and releases the WebGL context. */
  destroy: () => void;
}
