export type HoloCardPreset =
  | 'bursts'
  | 'stars'
  | 'shards'
  | 'cosmos'
  | 'rainbow'
  | 'swirl'
  | 'glitter'
  | 'gold';

export interface HoloCardProps {
  /** Front of the card. Same-origin or CORS-enabled URL. */
  image?: string;
  /** Back of the card. When set, a click or Enter flips the card over. */
  backImage?: string;
  /** Accessible description of the card. */
  alt?: string;
  /** The holo pattern on the card face. */
  preset?: HoloCardPreset;
  /** How strongly the foil shows through the print, 0 to 1. */
  intensity?: number;
  /** Size of the holo pattern. Higher values pack in more, smaller elements. */
  scale?: number;
  /** Brightness of the glitter on the border, 0 to 1. */
  edgeSparkle?: number;
  /** Width of the sparkling border as a percentage of the card width. */
  frame?: number;
  /** Strength of the glossy highlight under the light, 0 to 1. */
  glare?: number;
  /** Colour of the metal under the print. */
  foilColor?: string;
  /** Card width in px. The height follows the image. */
  width?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Largest tilt in degrees as the pointer moves. */
  tiltMax?: number;
  /** How much the card lifts while hovered. */
  hoverScale?: number;
  /** Drift the light and tilt slowly when nobody is hovering. */
  idle?: boolean;
  /** Soft shadow under the card that follows the tilt. */
  shadow?: boolean;
  class?: string;
}

export interface HoloCardSettings {
  preset: number;
  intensity: number;
  scale: number;
  edgeSparkle: number;
  frame: number;
  glare: number;
  foil: [number, number, number];
  radius: number;
  tiltMax: number;
  hoverScale: number;
  idle: boolean;
}

export interface HoloCardPointer {
  x: number;
  y: number;
  inside: boolean;
}

export interface HoloCardMotion {
  tiltX: number;
  tiltY: number;
  tiltVX: number;
  tiltVY: number;
  lightX: number;
  lightY: number;
  lightVX: number;
  lightVY: number;
  lift: number;
  liftV: number;
  turn: number;
  turnV: number;
  clock: number;
}
