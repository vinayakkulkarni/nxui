import type { StyleValue } from 'vue';

export type HalftoneRevealMode = 'mono' | 'duotone' | 'color';

export type HalftoneRevealShape =
  | 'dot'
  | 'ellipse'
  | 'square'
  | 'diamond'
  | 'line'
  | 'cross';

export interface HalftoneRevealProps {
  /** Image to print. Transparent or plain backgrounds are left unprinted. Must be served with CORS headers. */
  src?: string;
  /** Show the whole image, or crop it to fill the container. */
  fit?: 'contain' | 'cover';
  /** One ink, two inks at different screen angles, or full color: CMYK on light paper and RGB light on dark paper. */
  mode?: HalftoneRevealMode;
  /** Shape of the halftone marks. */
  shape?: HalftoneRevealShape;
  /** Spacing of the halftone screen, in px. */
  cellSize?: number;
  /** Rotation of the screen, in degrees. */
  angle?: number;
  /** Scales every mark. Below 1 keeps them apart, above 1 lets them merge sooner. */
  dotScale?: number;
  /** Color of the printed marks. */
  inkColor?: string;
  /** Second ink used in duotone mode. */
  accentColor?: string;
  /** Background the image is printed on. Match it to your page. */
  paperColor?: string;
  /** Tonal contrast applied before printing. */
  contrast?: number;
  /** Shifts the image lighter or darker before printing. */
  brightness?: number;
  /** Prints a negative of the image. */
  invert?: boolean;
  /** Gives the marks ragged, ink-spread edges, from 0 to 1. */
  roughness?: number;
  /** Offsets the ink layers like a slightly misaligned press, from 0 to 1. */
  misregistration?: number;
  /** Radius of the area around the cursor where the dots swell into the real photo, in px. */
  revealRadius?: number;
  /** Width of the band where the dots grow into the photo. 0 is a hard edge. */
  softness?: number;
  /** Seconds the revealed trail takes to shrink back into print. 0 turns the trail off. */
  linger?: number;
  /** Start as the photo and print wherever the cursor goes. */
  reverse?: boolean;
  /** Lets the reveal drift around on its own while the pointer is away. */
  wander?: boolean;
  /** Clicking sends a ring of color rippling out through the print. */
  clickBurst?: boolean;
  /** Grows the dots in from the center on load. */
  intro?: boolean;
  /** Extra classes for the root element. */
  class?: string;
  /** Inline styles for the container. */
  style?: StyleValue;
}

export interface HalftoneRevealSettings {
  fit: 'contain' | 'cover';
  mode: number;
  shape: number;
  cellSize: number;
  angle: number;
  dotScale: number;
  inkColor: string;
  accentColor: string;
  paperColor: string;
  contrast: number;
  brightness: number;
  invert: boolean;
  roughness: number;
  misregistration: number;
  revealRadius: number;
  softness: number;
  linger: number;
  reverse: boolean;
  wander: boolean;
  clickBurst: boolean;
  intro: boolean;
}

export interface HalftoneRevealEngine {
  /** Re-measures the container and resizes the canvas and mask targets. */
  resize: (width: number, height: number) => void;
  /** Pointer moved or entered, in container-local px. */
  pointerMove: (x: number, y: number) => void;
  /** Pointer left or was cancelled. */
  pointerLeave: () => void;
  /** Pointer pressed, in container-local px. `primary` is false for non-left mouse buttons. */
  pointerDown: (x: number, y: number, primary: boolean) => void;
  /** Pauses or resumes the loop when the canvas leaves or enters the viewport / tab. */
  setVisible: (visible: boolean) => void;
  /** Redraws once with the latest settings and restarts the loop if needed. */
  refresh: () => void;
  /** Stops the loop and frees every GL resource. */
  destroy: () => void;
}

export interface MaskTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export interface Burst {
  x: number;
  y: number;
  start: number;
}

export interface Pointer {
  x: number;
  y: number;
  inside: boolean;
  fresh: boolean;
  placed: boolean;
}

export interface Brush {
  x: number;
  y: number;
  px: number;
  py: number;
}

export type Rgb = [number, number, number];

export interface HalftoneState {
  width: number;
  height: number;
  dpr: number;
  image: HTMLImageElement | null;
  matte: Rgb;
  key: number;
  introStart: number;
  presence: number;
  drift: number;
  trailUntil: number;
}
