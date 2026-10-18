import type { HTMLAttributes } from 'vue';

export type MoltenMetalColorMode = 'molten' | 'ember' | 'frost';

export interface MoltenMetalProps {
  /** Gradient the metal heats through, from the dim glow to the hot body. Up to five colors. */
  colors?: string[];
  /** Color of the white-hot cores at the end of the gradient. */
  coreColor?: string;
  /** Fills the canvas behind the metal. `transparent` lets the page show through. */
  backgroundColor?: string;
  /** Draws the flow as colored ink for light pages. */
  lightMode?: boolean;
  /** How fast the metal flows. */
  speed?: number;
  /** Zoom of the flow. Higher fits more of it on screen. */
  scale?: number;
  /** Layers of folded filaments, from 1 to 8. Fractions blend between layers. */
  detail?: number;
  /** How much heat the filaments carry. */
  glow?: number;
  /** Width of the filaments and their white-hot cores. */
  thickness?: number;
  /** How tightly the flow spirals. */
  swirl?: number;
  /** How strongly each layer folds the flow. */
  turbulence?: number;
  /** Soft glow between the filaments. 0 leaves only the filaments. */
  haze?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Balance of the gradient. Ember runs hotter, frost stays cooler. */
  colorMode?: MoltenMetalColorMode;
  /** Rotation of the whole flow in degrees. */
  rotation?: number;
  /** Moves the flow sideways, as a fraction of the width. */
  offsetX?: number;
  /** Moves the flow up or down, as a fraction of the height. */
  offsetY?: number;
  /** How far the flow drifts as the cursor moves. 0 keeps it still. */
  drift?: number;
  /** Film grain in the glow. 0 turns it off. */
  grain?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Ignites the metal from its hottest cores outward the first time it comes into view. */
  intro?: boolean;
  /** The cursor heats the filaments it passes over, leaving a trail that slowly cools. */
  mouseInteraction?: boolean;
  /** How hot the cursor runs. */
  mouseStrength?: number;
  /** Clicking flares the nearby filaments white-hot before they cool back down. */
  flareOnClick?: boolean;
  /** Freezes the flow. */
  paused?: boolean;
  /** Maximum device pixel ratio of the canvas. */
  dpr?: number;
  class?: HTMLAttributes['class'];
}

export type MoltenMetalRgb = [number, number, number];

export interface MoltenMetalTrailPoint {
  x: number;
  y: number;
  time: number;
  arrive: number;
  weight: number;
  live: boolean;
}

export interface MoltenMetalFlare {
  x: number;
  y: number;
  time: number;
}

export interface MoltenMetalSettings {
  palette: MoltenMetalRgb[];
  paper: MoltenMetalRgb | null;
  lightMode: boolean;
  speed: number;
  scale: number;
  detail: number;
  glow: number;
  thickness: number;
  swirl: number;
  fold: number;
  blackPoint: number;
  brightness: number;
  balance: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  drift: number;
  grain: number;
  opacity: number;
  intro: boolean;
  mouseInteraction: boolean;
  mouseStrength: number;
  flareOnClick: boolean;
  paused: boolean;
  dpr: number;
}

export type MoltenMetalPreset =
  | 'classic'
  | 'forge'
  | 'mercury'
  | 'tide'
  | 'vortex';

export type MoltenMetalLook = Required<
  Omit<
    MoltenMetalProps,
    | 'class'
    | 'backgroundColor'
    | 'drift'
    | 'intro'
    | 'mouseInteraction'
    | 'mouseStrength'
    | 'flareOnClick'
    | 'paused'
    | 'dpr'
  >
>;
