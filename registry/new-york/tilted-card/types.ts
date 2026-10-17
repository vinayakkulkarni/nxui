export type TiltedCardAxis = 'both' | 'horizontal' | 'vertical';

export type TiltedCardActivateEvent = MouseEvent | KeyboardEvent;

export interface TiltedCardProps {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  containerHeight?: number | string;
  containerWidth?: number | string;
  imageHeight?: number | string;
  imageWidth?: number | string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  displayOverlayContent?: boolean;
  overlayDepth?: number;
  flipOnClick?: boolean;
  /** Controlled side. Leave undefined to let clicks flip the card. */
  flipped?: boolean;
  radius?: number | string;
  perspective?: number | string;
  smoothness?: number;
  glare?: number;
  glareColor?: string;
  shadow?: number;
  parallax?: number;
  axis?: TiltedCardAxis;
  reverse?: boolean;
  trackWindow?: boolean;
  floating?: boolean;
  gyroscope?: boolean;
  intro?: boolean;
  introDelay?: number;
  /** Click / keyboard activation handler. Passing it makes the card a button. */
  onClick?: (event: TiltedCardActivateEvent) => void;
  class?: string;
}

export interface TiltedCardLayerProps {
  depth?: number;
  class?: string;
}

export interface TiltedCardSettings {
  amplitude: number;
  scale: number;
  smoothness: number;
  glare: number;
  shadow: number;
  parallax: number;
  axis: TiltedCardAxis;
  reverse: boolean;
  trackWindow: boolean;
  floating: boolean;
  gyroscope: boolean;
  intro: boolean;
  introDelay: number;
  interactive: boolean;
  flipped: boolean;
  tooltip: boolean;
}

export interface TiltedCardSpringState {
  [key: string]: number;
}
