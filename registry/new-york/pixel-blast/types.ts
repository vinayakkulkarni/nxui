export type PixelBlastVariant =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'cross'
  | 'ring';

export type PixelBlastHoverEffect = 'reveal' | 'grow' | 'none';

export interface PixelBlastProps {
  /** Shape of each pixel. */
  variant?: PixelBlastVariant;
  /** Size of each pixel, in px. */
  pixelSize?: number;
  /** Color of the pixels. */
  color?: string;
  /** Color the densest areas, ripples and the area under the cursor shift toward. Defaults to `color`. */
  accentColor?: string;
  /** Zoom of the cloud pattern. Higher values make smaller, busier clouds. */
  patternScale?: number;
  /** How many pixels light up. Higher values fill more of the area. */
  patternDensity?: number;
  /** Random size variation between pixels, from 0 to 1. */
  pixelSizeJitter?: number;
  /** Clicking sends a ring of pixels out from the click. */
  enableRipples?: boolean;
  /** Brightness of ripples. */
  rippleIntensityScale?: number;
  /** Width of the ripple ring. */
  rippleThickness?: number;
  /** How fast ripples spread. */
  rippleSpeed?: number;
  /** Stops rendering while the background is scrolled out of view. */
  autoPauseOffscreen?: boolean;
  /** How fast the clouds change shape. */
  speed?: number;
  /** Shows the page behind the pixels. Off draws a solid black (or white in light mode) backdrop. */
  transparent?: boolean;
  /** Fades the pixels out toward the edges, from 0 to 1. */
  edgeFade?: number;
  /** Film grain on the pixels. */
  noiseAmount?: number;
  /** Lets pixels grow and shrink smoothly instead of popping on and off, from 0 to 1. */
  softness?: number;
  /** Smooths the edges of the clouds. 0 keeps the original blocky steps. */
  smoothing?: number;
  /** Soft light behind the densest areas, and a hot core in ripples. */
  glow?: number;
  /** Lets pixels shimmer at their own pace, from 0 to 1. */
  twinkle?: number;
  /** How fast the clouds slide across the area. 0 keeps them in place. */
  drift?: number;
  /** Direction of the drift, in degrees. */
  driftAngle?: number;
  /** What the cursor does: light up more pixels around it, or make nearby pixels swell and brighten. */
  hoverEffect?: PixelBlastHoverEffect;
  /** Size of the area the cursor affects, in px. */
  hoverRadius?: number;
  /** Sends a ripple from a random spot about this many seconds apart. 0 turns it off. */
  autoRipple?: number;
  /** Tilts the pixels back into a floor that fades toward the horizon, in degrees. */
  tiltX?: number;
  /** Turns the pixels sideways in perspective, in degrees. */
  tiltY?: number;
  /** Blasts the pixels out from the center in a ring on mount. */
  intro?: boolean;
  /** Picks a fixed pattern. Leave it out for a different one on every mount. */
  variation?: number;
  /** Darkens hot pixels instead of brightening them, for light pages. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface PixelBlastSettings {
  variant: number;
  pixelSize: number;
  color: string;
  accentColor: string;
  patternScale: number;
  patternDensity: number;
  pixelSizeJitter: number;
  enableRipples: boolean;
  rippleIntensityScale: number;
  rippleThickness: number;
  rippleSpeed: number;
  autoPauseOffscreen: boolean;
  speed: number;
  transparent: boolean;
  edgeFade: number;
  noiseAmount: number;
  softness: number;
  smoothing: number;
  glow: number;
  twinkle: number;
  drift: number;
  driftAngle: number;
  hoverEffect: number;
  hoverRadius: number;
  autoRipple: number;
  tiltX: number;
  tiltY: number;
  intro: boolean;
  variation: number | undefined;
  lightMode: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface PixelBlastEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerLeave: () => void;
  destroy: () => void;
}
