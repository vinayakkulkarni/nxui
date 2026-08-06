export type HoloPattern = 'linear' | 'radial' | 'patches';

export type Finish = 'holo' | 'gloss' | 'matte' | 'chrome' | 'glitter';

export type HoloOverlay = 'none' | 'triangles' | 'squares' | 'stripes';

export type LayerMaterial =
  | 'auto'
  | 'glitter'
  | 'gloss'
  | 'chrome'
  | 'matte'
  | 'prism'
  | 'satin';

export type PeelDirection =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

export interface StickerSettings {
  /** Surface finish preset: drives metalness/roughness in the shader. */
  finish: Finish;
  /** Sticker scale within the canvas, 0.3–1. */
  size: number;
  /** Die-cut white/foil border width, 0–0.08 (uv units). */
  border: number;
  /** Cut tolerance: interior holes/gaps smaller than this stay foil, 0–0.12. */
  cutTolerance: number;
  /** Refractor facet overlay pattern. */
  overlay: HoloOverlay;
  /** Ink visibility: 0 = foil only, 1 = as uploaded, up to 2 = densified. */
  ink: number;
  /** Embossed print relief: the ink sits proud with a shaded bevel, 0–1. */
  relief: number;
  /** Exploded view: backing paper, kiss-cut foil blank, and artwork. */
  layersOn: boolean;
  /** Separation between the exploded layers, 0–0.3. */
  layerDepth: number;
  /** Material preset per layer: [backing, kiss-cut foil, artwork]. */
  layerMaterials: LayerMaterial[];
  /** Holographic rainbow intensity, 0–1. */
  holoIntensity: number;
  /** Rainbow band frequency, 1–20. */
  bands: number;
  /** Extra hue rotation, 0–1. */
  hueShift: number;
  /** Foil grain amount, 0–1. */
  grain: number;
  /** Rainbow pattern style. */
  pattern: HoloPattern;
  /** Corner being peeled. */
  peelDirection: PeelDirection;
  /** Peel progress, 0–1. */
  peelAmount: number;
  /** Curl radius, 0.02–0.25. */
  curl: number;
  /** Drop-shadow strength under the curl, 0–1. */
  shadow: number;
  /** Light position in uv space. */
  light: { x: number; y: number };
  /** Preview background; transparent renders the standard checkerboard. */
  background: 'transparent' | 'white' | 'black';
}

export interface HoloStickerProps {
  /** Artwork source — an SVG/PNG/JPG/WebP URL or data URL. Alpha = die-cut shape. */
  src?: string;
  /** Sticker settings; merged over the defaults. */
  settings?: Partial<StickerSettings>;
  /** When true, pointer movement no longer tilts the sticker. */
  tiltLocked?: boolean;
  class?: string;
}
