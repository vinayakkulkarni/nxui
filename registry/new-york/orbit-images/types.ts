export interface OrbitItem {
  src: string;
  alt?: string;
}

export type OrbitImageSource = string | OrbitItem;

export type OrbitShape =
  | 'ellipse'
  | 'circle'
  | 'square'
  | 'rectangle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'infinity'
  | 'wave'
  | 'custom';

export type OrbitDirection = 'normal' | 'reverse';

export type OrbitEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export type OrbitItemClickHandler = (index: number, src: string) => void;

export interface OrbitImagesProps {
  /** Images that travel along the path, as URLs or objects with their own alt text. */
  images?: OrbitImageSource[];
  /** Prefix for the alt text of images given as plain URLs. */
  altPrefix?: string;
  /** Shape of the path the images follow. */
  shape?: OrbitShape;
  /** Your own SVG path, drawn in a baseWidth by baseWidth space. Used when shape is custom. */
  customPath?: string;
  /** Size of the coordinate space for the radii, the item size and custom paths. */
  baseWidth?: number;
  /** Horizontal radius for the ellipse, rectangle, infinity and wave. */
  radiusX?: number;
  /** Vertical radius for the ellipse, rectangle, infinity and wave. */
  radiusY?: number;
  /** Radius for the circle, square, triangle, star and heart. */
  radius?: number;
  /** Number of points on the star. */
  starPoints?: number;
  /** Inner radius of the star as a fraction of the outer one. */
  starInnerRatio?: number;
  /** Rotation of the whole path in degrees. Images stay upright. */
  rotation?: number;
  /** Seconds for one full lap. */
  duration?: number;
  /** Size of each image, in the same units as the radii. */
  itemSize?: number;
  /** Which way the images travel. */
  direction?: OrbitDirection;
  /** Spreads the images evenly around the path. Off makes them follow each other in a train. */
  fill?: boolean;
  /** Width of the container. The orbit scales to fit. */
  width?: number | string;
  /** Height of the container. Auto matches the shape of the orbit. */
  height?: number | string;
  /** Draws the path the images follow. */
  showPath?: boolean;
  /** Color of the path line. */
  pathColor?: string;
  /** Width of the path line in pixels. */
  pathWidth?: number;
  /** Dash length of the path line in pixels. 0 draws a solid line. */
  pathDash?: number;
  /** Easing applied to each lap. */
  easing?: OrbitEasing;
  /** Stops the orbit. Dragging still works. */
  paused?: boolean;
  /** Sense of depth, from 0 to 1. */
  depth?: number;
  /** Corner radius of the images, in itemSize units, or any CSS length. */
  itemRadius?: number | string;
  /** Strength of the soft shadow under each image, from 0 to 1. */
  shadow?: number;
  /** How much an image grows when hovered. */
  hoverScale?: number;
  /** Speed while hovered, as a fraction of the normal speed. */
  hoverSpeed?: number;
  /** Lets people drag or swipe sideways to spin the orbit, and fling it. */
  draggable?: boolean;
  /** Clicking an image glides it around to the front. */
  clickToFront?: boolean;
  /** Turns each image to follow the curve instead of staying upright. */
  alignToPath?: boolean;
  /** Images fan out from the front and the line draws in on first view. */
  intro?: boolean;
  /** Bound by `@item-click`. When set, the images become keyboard-focusable buttons. */
  onItemClick?: OrbitItemClickHandler;
  class?: string;
}

export interface OrbitEngineConfig {
  baseWidth: number;
  rotation: number;
  duration: number;
  itemSize: number;
  direction: OrbitDirection;
  fill: boolean;
  pathWidth: number;
  pathDash: number;
  easing: OrbitEasing;
  paused: boolean;
  depth: number;
  hoverScale: number;
  hoverSpeed: number;
  draggable: boolean;
  clickToFront: boolean;
  alignToPath: boolean;
  intro: boolean;
  sources: string[];
  onItemClick?: OrbitItemClickHandler;
}

export interface OrbitEngineCallbacks {
  getConfig: () => OrbitEngineConfig;
  setAspect: (aspect: number) => void;
  setIntroPending: (pending: boolean) => void;
  setDragging: (dragging: boolean) => void;
}

export interface OrbitEngine {
  refresh: () => void;
  wake: () => void;
  resize: () => void;
  destroy: () => void;
  setVisible: (visible: boolean) => void;
  setReduced: (reduced: boolean) => void;
  onEnter: () => void;
  onLeave: () => void;
  onOver: (event: PointerEvent) => void;
  onDown: (event: PointerEvent) => void;
  onMove: (event: PointerEvent) => void;
  onUp: (event: PointerEvent) => void;
  onCancel: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
  onKey: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
}
